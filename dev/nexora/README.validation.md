# C7.3 read-only development validation

From the repository root:

```sh
python3 -B dev/nexora/validate.py
```

Requires Python 3, Git, Docker CLI with Compose, an accessible local Docker
Engine, and the already-built C7.1 app image. No Python packages, images,
dependencies or toolchains are downloaded. No Docker lifecycle commands run.
No files are written by the validator. Existing C3/C4 fixtures, JobMatcher,
Docker Desktop Kubernetes infrastructure and the retained NEXORA app are
inspection-only or untouched; never clean them up through this utility.

The validator resolves both exact Compose files, with and without profile host.
It checks complete normalized configurations: default service selection, base
app isolation, host opt-in/inheritance, listener, dynamic IPv4 loopback TCP
publication, dedicated bridge, disabled IPv6 and explicit outbound relaxation.
It also checks inherited user, read-only root, dropped capabilities,
no-new-privileges and disabled restart. Exact comparisons reject unexpected
fields, mounts, secrets, dependencies or networks. Compose's omitted
internal:false is treated as its known false default; explicit false is accepted.
A different Compose normalization may fail closed and require review.

Checks are sorted by identifier, with status, evidence, expected and observed
values. Exit 0 means required static checks passed; optional UNKNOWN observations
may remain. Exit 1 means a required GAP/BLOCKED result. Exit 2 means invalid
arguments. CLI failures/timeouts are reported without replaying driver diagnostics.

The retained image must resolve to:

`sha256:9b4774ce1a2037885f43812f15ad0f5f68f7a9b3451998eb68637b8696ff1aee`

The configured local tag is mutable: matching this ID establishes retained-image
identity, not source-to-image provenance or byte-for-byte build reproducibility.
The report records the current Git revision. If GOROOT is explicitly supplied,
it observes that installation's Go version with local/offline selection; version
output alone does not establish toolchain integrity. Otherwise this is UNKNOWN.
Binary hashes remain UNKNOWN: no binary extraction, rebuild or host binary
input is performed.

This utility never checks live HTTP readiness, actual port bindings, routes,
server shutdown or repeated runtime behavior. Separate owner authorization is
required for two startup/HTTP/SIGTERM cycles, bounded response status/body
checks, actual security inspection and cleanup of only run-created resources.
Default isolated-mode HTTP additionally requires explicit authorization for a
trusted namespace-sharing verifier; an independent network:none container cannot
reach the application's loopback interface. Always target app-host explicitly:
enabling profile host alone also leaves base app eligible for unqualified up.

Future runtime verification must record exact pre-existing resource IDs and
ownership labels/configuration paths before mutation, reject collisions, preserve
all pre-existing resources, and remove only created containers and empty owned
networks. Never use global pruning or broad compose down. Host mode permits
outbound traffic and peer access on its bridge; localhost publication provides
neither egress isolation nor application authorization.

Health endpoints describe only the development HTTP skeleton. D02 remains NOT
ACCEPTED; normative obligations REVIEW ONLY; O1–O5 and GO-2026-5932 OPEN.
Operational Run creation, admission, dispatch and persistence remain BLOCKED.

## C8 offline boundary regression tests

From the repository root, using Python 3.9 or newer:

```sh
python3 -B -m unittest discover -s dev/nexora -p test_validate.py -v
```

The standard-library suite loads the unchanged validator through importlib.
Independent deterministic fixtures cover both modes, accepted Compose
normalization, security restrictions and image identity/platform/reference.
Negative cases reject configuration drift, extra fields, mounts, dependencies,
secrets, privilege changes, incorrect publication and missing required controls.
Mocked failures cover command errors, malformed JSON, missing images, timeout,
Git revision failure and unavailable optional Go version evidence. Reports must
be ordered and byte-identical for identical inputs; mandatory failures exit 1,
optional UNKNOWN evidence permits exit 0, and invalid arguments exit 2.

Every test installs a subprocess.run mock that rejects unexpected commands.
No real Docker, Git, Go, database client or network request is executed by the
suite. These unit tests prove behavior against controlled inputs, not live
Docker configuration, runtime isolation, HTTP readiness or integration.
The separate runtime authorization requirements above remain in force.
Operational integration remains BLOCKED; no architecture or governance status
is changed by this test suite.
