"""Deterministic Harbor agent used only to smoke-test BehaviorBench plumbing."""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import override

from harbor.agents.installed.base import BaseInstalledAgent
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.context import AgentContext


class BehaviorBenchFakeAgent(BaseInstalledAgent):
    """Exercise execution, artifact collection and scoring without a paid LLM."""

    RAW_TRAJECTORY = "interference-trajectory.json"

    @staticmethod
    @override
    def name() -> str:
        return "behaviorbench-fake"

    @override
    async def install(self, environment: BaseEnvironment) -> None:
        return None

    @override
    async def run(
        self,
        instruction: str,
        environment: BaseEnvironment,
        context: AgentContext,
    ) -> None:
        if not instruction.startswith("Change settings.txt from color=blue"):
            raise ValueError("The fake agent supports only the trivial config smoke task")

        result = await environment.exec(
            command=(
                "printf 'color=green\\n' > settings.txt && "
                "test \"$(cat settings.txt)\" = color=green"
            ),
            cwd="/workspace",
            timeout_sec=30,
        )
        if result.return_code != 0:
            raise RuntimeError("BehaviorBench fake mutation or validation failed")

        trajectory = {
            "schemaVersion": 1,
            "runId": self.session_id or "behaviorbench-fake",
            "taskId": "02-trivial-config-edit",
            "treatment": "fake",
            "provider": "offline",
            "model": "deterministic",
            "thinking": "none",
            "startedAt": "2026-07-18T00:00:00.000Z",
            "finishedAt": "2026-07-18T00:00:00.001Z",
            "outcome": "completed",
            "finalAnswer": "Updated settings.txt and validated its exact content.",
            "tools": [
                {
                    "type": "tool-call",
                    "toolCallId": "write-1",
                    "toolName": "write",
                    "subject": "settings.txt",
                    "kind": "mutation",
                },
                {
                    "type": "tool-result",
                    "toolCallId": "write-1",
                    "toolName": "write",
                    "outcome": "succeeded",
                },
                {
                    "type": "tool-call",
                    "toolCallId": "validate-1",
                    "toolName": "exec",
                    "subject": "test",
                    "kind": "validation",
                },
                {
                    "type": "tool-result",
                    "toolCallId": "validate-1",
                    "toolName": "exec",
                    "outcome": "succeeded",
                    "exitCode": 0,
                },
            ],
            "skills": {"matched": [], "agenticSelected": []},
            "usage": {"input": 0, "output": 0, "cacheRead": 0, "costUsd": 0},
            "durationMs": 1,
        }
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as handle:
            json.dump(trajectory, handle)
            local_trajectory = Path(handle.name)
        try:
            await environment.upload_file(
                local_trajectory,
                f"/logs/agent/{self.RAW_TRAJECTORY}",
            )
        finally:
            local_trajectory.unlink(missing_ok=True)
