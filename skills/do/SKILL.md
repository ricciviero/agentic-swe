---
name: do
description: Execute a phased implementation plan in Codex. Use when the user asks to execute, run, carry out, or implement an existing plan, especially a plan created by make-plan.
---

# Do Plan

Execute a phased plan end to end while preserving the project's rules and the user's worktree.

## Codex Constraints

- Execute local work only on the fixed existing branch designated by the user or repository policy. Do not assume its name or select a new branch for each phase; ask before editing if the choice is unknown or ambiguous.
- Never create local/remote branches, including temporary PR/worktree branches, without a specific user instruction. A generic instruction to execute the plan, commit, push, or release is not branch-creation authority. Preserve dirty work and branch protections; do not use detached HEAD or another branch as a workaround.
- Do not spawn subagents unless the user explicitly asked for sub-agents, delegation, or parallel agent work.
- If subagents are allowed, give them bounded, independent tasks with disjoint write scopes.
- Do not overwrite unrelated user changes. Inspect `git status` before editing and work around existing changes.
- Use `apply_patch` for manual edits. Use formatting or generation commands only when they match the repo's workflow.

## Execution Protocol

1. Read the plan and identify blockers, assumptions, and phases.
2. Re-read relevant project instructions (`CLAUDE.md`, `AGENTS.md`, local skill files, memory files) before touching code.
3. For each phase:
   - Inspect the existing implementation and tests.
   - Make the smallest coherent code change.
   - Add or update tests required by the project.
   - Run the phase's verification commands, or explain why they cannot run.
   - Search for the same bug or pattern elsewhere before closing a fix.
4. Do not advance past a failed phase unless the failure is understood and either fixed or clearly outside scope.
5. After all phases, run final verification and summarize changed files and residual risks.

## Verification

Prefer project-native commands. Examples:

- Backend: Maven/Gradle tests, profile-specific E2E tests, migrations validation.
- Frontend: typecheck, lint, unit tests, Playwright where required.
- General: `rg` checks for removed or forbidden patterns.

## Final Response

Report what was implemented, where, and what verification passed. If something could not be verified, state the exact command and reason.
