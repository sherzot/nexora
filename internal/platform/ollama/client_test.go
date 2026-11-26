package ollama

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/sherzot/nexora/internal/modelprobe"
)

const validTags = `{"models":[{"name":"qwen2.5-coder:1.5b","digest":"d7372fd828518a4d38b1eb196c673c31a85f2ed302b3d1e406c4c2d1b64a0668"}]}`
const validGeneration = `{"model":"qwen2.5-coder:1.5b","response":"local fixture result","done":true,"done_reason":"stop","prompt_eval_count":8,"eval_count":4}`

// Exercise the production HTTP client/policy, routing its fixed address to an
// ephemeral loopback fixture only inside tests. Production has no URL override.
func fixtureClient(t *testing.T, handler http.HandlerFunc) *Client {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	client := New()
	transport := client.http.Transport.(*http.Transport)
	transport.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
		if addr != "127.0.0.1:11434" {
			t.Errorf("unexpected destination %q", addr)
			return nil, errors.New("unapproved destination")
		}
		return (&net.Dialer{}).DialContext(ctx, network, server.Listener.Addr().String())
	}
	t.Cleanup(transport.CloseIdleConnections)
	return client
}

func writeJSON(w http.ResponseWriter, text string) {
	w.Header().Set("Content-Type", "application/json")
	io.WriteString(w, text)
}

func TestLocalRequestContractAndProxyIsolation(t *testing.T) {
	t.Setenv("HTTP_PROXY", "http://127.0.0.1:1")
	t.Setenv("ALL_PROXY", "http://127.0.0.1:1")
	var calls []string
	client := fixtureClient(t, func(w http.ResponseWriter, r *http.Request) {
		calls = append(calls, r.Method+" "+r.URL.Path)
		if r.Host != "127.0.0.1:11434" || r.Header.Get("Accept") != "application/json" {
			t.Error("unexpected request destination/headers")
		}
		if r.URL.Path == "/api/tags" {
			writeJSON(w, validTags)
			return
		}
		var body struct {
			Model     string         `json:"model"`
			Prompt    string         `json:"prompt"`
			Stream    bool           `json:"stream"`
			KeepAlive int            `json:"keep_alive"`
			Options   map[string]int `json:"options"`
		}
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&body); err != nil {
			t.Error(err)
		}
		if body.Model != Model || body.Prompt != "supplied text" || body.Stream || body.KeepAlive != 0 || body.Options["num_ctx"] != 2048 || body.Options["num_predict"] != MaxOutputTokens || body.Options["temperature"] != 0 || r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("unexpected generation request: %+v", body)
		}
		writeJSON(w, validGeneration)
	})
	result, err := modelprobe.Probe(context.Background(), client, "supplied text")
	if err != nil || result.Text != "local fixture result" || result.InputTokens != 8 || result.OutputTokens != 4 {
		t.Fatalf("got %+v: %v", result, err)
	}
	if strings.Join(calls, ",") != "GET /api/tags,POST /api/generate" {
		t.Fatal("unexpected request count/order:", calls)
	}
	transport := client.http.Transport.(*http.Transport)
	if transport.Proxy != nil || !transport.DisableKeepAlives || client.http.Timeout != Timeout {
		t.Fatal("transport restrictions changed")
	}
}

func TestModelDriftAndInvalidTagsPreventGeneration(t *testing.T) {
	for name, body := range map[string]string{
		"changed-digest": strings.ReplaceAll(validTags, ManifestDigest, "other"),
		"missing":        `{"models":[]}`,
		"duplicate":      strings.Replace(validTags, "}]}", `},{"name":"`+Model+`","digest":"`+ManifestDigest+`"}]}`, 1),
		"malformed":      `{"models":`,
		"null":           `null`,
	} {
		t.Run(name, func(t *testing.T) {
			calls := 0
			client := fixtureClient(t, func(w http.ResponseWriter, r *http.Request) {
				calls++
				if r.URL.Path != "/api/tags" {
					t.Error("generation after rejected model metadata")
				}
				writeJSON(w, body)
			})
			result, err := client.Generate(context.Background(), "text")
			if err == nil || result != (modelprobe.Result{}) || calls != 1 {
				t.Fatalf("drift/protocol failure hidden or retried: %+v %v %d", result, err, calls)
			}
		})
	}
}

func TestGenerationFailuresReturnNoPartialText(t *testing.T) {
	for name, body := range map[string]string{
		"wrong-model":     strings.Replace(validGeneration, Model, "other", 1),
		"not-done":        strings.Replace(validGeneration, `"done":true`, `"done":false`, 1),
		"truncated":       strings.Replace(validGeneration, `"stop"`, `"length"`, 1),
		"missing-count":   strings.Replace(validGeneration, `,"eval_count":4`, "", 1),
		"negative-count":  strings.Replace(validGeneration, `"eval_count":4`, `"eval_count":-1`, 1),
		"too-many-tokens": strings.Replace(validGeneration, `"eval_count":4`, `"eval_count":257`, 1),
		"empty-text":      strings.Replace(validGeneration, "local fixture result", "", 1),
		"too-much-text":   strings.Replace(validGeneration, "local fixture result", strings.Repeat("a", modelprobe.MaxOutputBytes+1), 1),
		"invalid-json":    `{"response":`,
		"trailing-json":   validGeneration + `{}`,
		"invalid-utf8":    strings.Replace(validGeneration, "local fixture result", string([]byte{0xff}), 1),
	} {
		t.Run(name, func(t *testing.T) {
			calls := 0
			client := fixtureClient(t, func(w http.ResponseWriter, r *http.Request) {
				calls++
				if r.URL.Path == "/api/tags" {
					writeJSON(w, validTags)
				} else {
					writeJSON(w, body)
				}
			})
			result, err := client.Generate(context.Background(), "text")
			if err == nil || result != (modelprobe.Result{}) || calls != 2 {
				t.Fatalf("invalid result escaped or was retried: %+v %v %d", result, err, calls)
			}
		})
	}
}

