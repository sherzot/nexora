#!/bin/sh
# Fixed local SQL exercise; never a Run acceptance or durability check.
set -eu
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec python3 - "$script_dir" "$@" <<'PY'
import json
import os
from pathlib import Path
import signal
import stat
import subprocess
import sys
import time

PROJECT = "nexora-c3-postgres"
IMAGE = "docker.io/library/postgres:17.11-bookworm@sha256:858bb5e98eed02eb8cafbcdc007f9a65d1b613972028944a8ec2133ccaf80d27"
deadline = time.monotonic() + 30

class InfrastructureError(Exception):
    pass

class AssertionFailure(Exception):
    pass

def run(args, text=None):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise subprocess.TimeoutExpired(args[0], 30)
    with subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, text=True, env=env,
                          start_new_session=True) as process:
        try:
            out, err = process.communicate(text, timeout=remaining)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.communicate()
            raise
    return process.returncode, out, err

def checked(args):
    code, out, _ = run(args)
    if code:
        raise InfrastructureError("Docker command unavailable or failed")
    return out

try:
    if len(sys.argv) != 2:
        print("usage: sh dev/postgres/smoke.sh (no arguments)", file=sys.stderr)
        sys.exit(64)
    directory = Path(sys.argv[1]).resolve()
    repository = directory.parent.parent
    secret_text = os.environ.get("NEXORA_C3_PASSWORD_FILE", "")
    if not secret_text:
        raise InfrastructureError("external private password file required")
    secret = Path(secret_text)
    if not secret.is_absolute() or secret.is_symlink():
        raise InfrastructureError("password file must be absolute and not a symlink")
    secret = secret.resolve(strict=True)
    info = secret.stat()
    if secret.is_relative_to(repository) or not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077 or not 0 < info.st_size <= 4096:
        raise InfrastructureError("password file must be private, nonempty and outside the repository")
    # No inherited Compose overrides, Docker remote selection, or libpq targets.
    if any(os.environ.get(key) for key in ("DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH")):
        raise InfrastructureError("Docker endpoint overrides are unsupported")
    env = {key: value for key, value in os.environ.items()
           if not key.startswith(("COMPOSE_", "PG"))}
    env["NEXORA_C3_PASSWORD_FILE"] = str(secret)
    endpoint = json.loads(checked(["docker", "context", "inspect"]))[0]["Endpoints"]["docker"]["Host"]
    if not endpoint.startswith("unix://"):
        raise InfrastructureError("a local Unix-socket Docker context is required")
    ids = checked(["docker", "ps", "-aq", "--filter", "label=com.docker.compose.project=" + PROJECT]).split()
    if len(ids) != 1:
        raise InfrastructureError("exactly one dedicated C3 container is required")
    container = json.loads(checked(["docker", "inspect", ids[0]]))[0]
    labels = container["Config"].get("Labels") or {}
    mounts = container.get("Mounts", [])
    tmpfs = container["HostConfig"].get("Tmpfs") or {}
    credentials = [m for m in mounts if m["Destination"] == "/run/secrets/postgres_password"]
    if (labels.get("com.docker.compose.service") != "postgres"
        or labels.get("com.docker.compose.project.config_files") != str(directory / "compose.yaml")
        or container["Config"]["Image"] != IMAGE
        or container["HostConfig"]["NetworkMode"] != "none"
        or container["HostConfig"].get("PortBindings")
        or any((container["NetworkSettings"].get("Ports") or {}).values())
        or container["HostConfig"].get("Privileged")
        or len(mounts) != 1
        or tmpfs != {"/var/lib/postgresql/data": "rw,nosuid,noexec,size=268435456"}
        or len(credentials) != 1 or credentials[0]["Type"] != "bind"
        or credentials[0].get("RW") or credentials[0]["Source"] != str(secret)):
        raise InfrastructureError("C3 container configuration conflict; no replacement attempted")
    if not container["State"]["Running"]:
        raise InfrastructureError("dedicated C3 database is not running")
    live_mounts = checked(["docker", "exec", ids[0], "cat", "/proc/mounts"])
    if not any(line.split()[1:3] == ["/var/lib/postgresql/data", "tmpfs"] for line in live_mounts.splitlines()):
        raise InfrastructureError("live PostgreSQL data mount is not tmpfs")
    compose = ["docker", "compose", "--env-file", "/dev/null", "-p", PROJECT,
               "-f", str(directory / "compose.yaml")]
    client = compose + ["exec", "-T", "postgres", "sh", "-eu", "-c", '''
export PGPASSWORD="$(cat /run/secrets/postgres_password)"
export PGCONNECT_TIMEOUT=3
export PGOPTIONS='-c statement_timeout=5000 -c lock_timeout=2000 -c idle_in_transaction_session_timeout=5000'
exec psql -X -w -qAt -h 127.0.0.1 -p 5432 -U nexora_c3 -d nexora_c3 -v ON_ERROR_STOP=1 -v VERBOSITY=sqlstate -f -
''']
    sql = """
SELECT 1;
CREATE TEMP TABLE c3_smoke (value integer NOT NULL);
INSERT INTO c3_smoke VALUES (11), (22);
DO $$ BEGIN
 IF (SELECT array_agg(value ORDER BY value) FROM c3_smoke) IS DISTINCT FROM ARRAY[11,22] THEN
  RAISE EXCEPTION 'synthetic readback mismatch';
 END IF;
END $$;
SELECT 'synthetic insert/readback verified';
BEGIN;
INSERT INTO c3_smoke VALUES (33);
DO $$ BEGIN
 IF (SELECT array_agg(value ORDER BY value) FROM c3_smoke) IS DISTINCT FROM ARRAY[11,22,33] THEN
  RAISE EXCEPTION 'transaction insert missing';
 END IF;
END $$;
ROLLBACK;
DO $$ BEGIN
 IF (SELECT array_agg(value ORDER BY value) FROM c3_smoke) IS DISTINCT FROM ARRAY[11,22] THEN
  RAISE EXCEPTION 'rollback did not restore original contents';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
            WHERE c.relkind IN ('r','p','f') AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema') THEN
  RAISE EXCEPTION 'unexpected application table';
 END IF;
END $$;
SELECT 'transaction rollback verified';
SELECT 'no application tables';
"""
    code, out, err = run(client, sql)
    if code in (1, 2) or code not in (0, 3):
        raise InfrastructureError("SQL client infrastructure failure")
    expected = "1\nsynthetic insert/readback verified\ntransaction rollback verified\nno application tables\n"
    if code != 0 or out != expected or err:
        raise AssertionFailure("positive SQL assertions failed")
    code, negative_out, negative_err = run(client, "SELECT 1/0;\nSELECT 'C3_SQL_ERROR_SENTINEL';\n")
    if code != 3:
        if code:
            raise InfrastructureError("SQL failure probe failed at infrastructure boundary")
        raise AssertionFailure("expected SQL script-error exit 3")
    if "22012" not in negative_err or "C3_SQL_ERROR_SENTINEL" in negative_out or negative_out:
        raise AssertionFailure("expected SQLSTATE 22012 with no sentinel execution")
    print(out, end="")
    print("expected SQL failure verified: SQLSTATE 22012; psql exit 3; sentinel not executed")
    print("PASS: synthetic PostgreSQL smoke only; no Run, durability or recovery guarantee")
except subprocess.TimeoutExpired:
    print("INFRASTRUCTURE: 30-second client watchdog expired; server termination is not established", file=sys.stderr)
    sys.exit(124)
except AssertionFailure as error:
    print("SQL ASSERTION FAILURE: " + str(error), file=sys.stderr)
    sys.exit(3)
except (InfrastructureError, OSError, ValueError, KeyError, IndexError, TypeError) as error:
    # Do not forward raw Docker/libpq diagnostics or secret-bearing environment.
    message = str(error) if isinstance(error, InfrastructureError) else "local prerequisite or inspection failed"
    print("INFRASTRUCTURE: " + message, file=sys.stderr)
    sys.exit(2)
PY
