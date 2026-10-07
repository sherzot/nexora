# ADR-001 — Core Platform Programming Language

- Status: **Accepted**
- Proposed: 2026-10-04
- Decision authority: human project owner
- Approval date: 2026-10-04
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-001 — Core Platform Programming Language." Acceptance includes the language-scope clarification requested in the same message.
- Decision: Go as the primary language for the NEXORA core platform and execution-facing backend
- Scope: core orchestration and execution-facing backend; excludes frontend, specialized ML workloads, workflow engine selection, and deployment topology

## 1. Context

NEXORA is intended to coordinate specialized engineering agents performing real repository, process, testing, tool, and integration work under human governance. The core must supervise concurrent, long-lived operations while handling failure, cancellation, permissions, and external provider boundaries. Sophia supplies organizational knowledge; the Virtual Office is a presentation layer, not authoritative execution state.

Verified repository evidence: the initial directory was empty and not a Git checkout (`ls -la`; `git status --short`, 2026-10-04). There is no existing backend to preserve, workload benchmark, dependency lockfile, deployment evidence, or accepted ADR. Requirements derive from the project-owner handoff, summarized in [architecture context](../architecture/ARCHITECTURE.md).

Unknown: team proficiency for each candidate, target operating systems, tenant model, expected concurrency, CPU/I/O mix, latency/recovery objectives, memory budgets, and operational staffing. No numerical rankings, performance guarantees, or cloud-cost estimates are justified. These unknowns must be resolved before affected implementation or deployment decisions. This record recommends a language based on stated workload characteristics, not a measured winner.

## 2. Problem

Choose a maintainable core platform language that supports concurrent agent supervision, controlled process/tool interaction, typed domain policy, and long-running execution without making a provider, framework, or infrastructure choice prematurely.

## 3. Decision Drivers

Priority order for this proposal, requiring owner review:

1. Reliable lifecycle and failure handling: cancellation, bounded resource use, retry safety, explicit outcomes.
2. Controlled execution: subprocess supervision and isolation integration, authorization and auditability.
3. Maintainable typed boundaries and testable policy independent of frameworks/providers.
4. Operational simplicity and diagnosable long-running workers.
5. Delivery productivity and compatibility with workflow, MCP, realtime, and provider ecosystems.
6. Memory footprint and total cloud cost, to be measured against the actual workload.

Future validation scenarios, not completed tests: cancellation of a tool run must reclaim its process tree and leases within an owner-agreed deadline; a crashed worker must recover without unauthorized duplicate effects; a slow provider must not block unrelated tasks; untrusted input must fail authorization before side effects; resource saturation must invoke bounded admission/backpressure. Exact limits remain unset. Crash recovery is a workflow/persistence property, not a language guarantee.

## 4. Considered Options

- Go with explicit application/domain boundaries and adapters.
- Kotlin with Spring Boot and JVM libraries; Temporal via Java SDK if selected later.
- TypeScript with Node.js and explicitly chosen backend conventions.
- Python with typed application conventions and asynchronous or process-based execution as appropriate.

All are viable candidates. None intrinsically provides durable workflows, sandboxing, tenant isolation, or safe autonomy.

## 5. Decision

**ACCEPTED: Go is the primary language for the NEXORA core platform and execution-facing backend.** Its concurrency model, context-aware process APIs, static typing, and compiled deployment artifacts fit the stated execution-facing workload. This is an architectural judgment, not evidence that Go will minimize cost or outperform every alternative.

TypeScript remains the expected language for the Virtual Office/web layer, subject to its relevant architecture decision.

Python may be introduced only for specialized workloads where there is a demonstrated technical or ecosystem justification.

Do not introduce additional backend/runtime programming languages merely for developer convenience. Introducing another runtime language must have an explicit architectural or workload justification and, when architecture-significant, must go through the ADR process.

