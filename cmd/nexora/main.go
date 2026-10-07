package main

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/sherzot/nexora/internal/platform/config"
	"github.com/sherzot/nexora/internal/platform/httpserver"
)

func main() {
	os.Exit(execute())
}

func execute() int {
	logger := slog.New(slog.NewJSONHandler(os.Stderr, nil))
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, os.LookupEnv, logger); err != nil {
		logger.Error("NEXORA process failed", "error", err)
		return 1
	}
	return 0
}

func run(ctx context.Context, lookup func(string) (string, bool), logger *slog.Logger) error {
	cfg, err := config.Load(lookup)
	if err != nil {
		return fmt.Errorf("load process configuration: %w", err)
	}
	if ctx.Err() != nil {
		return nil
	}
	server := httpserver.New(logger)
	listener, err := net.Listen("tcp", cfg.ListenAddress)
	if err != nil {
		return fmt.Errorf("listen for HTTP: %w", err)
	}
	return server.Serve(ctx, listener, cfg.ShutdownTimeout)
}
