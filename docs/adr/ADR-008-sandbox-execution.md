# ADR-008 — Sandbox & Execution Architecture

- Status: **Accepted**
- Proposal date: 2026-10-05
- Decision authority: Human project owner
- Approval date: 2026-10-05
- Approval evidence: explicit human project-owner approval in this conversation: "I approve ADR-008 — Sandbox & Execution Architecture as proposed." Acceptance preserves the existing architecture and all 50 execution invariants without semantic modification.
- Recommendation: Dedicated controlled execution boundary with attributable, bounded jobs; hostile-code isolation stronger than an ordinary same-kernel container; exact runtime/provider undecided
- Constraints: Accepted ADR-001 through ADR-007
- Scope: Conceptual execution ownership, threat boundary, policy, lifecycle, effects and evidence; no implementation, final package layout or deployment selection

## 1. Context

NEXORA's agents are intended to build, test, lint, format, compile and inspect projects, install dependencies, invoke CLIs/scripts, run generated code and use browser/network or process-based integrations. A legitimate objective does not make its source, dependency, compiler plugin, downloaded binary or subprocess trustworthy. The execution boundary must protect control-plane authority, other tenants/projects, host resources and external systems from both deliberate attacks and accidental exhaustion.

VERIFIED repository evidence before edits: thirteen Markdown documents plus incidental desktop metadata; no source, dependency manifests, execution workers, sandbox configuration, tests or deployment evidence. The constitution, AGENTS, ADR convention/index, all Accepted ADR-001–007 completely and all current architecture documentation were re-read. Reference searches covered every execution/filesystem/network/process/credential/artifact/isolation topic in the owner handoff. No material conflict with Accepted architecture was identified.

The current human handoff supersedes supporting scope statements prohibiting ADR-008. Those current status/navigation statements are synchronized; historical scope/analysis in Accepted ADRs is preserved unchanged. Go remains the primary core and execution-facing backend. Separate execution is compatible with a modular initial control plane: domain, process, sandbox and deployment boundaries are independent dimensions. Runtime owns Agent Runs, Temporal coordinates durably, Tool owners govern operations and Sophia supplies evidence without authority. No implicit Shared Kernel is allowed.

UNKNOWN implementation gates: supported operating systems/architectures and cloud, actual source/toolchain/browser workloads, hardware virtualization availability, tenant/compliance/residency requirements, secret-bearing tests, provider admission evidence, resource/cost/SLO/RPO/RTO budgets, operator privileges and incident staffing. These block final runtime/topology and quantitative claims, not the requested conceptual proposal. Assume repository/dependency/generated/process content can be hostile as an explicit Accepted risk posture, not a claim every project is malicious. No security, performance or complete reproducibility guarantee is established.

## 2. Problem

Turn currently authorized execution intent into a revision-bound, resource-bounded, isolated and attributable job without allowing its code, descendants, files, network, outputs or credentials to compromise NEXORA, another tenant or the host. Preserve honest knowledge when start, termination, external effects, extraction or cleanup cannot be confirmed.

## 3. Decision Drivers

1. Contain hostile code and protect authority independently of application permission.
2. Establish trusted source/job/policy attribution before starting any execution or dependency script.
3. Enforce filesystem, process, resource, egress, secret and output restrictions at actual boundaries.
4. Own descendant termination, durable dispatch, duplicate suppression, recovery and unresolved effects.
5. Preserve ADR-007 operation governance and ADR-003 lifecycle/history rather than merge them into a sandbox state.
6. Compare isolation classes without prematurely building a scheduling platform or promising product security.
7. Keep provider mechanisms behind inward contracts and Go integration; price operational complexity using future measurements.

Verification scenarios A–AO below express concrete stimuli and expected responses. Numeric admission, termination, recovery and output budgets must be owner-agreed before implementation/testing; none is invented here.

## 4. Considered Options

1. Direct host process execution.
2. OS process plus user/namespace/resource confinement.
3. Ordinary OCI/container isolation.
4. Hardened sandbox runtime with an additional userspace-kernel boundary, illustrated by gVisor.
5. MicroVM/VM isolation, illustrated by Firecracker-class infrastructure.
6. Kubernetes Job/Pod scheduling paired with an actual admitted isolation runtime.
7. Remote managed isolated execution provider.
8. Policy-selected isolation classes rather than one universal environment.

The threat model precedes the recommendation. Product names illustrate mechanisms, not selections. Scheduling and provider location can combine with an isolation class; they are not interchangeable security levels.

## 5. Decision

**ACCEPTED: establish a NEXORA-owned, provider-independent Execution Contract and dedicated controlled execution boundary outside the control-plane, Agent Runtime, Temporal orchestration and Sophia processes. Jobs are trusted-scope-bound, attributable to the source actually executed, resource-bounded and governed across filesystem, process, egress, secret, image, cache and artifact boundaries. Repository/dependency/generated code is treated as potentially hostile by default.**

**For production hostile-code execution, require an admitted isolation class that materially reduces direct exposure of the host kernel beyond ordinary same-kernel container confinement: an additional userspace-kernel sandbox, VM/microVM boundary, or managed isolation with demonstrated equivalent protection.** This selects a required property/class of protection, not gVisor, Firecracker, Kata, Docker, Kubernetes or any cloud/provider. A product label, non-root user or dedicated process cannot prove conformance.

This is architectural inference from native hostile-code and cross-tenant threats, supported by the documented isolation distinctions [K1, V1, F1]. It is justified before scale evidence because a host escape can expose other jobs and infrastructure authority. It is not a claim that every VM beats every userspace kernel, or that stronger isolation eliminates side channels, misconfiguration, provider/operator compromise or egress leaks. Exact implementation must pass workload, threat and recovery review under ADR-009/012. If no admitted provider meets required controls, the job is refused; there is no convenience fallback to host execution.

One hostile-code baseline limits initial policy complexity. Stronger separation can be required for sensitivity/compliance. A less isolated path can be considered only for demonstrably NEXORA-controlled helpers that cannot execute/load repository, dependency or model-controlled code and have independently reviewed minimal privileges. A repository owner's reputation, successful tests, Agent label or first-party project name cannot lower the baseline. Final tier names, number and physical mapping remain undecided. Local development preserves the same contract and reports unavailable features instead of silently weakening production semantics.

**Execution authorization != safe execution. Tool authorization != sandbox escape permission. Process isolation != tenant authorization. Container != automatically sufficient security boundary. Workspace path != filesystem security boundary. Working directory != confinement. Timeout != confirmed process-tree termination. Cancellation != rollback. Process exit code != complete effect evidence. Successful build/test != trusted code. MCP stdio process != sandbox merely because it is a child process. Sandbox isolation != authorization policy.**

Deny ambient privileges. Network is denied unless explicitly granted by trusted job policy; bounded local test connectivity can be granted without host/control-plane reachability. Prefer ADR-007 owned operations for consequential external actions. No workers, libraries, runtime configuration or implementation are authorized by this Accepted record. ADR-009 is not started.

## 6. Detailed Design

### 6.1 Threat model before technology

Protected assets: control-plane/Runtime/Temporal/Sophia authority and credentials; tenant source, secrets, artifacts and sessions; host kernel/devices/processes; execution capacity, cache integrity, external business state and recovery evidence. Adversaries include malicious contributors/dependencies/generated payloads, compromised MCP/tool providers, compromised worker infrastructure and privileged operators. Authentic source attribution does not establish benign behavior.

The following covers the handoff's fifty threats. Numbers identify threat coverage, not risk scores. Each control is a NEXORA requirement; implementation and effectiveness remain unverified.

