//go:build !darwin || !arm64

package localpeer

import (
	"errors"
	"net"
	"testing"
)

func TestUnsupportedPlatformCannotSupplyCredentials(t *testing.T) {
	if got, err := readPlatform(&net.UnixConn{}); !errors.Is(err, ErrUnsupported) || got != (Credentials{}) {
		t.Fatalf("unsupported platform supplied facts: %#v, %v", got, err)
	}
}
