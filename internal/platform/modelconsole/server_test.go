package modelconsole

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/sherzot/nexora/internal/modelprobe"
)

type providerFunc func(context.Context, string) (modelprobe.Result, error)

func (f providerFunc) Generate(ctx context.Context, prompt string) (modelprobe.Result, error) {
	return f(ctx, prompt)
}
func logger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }
func fixtureResult() modelprobe.Result {
	return modelprobe.Result{Model: "fixture", Text: "unverified fixture", InputTokens: 3, OutputTokens: 2}
}
func console(t *testing.T, provider modelprobe.Provider) *Server {
	t.Helper()
	s, err := New(provider, "http://127.0.0.1:12345", "fixture", logger())
	if err != nil {
		t.Fatal(err)
	}
	return s
}
func request(s *Server, body string) *http.Request {
	r := httptest.NewRequest(http.MethodPost, s.origin+"/api/probe", strings.NewReader(body))
	r.RemoteAddr = "127.0.0.1:50000"
	r.Header.Set("Origin", s.origin)
	r.Header.Set("X-Nexora-Probe-Token", s.token)
	r.Header.Set("Content-Type", "application/json")
	return r
}

func TestConstructorRejectsUnboundedOriginsAndMissingDependencies(t *testing.T) {
	provider := providerFunc(func(context.Context, string) (modelprobe.Result, error) { return fixtureResult(), nil })
	for _, origin := range []string{"https://127.0.0.1:12345", "http://localhost:12345", "http://0.0.0.0:12345", "http://127.0.0.1", "http://127.0.0.1:0", "http://127.0.0.1:65536", "http://user@127.0.0.1:12345", "http://127.0.0.1:12345/", "http://127.0.0.1:12345?x=1", "http://127.0.0.1:12345#fragment", "http://127.0.0.1:012345", "http://127.0.0.1:12345?"} {
		if _, err := New(provider, origin, "fixture", logger()); err == nil {
			t.Errorf("accepted origin %q", origin)
		}
	}
	if _, err := New(nil, "http://127.0.0.1:12345", "fixture", logger()); err == nil {
		t.Fatal("nil provider")
	}
	if _, err := New(provider, "http://127.0.0.1:12345", "fixture", nil); err == nil {
		t.Fatal("nil logger")
	}
	for _, label := range []string{"", strings.Repeat("a", 129), string([]byte{0xff})} {
		if _, err := New(provider, "http://127.0.0.1:12345", label, logger()); err == nil {
			t.Fatal("invalid label")
		}
	}
}

func TestEmbeddedPageSecurityAndNoProviderInvocation(t *testing.T) {
	s := console(t, providerFunc(func(context.Context, string) (modelprobe.Result, error) {
		t.Fatal("page must not invoke model")
		return modelprobe.Result{}, nil
	}))
	r := httptest.NewRequest(http.MethodGet, s.origin+"/", nil)
	r.RemoteAddr = "127.0.0.1:50000"
	w := httptest.NewRecorder()
	s.ServeHTTP(w, r)
	if w.Code != 200 || !strings.Contains(w.Body.String(), "Experimental, unverified output.") || strings.Contains(w.Body.String(), "__TOKEN__") || strings.Contains(w.Body.String(), "__NONCE__") {
		t.Fatal("page not initialized")
	}
	for name, value := range map[string]string{"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer"} {
		if w.Header().Get(name) != value {
			t.Fatal(name)
		}
	}
	csp := w.Header().Get("Content-Security-Policy")
	for _, part := range []string{"default-src 'none'", "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'none'", "worker-src 'none'", "script-src 'nonce-" + s.nonce + "'"} {
		if !strings.Contains(csp, part) {
			t.Fatal("CSP missing ", part)
		}
	}
	if strings.Contains(csp, "unsafe-inline") || w.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("security policy broadened")
	}
	other := console(t, s.provider)
	if other.token == s.token || other.nonce == s.nonce {
		t.Fatal("reused token/nonce")
	}
	label := `<script>alert(1)</script>`
	escaped, err := New(s.provider, s.origin, label, logger())
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(escaped.page, []byte(label)) {
		t.Fatal("model label injected HTML")
	}
}

