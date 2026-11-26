// Command model-console exposes only the owner-approved local developer probe.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sherzot/nexora/internal/modelprobe"
	"github.com/sherzot/nexora/internal/platform/modelconsole"
	"github.com/sherzot/nexora/internal/platform/ollama"
)

func main() { os.Exit(execute()) }
func execute() int {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	return run(ctx, os.Args[1:], os.Stdout, os.Stderr, ollama.New())
}

func run(ctx context.Context, args []string, out, diagnostic io.Writer, provider modelprobe.Provider) int {
	if len(args) > 0 {
		if len(args) == 1 && args[0] == "--help" {
			if _, err := fmt.Fprintln(out, "Usage: model-console\nLocal developer console; no configurable bind, model, URL, files or operational Runs."); err == nil {
				return 0
			}
			return 1
		}
		fmt.Fprintln(diagnostic, "model-console: only --help is supported")
		return 2
	}
	if ctx.Err() != nil {
		return 0
	}
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		fmt.Fprintln(diagnostic, "model-console: listen:", err)
		return 1
	}
	logger := slog.New(slog.NewTextHandler(diagnostic, nil))
	origin := "http://" + listener.Addr().String()
	handler, err := modelconsole.New(provider, origin, ollama.Model, logger)
	if err != nil {
		fmt.Fprintln(diagnostic, "model-console:", errors.Join(err, listener.Close()))
		return 1
	}
	server := &http.Server{Handler: handler, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 65 * time.Second, IdleTimeout: 30 * time.Second, MaxHeaderBytes: 16384, BaseContext: func(net.Listener) context.Context { return ctx }}
	if _, err := fmt.Fprintln(out, "Local Model Review Console:", origin); err != nil {
		logger.Error("startup output failed")
		if err := listener.Close(); err != nil {
			logger.Error("listener close failed", "error", err)
		}
		return 1
	}
	ended := make(chan error, 1)
	go func() { ended <- server.Serve(listener) }()
	select {
	case err := <-ended:
		logger.Error("console serving stopped unexpectedly", "error", err)
		return 1
	case <-ctx.Done():
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdown); err != nil {
		logger.Error("console shutdown failed", "error", errors.Join(err, server.Close()))
		return 1
	}
	if err := <-ended; !errors.Is(err, http.ErrServerClosed) {
		logger.Error("console stop failed", "error", err)
		return 1
	}
	return 0
}