Accepted on 2026-10-04 with explicit human project-owner approval recorded in the metadata above. No runtime version, framework, package, schema, API, workflow engine, or deployment target is selected. React/Next.js remains a frontend hypothesis. Approval of this ADR alone does not authorize application scaffolding, implementation, or ADR-002 under the current request.

## 6. Detailed Design

The language boundary proposed here covers orchestration use cases, lifecycle supervision, policy coordination, and execution/integration adapters. Concrete modules belong in ADR-002/003, not this language decision.

When subsequently authorized for implementation:

- Keep domain rules independent of transport, database, Temporal, MCP, and model-provider SDK types.
- Carry deadlines/cancellation through use cases and adapters; bound concurrent work, queues, output capture, and retries.
- Distinguish local cancellation from durable workflow cancellation and confirmed external-effect completion. A cancelled request is not proof that its tool stopped.
- Access execution through an explicit boundary. Go `os/exec` is process management, not a sandbox; process-tree cleanup and platform-specific isolation require ADR-008.
- Translate provider/tool responses into validated application types. Model output cannot grant capabilities.
- Preserve explicit failure and outcome information for structured telemetry; do not expose private chain-of-thought.

These are design obligations, not implemented contracts or accepted runtime architecture. Whether workers share a deployment is deferred.

## 7. Alternatives Analysis

The table is qualitative judgment against the handoff. Source references substantiate capabilities; costs and relative fit are proposals requiring validation.

| NEXORA requirement | Go | Kotlin / Spring Boot | TypeScript / Node.js | Python |
| --- | --- | --- | --- | --- |
| Concurrency and long-running lifecycle | Goroutines and context support explicit supervision; resource bounds and leak prevention still required [S1, S2] | Coroutine cancellation is cooperative; JVM thread/coroutine interaction must be designed [S3] | Async I/O suits provider/tool waits; synchronous work can block the event loop [S5] | Async subprocess support suits I/O waits; blocking library boundaries need control [S7] |
| Process execution and sandbox interaction | Standard process API avoids implicit shell invocation; cancellation is not full tree isolation [S1] | JVM process APIs are available; coroutine cancellation must be connected to process cleanup [S3, S10] | Async spawn and AbortSignal support; avoid synchronous child APIs and implicit shells [S5] | Async subprocess APIs support parallel monitoring; cleanup/timeouts remain explicit [S7] |
| Temporal compatibility | Official Go SDK | Java SDK is the JVM path; Kotlin interop must be validated | Official TypeScript SDK | Official Python SDK |
| MCP integration | SDK available; validate protocol/transport/auth coverage | Kotlin SDK available; JVM interoperability must be checked | SDK available; direct frontend language continuity | SDK available; AI library integration is attractive |
| Realtime communication | Networking/HTTP standard library supports streaming; WebSocket adapter choice deferred | Spring web ecosystem; framework cost and coupling require discipline | Async I/O maps to streaming; per-client backpressure still required | Async web adapters needed; library selection deferred |
| Type safety and reliability | Compile-time types and explicit errors; race detector helps expose exercised races, not prove correctness [S2] | Static types/nullability and rich modeling; framework annotation behavior needs integration tests | Static checking improves contracts; erased types do not validate runtime input [S6] | Type hints require enforced analysis and runtime validation; interpreter does not enforce annotations [S11] |
| Productivity and maintainability | Explicit wiring aids local reasoning; more application conventions must be established | Rich framework/transaction ecosystem; greater configuration and JVM/Spring knowledge burden | Shared language/tooling with frontend can reduce context switching; core boundaries still need enforcement | Useful specialized AI ecosystem; dynamic boundaries and mixed sync/async dependencies need discipline |
| Operations and observability | Compiled artifacts simplify runtime packaging; metrics/traces/profiling still need design | JVM tooling and Spring Actuator provide operational facilities; protect endpoints [S4] | Runtime/toolchain dependency and event-loop diagnostics; structured telemetry required | Interpreter/environment packaging and async/process diagnostics; structured telemetry required |
| Memory footprint and cloud cost | No NEXORA measurements; smaller runtime overhead is a hypothesis, not a budget guarantee | Measure heap, startup, warm throughput and packaging before judging cost | Measure heap, worker topology and CPU pressure | Measure interpreter, process duplication, native libraries and workload |
| Testing and security | Race testing complements unit/integration/fuzz tests; concurrency and command inputs still risky | Domain and framework integration tests; JVM/framework dependency exposure | Runtime input validation and event-loop saturation tests; package supply chain | Runtime validation, async cancellation and environment tests; package/native supply chain |
| Ecosystem maturity | Standard process/network tooling and official workflow/MCP paths support feasibility | JVM/Spring operational and integration facilities support feasibility | Official workflow/MCP paths and process APIs support feasibility | Official workflow/MCP paths and async subprocess APIs support feasibility |

