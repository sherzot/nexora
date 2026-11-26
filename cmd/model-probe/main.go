// Command model-probe sends explicitly supplied stdin text to the local model.
// It has no repository/file discovery, shell execution or operational authority.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/signal"
	"syscall"

	"github.com/sherzot/nexora/internal/modelprobe"
	"github.com/sherzot/nexora/internal/platform/ollama"
)

func main() { os.Exit(run()) }

func run() int {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	finished := make(chan struct{})
	defer close(finished)
	go func() {
		select {
		case <-ctx.Done():
			// Also interrupt a terminal still waiting for stdin, not only HTTP.
			_ = os.Stdin.Close()
		case <-finished:
		}
	}()
	return execute(ctx, os.Args[1:], os.Stdin, os.Stdout, os.Stderr, ollama.New())
}

func execute(ctx context.Context, args []string, in io.Reader, out, diagnostic io.Writer, provider modelprobe.Provider) int {
	if len(args) != 0 {
		if len(args) == 1 && args[0] == "--help" {
			if _, err := fmt.Fprintln(out, "Usage: model-probe < prompt.txt\nDeveloper-only local text probe; no Run, tools, repository access or persistence."); err == nil {
				return 0
			}
			return 1
		}
		fmt.Fprintln(diagnostic, "model-probe: accepts only stdin text or --help; no URL/model/file arguments")
		return 2
	}
	if err := ctx.Err(); err != nil {
		fmt.Fprintln(diagnostic, "model-probe:", err)
		return 1
	}
	input, err := io.ReadAll(io.LimitReader(in, modelprobe.MaxPromptBytes+1))
	if err != nil {
		fmt.Fprintln(diagnostic, "model-probe: input read failed")
		return 1
	}
	request, cancel := context.WithTimeout(ctx, ollama.Timeout)
	defer cancel()
	result, err := modelprobe.Probe(request, provider, string(input))
	if err != nil {
		fmt.Fprintln(diagnostic, "model-probe:", err)
		return 1
	}
	// JSON escapes terminal control characters; never render model text as ANSI.
	if err := json.NewEncoder(out).Encode(result); err != nil {
		fmt.Fprintln(diagnostic, "model-probe: output write failed")
		return 1
	}
	return 0
}