| Threats | Attack / asset and boundary | Required prevention, containment and recovery |
| --- | --- | --- |
| T01–T07 | Malicious source, build scripts, tests, lifecycle scripts, compiler/plugins, dependencies and generated code | Treat every code-loading phase as execution; admitted baseline and source/toolchain attribution; no privileged preparation phase |
| T08–T09 | Shell and argument injection | Prefer explicit executable/argument semantics; validate option/target behavior; shell scripts remain code inside isolation, never interpolated control-plane commands |
| T10–T14 | Traversal, symlink/hardlink escape, mount errors, sensitive `/proc`/`/sys`/devices/host files, runtime socket | Boundary-enforced confined storage; deny host mounts/control interfaces; validate provision/extraction, restrict pseudo-filesystem views |
| T15–T17 | Host process access, privilege escalation and kernel/container escape | Additional sandbox/VM boundary and minimized provider privileges; patch/admit versions, segregate authority; escape is an incident, not routine exit failure |
| T18–T25 | Surviving descendants, fork bombs, CPU/memory/disk/inode exhaustion, log floods and artifact explosion | Owned whole-environment termination and quotas; reserve host headroom; bound output pipeline and recovery capacity independently |
| T26–T32 | Exfiltration, arbitrary Internet, SSRF, localhost/private/link-local/cloud metadata, DNS changes and redirects | No ambient egress; policy enforcement at connection/destination boundary, scoped local test network, restricted DNS and redirect/audience handling |
| T33–T34 | Credential theft and environment leakage | No control-plane inheritance; scoped reference resolution/delivery; deny or redesign workloads unable to tolerate secret exposure to hostile code |
| T35–T40 | Cross-tenant workspace access, cross-job residue, poisoned/shared caches, stale source and concurrent mutation | Trusted scope and immutable source representation; private writes and controlled publication; no uncertain environment reuse or stale approval |
| T41–T44 | Secret-bearing logs/artifacts, malicious names/paths, archive traversal and hostile downloads/binaries | Bounded untrusted extraction/presentation; provenance/sensitivity, archive expansion bounds; no automatic host execution or knowledge promotion |
| T45–T46 | Failed cleanup and contaminated images/snapshots | Explicit teardown owner/evidence; quarantine/destroy uncertain environments; clean provenance and no captured tenant secrets/active authority |
| T47–T50 | Worker compromise, admin bypass, untrusted MCP stdio and execution-capacity denial | Provider/administration least privilege and audit, independently validated output/claims, controlled process hosting, tenant-aware admission; isolate/stop affected fleet after compromise |

Residual risks include unknown kernel/hypervisor/runtime bugs, hardware side channels, malicious allowed external endpoints, authorized code consuming its permitted data, covert output channels and privileged infrastructure access. No mechanism solves all threats. Separation of hosts/accounts/clusters may be necessary under ADR-009/012; this record does not claim physical separation or encryption-in-use. Allowed egress can carry source; destination allowlisting alone does not establish purpose-safe disclosure.

### 6.2 Vocabulary and ownership

These twenty concepts are semantic distinctions, not mandatory classes/tables or final bounded contexts.

| Concept | Meaning / ownership distinction |
| --- | --- |
| Execution Intent | Proposed command/tool action, source and requested constraints; caller assertions need trusted resolution |
| Authorized Execution | Intent currently permitted by security/resource owners and valid approval, subject to enforced execution policy; not a lasting grant |
| Execution Job | Stable logical owned execution obligation and correlated evidence; distinct from Run or environment |
| Execution Attempt | One permitted start/recovery attempt with its own attribution under the Job |
| Sandbox / Isolation Environment | Admitted confined resources/enforcement boundary used for an attempt, not job authority |
| Workspace | Scoped source/write/scratch view with owner-resolved identity and lifecycle |
| Source Snapshot / Repository Revision | Immutable or reconstructable representation of actual inputs, including changes and dependencies where required |
| Execution Image / Toolchain | Attributable OS/runtime/compiler/package-tool environment and allowed extensions |
| Process Tree | All job-owned descendants including detached/daemon processes; containment must survive parent exit |
| Resource Budget | Trusted bounds for compute, storage, processes, time, output, network and concurrency |
| Filesystem Policy | Permitted source/read/write/scratch/output areas, link/mount/type handling and boundary rules |
| Network/Egress Policy | Permitted destinations/protocols/purposes and data exposure, with enforcement and revocation behavior |
| Secret Material / Secret Reference | Actual sensitive capability versus controlled reference; credential owner authorizes resolution/use |
| Artifact | Attributed untrusted output, with extraction/visibility/retention disposition |
| Execution Result | Process/validation/output facts and limitations, not automatic task success |
| Execution Effect | Actual or possible local/external changes or disclosures; can be partial/unknown |
| Execution Evidence | Attributable observations of inputs, controls, starts/stops/effects/extraction/cleanup |
| Cleanup / Teardown | Assigned obligation to stop descendants and remove/reset resources, state and access |
| Execution Provider / Worker | Admitted infrastructure executing/enforcing jobs and reporting observations; authentication alone proves no isolation |
| Cache | Derived reusable acceleration with scope/provenance/integrity policy; not authoritative source |

Execution owner owns Job/attempt dispatch, environment/process/output/cleanup evidence and recovery responsibility. Runtime owns Run lifecycle/outcome and stores correlated references. Workflow owns durable coordination/waits. Tool owner owns its Operation semantics and external effects; security/resource/credential/approval owners remain authoritative over their respective decisions. Artifact custody/extraction and cache management have explicit execution-side owners; downstream publication/knowledge/deployment use has its own owner. Final module assignment is open. Do not create a universal `CommandExecution`, Agent, Task or Artifact model in shared infrastructure.

### 6.3 Control plane ↔ execution boundary

```text
Agent / Workflow / Application proposes execution intent
    → ADR-007 owned operation contract where applicable
    → NEXORA Execution Contract / conceptual coordinator
        trusted actor + tenant/project/repository/source binding
        current policy + valid approval + owned claim
        command/tool/image + resource/files/network/secret/output/deadline policy
        durable Job + Attempt identity
    → admitted Execution Provider Adapter
        controls established and verified before code or dependency scripts start
    → isolated job environment
        bounded process + filesystem + network + secret + output surfaces
    → bounded untrusted results/logs/artifacts + termination/effect/cleanup evidence
    → execution owner records facts; Runtime/Workflow consume correlated contracts
```

Challenge to the handoff diagram: an “already-authorized” arrow is not durable permission. Queue time, provider selection, source changes, secret resolution and preparation can change relevant context; validate current policy at admission and before actual start/disclosure. Provider must enforce trusted policy, not take model-supplied limits/mounts as privileged configuration. Output extraction/parsers are a second attack boundary. Status flows use public owner contracts, not direct private-state writes. Flow arrows are interactions; SDK/runtime/provider adapters depend inward on NEXORA contracts.

Coordinator is a responsibility, not a selected service/package/Temporal worker/controller. A small implementation can coordinate one provider and a few declared job kinds; no universal scheduler, sandbox DSL or all-provider platform is required. Isolation can demand separate processes/hosts without changing the modular initial control plane into microservices. Worker-to-control traffic is a narrowly authenticated evidence/control channel outside job access; untrusted job content cannot address admin APIs or forge privileged completions. Provider SDK IDs/types remain adapter metadata.

### 6.4 Admission, identity and source/workspace binding

Resolve authenticated initiator/delegator and Run/task/workflow/Tool correlations, trusted tenant/project/resource owner, exact source, declared effects and environment. Validate tool/executable/arguments, eligibility, image/provider admission, budgets and every requested access. Where approval is required, bind relevant source, command, privileges, effects, environment and budgets through Approval; durably wait if needed. Recheck current policy/approval/credential eligibility near start and any later consequential operation. Changed intent is rejected or separately reviewed, never silently upgraded.

Execution Job ID is distinct from Agent Run, Workflow, Tool Operation, event, provider request, OS PID, container/VM and Kubernetes Job/Pod IDs. Record mappings without freezing formats. Attempt ID distinguishes starts/recovery. An infrastructure reconnect can observe the same attempt; a safe retry can create a new attempt under the same Job only for unchanged semantics under its retry/effect contract. New semantic execution uses a new linked Job; terminal Agent Run retry remains a new linked Run under ADR-003. No identifier is authority.

Workspace binding includes tenant, project, source owner/representation, Job, attempt, permitted write areas, artifact extraction and sensitivity. An Agent path such as `/workspace/project` is not an authorized repository. Materialize an owner-authorized source view through a controlled fetch/export step; fetching private sources is itself sensitive and governed. Repository hooks, filters, submodules, plugins and source parsers must not turn privileged staging into unchecked execution. Preparation capable of executing code crosses the same boundary.

A Git SHA identifies the committed tree, not dirty files or dependency resolution. For repository-backed work, reference the actually materialized commit/tree plus permitted patch/uncommitted changes, generated-input provenance and lockfile state. Record reconstructable manifests/digests/references as required without demanding every secret/input be retained. Branch names can move; pin the reviewed representation before execution. Approval for H cannot silently execute H2. Freeze or validate source consistency at actual access; isolate concurrent writes rather than run against a changing shared checkout.

