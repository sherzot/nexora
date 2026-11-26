package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"strings"
	"testing"

	"github.com/sherzot/nexora/internal/modelprobe"
)

type providerFunc func(context.Context, string) (modelprobe.Result, error)

func (f providerFunc) Generate(ctx context.Context, input string) (modelprobe.Result, error) {
	return f(ctx, input)
}

type brokenIO struct{}

func (brokenIO) Read([]byte) (int, error)  { return 0, errors.New("private read error") }
func (brokenIO) Write([]byte) (int, error) { return 0, errors.New("private write error") }

func TestCLIEmitsJSONWithoutTerminalControlSequences(t *testing.T) {
	var out, diagnostic bytes.Buffer
	const prompt = "supplied fixture"
	provider := providerFunc(func(ctx context.Context, input string) (modelprobe.Result, error) {
		if input != prompt {
			t.Fatal("prompt modified")
		}
		if _, ok := ctx.Deadline(); !ok {
			t.Fatal("missing request deadline")
		}
		return modelprobe.Result{Model: "fixture", Text: "\x1b[31m<script>not instructions</script>"}, nil
	})
	if code := execute(context.Background(), nil, strings.NewReader(prompt), &out, &diagnostic, provider); code != 0 {
		t.Fatalf("exit %d: %s", code, &diagnostic)
	}
	var result modelprobe.Result
	if err := json.Unmarshal(out.Bytes(), &result); err != nil || strings.Contains(out.String(), "\x1b") || strings.Contains(out.String(), "<script>") || diagnostic.Len() != 0 {
		t.Fatalf("unsafe/invalid output %q: %v", out.String(), err)
	}
}

func TestCLIRejectsArgumentsAndInputBeforeProvider(t *testing.T) {
	provider := providerFunc(func(context.Context, string) (modelprobe.Result, error) {
		t.Fatal("invalid request reached provider")
		return modelprobe.Result{}, nil
	})
	for _, args := range [][]string{{"--url=http://example.com"}, {"--model=other"}, {"file.txt"}, {"--help", "extra"}} {
		var out, diagnostic bytes.Buffer
		if execute(context.Background(), args, strings.NewReader("text"), &out, &diagnostic, provider) != 2 || out.Len() != 0 || diagnostic.Len() == 0 {
			t.Fatalf("invalid arguments accepted: %v", args)
		}
	}
	for _, input := range []io.Reader{strings.NewReader(""), strings.NewReader(strings.Repeat("a", modelprobe.MaxPromptBytes+1)), strings.NewReader(string([]byte{0xff})), brokenIO{}} {
		var out, diagnostic bytes.Buffer
		if execute(context.Background(), nil, input, &out, &diagnostic, provider) == 0 || out.Len() != 0 || diagnostic.Len() == 0 {
			t.Fatal("invalid input was successful")
		}
	}
	var out bytes.Buffer
	if execute(context.Background(), []string{"--help"}, brokenIO{}, &out, io.Discard, provider) != 0 || !strings.Contains(out.String(), "no Run") {
		t.Fatal("help must be independent of input/provider")
	}
}

func TestCLIFailuresNeverEmitSuccessfulResult(t *testing.T) {
	for name, provider := range map[string]modelprobe.Provider{
		"failure": providerFunc(func(context.Context, string) (modelprobe.Result, error) {
			return modelprobe.Result{Model: "fixture", Text: "partial"}, errors.New("provider failed")
		}),
		"invalid": providerFunc(func(context.Context, string) (modelprobe.Result, error) { return modelprobe.Result{}, nil }),
	} {
		t.Run(name, func(t *testing.T) {
			var out, diagnostic bytes.Buffer
			if execute(context.Background(), nil, strings.NewReader("text"), &out, &diagnostic, provider) == 0 || out.Len() != 0 || diagnostic.Len() == 0 {
				t.Fatal("failure hidden")
			}
		})
	}
	provider := providerFunc(func(context.Context, string) (modelprobe.Result, error) {
		return modelprobe.Result{Model: "fixture", Text: "text"}, nil
	})
	if execute(context.Background(), nil, strings.NewReader("text"), brokenIO{}, io.Discard, provider) == 0 || execute(context.Background(), []string{"--help"}, brokenIO{}, brokenIO{}, io.Discard, provider) == 0 {
		t.Fatal("write failure hidden")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	var out bytes.Buffer
	if execute(ctx, nil, brokenIO{}, &out, io.Discard, provider) == 0 || out.Len() != 0 {
		t.Fatal("canceled invocation succeeded")
	}
}

func TestCLIPropagatesCancellationToProvider(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	started := make(chan struct{})
	provider := providerFunc(func(ctx context.Context, _ string) (modelprobe.Result, error) {
		close(started)
		<-ctx.Done()
		return modelprobe.Result{}, ctx.Err()
	})
	go func() { <-started; cancel() }()
	var out bytes.Buffer
	if execute(ctx, nil, strings.NewReader("text"), &out, io.Discard, provider) == 0 || out.Len() != 0 {
		t.Fatal("cancellation was hidden")
	}
}
