//go:build !darwin || !arm64

package localpeer

import "net"

func readPlatform(*net.UnixConn) (Credentials, error) {
	return Credentials{}, ErrUnsupported
}
