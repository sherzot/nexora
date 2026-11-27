package localidentity

import (
	"context"
	"errors"
	"io"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	binding "github.com/sherzot/nexora/internal/localidentity"
	"github.com/sherzot/nexora/internal/platform/localpeer"
)

func TestActualSocketIgnoresClientIdentityAndScopeClaims(t *testing.T) {
	root, err := os.MkdirTemp("", "nexora-binding-")
	if err != nil {
		t.Fatal(err)
	}
	t.Log("retained socket directory", root)
	address := &net.UnixAddr{Name: filepath.Join(root, "p.sock"), Net: "unix"}
	listener, err := net.ListenUnix("unix", address)
	if err != nil {
		t.Fatal(err)
	}
	listener.SetUnlinkOnClose(false)
	defer listener.Close()
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
	defer client.Close()
	peer, err := listener.AcceptUnix()
	if err != nil {
		t.Fatal(err)
	}
	defer peer.Close()
	if err := peer.SetDeadline(time.Now().Add(3 * time.Second)); err != nil {
		t.Fatal(err)
	}
	payload := []byte(`{"uid":4294967295,"operator":"administrator","project":"foreign-project"}`)
	if _, err := client.Write(payload); err != nil {
		t.Fatal(err)
	}
	calls := 0
	enabled := true
	r, err := New(func(_ context.Context, account binding.Account) (binding.IdentityRecord, error) {
		calls++
		if account != (binding.Account{UID: uint32(os.Geteuid()), GID: uint32(os.Getegid())}) {
			t.Fatal("client selected identity", account)
		}
		return binding.IdentityRecord{Account: account, OperatorID: "fixture-operator", WorkloadID: "fixture-workload", Revision: 1, Enabled: enabled}, nil
	}, func(_ context.Context, operator, workload string) (binding.ScopeRecord, error) {
		return binding.ScopeRecord{OperatorID: operator, WorkloadID: workload, OrganizationID: "fixture-org", ProjectID: "fixture-project", Revision: 2, Enabled: true}, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	old, err := r.Observe(context.Background(), peer)
	if err != nil || old.ProjectID() != "fixture-project" || old.OperatorID() != "fixture-operator" {
		t.Fatal(old, err)
	}
	body := make([]byte, len(payload))
	if _, err := io.ReadFull(peer, body); err != nil || string(body) != string(payload) {
		t.Fatal("payload was consumed or changed", err)
	}
	enabled = false
	got, err := r.Observe(context.Background(), peer)
	if !errors.Is(err, binding.ErrDenied) || got != (binding.Observation{}) || calls != 2 {
		t.Fatal(got, err, calls)
	}
	if err := peer.Close(); err != nil {
		t.Fatal(err)
	}
	if got, err := r.Observe(context.Background(), peer); !errors.Is(err, localpeer.ErrUnavailable) || got != (binding.Observation{}) || calls != 2 {
		t.Fatal("closed peer reached sources", got, err, calls)
	}
}
