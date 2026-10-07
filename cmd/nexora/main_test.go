package main

import (
	"context"
	"io"
	"log/slog"
	"net"
	"strings"
	"testing"
)

func TestRunRejectsConfiguration(t *testing.T) {
	err := run(context.Background(), func(string) (string, bool) { return "", true }, slog.New(slog.NewTextHandler(io.Discard, nil)))
	if err == nil || !strings.Contains(err.Error(), "load process configuration") {
		t.Fatalf("configuration failure lost: %v", err)
	}
}

func TestRunReportsBindFailure(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	err = run(context.Background(), func(key string) (string, bool) {
		if key == "NEXORA_LISTEN_ADDRESS" {
			return ln.Addr().String(), true
		}
		return "", false
	}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	if err == nil || !strings.Contains(err.Error(), "listen for HTTP") {
		t.Fatalf("bind failure lost: %v", err)
	}
}
