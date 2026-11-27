// Package localidentity checks owner-supplied local identity binding observations.
// An observation is not authentication, current permission or Run admission.
package localidentity

import (
	"context"
	"errors"
	"strings"
	"unicode"
	"unicode/utf8"
)

var (
	ErrInput         = errors.New("localidentity: invalid dependency or context")
	ErrNoBinding     = errors.New("localidentity: source has no binding")
	ErrDenied        = errors.New("localidentity: binding unavailable for this account")
	ErrUnavailable   = errors.New("localidentity: required owner evidence unavailable")
	ErrSerialization = errors.New("localidentity: observation serialization is not defined")
)

// Account must come from a trusted kernel adapter, never request JSON.
type Account struct{ UID, GID uint32 }

// IdentityRecord is an explicit owner projection, not a client identity claim.
// WorkloadID is a provisioned binding, not attestation of an executable/process.
type IdentityRecord struct {
	Account                Account
	OperatorID, WorkloadID string
	Revision               uint64
	Enabled                bool
}

// ScopeRecord is supplied by the scope owner, independently of identity lookup.
type ScopeRecord struct {
	OperatorID, WorkloadID, OrganizationID, ProjectID string
	Revision                                          uint64
	Enabled                                           bool
}

// Lookups must honor ctx and obtain appropriately scoped owner observations.
// No implementation, persistent registry or default owner is supplied here.
type IdentityLookup func(context.Context, Account) (IdentityRecord, error)
type ScopeLookup func(context.Context, string, string) (ScopeRecord, error)

// Observation retains immutable copies of the exact source references/revisions.
// It is not a bearer credential; owners must revalidate authority at actual use.
// It intentionally has no serialization contract or public field constructor.
type Observation struct {
	account                          Account
	operator, workload, org, project string
	identityRevision, scopeRevision  uint64
}

func (o Observation) Account() Account         { return o.account }
func (o Observation) OperatorID() string       { return o.operator }
func (o Observation) WorkloadID() string       { return o.workload }
func (o Observation) OrganizationID() string   { return o.org }
func (o Observation) ProjectID() string        { return o.project }
func (o Observation) IdentityRevision() uint64 { return o.identityRevision }
func (o Observation) ScopeRevision() uint64    { return o.scopeRevision }

// Reject accidental persistence or request-body reconstruction of observations.
func (Observation) MarshalJSON() ([]byte, error) { return nil, ErrSerialization }
func (*Observation) UnmarshalJSON([]byte) error  { return ErrSerialization }

// Observer owns no identity/scope state and caches no previous allowance.
type Observer struct {
	identity IdentityLookup
	scope    ScopeLookup
}

func New(identity IdentityLookup, scope ScopeLookup) (*Observer, error) {
	if identity == nil || scope == nil {
		return nil, ErrInput
	}
	return &Observer{identity: identity, scope: scope}, nil
}

// Resolve is an internal owner-composition boundary. Account is an asserted
// input here; transport callers must use the kernel-reading platform adapter.
// Sequential observations do not prove transactional freshness or revocation.
func (o *Observer) Resolve(ctx context.Context, account Account) (Observation, error) {
	if o == nil || o.identity == nil || o.scope == nil || ctx == nil {
		return Observation{}, ErrInput
	}
	if err := ctx.Err(); err != nil {
		return Observation{}, err
	}
	identity, err := o.identity(ctx, account)
	if ctx.Err() != nil {
		return Observation{}, ctx.Err()
	}
	if err != nil {
		return Observation{}, sourceError(err)
	}
	if !identity.Enabled || identity.Account != account {
		return Observation{}, ErrDenied
	}
	if !opaque(identity.OperatorID) || !opaque(identity.WorkloadID) || identity.Revision == 0 {
		return Observation{}, ErrUnavailable
	}
	scope, err := o.scope(ctx, identity.OperatorID, identity.WorkloadID)
	if ctx.Err() != nil {
		return Observation{}, ctx.Err()
	}
	if err != nil {
		return Observation{}, sourceError(err)
	}
	if !scope.Enabled || scope.OperatorID != identity.OperatorID || scope.WorkloadID != identity.WorkloadID {
		return Observation{}, ErrDenied
	}
	if !opaque(scope.OrganizationID) || !opaque(scope.ProjectID) || scope.Revision == 0 {
		return Observation{}, ErrUnavailable
	}
	return Observation{account: account, operator: identity.OperatorID, workload: identity.WorkloadID,
		org: scope.OrganizationID, project: scope.ProjectID,
		identityRevision: identity.Revision, scopeRevision: scope.Revision}, nil
}

func sourceError(err error) error {
	if errors.Is(err, ErrNoBinding) {
		return ErrDenied
	}
	return ErrUnavailable // Do not disclose raw owner errors or private lookup data.
}

// This bounds opaque owner references, without inventing UUIDs or normalizing
// human names into keys. Only the source owner defines namespace/canonical meaning.
func opaque(value string) bool {
	if value == "" || len(value) > 256 || !utf8.ValidString(value) || strings.TrimSpace(value) != value {
		return false
	}
	for _, character := range value {
		if unicode.IsControl(character) {
			return false
		}
	}
	return true
}
