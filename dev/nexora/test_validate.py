"""Offline regression tests: all process execution is intercepted by mocks."""
import copy
import importlib.util
import json
import unittest
from unittest import mock


SPEC = importlib.util.spec_from_file_location(
    "nexora_validate_under_test", __file__.rsplit("/", 1)[0] + "/validate.py")
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


def fixtures():
    """Independent expected inputs; do not obtain fixtures from the validator."""
    app = {
        "restart": "no", "cap_drop": ["ALL"], "command": None,
        "entrypoint": None,
        "environment": {"NEXORA_LISTEN_ADDRESS": "127.0.0.1:8080",
                        "NEXORA_SHUTDOWN_TIMEOUT": "10s"},
        "image": "nexora-c71-app:local", "network_mode": "none",
        "pull_policy": "never", "read_only": True,
        "security_opt": ["no-new-privileges:true"],
        "stop_grace_period": "15s", "user": "65532:65532",
    }
    default = {"name": "nexora", "services": {"app": copy.deepcopy(app)}}
    host = copy.deepcopy(app)
    del host["network_mode"]
    host.update({"profiles": ["host"],
                 "environment": {"NEXORA_LISTEN_ADDRESS": "0.0.0.0:8080",
                                 "NEXORA_SHUTDOWN_TIMEOUT": "10s"},
                 "networks": {"host_access": None},
                 "ports": [{"mode": "ingress", "host_ip": "127.0.0.1",
                            "target": 8080, "protocol": "tcp"}]})
    enabled = {"name": "nexora", "services": {"app": app, "app-host": host},
               "networks": {"host_access": {
                   "name": "nexora_host_access", "driver": "bridge",
                   "driver_opts": {"com.docker.network.bridge.host_binding_ipv4": "127.0.0.1"},
                   "ipam": {}, "enable_ipv6": False}}}
    image = [{"Id": "sha256:9b4774ce1a2037885f43812f15ad0f5f68f7a9b3451998eb68637b8696ff1aee",
              "Os": "linux", "Architecture": "arm64",
              "RepoTags": ["nexora-c71-app:local"]}]
    return default, enabled, image


