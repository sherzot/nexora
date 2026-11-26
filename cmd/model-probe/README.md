# C26 — Developer-only local model probe

The owner-approved C26 batch adds a provider-neutral text contract, one Ollama
adapter and an independent CLI. This is a diagnostic development command, not a
NEXORA Agent, Run, Workflow, Tool, admission service or Virtual Office integration.
It does not change the HTTP skeleton or existing operational governance.

Ownership: `internal/modelprobe` owns the consumer interface and validation;
`internal/platform/ollama` implements HTTP translation; `cmd/model-probe` composes
them with stdin/stdout. The architecture test adds narrow permissions for these
three owners only. Existing Runtime, identity, demo and other package restrictions
remain unchanged. There is no new dependency, shared domain state or persistence.

## Prerequisites and use

Use an existing verified Go toolchain compatible with `go.mod` (Go 1.27.1), with
`GOTOOLCHAIN=local GOPROXY=off GOFLAGS=-mod=readonly`. Do not install or download
anything to run this command. Build outside the repository, for example:

```sh
NEXORA_PROBE_BUILD=$(mktemp -d)
go build -o "$NEXORA_PROBE_BUILD/model-probe" ./cmd/model-probe
printf '%s\n' 'Explain what happens when an integer is divided by zero in Go.' | "$NEXORA_PROBE_BUILD/model-probe"
```

Only explicitly supplied stdin is sent. No prompt, path, model or URL positional
arguments are accepted; `--help` works without a model. Nothing discovers or reads
repository files. Supplying a file using shell redirection is an explicit action
by the caller; do not supply secrets or material outside your authorization.

The existing independently installed Ollama must already be running at
`http://127.0.0.1:11434` with cloud disabled. The command never starts a server,
pulls a model, changes configuration or falls back to another provider. It checks
`/api/tags` for exactly one `qwen2.5-coder:1.5b` entry with manifest digest
`d7372fd828518a4d38b1eb196c673c31a85f2ed302b3d1e406c4c2d1b64a0668`
before making one `/api/generate` request. Model drift blocks generation.

## Limits and failure behavior

- Nonblank UTF-8 input: at most 4096 bytes, including any trailing newline.
- Context option 2048; generated token limit 256; temperature 0 and seed 42.
- One 60-second deadline covers metadata and generation. Connection timeout is
  two seconds. Ctrl-C/SIGTERM cancels HTTP and interrupts stdin waiting.
- No redirects, environment proxies, automatic retries, cloud calls or tools.
- JSON responses are bounded to 64 KiB after HTTP decompression. Generated text
  is bounded to 16 KiB. Missing counts, invalid UTF-8/JSON, wrong model, incomplete
  or length-truncated generation and negative/over-budget output counts fail.
- Successful stdout is JSON with model, text and observed token counts. JSON
  escapes terminal control characters. Model text remains untrusted data.
- Errors have nonzero exit status and no successful result. Server error bodies
  and supplied prompts are not echoed to diagnostics. Exit 2 is invalid arguments;
  other failures exit 1. Output-write failure can leave partial stdout: require
  both exit 0 and valid complete JSON before consuming a result.

The local server and its native model code are trusted prerequisites, not a
sandbox established by this CLI. No OS-level filesystem/network isolation,
tenant authentication, current authorization, durable evidence or cost custody
is implemented. A local process able to replace the model/server can defeat the
preflight identity check; it is not an atomic per-generation weight attestation.
Byte limits do not establish exact token usage or exclude model-side input context
truncation. This probe is not evidence of faithful whole-repository analysis.
Cancellation stops the client's wait; it does not prove immediate server/GPU
termination. `keep_alive: 0` requests weight unloading after generation.

## Verification and scope boundaries

```sh
go test ./cmd/model-probe ./internal/modelprobe ./internal/platform/ollama ./internal/architecture
go test -race ./cmd/model-probe ./internal/modelprobe ./internal/platform/ollama
go vet ./...
go test ./...
```

Tests use ephemeral loopback HTTP fixtures without downloading a model. They cover
identity drift, protocol/status/size failures, redirect rejection, proxy policy,
deadline/cancellation, concurrent calls, CLI validation and safe output. Real-model
verification is a separate explicit invocation; mocks never establish live model
behavior. No frontend is changed, so browser suites are outside this slice.

Live verification found an important quality limitation: the pinned 1.5B model
returned the exact readiness marker, but incorrectly explained an empty-slice
integer-average fixture as an `xs[0]` index error, inventing an access absent from
the supplied code. The actual error is division by zero. Transport/protocol
verification passed; that semantic quality check FAILED. No prompt retry or model
change was used to conceal it. Do not use this fixture result as engineering
evidence or treat this developer probe as a trusted code-analysis agent.

A future OpenAI adapter would implement the same consumer interface, but still
requires separate provider/data/credential/budget approval. It is not implemented
or enabled by C26. No fallback to a remote API is permitted by this command.

D02 remains NOT ACCEPTED; normative obligations REVIEW ONLY; O1–O5 and
GO-2026-5932 remain OPEN. Historical forensic restrictions and PR #29 P1 remain
unchanged. Operational Run creation/admission/dispatch/persistence remain BLOCKED;
ADR-010 Human Approval is not replaced by a developer invocation. No merge,
deployment, operational execution or authority expansion is granted.
