from __future__ import annotations

import asyncio
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from harbor.models.agent.context import AgentContext

from benchmarks.harbor.agents.interference import InterferenceAgent


class InterferenceAgentTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.archive = self.root / "interference.tgz"
        self.archive.write_bytes(b"pinned-interference-artifact")
        self.digest = hashlib.sha256(self.archive.read_bytes()).hexdigest()

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def agent(self, **kwargs: object) -> InterferenceAgent:
        digest = kwargs.pop("interference_sha256", self.digest)
        return InterferenceAgent(
            logs_dir=self.root / "logs",
            model_name="deepseek/deepseek-v4-pro",
            interference_tarball=str(self.archive),
            interference_sha256=digest,
            **kwargs,
        )

    def raw(self) -> dict[str, object]:
        return {
            "schemaVersion": 1,
            "interferenceVersion": "0.7.0",
            "runId": "run-1",
            "taskId": "task-hash",
            "treatment": "authoritative",
            "provider": "deepseek",
            "model": "deepseek-v4-pro",
            "thinking": "max",
            "startedAt": "2026-07-18T00:00:00.000Z",
            "finishedAt": "2026-07-18T00:00:01.000Z",
            "outcome": "completed",
            "finalAnswer": "Done without private reasoning.",
            "tools": [
                {
                    "type": "tool-call",
                    "toolCallId": "call-1",
                    "toolName": "write",
                    "subject": "src/example.ts",
                    "kind": "mutation",
                },
                {
                    "type": "tool-result",
                    "toolCallId": "call-1",
                    "toolName": "write",
                    "outcome": "succeeded",
                },
            ],
            "skills": {"matched": [], "agenticSelected": []},
            "usage": {
                "input": 100,
                "output": 20,
                "cacheRead": 10,
                "classifierInputTokens": 5,
                "classifierOutputTokens": 2,
                "costUsd": 0.012,
            },
            "durationMs": 1000,
        }

    def test_rejects_unpinned_or_unfair_configuration(self) -> None:
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            self.agent(interference_sha256="0" * 64)
        with self.assertRaisesRegex(ValueError, "reasoning_effort=max"):
            self.agent(reasoning_effort="high")
        with self.assertRaisesRegex(ValueError, "treatment"):
            self.agent(treatment="shadow")

    def test_requires_exact_model(self) -> None:
        agent = self.agent()
        agent.model_name = "deepseek/deepseek-v4-flash"
        with self.assertRaisesRegex(ValueError, "exactly deepseek/deepseek-v4-pro"):
            agent._model()

    def test_converts_only_redacted_native_fields_to_atif(self) -> None:
        encoded = json.dumps(self.agent()._to_atif(self.raw()).to_json_dict())
        self.assertIn("src/example.ts", encoded)
        self.assertIn("Done without private reasoning", encoded)
        self.assertNotIn("chain-of-thought", encoded)
        self.assertNotIn("api-key", encoded)

    def test_populates_context_and_persists_valid_atif(self) -> None:
        agent = self.agent()
        agent.logs_dir.mkdir(parents=True)
        (agent.logs_dir / agent.RAW_TRAJECTORY).write_text(json.dumps(self.raw()))
        context = AgentContext()

        agent.populate_context_post_run(context)

        self.assertEqual(context.n_input_tokens, 105)
        self.assertEqual(context.n_output_tokens, 22)
        self.assertEqual(context.n_cache_tokens, 10)
        self.assertEqual(context.cost_usd, 0.012)
        atif = json.loads((agent.logs_dir / agent.ATIF_TRAJECTORY).read_text())
        self.assertEqual(atif["schema_version"], "ATIF-v1.7")
        self.assertEqual(atif["agent"]["extra"]["treatment"], "authoritative")

    def test_provider_key_is_uploaded_not_exposed_in_exec_arguments(self) -> None:
        secret = "benchmark-secret-never-in-command"

        class Environment:
            def __init__(self) -> None:
                self.uploads: dict[str, bytes] = {}
                self.command = ""
                self.env: dict[str, str] = {}

            async def upload_file(self, local: Path, remote: str) -> None:
                self.uploads[remote] = local.read_bytes()

            async def exec(self, *, command: str, env: dict[str, str], timeout_sec: int):
                self.command = command
                self.env = env
                return SimpleNamespace(return_code=0, stdout="", stderr="")

        environment = Environment()
        agent = InterferenceAgent(
            logs_dir=self.root / "logs",
            model_name="deepseek/deepseek-v4-pro",
            interference_tarball=str(self.archive),
            interference_sha256=self.digest,
            extra_env={"DEEPSEEK_API_KEY": secret},
        )

        asyncio.run(agent.run("safe instruction", environment, AgentContext()))

        self.assertIn(b"benchmark-secret", b"".join(environment.uploads.values()))
        self.assertNotIn(secret, environment.command)
        self.assertNotIn(secret, json.dumps(environment.env))
        self.assertIn("$(cat /tmp/.behaviorbench-deepseek-key)", environment.command)


if __name__ == "__main__":
    unittest.main()
