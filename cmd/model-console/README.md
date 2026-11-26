# C27 — Local Model Review Console

Owner-approved C27 adds a separate developer console for explicitly submitted
text. It is not a Virtual Office integration, admitted Agent/Run, approval UI,
code execution service or trusted engineering assistant. Known local model quality
failures remain unresolved. Every answer is visibly marked unverified.

The default C26 Ollama endpoint, model and digest are unchanged. The separately
evaluated Qwen3 candidate is not selected. No model/runtime installation, download,
cloud fallback, new dependency, repository discovery, shell/tool execution or
persistence is performed by this command.

## Run locally

Use an existing verified Go1.27.1 toolchain in PATH and existing approved Ollama
setup; do not download a toolchain, module, browser or model to satisfy this guide.

```sh
export GOTOOLCHAIN=local GOPROXY=off GOFLAGS=-mod=readonly
NEXORA_CONSOLE_BUILD=$(mktemp -d)
go build -o "$NEXORA_CONSOLE_BUILD/model-console" ./cmd/model-console
"$NEXORA_CONSOLE_BUILD/model-console"
```

Open the printed `http://127.0.0.1:<available-port>` URL. No bind/model/URL/file
arguments are accepted. `--help` works without the model. Ctrl-C/SIGTERM cancels
active HTTP contexts and drains the server within three seconds; it does not
prove immediate model/GPU termination. No login item or deployment is configured.

Submit a short synthetic example or text you are authorized to disclose locally.
Do not paste secrets. Input is at most 4096 UTF-8 bytes (not characters), with a
60-second provider deadline and one active console request at a time. There is
no queue or retry. Cancel aborts the browser request and invalidates old response
callbacks. Clear removes input/output; reload or returning from a cached page
clears the view. No localStorage, cookies, repository reads or application history
are used. Browser/OS history and Ollama internals are not controlled by this UI.

## HTTP and data boundaries

- `cmd/model-console` composes the unchanged provider and new console only.
- `internal/platform/modelconsole` consumes the C26 interface. It does not import
  Runtime, Workflow, Approval, Tool or Execution owners. Architecture permissions
  are added narrowly for these two new owners; existing restrictions stay intact.
- Only fixed GET `/` and POST `/api/probe` routes exist. HTML/CSS/JS are embedded
  at build time; there is no filesystem server, asset download or external font.
- IPv4 loopback binding, exact Host and remote loopback checks, exact POST Origin,
  JSON-only content type and random per-process request token protect the browser
  request boundary. Unknown JSON fields/model/URL overrides, query parameters,
  non-UTF-8 bodies, oversized bodies and concurrent requests reject before model use.
- No CORS allowance. Nonce-based CSP permits only bundled scripts/styles and
  same-origin fetch; framing, forms, external assets and workers are denied.
  Responses are no-store/nosniff and do not send a referrer. Model output/error
  messages use textContent, never HTML/Markdown rendering or eval.
- The root page supplies its request token to same-origin JavaScript. This is
  CSRF protection, **not user authentication**: a trusted local process can fetch
  the page and supply the token/Origin itself. The console grants no OS, tenant,
  operational or approval authority. Do not expose it through a proxy or tunnel.
- Errors are sanitized; provider error bodies/prompts/results are not logged.
  Cancellation and timeout return no successful result. The existing adapter's
  response/token limits, identity preflight and no-proxy/redirect policy still apply.

The local model/native server is an independently trusted prerequisite. This
console supplies no OS sandbox, atomic model attestation, durable evidence or
exact token/truncation guarantee. Its single-request slot does not prevent another
local application using Ollama. A successful response is not correctness evidence.

## Verification

```sh
go test ./cmd/model-console ./internal/platform/modelconsole ./internal/architecture
go test -race ./cmd/model-console ./internal/platform/modelconsole
go vet ./...
go test ./...
```

Go fixtures verify request guards before provider invocation, bounded payloads,
safe JSON, sanitized errors, single-flight behavior, actual HTTP cancellation and
loopback command lifecycle. Existing C26/Runtime/frontend source remains unchanged.

Use only the existing approved Playwright runtime and pinned browser revisions:

```sh
NEXORA_CONSOLE_EVIDENCE=$(mktemp -d)
export NEXORA_CONSOLE_EVIDENCE
export NEXORA_PLAYWRIGHT_MODULE=/absolute/path/to/existing/playwright-core/index.mjs
node --no-addons cmd/model-console/browser-check.mjs chromium http://127.0.0.1:PORT
```

Repeat with `firefox` and `webkit`. Preserve the established macOS Firefox
`CFFIXED_USER_HOME` workaround in an isolated per-run directory and WebKit's
Option+Tab convention. The runner renders one live pinned-model response, then
uses explicit browser fixtures for text-only/XSS, timeout and stale-callback
coverage; these fixtures are not real model-quality tests. It also checks actual
missing-token rejection, keyboard focus, mobile widths320/390, dark/reduced motion
and reload cleanup. A semantic answer is never asserted correct merely because
the transport completed. No previous stress-duration suites need repetition.

No merge/deployment authorization. D02 NOT ACCEPTED; normative REVIEW ONLY;
O1–O5 and GO-2026-5932 OPEN; historical forensic/PR29 P1 restrictions unchanged.
Operational Run creation/admission/dispatch/persistence remain BLOCKED. Human
inspection of text in this console is not ADR-010 Human Approval or usable consent.