class OfflineValidationTests(unittest.TestCase):
    def install_patch(self, patcher):
        value = patcher.start()
        self.addCleanup(patcher.stop)
        return value

    def setUp(self):
        # Even pure-helper tests install the process guard. Unexpected invocations
        # raise immediately rather than falling through to the host executable.
        self.process = self.install_patch(mock.patch.object(
            VALIDATOR.subprocess, "run", side_effect=AssertionError("unexpected process")))
        self.install_patch(mock.patch.dict(VALIDATOR.os.environ, {}, clear=True))
        self.install_patch(mock.patch.object(VALIDATOR.sys, "argv", ["validate.py"]))
        self.default, self.host, self.image = fixtures()
        self.output = self.install_patch(mock.patch("builtins.print"))

    def simulate(self, fault=None, mutation=None):
        """Respond only to the exact, approved read-only argument arrays."""
        compose = ["docker", "compose", "-p", "nexora", "-f",
                   "dev/nexora/compose.yaml", "-f", "dev/nexora/compose.host.yaml"]
        responses = {
            tuple(compose + ["config", "--format", "json"]): json.dumps(self.default),
            tuple(compose + ["--profile", "host", "config", "--format", "json"]): json.dumps(self.host),
            ("docker", "image", "inspect", "nexora-c71-app:local"): json.dumps(self.image),
            ("git", "rev-parse", "HEAD"): "fixture-revision",
        }

        def execute(args, **kwargs):
            key = tuple(args)
            if key == ("/fixture/go/bin/go", "version"):
                self.assertEqual(kwargs["env"]["GOTOOLCHAIN"], "local")
                self.assertEqual(kwargs["env"]["GOPROXY"], "off")
                return mock.Mock(returncode=1, stdout="", stderr="PRIVATE DRIVER DETAIL")
            self.assertIn(key, responses, "unapproved command, including lifecycle operation")
            self.assertNotIn("shell", kwargs)
            self.assertEqual(kwargs["timeout"], 30)
            if fault:
                result = fault(key)
                if result is not None:
                    return result
            return mock.Mock(returncode=0, stdout=responses[key], stderr="")

        self.process.side_effect = execute
        self.output.reset_mock()
        if mutation:
            mutation()
        code = VALIDATOR.main()
        text = self.output.call_args.args[0]
        return code, json.loads(text), text

    def test_positive_configuration_and_image(self):
        before = copy.deepcopy((self.default, self.host))
        for check in VALIDATOR.configuration_checks(self.default, self.host):
            self.assertEqual(check["status"], "PASS")
        for check in VALIDATOR.image_checks(self.image):
            self.assertEqual(check["status"], "PASS")
        self.assertEqual((self.default, self.host), before)
        self.process.assert_not_called()

    def test_explicit_false_compose_normalization(self):
        self.host["networks"]["host_access"]["internal"] = False
        self.assertTrue(all(c["status"] == "PASS" for c in
                            VALIDATOR.configuration_checks(self.default, self.host)))
        self.assertIn("internal", self.host["networks"]["host_access"])

    def test_negative_configurations(self):
        cases = [
            ("project", ("name",), "other"),
            ("extra default service", ("services", "extra"), {}),
            ("missing isolation", ("services", "app", "network_mode"), "host"),
        ]
        host_cases = [
            ("fixed port", ("ports",), [{"host_ip": "127.0.0.1", "target": 8080, "published": "8080", "protocol": "tcp"}]),
            ("wildcard IP", ("ports", 0, "host_ip"), "0.0.0.0"),
            ("IPv6 IP", ("ports", 0, "host_ip"), "::1"),
            ("profile", ("profiles",), ["other"]),
            ("listener", ("environment", "NEXORA_LISTEN_ADDRESS"), "127.0.0.1:8080"),
            ("network", ("networks",), {"foreign": None}),
            ("mount", ("volumes",), ["unexpected"]),
            ("secret", ("secrets",), ["unexpected"]),
            ("dependency", ("depends_on",), {"other": {}}),
            ("privileged", ("privileged",), True),
            ("user", ("user",), "0:0"),
            ("writable root", ("read_only",), False),
            ("capabilities", ("cap_drop",), []),
            ("no-new-privileges", ("security_opt",), []),
            ("restart", ("restart",), "always"),
            ("extra port", ("ports", 1), {}),
            ("unexpected field", ("unrecognized",), True),
        ]
        cases += [(name, ("services", "app-host") + path, value)
                  for name, path, value in host_cases]
        cases += [("IPv6 network", ("networks", "host_access", "enable_ipv6"), True),
                  ("internal drift", ("networks", "host_access", "internal"), True)]
        for name, path, value in cases:
            with self.subTest(name=name):
                default, host, _ = fixtures()
                target = default if name in {"project", "extra default service", "missing isolation"} else host
                for key in path[:-1]:
                    target = target[key]
                if isinstance(target, list) and path[-1] == len(target):
                    target.append(value)
                else:
                    target[path[-1]] = value
                self.assertTrue(any(c["status"] == "GAP" for c in
                                    VALIDATOR.configuration_checks(default, host)))
        # Missing required fields must also fail rather than assume a default.
        del self.host["services"]["app-host"]["read_only"]
        self.assertTrue(any(c["status"] == "GAP" for c in
                            VALIDATOR.configuration_checks(self.default, self.host)))

    def test_negative_images(self):
        for key, value in [("Id", "wrong"), ("Architecture", "amd64"),
                           ("RepoTags", ["other:local"])]:
            with self.subTest(field=key):
                image = copy.deepcopy(self.image)
                image[0][key] = value
                self.assertTrue(any(c["status"] == "GAP" for c in VALIDATOR.image_checks(image)))

    def test_required_command_failures(self):
        for name in ["docker failure", "malformed JSON", "missing image", "timeout"]:
            with self.subTest(name=name):
                def fault(key):
                    if name == "missing image" and key[:3] == ("docker", "image", "inspect"):
                        return mock.Mock(returncode=1, stdout="", stderr="PRIVATE DRIVER DETAIL")
                    if key[:2] == ("docker", "compose"):
                        if name == "docker failure":
                            return mock.Mock(returncode=1, stdout="", stderr="PRIVATE DRIVER DETAIL")
                        if name == "malformed JSON":
                            return mock.Mock(returncode=0, stdout="PRIVATE DRIVER DETAIL", stderr="")
                        if name == "timeout":
                            raise VALIDATOR.subprocess.TimeoutExpired(key, 30, stderr="PRIVATE DRIVER DETAIL")
                    return None
                code, report, text = self.simulate(fault)
                self.assertEqual(code, 1)
                self.assertEqual(report["conclusion"], "BLOCKED")
                self.assertTrue(any(c["status"] == "BLOCKED" for c in report["checks"]))
                self.assertNotIn("PRIVATE DRIVER DETAIL", text)

    def test_mandatory_gap_has_nonzero_exit(self):
        self.image[0]["Id"] = "wrong"
        code, report, _ = self.simulate()
        self.assertEqual(code, 1)
        self.assertEqual(report["conclusion"], "BLOCKED")

    def test_optional_observations_unknown(self):
        def fault(key):
            if key[0] == "git":
                return mock.Mock(returncode=1, stdout="", stderr="PRIVATE DRIVER DETAIL")
            return None
        self.install_patch(mock.patch.dict(VALIDATOR.os.environ, {"GOROOT": "/fixture/go"}))
        code, report, text = self.simulate(fault)
        self.assertEqual(code, 0)
        statuses = {c["id"]: c["status"] for c in report["checks"]}
        for name in ["evidence.git", "evidence.go", "evidence.binary_hashes", "runtime.verification"]:
            self.assertEqual(statuses[name], "UNKNOWN")
        self.assertNotIn("PRIVATE DRIVER DETAIL", text)

    def test_invalid_arguments(self):
        with mock.patch.object(VALIDATOR.sys, "argv", ["validate.py", "unexpected"]):
            self.assertEqual(VALIDATOR.main(), 2)
        self.process.assert_not_called()

    def test_deterministic_report_and_order(self):
        first = self.simulate()
        second = self.simulate()
        self.assertEqual(first[0], 0)
        self.assertEqual(first[2], second[2])
        identifiers = [c["id"] for c in first[1]["checks"]]
        self.assertEqual(identifiers, sorted(identifiers))


if __name__ == "__main__":
    unittest.main()