func TestRequestGuardsRejectBeforeProvider(t *testing.T) {
	s := console(t, providerFunc(func(context.Context, string) (modelprobe.Result, error) {
		t.Fatal("rejected request invoked provider")
		return modelprobe.Result{}, nil
	}))
	for name, change := range map[string]func(*http.Request){
		"host": func(r *http.Request) { r.Host = "evil.invalid" }, "remote": func(r *http.Request) { r.RemoteAddr = "192.0.2.1:44" },
		"missing-origin": func(r *http.Request) { r.Header.Del("Origin") }, "origin": func(r *http.Request) { r.Header.Set("Origin", "http://evil.invalid") },
		"null-origin": func(r *http.Request) { r.Header.Set("Origin", "null") }, "token": func(r *http.Request) { r.Header.Set("X-Nexora-Probe-Token", "wrong") },
		"missing-token": func(r *http.Request) { r.Header.Del("X-Nexora-Probe-Token") }, "cross-site": func(r *http.Request) { r.Header.Set("Sec-Fetch-Site", "cross-site") },
	} {
		t.Run(name, func(t *testing.T) {
			r := request(s, `{"prompt":"text"}`)
			change(r)
			w := httptest.NewRecorder()
			s.ServeHTTP(w, r)
			if w.Code != 403 {
				t.Fatal(w.Code)
			}
			if w.Header().Get("Access-Control-Allow-Origin") != "" {
				t.Fatal("CORS enabled")
			}
		})
	}
	for name, status := range map[string]int{"get": 405, "options": 405, "unknown": 404, "query": 400, "content-type": 415, "oversize": 413} {
		t.Run(name, func(t *testing.T) {
			r := request(s, `{"prompt":"text"}`)
			switch name {
			case "get":
				r.Method = "GET"
			case "options":
				r.Method = "OPTIONS"
			case "unknown":
				r.URL.Path = "/files/private"
			case "query":
				r.URL.RawQuery = "model=other"
			case "content-type":
				r.Header.Set("Content-Type", "text/plain")
			case "oversize":
				r.ContentLength = maxBodyBytes + 1
			}
			w := httptest.NewRecorder()
			s.ServeHTTP(w, r)
			if w.Code != status {
				t.Fatalf("got %d want %d", w.Code, status)
			}
		})
	}
}

func TestJSONAndPromptValidation(t *testing.T) {
	s := console(t, providerFunc(func(context.Context, string) (modelprobe.Result, error) {
		t.Fatal("invalid payload invoked provider")
		return modelprobe.Result{}, nil
	}))
	for _, body := range []string{`{}`, `null`, `{"prompt":" "}`, `{"prompt":"x","model":"other"}`, `{"prompt":"x","url":"http://evil.invalid"}`, `{"prompt":"x"}{}`, `{"prompt":3}`, `{"prompt":`, "{\"prompt\":\"" + string([]byte{0xff}) + "\"}", `{"prompt":"` + strings.Repeat("x", 4097) + `"}`} {
		w := httptest.NewRecorder()
		s.ServeHTTP(w, request(s, body))
		if w.Code != 400 {
			t.Fatalf("invalid payload got %d", w.Code)
		}
	}
	r := request(s, strings.Repeat("x", maxBodyBytes+1))
	r.ContentLength = -1
	w := httptest.NewRecorder()
	s.ServeHTTP(w, r)
	if w.Code != 413 {
		t.Fatal("chunked oversized body accepted", w.Code)
	}
}

