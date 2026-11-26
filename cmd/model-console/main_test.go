package main

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/sherzot/nexora/internal/modelprobe"
)

type providerFunc func(context.Context, string) (modelprobe.Result, error)

func (f providerFunc) Generate(ctx context.Context, prompt string) (modelprobe.Result, error) {
	return f(ctx, prompt)
}

type brokenWriter struct{}

func (brokenWriter) Write([]byte) (int, error) { return 0, errors.New("fixture write failure") }

type startupWriter struct{ url chan string }

func (w startupWriter) Write(data []byte) (int, error) {
	w.url <- strings.TrimSpace(strings.TrimPrefix(string(data), "Local Model Review Console:"))
	return len(data), nil
}

func TestConsoleArgumentsNeverContactProvider(t *testing.T) {
	provider := providerFunc(func(context.Context, string) (modelprobe.Result, error) {
		t.Fatal("unexpected model invocation")
		return modelprobe.Result{}, nil
	})
	for _, args := range [][]string{{"--bind=0.0.0.0:8080"}, {"--model=other"}, {"--url=http://evil.invalid"}} {
		if run(context.Background(), args, io.Discard, io.Discard, provider) != 2 {
			t.Fatal("arguments accepted")
		}
	}
	var out bytes.Buffer
	if run(context.Background(), []string{"--help"}, &out, io.Discard, provider) != 0 || !strings.Contains(out.String(), "operational Runs") {
		t.Fatal("help")
	}
	if run(context.Background(), []string{"--help"}, brokenWriter{}, io.Discard, provider) != 1 {
		t.Fatal("help write error hidden")
	}
	if run(context.Background(), nil, brokenWriter{}, io.Discard, provider) != 1 {
		t.Fatal("startup write failure hidden")
	}
	if run(context.Background(), nil, io.Discard, io.Discard, nil) != 1 {
		t.Fatal("missing provider accepted")
	}
}

func TestConsoleStartsOnlyOnLoopbackAndStops(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	writer := startupWriter{make(chan string, 1)}
	done := make(chan int, 1)
	provider := providerFunc(func(context.Context, string) (modelprobe.Result, error) {
		t.Fatal("GET must not contact model")
		return modelprobe.Result{}, nil
	})
	go func() { done <- run(ctx, nil, writer, io.Discard, provider) }()
	var origin string
	select {
	case origin = <-writer.url:
	case <-time.After(2 * time.Second):
		t.Fatal("startup timeout")
	}
	if !strings.HasPrefix(origin, "http://127.0.0.1:") {
		t.Fatal("not loopback", origin)
	}
	client := &http.Client{Timeout: 2 * time.Second}
	response, err := client.Get(origin)
	if err != nil {
		t.Fatal(err)
	}
	body, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil || response.StatusCode != 200 || !bytes.Contains(body, []byte("Local Model Review")) {
		t.Fatal("page unavailable", err)
	}
	cancel()
	select {
	case code := <-done:
		if code != 0 {
			t.Fatal("shutdown failed", code)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("shutdown timeout")
	}
	if response, err := client.Get(origin); err == nil {
		response.Body.Close()
		t.Fatal("listener still active")
	}
}

func TestConsoleShutdownCancelsActiveProvider(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	started, ended := make(chan struct{}), make(chan struct{})
	provider := providerFunc(func(ctx context.Context, _ string) (modelprobe.Result, error) {
		close(started)
		<-ctx.Done()
		close(ended)
		return modelprobe.Result{}, ctx.Err()
	})
	writer := startupWriter{make(chan string, 1)}
	done := make(chan int, 1)
	go func() { done <- run(ctx, nil, writer, io.Discard, provider) }()
	var origin string
	select {
	case origin = <-writer.url:
	case <-time.After(2 * time.Second):
		t.Fatal("startup timeout")
	}
	client := &http.Client{Timeout: 5 * time.Second}
	response, err := client.Get(origin)
	if err != nil {
		t.Fatal(err)
	}
	page, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil {
		t.Fatal(err)
	}
	parts := strings.SplitN(string(page), "const TOKEN='", 2)
	if len(parts) != 2 {
		t.Fatal("missing browser token")
	}
	token := strings.SplitN(parts[1], "'", 2)[0]
	request, err := http.NewRequest(http.MethodPost, origin+"/api/probe", strings.NewReader(`{"prompt":"fixture"}`))
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Origin", origin)
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Nexora-Probe-Token", token)
	requestDone := make(chan int, 1)
	go func() {
		r, err := client.Do(request)
		if err != nil {
			requestDone <- 0
			return
		}
		defer r.Body.Close()
		requestDone <- r.StatusCode
	}()
	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("provider did not start")
	}
	cancel()
	select {
	case <-ended:
	case <-time.After(2 * time.Second):
		t.Fatal("shutdown did not cancel provider")
	}
	select {
	case code := <-requestDone:
		if code == 200 {
			t.Fatal("shutdown produced success")
		}
	case <-time.After(5 * time.Second):
		t.Fatal("request did not finish")
	}
	select {
	case code := <-done:
		if code != 0 {
			t.Fatal("shutdown failed", code)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("server did not finish")
	}
}