Non-Git sources use their owner's immutable/reconstructable representation. Generated files created during execution are outputs unless explicitly used as attributed inputs for a later step. Preserve which snapshot each step consumed and link post-job patches/artifacts; do not rewrite earlier source or Run attribution to latest. Lockfiles/checksums constrain some inputs but do not prove safety or full reproducibility.

### 6.5 Filesystem and command policy

Deny host filesystem and cross-job access. Provide only explicit source/read areas, permitted private writable workspace/scratch, bounded temp storage and designated artifact output. Read-only source is suitable for inspection; builds/formatters/generation may need a private writable copy. Writes must not mutate an authoritative repository merely by mount access; publish reviewed patches through the repository owner/Tool boundary.

Confine traversal and symlink/hardlink resolution at actual open/create/rename/extract operations. Canonicalization prechecks are useful but cannot alone prevent TOCTOU. Link handling must define whether a permitted in-bound link is followed, copied as data or rejected; outbound links, device nodes and special files cannot escape extraction/storage policy. Mount setup is trusted administration with validated sources/propagation/permissions; job code cannot add host bind mounts, devices or runtime control sockets. Restricted virtual `/proc`/`/sys` views may support tools, but sensitive host namespaces/processes/kernel controls remain unavailable.

Prefer declared executable and argument intent over shell interpolation in trusted coordination. Validate option injection, executable resolution, command-size/encoding and tool-specific resource targets; an argument array does not make a malicious executable harmless. Shell scripts/pipelines can be legitimate job inputs, but parsing/execution occurs inside the admitted environment with the same bounds. No control-plane shell into a checkout, implicit unrestricted inherited descriptors, developer home, SSH agent, cloud config or container socket. Downloaded tooling must satisfy source/toolchain policy and run inside isolation; no host installer convenience path.

### 6.6 Network/egress and browser/HTTP

| Model | Fit / risk | Accepted disposition |
| --- | --- | --- |
| No external network | Prevents many disclosures and remote effects; can block installs/integration tests | Baseline until explicit trusted grant; local job-only communication can be declared |
| Allowlisted egress | Supports named registries/Git/test services; DNS, redirects, CDN endpoints and upload behavior complicate it | Purpose-scoped exception with actual destination enforcement and data-risk review |
| Broad Internet | Flexible discovery but permits exfiltration/malware/arbitrary effects | No default; exceptional reviewed contract with explicit sensitivity/effect limits, or decline workload |
| Dedicated proxy/broker | Can mediate retrieval/credentials/destinations and evidence | Optional enforcement class; no product/topology selected; must prevent direct bypass and own failure behavior |

Execution policy identifies schemes/protocols, destinations, ports, purpose/data, credentials and relevant traffic bounds. Deny host-loopback, private RFC1918/ULA, link-local/cloud metadata, host management, internal NEXORA and control-plane networks by default. Job-internal loopback or private synthetic test services can be explicitly allowed within the isolated job scope; this is not access to the host or shared production networks. IPv4/IPv6, alternate address encodings, DNS transports/tunnels, raw sockets and proxy bypass need enforcement review.

Authorize every relevant resolved destination/connection, redirect and fallback under the same policy; a DNS check followed by an unchecked lookup can race. Restrict DNS disclosure and bind validated destinations to actual connection while preserving TLS/audience requirements for HTTP where applicable. OWASP discusses these checks [O1]. Non-HTTP repository processes can bypass an application HTTP client, so enforcement cannot rely solely on URL validation. A domain allowlist is not proof against uploads/exfiltration to an allowed endpoint. No promise that package CDNs can be supported without broader risk review.

Package/Git retrieval may use a controlled fetch phase, scoped registry proxy, or restricted job egress after review. Acquired scripts remain hostile; network-off execution after fetch can reduce reachability but not remove cached malware. Integration tests prefer disposable synthetic dependencies within the isolated scope. Real remote databases/services need explicit environment/data/credential/effect authorization; never borrow production databases or broad credentials just to make tests pass. If required safe scope cannot be established, mark the test blocked.

Separate trusted adapter HTTP (ADR-007 provider operation), sandbox process HTTP, generic fetch and browser automation. They share trusted scope requirements but need different enforcement. Browser navigation includes subresources, scripts, downloads, sockets, service workers and redirects, not just the main URL. Use job-bound cookies/storage/profile/downloads and approved authentication; no cross-job/tenant sessions or host/control-plane reachability. Detailed browser/network mechanisms and identity are ADR-009/012 gates.

Kubernetes NetworkPolicy alone cannot supply all these requirements: official docs describe enforcement-plugin dependence, node/loopback exceptions and existing-connection behavior [K3]. Establish required protection before any init/preparation/job code starts; missing control readiness fails admission, not a temporary unrestricted window.

### 6.7 Secrets and consequential external actions

**Secrets are not ambient sandbox state.** Construct job environment and inherited handles from permitted inputs, never control-plane environment. Cloud/database/provider/NEXORA secrets, developer credentials and orchestration tokens are absent unless a specific authorized contract establishes required delivery. Agents/LLMs receive permitted references, not raw values. Credential lookup and injection remain privileged owner operations with tenant/provider/principal/purpose/lifetime attribution.

| Mechanism | Limitation to evaluate, none selected |
| --- | --- |
| Environment variables | Easy integration but readable by recipient code/descendants and can enter diagnostics |
| Mounted secret files | Can narrow delivery location but recipient can read/copy them; file permissions do not prevent malicious recipient use |
| Brokered operation/access | Can withhold raw credentials and constrain action/target; broad bearer broker access would recreate ambient authority |
| Short-lived credentials | Limits some future use; cannot retract disclosed data or undo a sent effect; scope/revocation still required |

A secret deliberately given to hostile code must be treated as accessible to that code. Isolation/redaction cannot guarantee it will not encode the secret into output or allowed egress. Prefer mediated operations or synthetic low-value test credentials; if the secret's confidentiality/effect limits cannot tolerate recipient access, deny delivery/redesign the test. Per-test secret injection into a multi-step job does not prove later malicious steps cannot retain it; stronger phase separation may be required.

Prefer ADR-007 Tool/Operation contracts for publish, messaging, deployment, cloud mutations and other consequential actions rather than broad repository tokens. An execution job cannot acquire new egress/credentials because a script requests them. A narrow broker capability is bound to action/target/job/current policy, rejects arbitrary tool chaining and is not general access to the control plane. Legitimate direct test effects require declared external targets/principals/idempotency/reconciliation and current owner approval where required. Credential revocation can stop future use, not prove earlier remote non-performance. Exact secret vault, issuance, delivery, rotation and revocation are ADR-009/012 decisions.

### 6.8 Process tree, cancellation, effects and cleanup

```text
shell
 ├─ build → compiler → plugin
 └─ test  → background daemon

Stop intent → termination requested → graceful/forced termination attempted
    → whole job population observed stopped?
    → effects and artifact disposition reconciled?
    → cleanup complete or assigned unresolved responsibility
```

Provider owns all descendants, including reparented/detached/daemon processes, from start to teardown. A one-time PID walk or direct-child signal can miss races; provider must enforce a job population boundary that code cannot leave and expose meaningful whole-environment stop evidence. Process groups/user separation/resource containers/VM teardown are candidates requiring platform review, not selected primitives. A job-internal daemon can support tests only while it remains owned/bounded and is stopped during finalization.

Go process APIs start programs; default CommandContext cancellation targets the command's Process and nil Env inherits the caller environment [G1]. Neither behavior is sufficient for this contract. Linux cgroup v2 documents descendant inheritance, PID controls and cgroup-wide kill [L1] as possible evidence of platform capability; this ADR does not select cgroups, signals or profiles. Whole-population termination still needs provider observation; remote mutations can continue after local processes stop.

Stop scheduling affected new work on authenticated cancellation, deadline or policy restriction. Propagate stop, permit bounded cleanup, escalate graceful to forced termination where supported and record acknowledgement plus observation separately. Lost heartbeat/control connection does not prove death. Provider admission must specify independent deadlines and loss-of-control behavior: no new privileged work without valid ownership; bounded policy-defined stop/containment if authority cannot be maintained. Exact leases/fencing/clock and network connection-revocation guarantees are gates; no assertion that a coordinator can instantly kill a partitioned worker.

Represent orthogonal facts rather than one misleading state enum:

