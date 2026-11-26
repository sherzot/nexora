package modelprobe

import (
	"context"
	"errors"
	"strings"
	"testing"
)

type providerFunc func(context.Context, string) (Result, error)

func (f providerFunc) Generate(ctx context.Context, prompt string) (Result, error) {
	return f(ctx, prompt)
}

func validResult() Result {
	return Result{Model: "fixture", Text: "untrusted text", InputTokens: 3, OutputTokens: 2}
}

func TestProbePreservesInputAndProviderResult(t *testing.T) {
	const prompt = "  supplied text\n"
	want := validResult()
	got, err := Probe(context.Background(), providerFunc(func(ctx context.Context, text string) (Result, error) {
		if text != prompt || ctx.Err() != nil {
			t.Fatal("input/context changed")
		}
		return want, nil
	}), prompt)
	if err != nil || got != want {
		t.Fatalf("got %+v, %v", got, err)
	}
}

func TestInvalidPromptNeverInvokesProvider(t *testing.T) {
	for name, prompt := range map[string]string{"empty": "", "blank": " \n\t", "oversized": strings.Repeat("a", MaxPromptBytes+1), "unicode-bytes": strings.Repeat("界", MaxPromptBytes/3+1), "invalid-utf8": string([]byte{0xff})} {
		t.Run(name, func(t *testing.T) {
			_, err := Probe(context.Background(), providerFunc(func(context.Context, string) (Result, error) {
				t.Fatal("invalid input reached provider")
				return Result{}, nil
			}), prompt)
			if !errors.Is(err, ErrInvalidPrompt) {
				t.Fatal(err)
			}
		})
	}
	if err := ValidatePrompt(strings.Repeat("a", MaxPromptBytes)); err != nil {
		t.Fatal("exact byte limit rejected:", err)
	}
}

func TestProbeRejectsMissingProviderAndInvalidResults(t *testing.T) {
	if _, err := Probe(context.Background(), nil, "text"); !errors.Is(err, ErrMissingProvider) {
		t.Fatal(err)
	}
	for name, result := range map[string]Result{
		"oversized-model": {Model: strings.Repeat("a", 129), Text: "text"},
		"empty":           {}, "blank-text": {Model: "fixture", Text: " "},
		"invalid-text":    {Model: "fixture", Text: string([]byte{0xff})},
		"oversized":       {Model: "fixture", Text: strings.Repeat("a", MaxOutputBytes+1)},
		"negative-input":  {Model: "fixture", Text: "text", InputTokens: -1},
		"negative-output": {Model: "fixture", Text: "text", OutputTokens: -1},
	} {
		t.Run(name, func(t *testing.T) {
			got, err := Probe(context.Background(), providerFunc(func(context.Context, string) (Result, error) { return result, nil }), "text")
			if !errors.Is(err, ErrInvalidResult) || got != (Result{}) {
				t.Fatalf("invalid result escaped: %+v %v", got, err)
			}
		})
	}
}

func TestProbeCancellationAndFailureReturnNoResult(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := Probe(ctx, providerFunc(func(context.Context, string) (Result, error) {
		t.Fatal("canceled request reached provider")
		return Result{}, nil
	}), "text"); !errors.Is(err, context.Canceled) {
		t.Fatal(err)
	}
	ctx, cancel = context.WithCancel(context.Background())
	got, err := Probe(ctx, providerFunc(func(context.Context, string) (Result, error) { cancel(); return validResult(), nil }), "text")
	if !errors.Is(err, context.Canceled) || got != (Result{}) {
		t.Fatalf("canceled result escaped: %+v %v", got, err)
	}
	failure := errors.New("provider failed")
	got, err = Probe(context.Background(), providerFunc(func(context.Context, string) (Result, error) { return validResult(), failure }), "text")
	if !errors.Is(err, failure) || got != (Result{}) {
		t.Fatalf("failed result escaped: %+v %v", got, err)
	}
}
