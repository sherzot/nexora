package localidentity

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"sync/atomic"
	"testing"
)

func records() (IdentityRecord, ScopeRecord) {
	return IdentityRecord{Account: Account{UID: 501, GID: 20}, OperatorID: "fixture-operator", WorkloadID: "fixture-workload", Revision: 3, Enabled: true},
		ScopeRecord{OperatorID: "fixture-operator", WorkloadID: "fixture-workload", OrganizationID: "fixture-org", ProjectID: "fixture-project", Revision: 9, Enabled: true}
}

func TestNoDefaultDependenciesOrContext(t *testing.T) {
	i, s := records()
	identity := func(context.Context, Account) (IdentityRecord, error) { return i, nil }
	scope := func(context.Context, string, string) (ScopeRecord, error) { return s, nil }
	for _, pair := range []struct {
		i IdentityLookup
		s ScopeLookup
	}{{nil, scope}, {identity, nil}, {nil, nil}} {
		if _, err := New(pair.i, pair.s); !errors.Is(err, ErrInput) {
			t.Fatal(err)
		}
	}
	o, _ := New(identity, scope)
	if got, err := o.Resolve(nil, i.Account); !errors.Is(err, ErrInput) || got != (Observation{}) {
		t.Fatal(got, err)
	}
	var missing *Observer
	if got, err := missing.Resolve(context.Background(), i.Account); !errors.Is(err, ErrInput) || got != (Observation{}) {
		t.Fatal(got, err)
	}
	if got, err := (&Observer{}).Resolve(context.Background(), i.Account); !errors.Is(err, ErrInput) || got != (Observation{}) {
		t.Fatal(got, err)
	}
}

func TestIdentityDenialsPrecedeScopeLookup(t *testing.T) {
	valid, scope := records()
	for _, scenario := range []struct {
		name   string
		change func(*IdentityRecord)
		source error
		want   error
	}{
		{"unknown", nil, ErrNoBinding, ErrDenied}, {"unavailable", nil, errors.New("private data"), ErrUnavailable},
		{"disabled", func(i *IdentityRecord) { i.Enabled = false }, nil, ErrDenied},
		{"wrong UID", func(i *IdentityRecord) { i.Account.UID++ }, nil, ErrDenied},
		{"wrong GID", func(i *IdentityRecord) { i.Account.GID++ }, nil, ErrDenied},
		{"empty operator", func(i *IdentityRecord) { i.OperatorID = "" }, nil, ErrUnavailable},
		{"empty workload", func(i *IdentityRecord) { i.WorkloadID = "" }, nil, ErrUnavailable},
		{"no revision", func(i *IdentityRecord) { i.Revision = 0 }, nil, ErrUnavailable},
		{"control", func(i *IdentityRecord) { i.OperatorID = "bad\nref" }, nil, ErrUnavailable},
		{"invalid UTF8", func(i *IdentityRecord) { i.WorkloadID = string([]byte{0xff}) }, nil, ErrUnavailable},
		{"oversized", func(i *IdentityRecord) { i.OperatorID = strings.Repeat("x", 257) }, nil, ErrUnavailable},
		{"whitespace", func(i *IdentityRecord) { i.WorkloadID = " fixture" }, nil, ErrUnavailable},
	} {
		t.Run(scenario.name, func(t *testing.T) {
			i := valid
			if scenario.change != nil {
				scenario.change(&i)
			}
			o, _ := New(func(context.Context, Account) (IdentityRecord, error) { return i, scenario.source }, func(context.Context, string, string) (ScopeRecord, error) {
				t.Fatal("scope lookup after invalid identity")
				return scope, nil
			})
			got, err := o.Resolve(context.Background(), valid.Account)
			if err != scenario.want || got != (Observation{}) {
				t.Fatal(got, err)
			}
		})
	}
}