| Dimension | Examples of recorded knowledge |
| --- | --- |
| Dispatch/admission | Not scheduled; durably scheduled; start accepted/unknown; current claim references |
| Process | Not started confirmed; started; parent exited with status; population alive/stopped/unknown |
| Stop | No request; cancellation/deadline/revocation intent; graceful/forced request, acknowledgement and observed outcome |
| Local/external effects | Not attempted/confirmed not performed/performed/partial/unknown, separately by target/effect |
| Artifacts/output | Extraction not attempted/complete/partial/failed; logs bounded/truncated; required-output validation |
| Cleanup | Pending/in progress/complete/failed/unknown; quarantine/destroy/reuse eligibility separately |
| Business result | Owning operation's required checks, Runtime outcome and task acceptance through their respective owners |

A job may have parent exited 0, required extraction failed, external effect unknown and cleanup complete. It is not complete business success. “Started” is not an effect guarantee; “not scheduled” cannot be claimed when provider acceptance is ambiguous. Process output may lie; provider observation has its own trust/compromise limits. Separate execution result from business acceptance and append late evidence/corrections without rewriting historical Run/source attribution.

Cleanup owns termination, credential/handle revocation, scratch/workspace/browser/session removal, approved artifact custody, cache publication disposition and network-state reset. Finish bounded caller waiting with unresolved references when needed, while execution owner retains durable orphan/reconciliation responsibility even after Run Finished. Confirmed termination does not undo files already published or remote HTTP accepted. Compensation/repair is a new authorized operation.

No pooling is selected. Before any reuse establish no live process, tenant data, secrets, writable residue, browser state or policy-disallowed cache/network residue. Failed/unknown cleanup means quarantine/destroy, never return to service silently. Destroy request itself can fail and needs tracked confirmation. Preserve permitted incident/effect evidence before authorized destruction; no unlimited raw secret-bearing snapshots. Fresh images/snapshots must have clean provenance and no tenant/session/active credential state. Firecracker documents snapshot-clone uniqueness risks [F2]; any cloning must establish independent identity/entropy and relevant application state rather than duplicate authority.

### 6.9 Resources, images, dependency installation and caches

| Budget surface | Required enforcement/accounting |
| --- | --- |
| CPU, memory, process/PID count | Job-level bounds, aggregate admission and host/provider headroom; descendants cannot escape accounting |
| Wall time and stop/cleanup | Independently enforceable job deadline plus bounded termination/recovery allowances |
| Disk bytes, temporary storage, file/inode count | Actual storage bounds, including staging/extraction/snapshots; I/O throttling alone is not capacity quota |
| stdout/stderr and logs | Bounded collection/transport/presentation/storage; explicit truncation/overflow policy |
| Artifact size/count/expansion | Per-job extraction and archive decompression bounds; required-output failure visible |
| Network bytes/connections where enforceable | Scoped limits and reported capability gaps; reject if a required bound cannot be enforced |
| Queued/active jobs and recovery backlog | Tenant/project/provider fairness, cost admission, reserved stop/reconciliation capacity and visible backpressure |

No numbers or scheduler are chosen. Docker documents that default containers have no resource constraints [D2]; runtime adoption must establish actual controls. CPU/memory limits alone cannot stop disk/inode exhaustion or a log collector being overwhelmed. Resource errors must not expose broader mounts/egress or trigger unbounded retry. Observed use and charges are reported with uncertainty where provider reporting lags.

Attribute OS/base environment, architecture/platform, runtime/compiler/package-manager versions, plugins, dependency state, image/digest/revision, provider/sandbox/runtime revision and policy at each attempt. Mutable `latest` cannot silently change consequential execution; resolve to an admitted immutable/versioned representation or reject unsupported attribution. Changed environment is a reviewed input change, not an invisible infrastructure retry. Complete reproducibility is not promised when inputs, time, network or secrets cannot be retained/pinned.

Package installation is execution, including ecosystem-specific scripts, plugins, build hooks and downloaded binaries. npm/pnpm/yarn, pip, Go, Maven/Gradle, Composer and Cargo are workload examples, not selected platform dependencies. Govern actual behavior rather than claim every command runs identical hooks. Lockfiles, checksums/signatures and source verification help integrity/attribution where supported but do not make malicious packages safe. Installation needs the same isolation, budgets, registry/Git disclosure and secret review as tests; no privileged host install/cache-warming bypass. Disable unnecessary hooks where feasible under the toolchain contract without falsely reporting equivalent validation.

Dependency/build/compiler/image-layer/repository caches are derived acceleration. Namespace private reads/writes by trusted tenant/job or reviewed sharing scope and relevant source/dependency/toolchain/platform/policy dimensions. A key string supplied by a repository is not trusted namespace. Do not permit untrusted jobs to overwrite privileged/shared cache entries. Broad read access can disclose source/credentials; successful cache hits cannot waive current scope or provenance.

Start with disposable/private writes; share only content established as eligible, non-secret and integrity-checked under accountable publication rules. Content addressing/checksums detect substitution only against trusted expectations, not malicious-but-valid inputs. Poisoned generations are revoked/quarantined and regenerated from admitted sources. Shared public packages may be justified after review, without implying tenant-private build outputs can share. Cache extraction is another untrusted parser/filesystem boundary. No cache technology, trust-signing system or physical tenancy design is selected.

### 6.10 Artifacts, logs and result interpretation

Compiled binaries, reports, coverage, generated source, patches, screenshots, archives and logs are attributed outputs, not trusted executables, canonical knowledge or deployment approval. Artifact extraction is an explicit owner operation through allowlisted output areas, trusted destination scope and bounded names/types/count/bytes. Deny traversal/absolute-path/link/device escape, normalize presentation safely and defend actual copy/extraction races. Do not run job-supplied exporter/parser code with privileged host access.

Archives require entry validation, link rules, nested/expanded byte/file limits and bounded parsers in an appropriate isolated extraction boundary. Stop/freeze writes or obtain an immutable output view for extraction; never assume parent exit means files are no longer being mutated. Required outputs have verified extraction and integrity/provenance references; partial/failed extraction is visible and must not be hidden behind process success. Retrying extraction can be distinct from rerunning code, but still needs trusted access and source stability.

Apply current access/sensitivity before exposing content to humans/models/downstream owners; avoid automatic active HTML/binary execution. Sanitize ANSI/control sequences and presentation, bound binary/oversized streams, and disclose truncation. Logs can forge “Tests passed,” prompts or artifacts; command/exit/test-result evidence must come from the verified execution contract, with limits on what malicious tests can prove. A zero exit code means only the invoked process reported success under recorded conditions.

Do not store secrets or private chain-of-thought in ordinary logs/artifacts/events/workflow/Sophia. Detectable secret output is withheld/quarantined with controlled incident handling and redaction; arbitrary encoding makes perfect filtering impossible. Record exposure uncertainty, recipients and cleanup/revocation responsibility without copying raw secrets into incidents. Output content cannot authorize execution, enlarge egress or choose credentials. Promotion to Sophia follows ADR-006; publishing a patch/deployment follows repository/Tool/approval owners. Artifact retention, integrity, store and audit are ADR-011/012 gates.

### 6.11 Durable dispatch, retry and provider loss

Required Job responsibility survives coordinator/provider/caller loss. Apply ADR-005 owner-state plus atomic dispatch intent or reviewed equivalent gap closure; consumer-scoped durable identity/claim/disposition prevents duplicate uncontrolled starts. Goroutine, HTTP connection, Temporal Activity and in-memory queue are not durable custody. No queue/database/Outbox schema or universal exactly-once execution claim is selected.

Durable acceptance, provider start acceptance and actual start are distinct. Establish Job/attempt identity and semantic bindings before send; revalidate scope/source/policy at actual start. Concurrent duplicates converge through an owner-enforced atomic protocol or a provider contract proven equivalent. A stale worker must be unable to start another attempt solely from old claimed state. A coordinator lease alone cannot fence already running code or remote effects; stop/isolation, credentials and external owner controls must cover that limit. Until old attempt non-start/termination and relevant effects are established, do not replace it blindly.

