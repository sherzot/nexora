// Package localpeer reads OS peer-account facts from an existing local socket.
// These facts are not a NEXORA principal, delegation, scope or permission.
package localpeer

import (
	"errors"
	"net"
)

var (
	ErrConnection  = errors.New("localpeer: connected Unix stream required")
	ErrUnavailable = errors.New("localpeer: kernel peer credentials unavailable")
	ErrUnsupported = errors.New("localpeer: unsupported platform")
)

// Credentials describes the peer account at the kernel's credential boundary.
// It does not attest a human, workload binary, current membership or revocation.
// UID zero is a possible OS fact, never an implicit administrator grant.
type Credentials struct {
	UID uint32
	GID uint32
}

// Read obtains kernel credentials without consuming the socket's payload.
// Only Darwin ARM64 is admitted by the current mechanism verification. Other
// platforms fail closed. Always check err: zero-valued facts do not mean success.
// The caller owns the connection and must establish its own trusted lifecycle.
func Read(connection *net.UnixConn) (Credentials, error) {
	if connection == nil {
		return Credentials{}, ErrConnection
	}
	local, remote := connection.LocalAddr(), connection.RemoteAddr()
	if local == nil || remote == nil || local.Network() != "unix" || remote.Network() != "unix" {
		return Credentials{}, ErrConnection
	}
	return readPlatform(connection)
}