func TestScopeMustMatchBothOwnedIdentityReferences(t *testing.T) {
	i, valid := records()
	for _, scenario := range []struct {
		name   string
		change func(*ScopeRecord)
		source error
		want   error
	}{
		{"unknown", nil, ErrNoBinding, ErrDenied}, {"unavailable", nil, errors.New("private scope"), ErrUnavailable},
		{"disabled", func(s *ScopeRecord) { s.Enabled = false }, nil, ErrDenied},
		{"wrong operator", func(s *ScopeRecord) { s.OperatorID = "other" }, nil, ErrDenied},
		{"wrong workload", func(s *ScopeRecord) { s.WorkloadID = "other" }, nil, ErrDenied},
		{"no organization", func(s *ScopeRecord) { s.OrganizationID = "" }, nil, ErrUnavailable},
		{"no project", func(s *ScopeRecord) { s.ProjectID = "" }, nil, ErrUnavailable},
		{"no revision", func(s *ScopeRecord) { s.Revision = 0 }, nil, ErrUnavailable},
		{"control", func(s *ScopeRecord) { s.ProjectID = "bad\x00id" }, nil, ErrUnavailable},
		{"oversized", func(s *ScopeRecord) { s.OrganizationID = strings.Repeat("x", 257) }, nil, ErrUnavailable},
	} {
		t.Run(scenario.name, func(t *testing.T) {
			s := valid
			if scenario.change != nil {
				scenario.change(&s)
			}
			o, _ := New(func(context.Context, Account) (IdentityRecord, error) { return i, nil }, func(_ context.Context, operator, workload string) (ScopeRecord, error) {
				if operator != i.OperatorID || workload != i.WorkloadID {
					t.Fatal("scope lookup key changed")
				}
				return s, scenario.source
			})
			got, err := o.Resolve(context.Background(), i.Account)
			if err != scenario.want || got != (Observation{}) {
				t.Fatal(got, err)
			}
		})
	}
}

func TestObservationsAreDetachedAndNeverReusedAsPermission(t *testing.T) {
	i, s := records()
	calls := 0
	o, _ := New(func(context.Context, Account) (IdentityRecord, error) { calls++; return i, nil }, func(context.Context, string, string) (ScopeRecord, error) { return s, nil })
	old, err := o.Resolve(context.Background(), i.Account)
	if err != nil {
		t.Fatal(err)
	}
	if old.Account() != i.Account || old.OperatorID() != i.OperatorID || old.WorkloadID() != i.WorkloadID || old.OrganizationID() != s.OrganizationID || old.ProjectID() != s.ProjectID || old.IdentityRevision() != 3 || old.ScopeRevision() != 9 {
		t.Fatal(old)
	}
	i.Enabled = false
	s.ProjectID = "changed"
	s.Revision++
	got, err := o.Resolve(context.Background(), i.Account)
	if calls != 2 || err != ErrDenied || got != (Observation{}) || old.ProjectID() != "fixture-project" || old.ScopeRevision() != 9 {
		t.Fatal(got, err, old, calls)
	}
}

func TestCancellationCannotYieldSuccessfulObservation(t *testing.T) {
	for _, phase := range []string{"before", "identity", "scope"} {
		t.Run(phase, func(t *testing.T) {
			i, s := records()
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			if phase == "before" {
				cancel()
			}
			o, _ := New(func(context.Context, Account) (IdentityRecord, error) {
				if phase == "before" {
					t.Fatal("lookup after cancellation")
				}
				if phase == "identity" {
					cancel()
				}
				return i, nil
			}, func(context.Context, string, string) (ScopeRecord, error) {
				if phase != "scope" {
					t.Fatal("scope called after cancellation")
				}
				cancel()
				return s, nil
			})
			got, err := o.Resolve(ctx, i.Account)
			if !errors.Is(err, context.Canceled) || got != (Observation{}) {
				t.Fatal(got, err)
			}
		})
	}
}

func TestEveryObservationResolvesSourcesWithoutCachedScope(t *testing.T) {
	i, s := records()
	var identityCalls, scopeCalls atomic.Int32
	o, _ := New(func(context.Context, Account) (IdentityRecord, error) { identityCalls.Add(1); return i, nil }, func(context.Context, string, string) (ScopeRecord, error) { scopeCalls.Add(1); return s, nil })
	for range 4 {
		if _, err := o.Resolve(context.Background(), i.Account); err != nil {
			t.Fatal(err)
		}
	}
	if identityCalls.Load() != 4 || scopeCalls.Load() != 4 {
		t.Fatal("source results were cached")
	}
}

func TestObservationJSONNeverBecomesAnAuthorityTransport(t *testing.T) {
	i, s := records()
	o, _ := New(func(context.Context, Account) (IdentityRecord, error) { return i, nil }, func(context.Context, string, string) (ScopeRecord, error) { return s, nil })
	original, err := o.Resolve(context.Background(), i.Account)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := json.Marshal(original); !errors.Is(err, ErrSerialization) {
		t.Fatal(err)
	}
	value := original
	for _, data := range []string{`{}`, `null`, `{"operator":"administrator","project":"other"}`} {
		if err := json.Unmarshal([]byte(data), &value); !errors.Is(err, ErrSerialization) || value != original {
			t.Fatal("deserialization changed observation", err)
		}
	}
}
