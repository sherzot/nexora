// Package postgrescheck provides an isolated local technical connectivity probe.
package postgrescheck

import (
	"context"
	"errors"
	"net"
	"os"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

// Settings describes a local PostgreSQL endpoint. Password is never included in errors.
type Settings struct {
	Host                     string
	Port                     uint16
	Database, User, Password string
}

var (
	ErrSettings       = errors.New("postgrescheck: invalid settings")
	ErrConnect        = errors.New("postgrescheck: connection failed")
	ErrAuthentication = errors.New("postgrescheck: authentication failed")
	ErrQuery          = errors.New("postgrescheck: check failed")
	ErrCleanup        = errors.New("postgrescheck: cleanup failed")
)

const (
	connectLimit = 3 * time.Second
	queryLimit   = 5 * time.Second
	cleanupLimit = 2 * time.Second
)

// Check makes one local connection attempt and verifies SELECT 1. It grants no
// authority and establishes neither application persistence nor durable acceptance.
func Check(ctx context.Context, s Settings) (err error) {
	if ctx == nil || s.Host != "127.0.0.1" || s.Port == 0 || !validText(s.Database) || !validText(s.User) || !validText(s.Password) {
		return ErrSettings
	}
	if ctx.Err() != nil {
		return errors.Join(ErrConnect, ctx.Err())
	}
	// Service configuration is unsupported. Reject it before pgconn can read an
	// inherited service file; never alter the process-wide environment.
	if os.Getenv("PGSERVICE") != "" || os.Getenv("PGSERVICEFILE") != "" {
		return ErrSettings
	}
	// Fixed options and the overrides below constrain the local connection.
	cfg, e := pgconn.ParseConfig("host=127.0.0.1 port=5432 user=nexora_c4 dbname=nexora_c4 password=unused sslmode=disable connect_timeout=3")
	if e != nil {
		return ErrSettings
	}
	cfg.Host = s.Host
	cfg.Port = s.Port
	cfg.Database = s.Database
	cfg.User = s.User
	cfg.Password = s.Password
	cfg.ConnectTimeout = 0 // The owned connect context supplies the single deadline.
	cfg.Fallbacks = nil
	cfg.ValidateConnect = nil
	cfg.AfterConnect = nil
	cfg.RuntimeParams = map[string]string{}
	cfg.TLSConfig = nil
	cfg.LookupFunc = func(context.Context, string) ([]string, error) { return []string{"127.0.0.1"}, nil }
	var attempted atomic.Bool
	var raw net.Conn
	cfg.DialFunc = func(c context.Context, network, address string) (net.Conn, error) {
		if !attempted.CompareAndSwap(false, true) {
			return nil, ErrConnect
		}
		var de error
		raw, de = (&net.Dialer{}).DialContext(c, "tcp", net.JoinHostPort("127.0.0.1", strconv.Itoa(int(s.Port))))
		return raw, de
	}
	connectCtx, cancel := context.WithTimeout(ctx, connectLimit)
	conn, e := pgconn.ConnectConfig(connectCtx, cfg)
	cause := connectCtx.Err()
	cancel()
	if e != nil {
		if raw != nil {
			_ = raw.Close()
		}
		kind := ErrConnect
		var pgErr *pgconn.PgError
		if errors.As(e, &pgErr) && strings.HasPrefix(pgErr.Code, "28") {
			kind = ErrAuthentication
		}
		return errors.Join(kind, cause)
	}
	defer func() { err = errors.Join(err, closeConnection(conn, raw)) }()
	queryCtx, done := context.WithTimeout(ctx, queryLimit)
	defer done()
	results, e := conn.Exec(queryCtx, "SELECT 1").ReadAll()
	if e != nil {
		return errors.Join(ErrQuery, queryCtx.Err())
	}
	if len(results) != 1 || len(results[0].Rows) != 1 || len(results[0].Rows[0]) != 1 || string(results[0].Rows[0][0]) != "1" {
		return ErrQuery
	}
	return nil
}

func validText(s string) bool { return s != "" && !strings.ContainsRune(s, 0) }

// Driver cancellation can schedule asynchronous cleanup. Block its extra dial,
// force-close the owned socket, and observe completion rather than IsClosed alone.
func closeConnection(conn *pgconn.PgConn, raw net.Conn) error {
	ctx, cancel := context.WithTimeout(context.Background(), cleanupLimit)
	defer cancel()
	e := conn.Close(ctx)
	if raw != nil {
		_ = raw.Close()
	}
	select {
	case <-conn.CleanupDone():
		if e != nil || ctx.Err() != nil {
			return errors.Join(ErrCleanup, ctx.Err())
		}
		return nil
	case <-ctx.Done():
		return errors.Join(ErrCleanup, ctx.Err())
	}
}