func TestHTTPFailuresAndBounds(t *testing.T) {
	for _, phase := range []string{"/api/tags", "/api/generate"} {
		for _, failure := range []string{"status", "content-type", "body-limit", "chunked-limit"} {
			t.Run(phase+"/"+failure, func(t *testing.T) {
				client := fixtureClient(t, func(w http.ResponseWriter, r *http.Request) {
					if r.URL.Path != phase {
						writeJSON(w, validTags)
						return
					}
					switch failure {
					case "status":
						w.WriteHeader(http.StatusServiceUnavailable)
						io.WriteString(w, "PRIVATE_SERVER_BODY")
					case "content-type":
						w.Header().Set("Content-Type", "text/html")
						io.WriteString(w, validTags)
					case "body-limit":
						w.Header().Set("Content-Type", "application/json")
						w.Header().Set("Content-Length", "65537")
						io.WriteString(w, strings.Repeat("a", maxResponseBytes+1))
					case "chunked-limit":
						w.Header().Set("Content-Type", "application/json")
						w.(http.Flusher).Flush()
						io.WriteString(w, strings.Repeat("a", maxResponseBytes+1))
					}
				})
				result, err := client.Generate(context.Background(), "text")
				if !errors.Is(err, ErrProtocol) || result != (modelprobe.Result{}) || strings.Contains(err.Error(), "PRIVATE_SERVER_BODY") {
					t.Fatalf("HTTP failure hidden or disclosed: %+v %v", result, err)
				}
			})
		}
	}
}

func TestRedirectsNeverReachAnotherServer(t *testing.T) {
	var targetCalls atomic.Int32
	target := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) { targetCalls.Add(1) }))
	defer target.Close()
	for _, phase := range []string{"/api/tags", "/api/generate"} {
		t.Run(phase, func(t *testing.T) {
			client := fixtureClient(t, func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == phase {
					http.Redirect(w, r, target.URL+"/PRIVATE_REDIRECT", http.StatusTemporaryRedirect)
				} else {
					writeJSON(w, validTags)
				}
			})
			_, err := client.Generate(context.Background(), "text")
			if !errors.Is(err, ErrProtocol) || targetCalls.Load() != 0 || strings.Contains(err.Error(), "PRIVATE_REDIRECT") {
				t.Fatal("redirect followed or leaked:", err)
			}
		})
	}
}

func TestCancellationAndDeadlineReachHTTP(t *testing.T) {
	for _, phase := range []string{"/api/tags", "/api/generate"} {
		t.Run(phase, func(t *testing.T) {
			started, released := make(chan struct{}), make(chan struct{})
			client := fixtureClient(t, func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != phase {
					writeJSON(w, validTags)
					return
				}
				// Like Ollama, consume the request before waiting for generation.
				// Otherwise HTTP/1 cannot observe peer cancellation while a body is unread.
				io.Copy(io.Discard, r.Body)
				close(started)
				<-r.Context().Done()
				close(released)
			})
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			result := make(chan error, 1)
			go func() { _, err := client.Generate(ctx, "text"); result <- err }()
			select {
			case <-started:
			case <-time.After(2 * time.Second):
				t.Fatal("HTTP request never started")
			}
			cancel()
			select {
			case err := <-result:
				if !errors.Is(err, context.Canceled) {
					t.Fatal(err)
				}
			case <-time.After(2 * time.Second):
				t.Fatal("canceled request did not return")
			}
			select {
			case <-released:
			case <-time.After(2 * time.Second):
				t.Fatal("server request not canceled")
			}
		})
	}
	client := fixtureClient(t, func(w http.ResponseWriter, r *http.Request) { <-r.Context().Done() })
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	if _, err := client.Generate(ctx, "text"); !errors.Is(err, context.DeadlineExceeded) {
		t.Fatal(err)
	}
}

func TestInvalidInputAndCanceledContextMakeNoRequests(t *testing.T) {
	client := fixtureClient(t, func(http.ResponseWriter, *http.Request) { t.Error("unexpected request") })
	if _, err := client.Generate(context.Background(), " "); !errors.Is(err, modelprobe.ErrInvalidPrompt) {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := client.Generate(ctx, "text"); !errors.Is(err, context.Canceled) {
		t.Fatal(err)
	}
}

func TestUnavailableClientFailsWithoutRetry(t *testing.T) {
	for _, client := range []*Client{nil, {}} {
		if _, err := client.Generate(context.Background(), "text"); !errors.Is(err, ErrUnavailable) {
			t.Fatal("uninitialized client:", err)
		}
	}
	client := New()
	calls := 0
	client.http.Transport.(*http.Transport).DialContext = func(context.Context, string, string) (net.Conn, error) {
		calls++
		return nil, errors.New("fixture connection refused")
	}
	result, err := client.Generate(context.Background(), "text")
	if !errors.Is(err, ErrUnavailable) || calls != 1 || result != (modelprobe.Result{}) {
		t.Fatalf("unavailable request retried or accepted: %+v %v calls=%d", result, err, calls)
	}
}

func TestConcurrentProbesRemainIndependent(t *testing.T) {
	client := fixtureClient(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/tags" {
			writeJSON(w, validTags)
		} else {
			writeJSON(w, validGeneration)
		}
	})
	var group sync.WaitGroup
	for range 8 {
		group.Go(func() {
			result, err := client.Generate(context.Background(), "text")
			if err != nil || result.Text != "local fixture result" {
				t.Errorf("%+v %v", result, err)
			}
		})
	}
	group.Wait()
}
