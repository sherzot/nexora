package localpeer

import (
	"errors"
	"io"
	"net"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"
	"unsafe"
)

// Preserve test artifacts/socket paths rather than deleting historical evidence.
func socketDirectory(t *testing.T) string {
	t.Helper()
	root, err := os.MkdirTemp("", "nexora-peer-")
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("retained socket directory: %s", root)
	return root
}

func socketPair(t *testing.T) (*net.UnixConn, *net.UnixConn) {
	t.Helper()
	address := &net.UnixAddr{Name: filepath.Join(socketDirectory(t), "p.sock"), Net: "unix"}
	listener, err := net.ListenUnix("unix", address)
	if err != nil {
		t.Fatal(err)
	}
	listener.SetUnlinkOnClose(false)
	t.Cleanup(func() { _ = listener.Close() })
	if err := os.Chmod(address.Name, 0600); err != nil {
		t.Fatal(err)
	}
	if err := listener.SetDeadline(time.Now().Add(3 * time.Second)); err != nil {
		t.Fatal(err)
	}
	client, err := net.DialUnix("unix", nil, address)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = client.Close() })
	peer, err := listener.AcceptUnix()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = peer.Close() })
	for _, connection := range []*net.UnixConn{client, peer} {
		if err := connection.SetDeadline(time.Now().Add(3 * time.Second)); err != nil {
			t.Fatal(err)
		}
	}
	return client, peer
}

func TestKernelFactsIgnoreAndPreserveClaimedIdentityPayload(t *testing.T) {
	client, peer := socketPair(t)
	payload := []byte(`{"claimed_uid":4294967295,"role":"administrator"}`)
	if _, err := client.Write(payload); err != nil {
		t.Fatal(err)
	}
	got, err := Read(peer)
	if err != nil || got.UID != uint32(os.Geteuid()) || got.GID != uint32(os.Getegid()) {
		t.Fatalf("kernel credentials mismatch: %#v, %v", got, err)
	}
	body := make([]byte, len(payload))
	if _, err := io.ReadFull(peer, body); err != nil || string(body) != string(payload) {
		t.Fatalf("Read consumed or modified caller data: %q, %v", body, err)
	}
	if err := peer.Close(); err != nil {
		t.Fatal(err)
	}
	if facts, err := Read(peer); !errors.Is(err, ErrUnavailable) || facts != (Credentials{}) {
		t.Fatalf("closed descriptor must not return cached facts: %#v, %v", facts, err)
	}
}

func TestConcurrentReadsHaveNoSharedCredentialState(t *testing.T) {
	_, peer := socketPair(t)
	var wait sync.WaitGroup
	for range 16 {
		wait.Add(1)
		go func() {
			defer wait.Done()
			got, err := Read(peer)
			if err != nil || got.UID != uint32(os.Geteuid()) || got.GID != uint32(os.Getegid()) {
				t.Errorf("concurrent credential read: %#v, %v", got, err)
			}
		}()
	}
	wait.Wait()
}

func TestRejectsUnconnectedDatagram(t *testing.T) {
	address := &net.UnixAddr{Name: filepath.Join(socketDirectory(t), "d.sock"), Net: "unixgram"}
	connection, err := net.ListenUnixgram("unixgram", address)
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	if got, err := Read(connection); !errors.Is(err, ErrConnection) || got != (Credentials{}) {
		t.Fatalf("datagram accepted: %#v, %v", got, err)
	}
}

func TestUnknownKernelLayoutsRejectBeforeReturningFacts(t *testing.T) {
	if unsafe.Sizeof(xucred{}) != 76 {
		t.Fatal("unexpected compiled xucred layout")
	}
	valid := xucred{UID: 123, NGroups: 1, Groups: [16]uint32{456}}
	for _, size := range []uint32{0, 75, 77} {
		if got, err := decode(valid, size); !errors.Is(err, ErrUnavailable) || got != (Credentials{}) {
			t.Fatal("accepted unknown size", size, got, err)
		}
	}
	for _, groups := range []int16{-1, 0, 17} {
		value := valid
		value.NGroups = groups
		if got, err := decode(value, 76); !errors.Is(err, ErrUnavailable) || got != (Credentials{}) {
			t.Fatal("accepted invalid group count", groups, got, err)
		}
	}
	value := valid
	value.Version = 1
	if got, err := decode(value, 76); !errors.Is(err, ErrUnavailable) || got != (Credentials{}) {
		t.Fatal("accepted unknown kernel version", got, err)
	}
	for _, value := range []xucred{valid, {NGroups: 16}} {
		got, err := decode(value, 76)
		if err != nil || got != (Credentials{UID: value.UID, GID: value.Groups[0]}) {
			t.Fatal("failed to preserve raw facts", got, err)
		}
	}
}
