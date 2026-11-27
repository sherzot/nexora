package localidentity

import (
	"context"
	"errors"
	"testing"

	binding "github.com/sherzot/nexora/internal/localidentity"
	"github.com/sherzot/nexora/internal/platform/localpeer"
)

func TestNoSourcesUsedWithoutKernelConnection(t *testing.T) {
	r, err := New(func(context.Context, binding.Account) (binding.IdentityRecord, error) {
		t.Fatal("identity called without kernel evidence")
		return binding.IdentityRecord{}, nil
	}, func(context.Context, string, string) (binding.ScopeRecord, error) {
		t.Fatal("scope called without identity")
		return binding.ScopeRecord{}, nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if got, err := r.Observe(context.Background(), nil); !errors.Is(err, localpeer.ErrConnection) || got != (binding.Observation{}) {
		t.Fatal(got, err)
	}
	if got, err := r.Observe(nil, nil); !errors.Is(err, binding.ErrInput) || got != (binding.Observation{}) {
		t.Fatal(got, err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if got, err := r.Observe(ctx, nil); !errors.Is(err, context.Canceled) || got != (binding.Observation{}) {
		t.Fatal(got, err)
	}
	var absent *Resolver
	if got, err := absent.Observe(context.Background(), nil); !errors.Is(err, binding.ErrInput) || got != (binding.Observation{}) {
		t.Fatal(got, err)
	}
	if _, err := New(nil, nil); !errors.Is(err, binding.ErrInput) {
		t.Fatal(err)
	}
}
