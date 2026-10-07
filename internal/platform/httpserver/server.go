// Package httpserver owns the skeleton's HTTP surface and local server lifecycle.
// It contains no domain policy or durable runtime semantics.
package httpserver

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"sync/atomic"
	"time"
)

type Server struct {
	http   *http.Server
	ready  atomic.Bool
	logger *slog.Logger
}

func New(logger *slog.Logger) *Server {
	s := &Server{logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", func(w http.ResponseWriter, r *http.Request) {
		s.status(w, http.StatusOK, "live")
	})
	mux.HandleFunc("GET /health/ready", func(w http.ResponseWriter, r *http.Request) {
		if !s.ready.Load() {
			s.status(w, http.StatusServiceUnavailable, "not_ready")
			return
		}
		s.status(w, http.StatusOK, "ready")
	})
	s.http = &http.Server{
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    16 * 1024,
		ErrorLog:          slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}
	return s
}

func (s *Server) status(w http.ResponseWriter, code int, status string) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(code)
	if _, err := io.WriteString(w, "{\"status\":\""+status+"\"}\n"); err != nil {
		s.logger.Warn("health response write failed", "error", err)
	}
}

// Serve takes ownership of listener and may be called once. Cancellation drains
// local HTTP requests within timeout; it says nothing about durable work or effects.
func (s *Server) Serve(ctx context.Context, listener net.Listener, timeout time.Duration) error {
	if timeout <= 0 {
		return errors.Join(fmt.Errorf("shutdown timeout must be positive"), listener.Close())
	}
	if ctx.Err() != nil {
		return listener.Close()
	}
	s.ready.Store(true)
	defer s.ready.Store(false)
	served := make(chan error, 1)
	go func() { served <- s.http.Serve(listener) }()
	s.logger.Info("HTTP server started", "listen_address", listener.Addr().String())
	select {
	case err := <-served:
		// ErrServerClosed is expected only after our own shutdown request.
		return errors.Join(fmt.Errorf("HTTP serving stopped unexpectedly: %w", err), s.http.Close())
	case <-ctx.Done():
		s.ready.Store(false)
		s.logger.Info("HTTP shutdown requested")
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	shutdownErr := s.http.Shutdown(shutdownCtx)
	var closeErr error
	if shutdownErr != nil {
		closeErr = s.http.Close()
	}
	serveErr := <-served
	if errors.Is(serveErr, http.ErrServerClosed) {
		serveErr = nil
	}
	if err := errors.Join(shutdownErr, closeErr, serveErr); err != nil {
		return fmt.Errorf("HTTP shutdown failed: %w", err)
	}
	s.logger.Info("HTTP shutdown completed")
	return nil
}
