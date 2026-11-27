package localpeer

import (
	"errors"
	"net"
	"testing"
)

func TestRejectsMissingConnection(t *testing.T) {
	for _, connection := range []*net.UnixConn{nil, {}} {
		got, err := Read(connection)
		if !errors.Is(err, ErrConnection) || got != (Credentials{}) {
			t.Fatalf("missing connection returned facts: %#v, %v", got, err)
		}
	}
}
