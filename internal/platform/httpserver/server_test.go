package httpserver

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestHealthResponses(t *testing.T) {
	s := New(testLogger())
	for _, test := range []struct {
		name, method, path, body string
		ready                    bool
		code                     int
	}{
		{"live", "GET", "/health/live", "{\"status\":\"live\"}\n", false, 200},
		{"not ready", "GET", "/health/ready", "{\"status\":\"not_ready\"}\n", false, 503},
		{"ready", "GET", "/health/ready", "{\"status\":\"ready\"}\n", true, 200},
		{"draining", "GET", "/health/ready", "{\"status\":\"not_ready\"}\n", false, 503},
	} {
		t.Run(test.name, func(t *testing.T) {
			s.ready.Store(test.ready)
			w := httptest.NewRecorder()
			s.http.Handler.ServeHTTP(w, httptest.NewRequest(test.method, test.path, nil))
			if w.Code != test.code || w.Body.String() != test.body {
				t.Fatalf("got %d %q", w.Code, w.Body.String())
			}
			if w.Header().Get("Content-Type") != "application/json" || w.Header().Get("Cache-Control") != "no-store" {
				t.Fatal("missing response headers")
			}
		})
	}
}

func TestHealthMethodsAndUnknownRoutes(t *testing.T) {
	s := New(testLogger())
	for _, path := range []string{"/health/live", "/health/ready"} {
		w := httptest.NewRecorder()
		s.http.Handler.ServeHTTP(w, httptest.NewRequest("POST", path, nil))
		if w.Code != http.StatusMethodNotAllowed || w.Header().Get("Allow") != "GET, HEAD" {
			t.Fatalf("POST %s: %d, Allow %q", path, w.Code, w.Header().Get("Allow"))
		}
	}
	for _, path := range []string{"/", "/agents", "/health/live/detail"} {
		w := httptest.NewRecorder()
		s.http.Handler.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if w.Code != http.StatusNotFound {
			t.Fatalf("unexpected route: %s -> %d", path, w.Code)
		}
	}
}

// Accept provides a deterministic barrier showing the server is accepting traffic.
type observedListener struct {
	net.Listener
	accepting chan struct{}
	once      sync.Once
}

func (l *observedListener) Accept() (net.Conn, error) {
	l.once.Do(func() { close(l.accepting) })
	return l.Listener.Accept()
}

func listener(t *testing.T) *observedListener {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = ln.Close() })
	return &observedListener{Listener: ln, accepting: make(chan struct{})}
}

func await[T any](t *testing.T, ch <-chan T) T {
	t.Helper()
	select {
	case value := <-ch:
		return value
	case <-time.After(5 * time.Second):
		t.Fatal("test synchronization timed out")
		var zero T
		return zero
	}
}

func TestServeHealthAndCancellation(t *testing.T) {
	s := New(testLogger())
	ln := listener(t)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- s.Serve(ctx, ln, time.Second) }()
	await(t, ln.accepting)
	client := &http.Client{Timeout: time.Second}
	for _, path := range []string{"/health/live", "/health/ready"} {
		resp, err := client.Get("http://" + ln.Addr().String() + path)
		if err != nil {
			t.Fatal(err)
		}
		_, readErr := io.Copy(io.Discard, resp.Body)
		closeErr := resp.Body.Close()
		if readErr != nil || closeErr != nil || resp.StatusCode != 200 {
			t.Fatalf("health request: status=%d read=%v close=%v", resp.StatusCode, readErr, closeErr)
		}
	}
	resp, err := client.Head("http://" + ln.Addr().String() + "/health/live")
	if err != nil {
		t.Fatal(err)
	}
	body, readErr := io.ReadAll(resp.Body)
	closeErr := resp.Body.Close()
	if readErr != nil || closeErr != nil || resp.StatusCode != 200 || len(body) != 0 {
		t.Fatal("HEAD did not return an empty successful response")
	}
	client.CloseIdleConnections()
	cancel()
	if err := await(t, done); err != nil {
		t.Fatal(err)
	}
	if s.ready.Load() {
		t.Fatal("readiness remained true after shutdown")
	}
	if conn, err := net.DialTimeout("tcp", ln.Addr().String(), time.Second); err == nil {
		_ = conn.Close()
		t.Fatal("listener remains open")
	}
}

func TestShutdownDrainsActiveRequest(t *testing.T) {
	s := New(testLogger())
	ln := listener(t)
	started, release := make(chan struct{}), make(chan struct{})
	defer close(release)
	original := s.http.Handler
	s.http.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(started)
		<-release
		original.ServeHTTP(w, r)
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- s.Serve(ctx, ln, 3*time.Second) }()
	await(t, ln.accepting)
	request := make(chan error, 1)
	client := &http.Client{Timeout: 4 * time.Second}
	defer client.CloseIdleConnections()
	go func() {
		resp, err := client.Get("http://" + ln.Addr().String() + "/health/live")
		if err == nil {
			_, err = io.Copy(io.Discard, resp.Body)
			err = errors.Join(err, resp.Body.Close())
			if resp.StatusCode != 200 {
				err = errors.Join(err, errors.New("active request failed"))
			}
		}
		request <- err
	}()
	await(t, started)
	shutdownStarted := make(chan struct{})
	s.http.RegisterOnShutdown(func() { close(shutdownStarted) })
	cancel()
	await(t, shutdownStarted)
	if s.ready.Load() {
		t.Fatal("draining server still ready")
	}
	select {
	case err := <-done:
		t.Fatalf("returned before active handler completed: %v", err)
	default:
	}
	// Release once; the deferred close handles failed assertions before this point.
	release <- struct{}{}
	if err := await(t, request); err != nil {
		t.Fatal(err)
	}
	if err := await(t, done); err != nil {
		t.Fatal(err)
	}
}

func TestShutdownDeadlineIsReported(t *testing.T) {
	s := New(testLogger())
	ln := listener(t)
	started, release := make(chan struct{}), make(chan struct{})
	defer close(release)
	s.http.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		close(started)
		<-release
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- s.Serve(ctx, ln, time.Millisecond) }()
	await(t, ln.accepting)
	client := &http.Client{Timeout: time.Second}
	defer client.CloseIdleConnections()
	request := make(chan error, 1)
	go func() {
		resp, err := client.Get("http://" + ln.Addr().String() + "/health/live")
		if err == nil {
			err = resp.Body.Close()
		}
		request <- err
	}()
	await(t, started)
	cancel()
	if err := await(t, done); !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("deadline error lost: %v", err)
	}
	if err := await(t, request); err == nil {
		t.Fatal("timed-out request was not forcibly closed")
	}
}

func TestServeReportsListenerFailure(t *testing.T) {
	s := New(testLogger())
	ln := listener(t)
	if err := ln.Close(); err != nil {
		t.Fatal(err)
	}
	if err := s.Serve(context.Background(), ln, time.Second); !errors.Is(err, net.ErrClosed) {
		t.Fatalf("listener failure lost: %v", err)
	}
	if s.ready.Load() {
		t.Fatal("failed server still ready")
	}
}

func TestServeAlreadyCancelled(t *testing.T) {
	s := New(testLogger())
	ln := listener(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := s.Serve(ctx, ln, time.Second); err != nil {
		t.Fatal(err)
	}
	if s.ready.Load() {
		t.Fatal("cancelled server became ready")
	}
}