Temporal support [S8] and MCP SDK availability [S9] eliminate a categorical ecosystem blocker; they do not prove feature parity. Protocol versions, authentication, reconnect behavior, SDK release policy, and provider adapters require later compatibility checks.

### Why the alternatives are not recommended as the default

**Kotlin / Spring Boot:** credible when transactional business complexity, JVM integrations, or team expertise dominate. It adds JVM/framework operational and configuration responsibilities to an execution-oriented platform. No memory penalty or deployment cost is quantified here. Choose it instead if verified staffing and domain needs outweigh Go's supervision and packaging fit.

**TypeScript / Node.js:** credible for an I/O-heavy core and fastest delivery by an established TypeScript team. Event-loop discipline and CPU/blocking work separation are central risks, not reasons it cannot orchestrate agents. Shared syntax does not justify importing frontend concerns into core policy. Reconsider if measured delivery gains outweigh execution supervision tradeoffs.

**Python:** credible for I/O orchestration and specialized ML integration. It is not rejected because an AI platform must avoid Python, or because concurrency is impossible. Conventional CPython's GIL limits CPU-bound Python thread parallelism; free-threaded builds exist and dependencies need evaluation [S12]. Typed-policy enforcement and packaging discipline require deliberate work. Prefer it for the core if actual workloads rely heavily on Python-only execution libraries and staffing supports reliable operation.

**Go tradeoff:** a second language alongside the frontend, fewer Spring-style application conventions, and explicit boilerplate. Goroutines can leak or race; context cancellation is cooperative across boundaries. Static types do not secure external input or provide durable state. These tradeoffs are accepted with this decision.

## 8. Consequences

### Positive

Proposed benefits: coherent execution-facing language, explicit cancellation/error boundaries, compile-time feedback, and deployable binaries. Provider/domain separation remains possible without committing to a framework or LLM vendor.

### Negative

Additional backend/frontend language knowledge; deliberate transaction, validation, and wiring conventions; less direct reuse of Python-only ML libraries. Runtime/framework choices still require work.

### Risks

Team productivity is unknown. SDK compatibility may change. Unbounded goroutines/output or incomplete subprocess cleanup can exhaust resources. Go may not win measured cost/performance. Polyglot specialization can create unnecessary operational boundaries. No language removes hostile-code execution or approval-bypass risks.

## 9. Security Considerations

Language selection is not an isolation boundary. Require authentication, per-operation authorization, tenant/resource scoping, least privilege, validated arguments, secret isolation, path/network controls, and auditability in later designs. Prefer direct executable/argument invocation over shell interpolation; this does not eliminate malicious executable or argument behavior. Never execute untrusted repository code in the control-plane trust boundary merely because process APIs exist.

Treat provider output, MCP descriptions/results, retrieved knowledge, and repositories as untrusted. Explicit owner approval is required for dangerous actions; approvals must ultimately bind to intended action/target and be enforced at execution boundaries. ADR-007 through ADR-010 must resolve injection, credentials, sandbox escape, tenant isolation, and approval replay/change risks before relevant implementation. No security controls have been verified in this documentation-only repository.

