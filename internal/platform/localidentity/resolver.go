// Package localidentity bridges an actual Unix peer to owner binding observations.
// It creates no listener, principal, scope grant or operational endpoint.
package localidentity

import (
	"context"
	"net"

	binding "github.com/sherzot/nexora/internal/localidentity"
	"github.com/sherzot/nexora/internal/platform/localpeer"
)

type Resolver struct{ observer *binding.Observer }

func New(identity binding.IdentityLookup, scope binding.ScopeLookup) (*Resolver, error) {
	observer, err := binding.New(identity, scope)
	if err != nil {
		return nil, err
	}
	return &Resolver{observer: observer}, nil
}

// Observe has no caller-provided UID/operator/project parameters. It does not
// consume payloads. Sources are trusted composition dependencies, not plugins
// selected by a client/model. Their availability, provenance and policy remain
// separate from the kernel mechanism. No production source is installed here.
func (r *Resolver) Observe(ctx context.Context, connection *net.UnixConn) (binding.Observation, error) {
	if r == nil || r.observer == nil || ctx == nil {
		return binding.Observation{}, binding.ErrInput
	}
	if err := ctx.Err(); err != nil {
		return binding.Observation{}, err
	}
	credentials, err := localpeer.Read(connection)
	if err != nil {
		return binding.Observation{}, err
	}
	return r.observer.Resolve(ctx, binding.Account{UID: credentials.UID, GID: credentials.GID})
}