| Retry boundary | Governing owner / allowed behavior |
| --- | --- |
| Before confirmed start | Execution owner may retry dispatch of same obligation after validated non-start/dedup contract; ambiguous acceptance requires lookup |
| Infrastructure reconnect/recovery | Provider adapter observes/reconciles existing attempt; does not implicitly rerun source |
| Process retry | Execution owner permits new attempt only under source/environment binding and effect-safe contract; private workspace reset as required |
| Whole execution | Reviewed new linked Job for changed semantic work, or contract-permitted attempt under same Job; retain prior evidence and current authorization |
| Tool Operation | ADR-007 owner governs remote action identity/idempotency/reconciliation; no unrestricted job-layer replay |
| Agent Run | Runtime terminal retry creates new linked Run; Job cannot reopen a Finished Run |
| Workflow step | Temporal coordinates through stable references; Activity/history replay reconnects, not automatic code replay |

One owner governs each retry boundary and nested layers share finite budgets. Kubernetes documents that even a single-completion Job may start the program twice [K2]; scheduler settings alone do not establish semantic deduplication. Worker/SDK/Temporal/controller retry behavior must conform before use, not multiply starts independently.

Partition/crash can mean never started, still running, finished, provider dead, effects performed or cleanup pending. Query admitted provider evidence bound to attempt/source, terminate or reconnect only under valid ownership, and reconcile external owner facts. PID absence on a replacement host or expired heartbeat is not non-performance. If reliable evidence is unavailable, keep unknown, stop unsafe replay and retain manual/recovery responsibility. Provider compromise downgrades its evidence trust; independent observation/incident review may be required. DR restores identities/intents/evidence and reconciles post-checkpoint effects before replay.

### 6.12 Provider admission and isolation classes

Execution requested, provider selected, authenticated, admitted, controls ready, job started, population stopped and cleanup complete are separate facts. Admission records accountable operator, origin/identity, supported isolation/OS/runtime versions, resource/process/network/file/secret/output control coverage, start/dedup/status/cancel/teardown semantics, privacy/residency, admin access, vulnerability response and evidence limitations. Attestation can mean verified release/configuration/conformance evidence; hardware attestation is not required by naming it.

Actual controls must be ready before code runs. Validate least-privilege host provisioning, socket/API custody, safe images and signed/verified evidence where selected later. Untrusted workers cannot be trusted merely because registered. Provider channels expose narrow scope; compromise/suspension blocks new jobs and triggers containment/reconciliation of active jobs rather than automatic failover. Never transfer unresolved execution to another provider as a blind retry.

The proposed stronger-than-ordinary-container class reduces one material kernel attack path. It adds compatibility/operational costs; platform availability may prevent local execution. Reject unsupported jobs or evaluate a remote/VM path instead of silently lowering protection. Stronger compliance/high-risk requirements can demand dedicated tenancy/hosts/accounts. Final policy-selected classes remain a future reviewed mapping, not an Agent-controlled switch.

### 6.13 Accepted execution invariants

1. Execution authorization is not proof of safe execution.
2. Hostile/untrusted repository code MUST NOT execute in control-plane, Agent Runtime, Temporal orchestration or Sophia processes.
3. `os/exec`, shell invocation and ordinary child processes are not sandbox boundaries.
4. Working directory/path strings are not filesystem confinement.
5. Sandbox isolation and application authorization are separate controls.
6. Execution Job identity is distinct from Agent Run, Workflow, Tool Operation, event, OS process and sandbox/provider identities; attempts are separately attributable.
7. Source/repository representation actually executed is attributable, including relevant patches/dirty inputs and dependency state.
8. Changed source/revision invalidates bindings where revision matters; historical attribution is not silently rewritten.
9. Filesystem access is explicitly bounded by trusted execution policy.
10. Host filesystem/devices/runtime-control interfaces are unavailable to untrusted jobs; any exception requires explicit threat/architecture review and cannot bypass the hostile-code baseline.
11. Traversal, link and race defenses are enforced at the execution boundary, not only model/application prechecks.
12. Network access is explicitly governed and denied absent trusted grants; repository code cannot grant itself egress.
13. Host localhost/private/link-local/cloud-metadata/control-plane access is not implicit; isolated test-local access requires scoped policy.
14. Redirect/DNS/destination changes cannot silently expand network authority.
15. Secrets are not ambient sandbox state.
16. Control-plane environment/secrets MUST NOT be inherited by untrusted jobs.
17. Secret delivery is minimum-scope/purpose/lifetime and attributable; delivered secrets must be treated as accessible to recipient code.
18. Resource, output, queue, concurrency and recovery use is bounded by explicit owners.
19. Process-tree ownership includes descendants/detached processes; parent exit does not prove job termination.
20. Cancellation request is distinct from attempted and confirmed whole-population termination.
21. Timeout/connection loss is not proof of no external effect.
22. Unknown execution/external effects block blind replay where duplicate effects matter; no universal exactly-once guarantee exists.
23. Process exit code is not complete business/effect/cleanup evidence.
24. Logs/stdout/stderr are untrusted bounded outputs with explicit truncation/sensitivity handling.
25. Artifacts are untrusted outputs with provenance, not automatically executable, canonical knowledge or deployment approval.
26. Artifact/archive extraction cannot bypass filesystem, type, size, count, race or sensitivity policy.
27. Dependency installation/preparation that executes code receives the same trust/resource/network treatment.
28. Shared caches cannot become cross-tenant secret/state channels or privileged untrusted-write targets.
29. Cache content is derived, rebuildable and not authoritative or inherently trusted.
30. Execution image/toolchain/runtime/provider versions and platform are attributable per attempt.
31. Mutable environment aliases must not silently change consequential execution semantics.
32. Execution retries/redelivery preserve logical identity where required and use separate attempt identity.
33. Duplicate delivery cannot create uncontrolled duplicate execution; current ownership and durable deduplication are required.
34. Cleanup/teardown is an explicit durable lifecycle responsibility independent of caller/Run completion.
35. Failed/unknown cleanup does not return an environment to a reusable pool; quarantine/destruction needs tracked disposition.
36. Worker/provider registration/authentication does not prove sufficient isolation or trustworthy evidence.
37. Kubernetes scheduling primitives are not automatically sandbox/security boundaries.
38. Ordinary same-kernel containers alone do not satisfy the proposed production hostile-code baseline.
39. Isolation claims must use actual threat/control coverage; an additional admitted userspace-kernel/VM or demonstrated equivalent boundary is required for hostile code.
40. Consequential external effects from jobs require explicit policy and scoped credentials; broad ambient provider authority is prohibited.
41. ADR-007 Tool/Operation authorization is preferred for controlled consequential external actions where feasible; mediated access cannot become general control-plane access.
42. Browser/session state MUST NOT cross tenant/job boundaries.
43. Sandbox/provider compromise is a security boundary failure requiring containment and evidence review, not ordinary process retry.
44. Execution infrastructure MUST NOT become an implicit Shared Kernel, private cross-owner access path or universal business authority.
45. Workflow Definition, Agent Instance, Memory, Event, Tool Descriptor and repository/model content remain non-authoritative for execution privileges.
46. Local-development convenience MUST NOT silently weaken production execution security semantics.
47. Current trusted authorization/approval/source/credential checks apply before actual start and relevant consequential operations; admission history is not durable permission.
48. Worker loss/claim expiry does not prove process death or fence external effects; recovery must reconcile before replacement/replay.
49. Required isolation/resource/network/secret controls are established before any job or code-executing preparation starts; missing readiness blocks execution.
50. Isolation/redaction cannot guarantee confidentiality of a secret intentionally delivered to hostile code; exposure risk must be explicitly acceptable or delivery denied/redesigned.

Invariants 1–46 refine the owner's candidate list; 47–50 make start-time revalidation, partition ambiguity, readiness and secret-recipient limits explicit. These are Accepted obligations, not implemented or verified protections.

## 7. Alternatives Analysis

Official facts are cited separately from NEXORA fit. No startup/density/price/compatibility ranking is measured.

