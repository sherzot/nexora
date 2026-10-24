package postgrescheck

import (
	"context"
	"errors"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgproto3"
)

func TestSettings(t *testing.T) {
	for _, s := range []Settings{{}, {Host: "example.com", Port: 5432, Database: "d", User: "u", Password: "secret"}, {Host: "127.0.0.1", Port: 0, Database: "d", User: "u", Password: "secret"}} {
		if e := Check(context.Background(), s); !errors.Is(e, ErrSettings) {
			t.Fatalf("expected settings error: %v", e)
		}
	}
}

// This protocol fixture is a test peer, not a source, Security or database authority.
func peer(t *testing.T, mode string) Settings {
	t.Helper()
	ln, e := net.Listen("tcp", "127.0.0.1:0")
	if e != nil {
		t.Fatal(e)
	}
	finished := make(chan struct{})
	t.Cleanup(func() {
		ln.Close()
		select {
		case <-finished:
		case <-time.After(4 * time.Second):
			t.Error("peer did not stop")
		}
	})
	go func() {
		defer close(finished)
		c, e := ln.Accept()
		if e != nil {
			return
		}
		defer c.Close()
		c.SetDeadline(time.Now().Add(3 * time.Second))
		b := pgproto3.NewBackend(c, c)
		if _, e = b.ReceiveStartupMessage(); e != nil {
			return
		}
		if mode == "auth" {
			b.Send(&pgproto3.ErrorResponse{Severity: "FATAL", Code: "28P01", Message: "password secret-value"})
			b.Flush()
			return
		}
		b.Send(&pgproto3.AuthenticationOk{})
		b.Send(&pgproto3.BackendKeyData{ProcessID: 1, SecretKey: []byte{0, 0, 0, 2}})
		b.Send(&pgproto3.ReadyForQuery{TxStatus: 'I'})
		if b.Flush() != nil {
			return
		}
		msg, e := b.Receive()
		if e != nil {
			return
		}
		q, ok := msg.(*pgproto3.Query)
		if !ok || q.String != "SELECT 1" {
			return
		}
		if mode == "stall" {
			b.Receive()
			return
		}
		if mode == "query" {
			b.Send(&pgproto3.ErrorResponse{Severity: "ERROR", Code: "XX000", Message: "secret-value"})
		} else {
			b.Send(&pgproto3.RowDescription{Fields: []pgproto3.FieldDescription{{Name: []byte("?column?"), DataTypeOID: 23, DataTypeSize: 4}}})
			b.Send(&pgproto3.DataRow{Values: [][]byte{[]byte("1")}})
			b.Send(&pgproto3.CommandComplete{CommandTag: []byte("SELECT 1")})
		}
		b.Send(&pgproto3.ReadyForQuery{TxStatus: 'I'})
		if b.Flush() != nil {
			return
		}
		b.Receive()
	}()
	return Settings{Host: "127.0.0.1", Port: uint16(ln.Addr().(*net.TCPAddr).Port), Database: "d", User: "u", Password: "secret-value"}
}

func TestProtocolOutcomes(t *testing.T) {
	for _, tc := range []struct {
		mode string
		want error
	}{{"ok", nil}, {"auth", ErrAuthentication}, {"query", ErrQuery}} {
		t.Run(tc.mode, func(t *testing.T) {
			e := Check(context.Background(), peer(t, tc.mode))
			if !errors.Is(e, tc.want) {
				t.Fatalf("got %v, want %v", e, tc.want)
			}
			if e != nil && strings.Contains(e.Error(), "secret-value") {
				t.Fatal("credential leaked")
			}
		})
	}
}
func TestCancellation(t *testing.T) {
	s := peer(t, "stall")
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	start := time.Now()
	e := Check(ctx, s)
	if !errors.Is(e, ErrQuery) || !errors.Is(e, context.DeadlineExceeded) {
		t.Fatalf("classification: %v", e)
	}
	if time.Since(start) > 3*time.Second {
		t.Fatal("cleanup exceeded bound")
	}
}
func TestAlreadyCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	e := Check(ctx, Settings{"127.0.0.1", 5432, "d", "u", "secret"})
	if !errors.Is(e, context.Canceled) {
		t.Fatalf("%v", e)
	}
}
func TestUnavailable(t *testing.T) {
	l, e := net.Listen("tcp", "127.0.0.1:0")
	if e != nil {
		t.Fatal(e)
	}
	port := uint16(l.Addr().(*net.TCPAddr).Port)
	l.Close()
	if e = Check(context.Background(), Settings{"127.0.0.1", port, "d", "u", "secret"}); !errors.Is(e, ErrConnect) {
		t.Fatalf("%v", e)
	}
}

// Non-parallel: t.Setenv restores both variables after each case.
func TestInheritedServiceConfiguration(t *testing.T) {
	dir := t.TempDir()
	invalid := filepath.Join(dir, "invalid-service-secret")
	if e := os.WriteFile(invalid, []byte("not a service definition\n"), 0600); e != nil {
		t.Fatal(e)
	}
	missing := filepath.Join(dir, "missing-service-secret")
	for _, tc := range []struct{ name, service, file string }{
		{"MissingService", "missing-service-secret", ""},
		{"MissingFileOnly", "", missing},
		{"InvalidFileOnly", "", invalid},
		{"MissingServiceFile", "missing-service-secret", missing},
		{"InvalidServiceFile", "missing-service-secret", invalid},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("PGSERVICE", tc.service)
			t.Setenv("PGSERVICEFILE", tc.file)
			s := peer(t, "ok") // Valid explicit settings and an otherwise successful peer.
			for i := 0; i < 2; i++ {
				e := Check(context.Background(), s)
				// Exact sentinel identity excludes wrapped paths, passwords and diagnostics.
				if e != ErrSettings {
					t.Fatal("expected only the settings sentinel")
				}
			}
			ctx, cancel := context.WithCancel(context.Background())
			cancel()
			e := Check(ctx, s)
			if !errors.Is(e, ErrConnect) || !errors.Is(e, context.Canceled) || errors.Is(e, ErrSettings) {
				t.Fatal("existing cancellation precedence changed")
			}
		})
	}
	t.Run("EmptyServiceEnvironment", func(t *testing.T) {
		t.Setenv("PGSERVICE", "")
		t.Setenv("PGSERVICEFILE", "")
		if e := Check(context.Background(), peer(t, "ok")); e != nil {
			t.Fatalf("explicit settings failed: %v", e)
		}
	})
}
