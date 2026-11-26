// Package modelprobe owns the developer-only text probe contract. It is not an
// Agent, Run, Tool or authorization boundary and reads no repository content.
package modelprobe

import (
	"context"
	"errors"
	"strings"
	"unicode/utf8"
)

const MaxPromptBytes = 4096
const MaxOutputBytes = 16384

var ErrInvalidPrompt = errors.New("prompt must be nonblank UTF-8 and at most 4096 bytes")
var ErrInvalidResult = errors.New("invalid model result")
var ErrMissingProvider = errors.New("model provider is required")

// Provider is owned by its consumer; HTTP and vendor types stay in adapters.
type Provider interface {
	Generate(context.Context, string) (Result, error)
}

type Result struct {
	Model        string `json:"model"`
	Text         string `json:"text"`
	InputTokens  int    `json:"input_tokens"`
	OutputTokens int    `json:"output_tokens"`
}

func ValidatePrompt(prompt string) error {
	if len(prompt) > MaxPromptBytes || !utf8.ValidString(prompt) || strings.TrimSpace(prompt) == "" {
		return ErrInvalidPrompt
	}
	return nil
}

func ValidateResult(result Result) error {
	if strings.TrimSpace(result.Model) == "" || len(result.Model) > 128 || !utf8.ValidString(result.Model) ||
		strings.TrimSpace(result.Text) == "" || !utf8.ValidString(result.Text) ||
		len(result.Text) > MaxOutputBytes || result.InputTokens < 0 || result.OutputTokens < 0 {
		return ErrInvalidResult
	}
	return nil
}

// Probe performs one request. Output is untrusted text, never instructions to
// execute. Cancellation or failure never returns a partial successful result.
func Probe(ctx context.Context, provider Provider, prompt string) (Result, error) {
	if err := ctx.Err(); err != nil {
		return Result{}, err
	}
	if err := ValidatePrompt(prompt); err != nil {
		return Result{}, err
	}
	if provider == nil {
		return Result{}, ErrMissingProvider
	}
	result, err := provider.Generate(ctx, prompt)
	if err != nil {
		return Result{}, err
	}
	if err := ctx.Err(); err != nil {
		return Result{}, err
	}
	if err := ValidateResult(result); err != nil {
		return Result{}, err
	}
	return result, nil
}