## 10. Operational Considerations

Long-lived processes need admission limits, cancellation, graceful shutdown, retry budgets, idempotency, failure recovery, output limits, and observable termination. Durable execution and restart recovery await ADR-004; deployment lifecycle awaits ADR-012. Define structured logs, metrics, traces and audit events without secrets or private model reasoning in ADR-011.

Future validation must measure representative concurrent agent sessions, streamed provider/tool I/O, subprocess churn, cancellation and crash behavior, memory/CPU, startup, and operator recovery. Compare options using identical workloads and record environments. Cost must include models, tools, sandboxes, storage, workflow services, and staffing—not only backend memory. No benchmarks or runtime tests were run for this proposal.

## 11. Evolution / Exit Strategy

Reopen this decision if verified team constraints, incompatible critical SDKs, Python-only workloads, cancellation defects, resource measurements, or operational costs invalidate its drivers. Keep provider, workflow and execution boundaries explicit to limit replacement scope; portability does not imply a cost-free rewrite.

Before implementation, confirm team readiness and target platforms. After separately authorized implementation begins, validate the highest-risk process lifecycle and SDK paths before broad feature work. A changed language decision requires a new Proposed ADR, impact analysis, explicit acceptance and links superseding this record if it had been accepted. No rewrite or service extraction is authorized here.

## 12. Development Constitution Compliance

- Inspected the empty directory before modification; preserved all existing work (none present).
- Created documentation only; no application code, manifests, schemas, dependencies, infrastructure or deletion.
- Compared four required candidates against real stated workloads and disclosed unknowns.
- Recorded Accepted status on 2026-10-04 with explicit human project-owner approval and the requested language-scope clarification; no benchmark claims were added.
- Preserved domain/security boundaries as obligations; did not claim implemented controls.
- Documented verification scope and future evidence gates. ADR-002 has not been started.

## 13. Related Decisions

[ADR index and roadmap](README.md). ADR-002 may test language/module ergonomics; ADR-003 lifecycle semantics; ADR-004 workflow SDK constraints; ADR-007 MCP compatibility; ADR-008 process/isolation needs; ADR-009/010 security and approval enforcement; ADR-011 diagnostics; ADR-012 deployment footprint. All are future analyses, not accepted dependencies. Conflicts must be surfaced through the ADR process.

## 14. Evidence References

Official documentation reviewed 2026-10-04. These links support capability statements, not relative performance or NEXORA readiness. Versions are deliberately unselected.

- S1: [Go os/exec](https://pkg.go.dev/os/exec) — process invocation and context cancellation.
- S2: [Go race detector](https://go.dev/doc/articles/race_detector) — dynamic race detection and limitations.
- S3: [Kotlin cancellation and timeouts](https://kotlinlang.org/docs/cancellation-and-timeouts.html) — cooperative cancellation.
- S4: [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/index.html) — operational features.
- S5: [Node.js child processes](https://nodejs.org/api/child_process.html) — asynchronous spawn, blocking synchronous APIs, AbortSignal.
- S6: [TypeScript basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html) — static checking and erased types.
- S7: [Python asyncio subprocesses](https://docs.python.org/3/library/asyncio-subprocess.html) — asynchronous execution/monitoring.
- S8: [Temporal SDK architecture](https://docs.temporal.io/encyclopedia/temporal-sdks) and [Java development](https://docs.temporal.io/develop/java) — supported language paths.
- S9: [MCP SDKs](https://modelcontextprotocol.io/docs/sdk) — available official language SDKs; assess actual compatibility later.
- S10: [Java ProcessHandle](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/ProcessHandle.html) — process control and descendants.
- S11: [Python typing](https://docs.python.org/3/library/typing.html) — annotations are not enforced by runtime.
- S12: [Python threading](https://docs.python.org/3/library/threading.html) — GIL and free-threaded build caveats.
