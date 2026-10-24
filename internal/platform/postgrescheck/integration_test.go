package postgrescheck

import (
	"context"
	"errors"
	"net"
	"os"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

// The host verifies both containers before creating /tmp/c4-verified in the
// non-root runner. Until then this test neither reads credentials nor connects.
func TestIntegration(t *testing.T) {
	if os.Getenv("NEXORA_C4_RUNNER") != "1" {
		t.Skip("verified namespace-sharing runner required")
	}
	if runtime.GOOS != "linux" || runtime.GOARCH != "arm64" || os.Geteuid() == 0 {
		t.Fatal("non-root Linux ARM64 runner required")
	}
	gate := time.NewTimer(20 * time.Second)
	defer gate.Stop()
	ticker := time.NewTicker(50 * time.Millisecond)
	defer ticker.Stop()
waiting:
	for {
		select {
		case <-gate.C:
			t.Fatal("host isolation gate not established")
		case <-ticker.C:
			if _, e := os.Stat("/tmp/c4-verified"); e == nil {
				break waiting
			}
		}
	}
	path := os.Getenv("NEXORA_C4_PASSWORD_FILE")
	if path != "/run/secrets/postgres_password" {
		t.Fatal("unexpected credential path")
	}
	info, e := os.Stat(path)
	if e != nil || !info.Mode().IsRegular() || info.Mode().Perm()&0077 != 0 {
		t.Fatal("private fixture credential required")
	}
	password, e := os.ReadFile(path)
	if e != nil {
		t.Fatal("credential unreadable")
	}
	s := Settings{"127.0.0.1", 5432, "nexora_c4", "nexora_c4", strings.TrimRight(string(password), "\r\n")}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	t.Run("SelectOne", func(t *testing.T) {
		if e := Check(ctx, s); e != nil {
			t.Fatalf("check: %v", e)
		}
	})
	t.Run("AuthenticationFailure", func(t *testing.T) {
		bad := s
		bad.Password += "-invalid"
		e := Check(ctx, bad)
		if !errors.Is(e, ErrAuthentication) {
			t.Fatalf("classification: %v", e)
		}
		if strings.Contains(e.Error(), s.Password) {
			t.Fatal("secret disclosed")
		}
	})
	t.Run("Cancelled", func(t *testing.T) {
		c, stop := context.WithCancel(ctx)
		stop()
		if e := Check(c, s); !errors.Is(e, context.Canceled) {
			t.Fatalf("%v", e)
		}
	})
	t.Run("ExpiredDeadline", func(t *testing.T) {
		c, stop := context.WithDeadline(ctx, time.Now().Add(-time.Second))
		defer stop()
		if e := Check(c, s); !errors.Is(e, context.DeadlineExceeded) {
			t.Fatalf("%v", e)
		}
	})
	t.Run("UnavailableEndpoint", func(t *testing.T) {
		l, e := net.Listen("tcp", "127.0.0.1:0")
		if e != nil {
			t.Fatal(e)
		}
		port := uint16(l.Addr().(*net.TCPAddr).Port)
		l.Close()
		bad := s
		bad.Port = port
		if e = Check(ctx, bad); !errors.Is(e, ErrConnect) {
			t.Fatalf("%v", e)
		}
	})
	// Independent observation of fixture sessions, not an inference from client Close.
	t.Run("ServerSessionsReleased", func(t *testing.T) {
		cfg, e := pgconn.ParseConfig("host=127.0.0.1 port=5432 user=nexora_c4 dbname=nexora_c4 sslmode=disable connect_timeout=3")
		if e != nil {
			t.Fatal("observer configuration failed")
		}
		cfg.Password = s.Password
		cfg.Fallbacks = nil
		c, e := pgconn.ConnectConfig(ctx, cfg)
		if e != nil {
			t.Fatal("observer connection failed")
		}
		defer func() {
			closeCtx, done := context.WithTimeout(context.Background(), 2*time.Second)
			defer done()
			if c.Close(closeCtx) != nil {
				t.Error("observer cleanup failed")
			}
		}()
		deadline := time.Now().Add(2 * time.Second)
		for {
			rs, e := c.Exec(ctx, "SELECT count(*) FROM pg_stat_activity WHERE datname = 'nexora_c4' AND usename = 'nexora_c4' AND backend_type = 'client backend' AND pid <> pg_backend_pid()").ReadAll()
			if e != nil || len(rs) != 1 || len(rs[0].Rows) != 1 {
				t.Fatal("session observation failed")
			}
			if string(rs[0].Rows[0][0]) == "0" {
				return
			}
			if time.Now().After(deadline) {
				t.Fatal("fixture sessions remain")
			}
			time.Sleep(25 * time.Millisecond)
		}
	})
}
