// Package ollama adapts the developer probe to a fixed loopback Ollama server.
// It does not install models, execute tools or implement Runtime admission.
package ollama

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net"
	"net/http"
	"time"
	"unicode/utf8"

	"github.com/sherzot/nexora/internal/modelprobe"
)

const Endpoint = "http://127.0.0.1:11434"
const Model = "qwen2.5-coder:1.5b"
const ManifestDigest = "d7372fd828518a4d38b1eb196c673c31a85f2ed302b3d1e406c4c2d1b64a0668"
const MaxOutputTokens = 256
const Timeout = 60 * time.Second
const maxResponseBytes = 65536

var ErrUnavailable = errors.New("local Ollama unavailable")
var ErrProtocol = errors.New("invalid Ollama response")
var ErrModelMismatch = errors.New("approved local model identity not found")
var ErrIncomplete = errors.New("model generation did not finish normally")

type Client struct{ http *http.Client }

// New accepts no URL, proxy or model configuration. Environment proxy settings
// and redirects cannot send prompts to another endpoint. No automatic retry.
func New() *Client {
	transport := &http.Transport{
		Proxy:                  nil,
		DialContext:            (&net.Dialer{Timeout: 2 * time.Second}).DialContext,
		DisableKeepAlives:      true,
		MaxResponseHeaderBytes: 16384,
	}
	return &Client{http: &http.Client{
		Transport: transport,
		Timeout:   Timeout,
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return ErrProtocol
		},
	}}
}

func (c *Client) Generate(ctx context.Context, prompt string) (modelprobe.Result, error) {
	if err := ctx.Err(); err != nil {
		return modelprobe.Result{}, err
	}
	if err := modelprobe.ValidatePrompt(prompt); err != nil {
		return modelprobe.Result{}, err
	}
	if c == nil || c.http == nil {
		return modelprobe.Result{}, ErrUnavailable
	}
	ctx, cancel := context.WithTimeout(ctx, Timeout)
	defer cancel()
	var tags struct {
		Models []struct{ Name, Digest string }
	}
	if err := c.request(ctx, http.MethodGet, "/api/tags", nil, &tags); err != nil {
		return modelprobe.Result{}, err
	}
	matches := 0
	for _, entry := range tags.Models {
		if entry.Name == Model {
			if entry.Digest != ManifestDigest {
				return modelprobe.Result{}, ErrModelMismatch
			}
			matches++
		}
	}
	if matches != 1 {
		return modelprobe.Result{}, ErrModelMismatch
	}
	body, err := json.Marshal(struct {
		Model     string         `json:"model"`
		Prompt    string         `json:"prompt"`
		Stream    bool           `json:"stream"`
		KeepAlive int            `json:"keep_alive"`
		Options   map[string]int `json:"options"`
	}{Model, prompt, false, 0, map[string]int{"num_ctx": 2048, "num_predict": MaxOutputTokens, "temperature": 0, "seed": 42}})
	if err != nil {
		return modelprobe.Result{}, fmt.Errorf("encode probe: %w", err)
	}
	var generated struct {
		Model           string `json:"model"`
		Response        string `json:"response"`
		Done            bool   `json:"done"`
		DoneReason      string `json:"done_reason"`
		PromptEvalCount *int   `json:"prompt_eval_count"`
		EvalCount       *int   `json:"eval_count"`
	}
	if err := c.request(ctx, http.MethodPost, "/api/generate", body, &generated); err != nil {
		return modelprobe.Result{}, err
	}
	if generated.Model != Model {
		return modelprobe.Result{}, ErrModelMismatch
	}
	if !generated.Done || generated.DoneReason != "stop" {
		return modelprobe.Result{}, ErrIncomplete
	}
	if generated.PromptEvalCount == nil || generated.EvalCount == nil || *generated.EvalCount > MaxOutputTokens {
		return modelprobe.Result{}, ErrProtocol
	}
	result := modelprobe.Result{Model: generated.Model, Text: generated.Response,
		InputTokens: *generated.PromptEvalCount, OutputTokens: *generated.EvalCount}
	if err := modelprobe.ValidateResult(result); err != nil {
		return modelprobe.Result{}, err
	}
	return result, nil
}

func (c *Client) request(ctx context.Context, method, path string, body []byte, target any) error {
	req, err := http.NewRequestWithContext(ctx, method, Endpoint+path, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create probe request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	response, err := c.http.Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if errors.Is(err, ErrProtocol) {
			return fmt.Errorf("%w: redirect rejected", ErrProtocol)
		}
		return fmt.Errorf("%w: %w", ErrUnavailable, err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		// Never echo server response bodies, which may contain user data.
		return fmt.Errorf("%w: HTTP status %d", ErrProtocol, response.StatusCode)
	}
	contentType, _, err := mime.ParseMediaType(response.Header.Get("Content-Type"))
	if err != nil || contentType != "application/json" || response.ContentLength > maxResponseBytes {
		return ErrProtocol
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, maxResponseBytes+1))
	if err != nil {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		return fmt.Errorf("%w: response read failed", ErrProtocol)
	}
	if len(data) > maxResponseBytes || !utf8.Valid(data) || json.Unmarshal(data, target) != nil {
		return ErrProtocol
	}
	return nil
}
