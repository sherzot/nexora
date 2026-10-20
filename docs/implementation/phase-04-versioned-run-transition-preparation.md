# Implementation Phase 4 — Versioned Run Transition Preparation

## Authority and baseline

The human project owner explicitly accepted the Phase 4 Architecture & Scope Proposal and Scope Acceptance Record in this conversation, then separately authorized this implementation on 2026-10-20. This is an implementation record, not a new ADR or amendment to an Accepted ADR.

Verified before mutation: local HEAD/main/origin/main and live remote main all matched `e2ce082814f001d6dd5a0727da04018591b02c54`; worktree/index were clean. GitHub PR #3 was MERGED with that merge commit. Neither local nor remote contained `feat/versioned-run-transition-preparation`. That single branch was created from verified main. Phases 1–3, governance, all Accepted ADRs, Runtime APIs and dependency fitness were reviewed; proposal/acceptance evidence remains in the conversation.

Authorization permits this narrow implementation, focused tests, documentation, local verification and one commit/push to the named feature branch. PR creation, merge, Phase 5 and broader operational implementation remain unauthorized.

## Implemented contracts and ownership

Everything added is owned by the existing `internal/runtime` package; no package/import boundary is broadened. Existing Phase 3 source and tests remain unchanged. Production code adds only the already permitted standard-library `errors` import.

| API | Implemented local meaning |
| --- | --- |
| `NewRunRevision(uint64)` / `RunRevision` | Private uint64 representation, zero invalid; `Value`, `IsZero`, `Next` |
| `NewRunSnapshot(Run, RunRevision)` / `RunSnapshot` | Immutable pair; `Run`, `Revision`, `IsZero`; validates nonzero attribution/revision and state/metadata combinations |
| Seven `RunSnapshot.Prepare…` methods | Explicit expected RunID/revision plus typed operation metadata where applicable |
| `PreparedRunTransition` | Private immutable fields; `PredecessorID`, `PredecessorRevision`, `Operation`, `Candidate`, `ProposedRevision`, `IsZero` |
| `RunOperation` | Output-only operation-kind metadata; no arbitrary command-dispatch API |

Initial valid revision is 1. Every positive uint64 is representable; callers can pair an existing Run with an explicit revision without claiming authoritative retrieval. Successful preparation proposes exactly N+1. Maximum uint64 is valid but cannot advance; overflow returns an error without wrapping. `Next` never mutates its receiver. No timestamp, claim, lease, fence or authoritative freshness follows from a revision.

The preparation methods are `PrepareEnqueue`, `PrepareStart`, `PrepareWait`, `PrepareRequeue`, `PrepareFinish`, `PrepareRequestStop` and `PrepareWithEffectKnowledgeProjection`. Each delegates the actual transition to the corresponding existing Run method. The private common helper cannot be supplied by external callers with arbitrary transformations; there is no universal command framework or speculative repository interface.

## Preparation, predecessor and rejection semantics

Given the supplied snapshot, preparation checks snapshot validity, expected identity, nonzero expected revision, revision equality, and typed metadata validity in that order. It then rejects terminal mutation, invokes the existing domain operation on a value copy, and checks revision exhaustion before constructing a candidate. If several conditions fail, the first check in that order determines the error. Domain rejection precedes overflow; no candidate escapes on either failure.

| Classification | Inspectable error |
| --- | --- |
| Invalid/unset snapshot | `ErrInvalidSnapshot`, joined with `ErrInvalidRevision` or `ErrInvalidRun` |
| Invalid expected revision | `ErrInvalidRevision` |
| Zero/wrong expected identity | `ErrRunIdentityMismatch` |
| Expected revision differs from supplied revision | `ErrExpectedRevisionMismatch` |
| Invalid typed metadata | Existing `ErrInvalidValue` |
| Illegal lifecycle operation | Existing `ErrIllegalTransition` |
| Stop-related restriction / repeated stop | Existing `ErrStopRequested` |
| Terminal mutation with otherwise valid inputs | `ErrTerminalMutation`, joined with `ErrIllegalTransition` |
| Revision exhaustion | `ErrRevisionOverflow` |

Use `errors.Is` to inspect classifications. Invalid operation kinds cannot be submitted: callers select one of seven concrete methods, with no caller-supplied discriminator. An invalid operation for the current lifecycle rejects through the domain method. Expected-revision mismatch describes only the two supplied values, never authoritative storage staleness.

All errors return the zero/unset prepared value. The supplied Run/snapshot/revision remain unchanged on success and failure. Getters return copies; deriving another Run from a getter does not mutate the retained candidate or predecessor. Candidate identity and historical configuration/assignment attribution remain equal to the predecessor's. The prepared value binds predecessor ID/revision and requested operation kind to the candidate and proposed revision.

Existing terminal/wait/stop/outcome/projection semantics are preserved. A repeated stop remains an error; explicit completion can win after stop intent where the domain permits it. Unknown effects remain independently representable. A valid same-category projection replacement proposes N+1 even when the candidate Run equals the predecessor Run. Whole-value JSON encode/decode is explicitly rejected for revision, snapshot and candidate using `ErrRunSerialization`; failed decoding preserves receivers. No external serialization contract is introduced.