func TestValidProbePreservesTextAndEscapesOutput(t *testing.T) {
	const text = "  supplied text\n"
	s := console(t, providerFunc(func(ctx context.Context, prompt string) (modelprobe.Result, error) {
		if prompt != text {
			t.Fatal("prompt modified")
		}
		deadline, ok := ctx.Deadline()
		if !ok || time.Until(deadline) > RequestTimeout {
			t.Fatal("deadline missing")
		}
		return modelprobe.Result{Model: "fixture", Text: "<script>window.pwned=1</script>\x1b", InputTokens: 2, OutputTokens: 1}, nil
	}))
	body, _ := json.Marshal(map[string]string{"prompt": text})
	w := httptest.NewRecorder()
	s.ServeHTTP(w, request(s, string(body)))
	if w.Code != 200 || strings.Contains(w.Body.String(), "<script>") || strings.Contains(w.Body.String(), "\x1b") {
		t.Fatal("unsafe output", w.Code)
	}
	var response struct {
		Result modelprobe.Result `json:"result"`
	}
	if json.Unmarshal(w.Body.Bytes(), &response) != nil || !strings.Contains(response.Result.Text, "<script>") {
		t.Fatal("result altered")
	}
}

func TestProviderErrorsAreSanitizedAndBusyClears(t *testing.T) {
	for name, providerErr := range map[string]error{"provider": errors.New("PRIVATE_PROMPT_AND_SECRET"), "deadline": context.DeadlineExceeded, "cancel": context.Canceled} {
		t.Run(name, func(t *testing.T) {
			var calls atomic.Int32
			s := console(t, providerFunc(func(context.Context, string) (modelprobe.Result, error) {
				if calls.Add(1) == 1 {
					return fixtureResult(), providerErr
				}
				return fixtureResult(), nil
			}))
			w := httptest.NewRecorder()
			s.ServeHTTP(w, request(s, `{"prompt":"text"}`))
			want := 503
			if name == "deadline" {
				want = 504
			}
			if name == "cancel" {
				want = 408
			}
			if w.Code != want || strings.Contains(w.Body.String(), "PRIVATE") || strings.Contains(w.Body.String(), "unverified fixture") {
				t.Fatalf("bad failure %d %s", w.Code, w.Body.String())
			}
			w = httptest.NewRecorder()
			s.ServeHTTP(w, request(s, `{"prompt":"text"}`))
			if w.Code != 200 {
				t.Fatal("busy slot retained")
			}
		})
	}
	s := console(t, providerFunc(func(context.Context, string) (modelprobe.Result, error) { return modelprobe.Result{}, nil }))
	w := httptest.NewRecorder()
	s.ServeHTTP(w, request(s, `{"prompt":"text"}`))
	if w.Code != 503 {
		t.Fatal("invalid result accepted")
	}
}

func TestConcurrentRequestRejectedAndHTTPAbortPropagates(t *testing.T) {
	started, ended := make(chan struct{}), make(chan struct{})
	var calls atomic.Int32
	provider := providerFunc(func(ctx context.Context, _ string) (modelprobe.Result, error) {
		calls.Add(1)
		close(started)
		<-ctx.Done()
		close(ended)
		return modelprobe.Result{}, ctx.Err()
	})
	ts := httptest.NewUnstartedServer(nil)
	defer ts.Close()
	origin := "http://" + ts.Listener.Addr().String()
	s, err := New(provider, origin, "fixture", logger())
	if err != nil {
		t.Fatal(err)
	}
	ts.Config.Handler = s
	ts.Start()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	r := request(s, `{"prompt":"first"}`).WithContext(ctx)
	r.RequestURI = ""
	done := make(chan error, 1)
	go func() {
		response, err := ts.Client().Do(r)
		if response != nil {
			response.Body.Close()
		}
		done <- err
	}()
	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("provider did not start")
	}
	w := httptest.NewRecorder()
	s.ServeHTTP(w, request(s, `{"prompt":"second"}`))
	if w.Code != 429 || calls.Load() != 1 {
		t.Fatal("concurrent request reached model")
	}
	cancel()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("HTTP abort did not return")
	}
	select {
	case <-ended:
	case <-time.After(2 * time.Second):
		t.Fatal("abort not propagated")
	}
}
