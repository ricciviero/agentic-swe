"""Harbor installed-agent adapter for Interference headless mode.

The adapter intentionally contains no behavior policy. Both experimental arms use
this class and differ only by the validated ``treatment`` constructor argument.
"""

from __future__ import annotations

import hashlib
import json
import os
import shlex
import tempfile
from pathlib import Path
from typing import Any, override

from harbor.agents.installed.base import BaseInstalledAgent
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.context import AgentContext
from harbor.models.trajectories import (
    Agent,
    FinalMetrics,
    Metrics,
    Observation,
    ObservationResult,
    Step,
    ToolCall,
    Trajectory,
)


class InterferenceAgent(BaseInstalledAgent):
    """Run a pinned local Interference tarball in one-shot mode."""

    SUPPORTS_ATIF = True
    RAW_TRAJECTORY = "interference-trajectory.json"
    ATIF_TRAJECTORY = "trajectory.json"

    def __init__(
        self,
        *args: Any,
        treatment: str = "authoritative",
        interference_tarball: str | None = None,
        interference_sha256: str | None = None,
        reasoning_effort: str = "max",
        max_cost_usd: str | float = "0.25",
        max_output_tokens: str | int = "16000",
        max_steps: str | int = "40",
        max_continuations: str | int = "8",
        **kwargs: Any,
    ) -> None:
        if treatment not in {"legacy", "authoritative"}:
            raise ValueError("treatment must be legacy or authoritative")
        if reasoning_effort != "max":
            raise ValueError("BehaviorBench requires reasoning_effort=max")
        if not interference_tarball:
            raise ValueError("interference_tarball is required")
        self.treatment = treatment
        self.interference_tarball = Path(interference_tarball).expanduser().resolve()
        if not self.interference_tarball.is_file():
            raise FileNotFoundError(self.interference_tarball)
        self.interference_sha256 = interference_sha256
        self.reasoning_effort = reasoning_effort
        self.max_cost_usd = float(max_cost_usd)
        self.max_output_tokens = int(max_output_tokens)
        self.max_steps = int(max_steps)
        self.max_continuations = int(max_continuations)
        if min(self.max_cost_usd, self.max_output_tokens, self.max_steps, self.max_continuations) <= 0:
            raise ValueError("budget and execution limits must be positive")
        self._verify_tarball()
        super().__init__(*args, **kwargs)

    @staticmethod
    @override
    def name() -> str:
        return "interference"

    def _verify_tarball(self) -> None:
        digest = hashlib.sha256(self.interference_tarball.read_bytes()).hexdigest()
        if self.interference_sha256 and digest != self.interference_sha256:
            raise ValueError(
                f"Interference tarball digest mismatch: expected {self.interference_sha256}, got {digest}"
            )
        self.interference_sha256 = digest

    @override
    async def install(self, environment: BaseEnvironment) -> None:
        remote_tarball = "/tmp/interference-agent.tgz"
        await environment.upload_file(self.interference_tarball, remote_tarball)
        await self.exec_as_root(
            environment,
            command=(
                "set -euo pipefail; "
                "export PATH=/root/.bun/bin:$PATH; "
                f"bun add --global {shlex.quote(remote_tarball)}; "
                "interference --version"
            ),
        )

    def _model(self) -> tuple[str, str]:
        if self.model_name != "deepseek/deepseek-v4-pro":
            raise ValueError(
                "BehaviorBench model must be exactly deepseek/deepseek-v4-pro"
            )
        return "deepseek", "deepseek-v4-pro"

    @override
    async def run(
        self,
        instruction: str,
        environment: BaseEnvironment,
        context: AgentContext,
    ) -> None:
        provider, model = self._model()
        api_key = self._get_env("DEEPSEEK_API_KEY")
        if not api_key:
            raise ValueError("DEEPSEEK_API_KEY is required")

        with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as handle:
            handle.write(api_key)
            local_key = Path(handle.name)
        try:
            remote_key = "/tmp/.behaviorbench-deepseek-key"
            await environment.upload_file(local_key, remote_key)
        finally:
            local_key.unlink(missing_ok=True)

        instruction_digest = hashlib.sha256(instruction.encode()).hexdigest()
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as handle:
            handle.write(instruction)
            local_prompt = Path(handle.name)
        try:
            remote_prompt = "/tmp/behaviorbench-instruction.md"
            await environment.upload_file(local_prompt, remote_prompt)
        finally:
            local_prompt.unlink(missing_ok=True)

        raw_path = f"/logs/agent/{self.RAW_TRAJECTORY}"
        command = " ".join(
            [
                "export PATH=/root/.bun/bin:$PATH;",
                f"export DEEPSEEK_API_KEY=\"$(cat {shlex.quote(remote_key)})\";",
                f"rm -f {shlex.quote(remote_key)};",
                "interference",
                "--headless",
                "--prompt-file", shlex.quote(remote_prompt),
                "--output-json", shlex.quote(raw_path),
                "--treatment", self.treatment,
                "--provider", provider,
                "--model", model,
                "--thinking", self.reasoning_effort,
                "--max-cost-usd", str(self.max_cost_usd),
                "--max-output-tokens", str(self.max_output_tokens),
                "--timeout-ms", "840000",
                "--run-id", shlex.quote(self.session_id or instruction_digest[:20]),
                "--task-id", instruction_digest[:20],
            ]
        )
        result = await environment.exec(
            command=command,
            env={
                "INTERFERENCE_HOME": "/tmp/interference-home",
                "INTERFERENCE_MAX_STEPS": str(self.max_steps),
                "INTERFERENCE_MAX_CONTINUATIONS": str(self.max_continuations),
            },
            timeout_sec=870,
        )
        # Exit 3 is an observed user/permission refusal and remains a valid trial
        # for the verifier. Provider/harness/budget failures are not collapsed into 0.
        if result.return_code not in {0, 3}:
            raise RuntimeError(
                f"Interference headless failed with exit {result.return_code}: "
                f"{(result.stderr or result.stdout or 'no output')[:1000]}"
            )

    def _to_atif(self, raw: dict[str, Any]) -> Trajectory:
        steps: list[Step] = [
            Step(
                step_id=1,
                timestamp=raw.get("startedAt"),
                source="user",
                message=(
                    "[instruction omitted; sha256="
                    + hashlib.sha256((raw.get("taskId") or "unknown").encode()).hexdigest()
                    + "]"
                ),
            )
        ]
        pending: dict[str, dict[str, Any]] = {}
        for event in raw.get("tools") or []:
            if event.get("type") == "tool-call":
                pending[event["toolCallId"]] = event
                continue
            call = pending.pop(event.get("toolCallId"), None)
            tool_name = (call or event).get("toolName", "unknown")
            call_id = event.get("toolCallId", f"unpaired-{len(steps)}")
            arguments = {
                key: value
                for key, value in {
                    "subject": (call or {}).get("subject"),
                    "kind": (call or {}).get("kind"),
                }.items()
                if value is not None
            }
            steps.append(
                Step(
                    step_id=len(steps) + 1,
                    source="agent",
                    model_name=raw.get("model"),
                    reasoning_effort=raw.get("thinking"),
                    message="",
                    tool_calls=[
                        ToolCall(
                            tool_call_id=call_id,
                            function_name=tool_name,
                            arguments=arguments,
                        )
                    ],
                    observation=Observation(
                        results=[
                            ObservationResult(
                                source_call_id=call_id,
                                content=event.get("outcome", "unknown"),
                                extra={
                                    key: value
                                    for key, value in {
                                        "exit_code": event.get("exitCode"),
                                    }.items()
                                    if value is not None
                                }
                                or None,
                            )
                        ]
                    ),
                    llm_call_count=1,
                )
            )
        usage = raw.get("usage") or {}
        steps.append(
            Step(
                step_id=len(steps) + 1,
                timestamp=raw.get("finishedAt"),
                source="agent",
                model_name=raw.get("model"),
                reasoning_effort=raw.get("thinking"),
                message=raw.get("finalAnswer") or f"[{raw.get('outcome', 'unknown')}]",
                metrics=Metrics(
                    prompt_tokens=(usage.get("input") or 0) + (usage.get("classifierInputTokens") or 0),
                    completion_tokens=(usage.get("output") or 0) + (usage.get("classifierOutputTokens") or 0),
                    cached_tokens=usage.get("cacheRead") or 0,
                    cost_usd=usage.get("costUsd") or 0,
                ),
                llm_call_count=1,
            )
        )
        return Trajectory(
            schema_version="ATIF-v1.7",
            session_id=raw.get("runId"),
            trajectory_id=f"interference-{raw.get('runId', 'unknown')}",
            agent=Agent(
                name="interference",
                version=raw.get("interferenceVersion", "unknown"),
                model_name=raw.get("model"),
                extra={
                    "treatment": raw.get("treatment"),
                    "artifact_sha256": self.interference_sha256,
                    "native_trajectory": self.RAW_TRAJECTORY,
                },
            ),
            steps=steps,
            notes="Converted from the redacted Interference headless trajectory; reasoning is intentionally omitted.",
            final_metrics=FinalMetrics(
                total_prompt_tokens=(usage.get("input") or 0) + (usage.get("classifierInputTokens") or 0),
                total_completion_tokens=(usage.get("output") or 0) + (usage.get("classifierOutputTokens") or 0),
                total_cached_tokens=usage.get("cacheRead") or 0,
                total_cost_usd=usage.get("costUsd") or 0,
                total_steps=len(steps),
                extra={
                    "duration_ms": raw.get("durationMs", 0),
                    "outcome": raw.get("outcome"),
                },
            ),
        )

    @override
    def populate_context_post_run(self, context: AgentContext) -> None:
        raw_path = self.logs_dir / self.RAW_TRAJECTORY
        if not raw_path.exists():
            return
        raw = json.loads(raw_path.read_text())
        usage = raw.get("usage") or {}
        context.n_input_tokens = (usage.get("input") or 0) + (usage.get("classifierInputTokens") or 0)
        context.n_cache_tokens = usage.get("cacheRead") or 0
        context.n_output_tokens = (usage.get("output") or 0) + (usage.get("classifierOutputTokens") or 0)
        context.cost_usd = usage.get("costUsd") or 0
        context.metadata = {
            "treatment": raw.get("treatment"),
            "outcome": raw.get("outcome"),
            "interference_trajectory": self.RAW_TRAJECTORY,
            "artifact_sha256": self.interference_sha256,
        }
        atif = self._to_atif(raw)
        (self.logs_dir / self.ATIF_TRAJECTORY).write_text(
            json.dumps(atif.to_json_dict(), indent=2) + "\n"
        )