| Alternative | Security/kernel boundary and control fit | Operations, compatibility and portability | Accepted disposition |
| --- | --- | --- | --- |
| Direct host process | No additional hostile-code barrier; can access caller's authority unless restricted | Small invocation overhead is not a NEXORA benchmark; cleanup and host-state contamination remain | Reject for hostile/project code; cannot satisfy baseline |
| OS process + user/namespace/resource confinement | Restricts resources/visibility but directly shares host kernel; actual policy strength matters | Platform-specific lifecycle/file/network engineering; dedicated host does not itself solve privileged host escape | Potential reviewed bounded helper path, not default hostile-code isolation |
| Standard OCI/container | Namespace/resource confinement with shared host kernel; mount/socket/privilege mistakes expose host [D1] | Broad tooling compatibility must still be tested; image, output, quotas and teardown remain work | Packaging/control component, insufficient alone for baseline |
| Additional userspace-kernel sandbox | Interposes system interface and reduces direct host-kernel attack surface; still depends on host/resource/network controls [V1] | Incomplete syscall compatibility requires actual workload tests [V2]; observability and performance can differ | Candidate class; no gVisor runtime/SDK selected |
| MicroVM/VM | Guest-kernel/hardware-virtualization boundary; host/VMM/device/config still trusted [F1] | Guest images, patching, devices, network and startup/pooling lifecycle add work; platform availability is a gate | Candidate class; no Firecracker/Kata/hypervisor selected |
| Kubernetes Job/Pod plus runtime | Scheduler is independent of isolation; Job retries can start code twice [K2] | Cluster/network/admission/controller ownership adds burden; node/loopback policy gaps need other controls [K3] | Optional future scheduling, not initial platform or isolation selection |
| Remote managed execution | Can outsource host/runtime operation; only documented and validated provider boundary counts | Residency, API/dedup/status/teardown/output/cost/export restrictions and lock-in remain; availability is provider-specific | Candidate where conformance/operator value justify it; no provider selected |
| Policy-selected classes | Can match compatibility/sensitivity and add stronger separation without one universal runtime | More policy combinations and downgrade risk; every path must conform | Start with one hostile-code baseline, add reviewed classes only for real workloads |

Comparison dimensions across all options: startup latency and density require measurement of cold/warm jobs, image preparation and cleanup; resource enforcement includes provider overhead plus guest/process/storage/output; tree control requires independent population observation; filesystem/network/secret guarantees depend on actual configuration; operations include upgrades, incident response and quarantine. Local macOS/Windows/Linux development and cloud support are UNKNOWN until selected-platform evaluation. No unsupported API/Go SDK parity is claimed; use provider adapters with Go core language discipline rather than add a runtime for convenient SDKs.

Cost includes idle capacity/pools, per-job compute, guest/host overhead, image fetch/storage, network/egress, artifact/log retention, cache and security/recovery staffing. Remote API and VM boundaries create migration/compatibility work. Stronger isolation can lower some escape exposure but does not reduce all operational costs. A dedicated host/cluster can reduce co-resident tenant exposure while remaining vulnerable to authority reachable from the execution plane.

The strongest challenge to the baseline is operational portability and compatibility. Ordinary confinement may be enough for reviewed code without untrusted extensions, but the requested workload explicitly includes arbitrary native tests/dependencies/generated code. Allowing that workload to directly exercise the host kernel trades away a key containment layer. The proposal therefore keeps a required class while deferring its product. If future evidence contradicts this threat assumption, use explicit architecture/security review; do not introduce an undocumented weaker fallback. Neither hardware virtualization nor a managed-provider brand establishes sufficient control coverage by itself.

AWS documents task-isolation properties for ECS Fargate [A1], illustrating that managed mechanisms have specific boundaries. That is not evidence that Fargate meets this entire contract or that all managed sandboxes behave alike. No named managed-provider integration, price comparison or procurement is selected.

## 8. Consequences

### Positive

Execution identity and honest effects remain independent of Agent/Workflow/provider mechanics. Hostile code has an explicit containment requirement before first use. Controlled source, privileges, output and cleanup make failures reviewable. Provider-independent contracts permit focused adoption without a universal execution platform.

### Negative

Stronger isolation and independent enforcement add compatibility, startup/resource and operational work that must be measured. Secret-bearing real tests may need redesign or refusal. Source evidence, durable claims, artifact extraction and orphan recovery are genuine product responsibilities. Some local environments will need a remote or VM path rather than direct execution.

### Risks

Policy-selected tiers can downgrade trust incorrectly. Coordinator/provider evidence can diverge. Partitioned code can survive and affect external systems. Egress/cache/artifact channels can leak secrets despite kernel isolation. Pool/snapshot state can contaminate jobs. Excessive generic abstractions can create a premature platform. Described controls do not establish runtime safety.

## 9. Security Considerations

Enforce scope/authority at every admission/start/output/external operation boundary outside model reasoning. Reject model-supplied identities, mounts, resource numbers or provider selections that exceed trusted policy. Only trusted administrative paths control images, runtime APIs and provider configuration. Repository trust ratings cannot automatically waive hostile-code treatment when dependencies/plugins still load uncontrolled code.

Keep worker management identity separate from job credentials and from initiating NEXORA actor. Limit worker access to its assigned scopes and necessary evidence/control channels; no broad control-plane DB or Temporal admin credentials in jobs. Minimize host/provider blast radius, patch supported versions and evaluate firmware/hardware risks. Independent security review must assess supply chain, image/registry, broker/extraction parsers, metadata/network, admin privileges and evidence forgery before corresponding features.

A sandbox cannot stop secrets deliberately supplied to attacker-controlled code from being read. Output filtering/egress controls reduce routes but cannot prove arbitrary encoding absent. Unknown exposure is an incident disposition, not a success claim. Source/code/log/prompt injection cannot raise policy, privileges or approval. Quarantine output before sensitive model exposure where required; Sophia ingestion remains an independently authorized promotion operation.

Security owner governs provider compromise: suspend new dispatch, isolate suspect hosts/environments, revoke affected access under authorized procedures, preserve permitted evidence and reconcile outstanding jobs/effects. A compromised provider's “cleanup complete” is not sufficient proof to reuse. Privileged operators need least authority, authenticated attributable changes and independently governed exceptional access; final roles/approval/audit mechanisms are ADR-009/010/011. No secret rotation, deletion, provider connection or security configuration is performed by this documentation task.

## 10. Operational Considerations

### Failure scenarios A–AO

All rows retain a permitted baseline: trusted actor/tenant/project/source, Run/task/workflow/Tool/Job/attempt correlations; command/tool/image/provider revision; policy/approval and secret-reference decisions without values; resource/access budgets; provider start/population observations; stop/exit/effect/extraction/cleanup facts and recovery owner. The last column adds scenario-specific evidence and an unresolved gate. No secrets/private reasoning are retained as ordinary evidence.

In every started scenario, stop is requested/escalated under section 6.8 and confirmed only by adequate provider observation. Denied local accesses can be recorded as prevented only with enforcement evidence; absence of a log is not proof. External effects remain unknown unless authoritative evidence resolves them. This applies even when a row names a more specific state.

