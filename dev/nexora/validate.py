#!/usr/bin/env python3
"""Read-only C7 development configuration and retained-image validation."""
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
IMAGE = "nexora-c71-app:local"
IMAGE_ID = "sha256:9b4774ce1a2037885f43812f15ad0f5f68f7a9b3451998eb68637b8696ff1aee"


def command(args, cwd=ROOT):
    """Only callers with fixed, read-only command arrays use this boundary."""
    result = subprocess.run(args, cwd=cwd, capture_output=True, text=True,
                            timeout=30, check=False)
    if result.returncode:
        # Do not reproduce arbitrary CLI diagnostics or environment values.
        raise RuntimeError("read-only command failed (exit %d)" % result.returncode)
    return result.stdout.strip()


def record(identifier, expected, observed, optional=False):
    return {"id": identifier,
            "status": ("UNKNOWN" if optional else
                       "PASS" if expected == observed else "GAP"),
            "evidence": "optional observation" if optional else "exact value comparison",
            "expected": expected, "observed": observed}


def expected_configs():
    base = {
        "restart": "no", "cap_drop": ["ALL"], "command": None,
        "entrypoint": None,
        "environment": {"NEXORA_LISTEN_ADDRESS": "127.0.0.1:8080",
                        "NEXORA_SHUTDOWN_TIMEOUT": "10s"},
        "image": IMAGE, "network_mode": "none", "pull_policy": "never",
        "read_only": True, "security_opt": ["no-new-privileges:true"],
        "stop_grace_period": "15s", "user": "65532:65532",
    }
    host = dict(base)
    host.pop("network_mode")
    host.update({"profiles": ["host"],
                 "environment": {"NEXORA_LISTEN_ADDRESS": "0.0.0.0:8080",
                                 "NEXORA_SHUTDOWN_TIMEOUT": "10s"},
                 "networks": {"host_access": None},
                 "ports": [{"mode": "ingress", "host_ip": "127.0.0.1",
                            "target": 8080, "protocol": "tcp"}]})
    default = {"name": "nexora", "services": {"app": base}}
    network = {"name": "nexora_host_access", "driver": "bridge",
               "driver_opts": {"com.docker.network.bridge.host_binding_ipv4": "127.0.0.1"},
               "ipam": {}, "enable_ipv6": False}
    enabled = {"name": "nexora", "services": {"app": base, "app-host": host},
               "networks": {"host_access": network}}
    return default, enabled


def configuration_checks(default, enabled):
    """Pure checks, also usable with controlled negative fixtures.

    Compose omits internal:false in normalized JSON. Explicit false is equally
    valid; missing required values and every other unexpected field fail closed.
    """
    # Copy inputs so validation never alters caller-owned fixtures.
    enabled = json.loads(json.dumps(enabled))
    network = enabled.get("networks", {}).get("host_access", {})
    if network.get("internal") is False:
        network.pop("internal")
    wanted_default, wanted_enabled = expected_configs()
    return [record("config.default", wanted_default, default),
            record("config.host", wanted_enabled, enabled)]


def image_checks(images):
    valid = isinstance(images, list) and len(images) == 1 and isinstance(images[0], dict)
    image = images[0] if valid else {}
    return [record("image.identity", IMAGE_ID, image.get("Id")),
            record("image.platform", ["linux", "arm64"],
                   [image.get("Os"), image.get("Architecture")]),
            record("image.reference", IMAGE,
                   IMAGE if IMAGE in (image.get("RepoTags") or []) else None)]


def main():
    if len(sys.argv) != 1:
        print("Usage: python3 dev/nexora/validate.py", file=sys.stderr)
        return 2
    checks = []
    compose = ["docker", "compose", "-p", "nexora", "-f",
               "dev/nexora/compose.yaml", "-f", "dev/nexora/compose.host.yaml"]
    try:
        default = json.loads(command(compose + ["config", "--format", "json"]))
        enabled = json.loads(command(compose + ["--profile", "host", "config",
                                               "--format", "json"]))
        checks.extend(configuration_checks(default, enabled))
    except (OSError, RuntimeError, ValueError, TypeError, AttributeError,
            subprocess.TimeoutExpired):
        checks.append({"id": "config.load", "status": "BLOCKED",
                       "evidence": "configuration resolution failed or malformed output",
                       "expected": "complete Compose JSON", "observed": "unavailable"})
    try:
        checks.extend(image_checks(json.loads(command(["docker", "image", "inspect", IMAGE]))))
    except (OSError, RuntimeError, ValueError, subprocess.TimeoutExpired):
        checks.append({"id": "image.load", "status": "BLOCKED",
                       "evidence": "required local image inspection failed",
                       "expected": IMAGE_ID, "observed": "unavailable"})
    try:
        revision = command(["git", "rev-parse", "HEAD"])
        checks.append({"id": "evidence.git", "status": "PASS",
                       "evidence": "git rev-parse HEAD", "expected": "current revision",
                       "observed": revision})
    except (OSError, RuntimeError, subprocess.TimeoutExpired):
        checks.append(record("evidence.git", "current revision", "unavailable", True))
    # No automatic Go toolchain selection or download. Only observe an explicitly
    # supplied GOROOT, with local selection and offline/read-only module settings.
    goroot = os.environ.get("GOROOT")
    version = "not observed: explicit GOROOT unavailable"
    if goroot:
        try:
            env = dict(os.environ, GOTOOLCHAIN="local", GOPROXY="off", GOFLAGS="-mod=readonly")
            result = subprocess.run([str(Path(goroot) / "bin/go"), "version"],
                                    env=env, capture_output=True, text=True,
                                    timeout=10, check=False)
            if result.returncode == 0:
                version = result.stdout.strip()
        except (OSError, subprocess.TimeoutExpired):
            pass
    checks.append({"id": "evidence.go", "status": "UNKNOWN" if version.startswith("not observed") else "PASS",
                   "evidence": "optional local version observation; not integrity verification",
                   "expected": "available explicitly selected toolchain version", "observed": version})
    checks.append(record("evidence.binary_hashes", "accessible without extraction or rebuild",
                         "not observed; no host binary input configured", True))
    checks.append(record("runtime.verification", "separate authorized runtime checks",
                         "not executed by this utility", True))
    failed = any(c["status"] in ("GAP", "BLOCKED") for c in checks)
    print(json.dumps({"checks": sorted(checks, key=lambda c: c["id"]),
                      "conclusion": "BLOCKED" if failed else "PASS",
                      "scope": "static configuration and retained-image identity only"},
                     indent=2, sort_keys=True))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