## Concurrency, security and evidence limits

**Prepared means locally valid only: not committed, authorized, dispatched or durably recorded.** Two independent preparations from N may both succeed with different candidates at N+1; repeating preparation is deterministic and does not acquire ownership. Tests selecting a returned value as the next local snapshot do not implement authoritative commit or recovery.

No mutex, compare-and-swap, claim, lease, fence, command identity ledger or durable deduplication exists. Revision equality cannot establish current ownership or freshness. Complete launch attribution remains partial as in Phases 2/3. No trusted principal, tenant scope, current authorization, Approval usability, budget or resolver evidence is established. The executable remains the unchanged local HTTP skeleton and does not compose Runtime.

Effect knowledge is the caller-reported Runtime projection, not verified Tool/Execution evidence. Even Confirmed categories do not validate provenance or custody; Unknown blocks blind consequential retry under the Accepted architecture. This phase implements no retry eligibility, dispatch, reconciliation or evidence policy. Successful local Finish is not proof that processes stopped, effects reversed, a task was accepted or operational result checks occurred.

## Accepted ADR and constitution compliance

ADR-001/002: Go, existing owner boundary, inward dependencies and no implicit Shared Kernel. ADR-003: stable identity/history and separate lifecycle/wait/stop/outcome/effects with terminal freeze. ADR-004: no competing orchestration, timers or Workflow authority. ADR-005: no durability/exactly-once/publication claim. ADR-006–008: Sophia, Tool and Execution retain separate truth/evidence ownership. ADR-009/010: no identity/history/preparation/Approval-derived authority. ADR-011: candidate is not durable audit. ADR-012: storage/deployment acceptance does not authorize integration here.

The constitution permits the explicitly authorized focused code/tests and necessary documentation/status corrections. No constitution, Accepted ADR, prior implementation record, unrelated module or existing Phase 3 source/test is changed; no deletion, dependency or infrastructure is introduced. No additional ADR is created or accepted. README/AGENTS correct only active implementation scope/status. No runtime security, persistence or operational safety guarantee is asserted.

## Tests and verification

Focused tests cover revision zero/1/increment/max/overflow; unset and malformed snapshots; expected identity/revision; all seven entry points across five states and every valid metadata category; all 256 metadata enum values; stopped advancement/repeated stop/explicit completion; all effect/outcome pairs; same-category Unknown projection; immutable predecessors/getter copies; competing candidates/no exclusivity/determinism; and rejected serialization.

`FuzzRunPreparation` exercises bounded arbitrary sequences (up to 1024 bytes), invalid metadata/preconditions, unchanged rejected inputs, candidate binding, identity/attribution/revision invariants and terminal freeze. It tests value semantics only, not concurrent commits, authority, durable recovery or effects.

Executed on 2026-10-20 with Go 1.27.1, darwin/arm64:

| Command / check | Observed result |
| --- | --- |
| `go test -count=1 ./internal/runtime ./internal/architecture` | Exit 0; focused tests and fitness passed before final full verification |
| `gofmt -l cmd internal` | Exit 0; no filenames |
| `go vet ./...` | Exit 0; no diagnostics |
| `go test -count=1 ./...` | Exit 0; all nine packages freshly passed, including prior Phase 1–3 tests and architecture fitness |
| `go test -race -count=1 ./...` | Exit 0; all nine packages freshly passed |
| `go build ./...` | Exit 0 |
| `git diff --check` | Exit 0; no diagnostics |
| `go test ./internal/runtime -run '^$' -fuzz '^FuzzRunPreparation$' -fuzztime=3s -parallel=1` | PASS, exit 0; 10,145 executions, 30 new interesting inputs, 35 total; shutdown included in 4.385s |
| `go list -m all` / `go list` import inspection | Only NEXORA module; same nine packages and existing import graph, zero third-party modules; no go.sum |
| Baseline preservation / scope / document links | Constitution, all twelve Accepted ADRs, architecture, Phase 1–3 records, executable and prior source/tests unchanged; exactly five authorized added/modified files, no deletions; README/AGENTS Phase 4 links resolve |

Only `internal/runtime/preparation.go`, `internal/runtime/preparation_test.go`, this record, README and AGENTS change. Final commit/push and clean branch evidence are reported separately after publication. The race detector covers exercised Go paths, not authoritative concurrency; bounded fuzzing is not an exhaustive proof. No database, provider, workflow, operational security, cross-platform, recovery or deployment behavior was tested or claimed.

## Deferred work

Persistence/PostgreSQL/SQL/migrations/drivers/repositories; atomic commits/concurrency enforcement; durable command idempotency; worker claims/leases/fencing; Temporal/Workflow; models/providers; Tool/MCP dispatch; Execution Jobs; Security/authorization/tenant isolation; Approval; durable audit/events/custody; operational waits/stops/retries/recovery; complete launch attribution; HTTP endpoints/executable integration; external serialization; infrastructure/deployment and Phase 5 all remain deferred. Their contracts and explicit authorization must precede affected implementation. No operational guarantee follows from passing local tests.