| Scenario | Expected boundary behavior / authoritative owners | Stop, effects and recovery | Additional evidence / unresolved implementation gate |
| --- | --- | --- | --- |
| A — Test reads control-plane environment | Execution/security: explicit minimal environment, no inherited secrets or host view | Deny; isolate incident if unexpected data seen; stop population where required, investigate exposure | Environment policy/reference and denied access; delivery/host isolation mechanism open |
| B — `../../` traversal | Execution/filesystem: confine actual access outside permitted view | Deny; stop violation per policy, retain local-effect evidence; do not rerun without disposition | Target/path-safe diagnostic and enforcement observation; race-safe primitive open |
| C — Symlink to sensitive host path | Execution/filesystem: no host mount; enforce resolution/extraction confinement | Deny link escape; quarantine output, terminate if containment suspect; reconcile possible disclosure | Source/link/extraction reference; link policy/filesystem enforcement open |
| D — Install script starts daemon | Execution/provider: descendants remain owned/bounded in admitted job | Daemon never escapes; stop all during finalization, unknown if unobserved; quarantine uncertain environment | Descendant/start/stop evidence; process-population implementation open |
| E — Timed-out parent, live grandchild | Execution/provider: deadline targets whole population | Escalate forced environment stop; timeout alone unknown; retain orphan recovery and no reuse | Deadline, child population and kill observation; stop SLA/control mechanism open |
| F — PID exhaustion | Execution/provider: enforced process budget before start | Refuse excess children; terminate job under policy, verify population; no host-wide unbounded forks | Peak/limit/violation and stop observations; PID enforcement and host reserve open |
| G — Memory pressure | Execution/provider: bounded job memory plus aggregate headroom | Contain/terminate job without assuming host survived; reconcile partial outputs/effects | Memory pressure/limit/provider health; guest and host-overhead accounting open |
| H — Temporary disk flood | Execution/storage: bounded scratch and host provisioning | Stop writes/terminate on quota; reclaim only under owned cleanup; partial files/effects retained | Storage usage/quota/cleanup; byte quota/filesystem mechanism open |
| I — stdout/stderr flood | Execution/output: bound collector/transport/store independently | Truncate or fail explicitly; stop if contract requires, avoid control-plane memory exhaustion | Bytes/truncation/overflow and required-output status; streaming strategy open |
| J — Millions of tiny files | Execution/storage: inode/file count and extraction bounds | Reject growth/stop; cleanup bounded with retained responsibility, quarantine if incomplete | File count/quota/cleanup progress; inode enforcement mechanism open |
| K — Cloud metadata request | Execution/network/security: deny metadata/link-local actual traffic | Block before connection where proven; terminate violation; investigate any possible credential exposure | Destination/deny/connection observation; IPv4/IPv6 enforcement open |
| L — Host localhost/control endpoint | Execution/network: no host/control-plane route or admin identity | Deny; own test-local loopback distinct; contain if access succeeded, reconcile effects | Resolved namespace/destination evidence; topology/loopback guards open |
| M — Allowed URL redirects inward | Fetch/browser/network owners: revalidate redirects/audience | Reject forbidden hop/no token forward; known prevented versus unknown prior exposure separate | Initial/hop policy/connection references; client/proxy behavior open |
| N — DNS changes after check | Network/security: enforce validated destination at actual connect/retry | Block rebinding; no unchecked second resolution; investigate uncertain connections | Resolver/destination/policy observations; DNS/connect binding mechanism open |
| O — Source exfiltration via Internet | Security/execution: no ambient Internet; explicit disclosure review | Deny ungranted egress; if allowed endpoint leaked, stop/revoke forward access, incident not rollback | Permitted destinations/bytes/data-risk and exposure evidence; leak detection limits open |
| P — Needs package registry | Execution/toolchain/network: grant scoped retrieval or fetch stage, code remains isolated | Deny unsupported reachability rather than broaden; retry fetch only safely, run hooks under same policy | Registry/toolchain/lock/source and network records; CDN/proxy coverage open |
| Q — Legitimate test database/service | Resource/security/execution: isolated synthetic service or reviewed narrow remote test resource | Permit only scoped target/credential/effects; stop clients/services, reconcile remote mutation | Test dependency/environment and principal evidence; service topology/credential rules open |
| R — Test secret printed | Credential/output/security: withhold detectable secret from ordinary outputs/models | Stop/contain per policy, restrict evidence, authorized revocation/recovery; exposure can be unknown | Redacted exposure/recipient/decision references; detection cannot cover all encodings |
| S — Secret in artifact | Artifact/credential/security: sensitivity gate, no ordinary release/promotion | Quarantine/restrict/delete under approved policy; assess prior access, cleanup no secrecy guarantee | Artifact identity/sensitivity/custody without value; scan/retention controls open |
| T — Artifact link/traversal | Artifact/filesystem: confined immutable extraction and type rules | Reject/quarantine entry; retry extraction only from valid frozen view, not execute again | Entry/policy/extraction rejection; race-safe exporter open |
| U — Archive escapes output area | Artifact/security: confined bounded parser, entry/link/expansion rules | Reject malformed archive; clean partial extraction, preserve uncertainty if boundary breached | Archive identity/entry/expansion counts; parser/isolation library open |
| V — Image/toolchain changes | Execution/admission/approval: retain admitted revision per attempt | Pause incompatible attempt; new reviewed binding where required, no silent retry with latest | Old/new image/toolchain/source/policy refs; version catalog/compatibility open |
| W — Cache leaks tenant data | Cache/security: scoped reads and eligible published content | Deny cross-scope hit; quarantine generation if leaked, stop delivery/incident response | Cache origin/scope/access references; physical namespace and invalidation open |
| X — Cache poisoning | Cache/security: private untrusted writes, reviewed integrity publication | Reject overwrite; revoke suspect generation/rebuild; do not trust affected future jobs | Content provenance/publication/generation evidence; validation mechanism open |
| Y — Revision H becomes H2 | Source/approval/execution: pin actual representation/check reviewed binding | Reject H2 before start; renew intent/approval, record old attribution unchanged | Approved/materialized commit/patch evidence; immutable staging mechanism open |
| Z — Crash after possible effect | Execution/provider/Tool: preserve Job/attempt and ambiguity | Reconcile population plus remote owner state; no blind re-execution; quarantine until cleanup known | Last start/effect/provider evidence; status/remote reconciliation support open |
| AA — Cancel after HTTP mutation | Execution/Tool/resource: stop future work, scoped remote cancel if supported | Confirmed/unknown earlier mutation persists; compensation newly authorized, no rollback assumption | Send/accept/cancel/remote operation refs; target status contract open |
| AB — Control connection lost, code running | Provider/execution/security: independent deadline/loss-of-control policy | Stop or bounded continuation only under admitted valid policy; no new authority; reconcile, not duplicate | Heartbeat/ownership/deadline/population evidence; fencing/partition guarantees open |
| AC — Restart sees pending Job | Execution/provider: consult durable identity and authoritative attempt evidence | Observe prior start/termination/effects before replacement; ambiguous pending is not safe replay | Prior claim/start/provider mapping; recovery ledger/storage open |
| AD — Duplicate delivery | Execution/publication owner: atomic semantic identity/claim convergence | Return existing evidence/pending disposition; never uncontrolled second start; partial/unknown retained | Duplicate binding/claim/result references; dedup horizon/provider primitive open |
| AE — Teardown fails | Execution/provider: durable cleanup custody and quarantine | Stop/destroy attempts tracked; no pool reuse, effect/cleanup uncertainty explicit | Resource/stop/cleanup failure references; destruction confirmation/reaper open |
| AF — Runtime/kernel escape | Security/provider: suspend/isolate affected execution boundary | Treat evidence as suspect; no ordinary retry; incident containment and independent effect reconciliation | Version/incident/last trusted observations; exploit detection/host replacement plan open |
| AG — Operator bypass | Security/admin/audit: narrow authenticated privileged path, independent governance | Block unauthorized action; if performed, incident/attribution, stop affected jobs without claiming rollback | Operator/action/policy/exception evidence; roles/break-glass controls open |
| AH — Untrusted MCP stdio | Tool/execution/admission: isolate server process and its descendants | Reject direct control-process launch; bounded managed lifetime, stop/reconcile under job policy | MCP provider/version/process/job/effects refs; hosting/lifecycle class open |
| AI — Browser cookies from other job | Browser/execution/security: fresh scoped profile, credential policy | Reject contaminated state; quarantine environment, assess disclosure, no reuse until verified reset | Profile/session origin and exposure refs without cookies; browser isolation mechanism open |
| AJ — Runtime socket access | Execution/provider: socket/API absent and denied | Block; if reachable, security boundary failure/containment, not ordinary command retry | Mount/handle/deny/provider evidence; runtime custody mechanism open |
| AK — Mount/device/escalation attempt | Execution/provider/security: deny privileged host interfaces | Contain denied attempt, terminate per policy; if successful suspect boundary/effects | Requested interface/privilege and enforcement refs; runtime hardening profile open |
| AL — Trusted repo gains malicious dependency | Admission/security/toolchain: hostile baseline applies to dependencies | No automatic lower tier; updated source/dependency attribution, stop suspicious effects | Trust classification/lock/tool provenance; controlled-helper criteria open |
| AM — Exit success, extraction failed | Artifact/execution/Runtime: required outputs checked independently | Result incomplete/failed; safe extraction recovery separate from rerun; cleanup/effects separate | Exit and extraction failure/required artifact refs; output-success contract open |
| AN — Exit 0, background alive | Execution/provider: parent status separate from population | Stop descendants, observe termination; no clean-success/reuse based on exit code | Parent exit/population/termination refs; provider population evidence open |
| AO — Execution done, cleanup/effects unknown | Execution/Tool/Runtime: honest orthogonal status and retained owners | End caller waiting with unresolved references; quarantine and reconcile, no blind replay/reuse | Separate completion/cleanup/effect facts; backlog/escalation/SLO policy open |

### Availability, capacity, evidence and validation gates

Provider unavailable means explicit queued/waiting/failed admission under a bounded durable responsibility, not direct host fallback. Global/tenant/project/provider budgets include staging, extraction, orphan cleanup and reconciliation. Preserve accepted obligations while refusing new work when durable capacity is exhausted; no unbounded queue or silent loss. Cost/usage reporting covers failed/unknown attempts too.

Expose who requested what, trusted source actually executed, Job/attempt/Run/Tool/workflow, policies/approval/credential references, environment/provider/toolchain, budgets, scheduling/start/stop/exit, population, artifacts, effects, cleanup, retries and operator interventions. Minimize sensitive command arguments/output; preserve permitted digests/references with reconstruction limitations. Provider/log telemetry is not complete audit or business truth. ADR-011 sets final integrity/privacy/retention/alerts; no private chain-of-thought is required.

Future separately authorized conformance must exercise A–AO with actual filesystem/link races, fork/daemon/stop races, byte/inode/log floods, private/IPv6/DNS/redirect/socket egress, source/approval changes, encoded secret output, cross-tenant caches/profiles, duplicate/partition/restart and teardown/compromise conditions. Verify isolation/control readiness before scripts start and host headroom under contention. Measure representative build/test/browser compatibility, cold/warm startup, density, stop latency, extraction, recovery and cost against owner-agreed budgets. No hostile sample, repository code, runtime command, Docker/VM/SDK install, benchmark or integration test was executed here.

## 11. Evolution / Exit Strategy

```text
NEXORA-owned Execution Contract
    → inward Execution Provider Adapter
        → admitted hardened sandbox / VM / scheduled runtime / managed provider
```

Alternatives are possible future routes, not required multiple implementations. Start separately authorized implementation with one admitted provider, one representative workload and the smallest contract that satisfies its threats. No platform ecosystem or orchestration layer is pre-built by this ADR.

Provider migration preserves trusted source/scope, Job/attempt links, current policy/approval, required isolation/resource/files/network/secret controls, output/effect/termination/cleanup interpretation and historical provider attribution. Disclose incompatible/weaker guarantees and require architecture/security review before routing. Drain/reconcile old attempts under their original provider; no dual execution or failover of an unknown mutation. Exported logs/artifacts do not make live VM/process state portable.

Review for newly required platforms/hardware, syscall/browser compatibility gaps, sensitivity/compliance constraints, provider incidents, inability to enforce bounds or stop, unacceptable measured cost/latency, operational staffing or a materially changed trust model. Security changes can justify separate hosts/accounts/regions before scale-driven extraction. Future supersession is explicit owner review; never silently amend Accepted constraints.

DR restores durable job/source/policy/evidence correlations, applies current revocation/deletion decisions and reconciles actual providers/external targets before starting work from checkpoints. Snapshot restoration does not recreate authorization or prove effects absent. Exact RPO/RTO, backup and provider-state procedures are ADR-012 gates.

## 12. Development Constitution Compliance

- Re-read constitution, AGENTS, ADR convention, all Accepted ADR-001–007 and all architecture documentation; inspected repository and searched execution references before edits.
- Surfaced stale supporting ADR-008 prohibition, no material accepted conflict, hostile-code assumption and unresolved deployment/workload/control guarantees before drafting.
- Preserve Go, modular control-plane topology, public owner/inward contracts and No implicit Shared Kernel; isolated execution does not imply final contexts/microservices.
- Preserve Run lifecycle/outcome/history, current authorization, Temporal infrastructure/replay distinction, durable event patterns, Sophia evidence boundaries and ADR-007 operation governance.
- Accepted with explicit human project-owner approval dated 2026-10-05. Acceptance does not authorize implementation.
- Distinguish verified primary-source technology facts, NEXORA requirements, architectural inference and unknown implementation gates.
- Documentation only; no source, Go modules/dependencies, workers, schemas, queues, images, Dockerfiles, CI, runtime/provider/credential/network/infrastructure configuration or final package layout.
- Synchronize directly supporting status/navigation/scope only. Accepted ADR-001–007 remain unchanged; ADR-009 not started.
- Document verification covers status/structure/links/threats/scenarios/invariants/scope and pre-edit byte comparison, not deployed control guarantees.

## 13. Related Decisions

[Constitution](../../DEVELOPMENT_CONSTITUTION.md), [ADR convention/index](README.md), [architecture context](../architecture/ARCHITECTURE.md), [principles](../architecture/principles.md). Accepted constraints: [ADR-001](ADR-001-core-programming-language.md), [ADR-002](ADR-002-architecture-style.md), [ADR-003](ADR-003-agent-runtime.md), [ADR-004](ADR-004-workflow-engine.md), [ADR-005](ADR-005-event-architecture.md), [ADR-006](ADR-006-memory-architecture.md), [ADR-007](ADR-007-mcp-tool-architecture.md).

| Deferred ADR | Unresolved questions / implementation gates |
| --- | --- |
| ADR-009 — Security & Isolation | Trusted identities/current policy/tenancy, revocation/fencing races, provider admission and compromised evidence, secret issuance/delivery, egress/security topology, supply chain, operator privileges, sensitive workload/side-channel requirements |
| ADR-010 — Human Approval | Source/command/environment/privilege/resource/effect bindings, approval validity/reuse/revocation, code trust classification and exceptional operator access; no approval matrix finalized |
| ADR-011 — Observability | Integrity/privacy/retention of job/output/audit evidence, denied/admin actions, secret incidents, truncation, costs, unknown-effect/orphan/cleanup alerts and correction semantics |
| ADR-012 — Deployment | Actual sandbox/runtime/provider/platform versions, worker hosts/topology/pools, scheduling, images/registries/caches/artifact storage, network mechanisms, resource numbers/SLOs/cost, patch/upgrade/drain/incident/DR procedures |

Undecided: Docker/OCI runtime, gVisor/Kata/Firecracker/hypervisor, Kubernetes/ECS/Nomad/cloud/managed sandbox; seccomp/namespaces/cgroups/capabilities/AppArmor/SELinux profiles; filesystem driver/overlay, proxy/DNS/mesh/browser isolation, secret vault, image registry, worker protocol, queue/database/Outbox schema, cache, resource/timeout/rate numbers, log/audit/artifact backend, final domain/package layout and deployment topology. No additional platform runtime language is introduced. Controls must be resolved before their affected feature, not after implementation.

## 14. Evidence / References

Primary sources reviewed **2026-10-05**. Facts below describe documented mechanisms/limitations; requirements and the recommended protection class are NEXORA architectural inferences from the owner threat scenarios and Accepted constraints. No installed-version conformance, comparative benchmark, managed-provider equivalence or security test is claimed. Recheck selected supported releases before separately authorized adoption.

- G1: [Go os/exec](https://pkg.go.dev/os/exec) — program invocation, environment and direct-process cancellation; not a sandbox/process-tree guarantee.
- D1: [Docker Engine security](https://docs.docker.com/engine/security/) — namespace/capability/daemon/mount attack surface; product naming does not establish NEXORA hostile-code conformance.
- D2: [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/) — default resource limits are absent; required controls must be configured and validated.
- K1: [Kubernetes multi-tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/) — shared-kernel container exposure and userspace-kernel/VM sandboxing for malicious workloads; not a NEXORA cluster selection.
- K2: [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/) — failure/restart and duplicate program-start limitations; scheduler identity is not semantic execution identity.
- K3: [Kubernetes NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) — enforcement readiness/plugin, node/loopback and connection limitations; not full egress/SSRF policy.
- V1: [gVisor security model](https://gvisor.dev/docs/architecture_guide/security/) — restricted host interface, remaining resource/network/hardware risks; no claim of universal VM superiority.
- V2: [gVisor application compatibility](https://gvisor.dev/docs/user_guide/compatibility/) — incomplete system-call surface and need for workload validation.
- F1: [Firecracker production host setup](https://github.com/firecracker-microvm/firecracker/blob/main/docs/prod-host-setup.md) — KVM/hardware boundary, host/guest patching and jailer-equivalent constraints; no runtime selected.
- F2: [Firecracker snapshot support](https://github.com/firecracker-microvm/firecracker/blob/main/docs/snapshotting/snapshot-support.md) — cloned identity/entropy/token-state risks; not a snapshot feature adoption.
- L1: [Linux cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html) — descendant membership, PID limits and population kill primitives as capability evidence, not selected implementation.
- O1: [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) — destination/DNS/redirect validation and connection binding; job-level enforcement must cover non-HTTP bypasses too.
- A1: [AWS Fargate security considerations](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-security-considerations.html) — specific managed task isolation example; no provider-wide equivalence or adoption claimed.

Project evidence: current ADR-008 owner handoff, direct inspection of thirteen existing Markdown documents, execution reference search and pre-edit file-byte snapshot. This document is Accepted with explicit human project-owner approval dated 2026-10-05; implementation security remains unverified.
