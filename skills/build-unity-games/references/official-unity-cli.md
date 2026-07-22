# Official Unity CLI and Pipeline

Research snapshot: 2026-07-22. The Unity CLI and `com.unity.pipeline` are experimental; verify every command against the installed binary and package.

## Contents

- [Choose the correct command surface](#choose-the-correct-command-surface)
- [Inspect before changing the machine](#inspect-before-changing-the-machine)
- [Install and authenticate](#install-and-authenticate)
- [Manage Editors and projects](#manage-editors-and-projects)
- [Control a running Editor](#control-a-running-editor)
- [Test and build](#test-and-build)
- [Automation contract](#automation-contract)
- [Security boundaries](#security-boundaries)
- [Editor fallback](#editor-fallback)
- [Official sources](#official-sources)

## Choose the Correct Command Surface

Unity now has three related command surfaces:

| Surface | Use it for |
| --- | --- |
| Standalone `unity` CLI | Editors, modules, projects, templates, authentication, diagnostics, tests, builds, and launching. |
| `com.unity.pipeline` | Local HTTP control of a running Unity Editor or opted-in development Player. |
| Unity Editor executable | Established batch-mode, `-executeMethod`, test-runner, and build arguments when the new CLI is absent or insufficient. |

Do not confuse the standalone CLI with the deprecated Unity Hub headless syntax or with the separate Unity Gaming Services CLI.

The public CLI beta began at `0.1.0-beta.1` in April 2026. Later beta releases added project creation, diagnostics, structured envelopes, `run`, `build`, Pipeline installation, command discovery, live evaluation, license management, and `test`. Documentation can lag the binary, so `unity --help` is the command contract for the installed release.

## Inspect Before Changing the Machine

Run read-only discovery first:

```bash
command -v unity
unity --version
unity --help
unity editors --installed --format json
unity projects --help
unity build --help
unity test --help
unity pipeline --help
unity command --help
unity doctor --format json
```

Commands added in a recent beta might use an alias or appear only in local help. If a command is absent, do not guess its spelling; use the Editor fallback or ask before changing the installed CLI channel.

## Install and Authenticate

Installing the CLI changes the user's machine and must be authorized. Unity's official macOS/Linux beta installer is:

```bash
curl -fsSL https://public-cdn.cloud.unity3d.com/hub/prod/cli/install.sh \
  | UNITY_CLI_CHANNEL=beta bash
```

After installation, restart the shell and verify `unity --version`. Use `unity upgrade` only after reviewing `unity upgrade --help` and obtaining approval for the update.

Interactive authentication uses a browser flow:

```bash
unity auth login
unity auth status --format json
unity license status --format json
```

For CI, Unity supports service-account environment variables. Never print, persist, commit, or place those secrets in command arguments. Personal or serial-license activation can require a user-owned browser, credential, or license decision; report it rather than fabricating success.

## Manage Editors and Projects

Inspect the release-specific help, then use structured output:

```bash
unity releases --format json
unity editors --installed --format json
unity editors info 6000.5.4f1 --format json
unity modules list 6000.5.4f1 --format json
unity templates list --format json
unity projects --help
```

Typical operations include:

```bash
unity install lts -m ios webgl
unity editors add /path/to/Unity.app
unity editors default 6000.5.4f1
unity projects new Demo --template <template-id> --editor-version 6000.5.4f1
unity open /path/to/Demo
```

The beta has exposed both `projects create` and `projects new` forms over time. Choose only the form shown by installed help. Use `--dry-run`, `--non-interactive`, `--yes`, and license-acceptance flags only when the command documents them and the user authorized the operation.

Never silently upgrade an existing project. Before `projects upgrade`, preserve a clean Git state, inspect package compatibility, and require an explicit target version.

## Control a Running Editor

Pipeline requires Unity Editor 6.0 or newer and the standalone CLI. Install the package only after approval:

```bash
unity pipeline install --project-path /path/to/project
unity pipeline list --format json
unity status --format json
unity command --format json
```

The running Editor advertises available commands. Discover them instead of hardcoding a global command list. Custom static C# methods can be exposed with Pipeline command and argument attributes from the installed package; inspect that package's API before writing attributes because it is experimental.

Recent releases document live evaluation in both top-level and command-scoped forms. Use the spelling reported by local help:

```bash
unity eval 'return UnityEngine.Application.unityVersion;' --format json
unity command eval 'return UnityEditor.EditorApplication.isPlaying;' --format json
unity command eval_file /path/to/inspection.cs --format json
```

Use live evaluation to query state, toggle Play mode, invoke a narrow Editor API, or prototype an operation. Put repeatable project mutations into reviewed, idempotent Editor code or a custom command so they remain testable and versioned.

## Test and Build

The current beta provides high-level commands, but options are release-specific:

```bash
unity test /path/to/project --help
unity test /path/to/project --mode editmode --output artifacts/editmode.xml
unity test /path/to/project --mode playmode --output artifacts/playmode.xml
unity build /path/to/project --help
```

`unity test` can select mode, filter, Editor version or path, architecture, install behavior, timeout, and NUnit XML output. The beta documents exit code `6` when test execution completes with failing tests.

`unity build` supports platform-specific options and rejects a dirty working tree unless the installed release allows and receives an explicit dirty-build override. Keep signing secrets out of arguments. Use a project-owned build script when the build requires deterministic scenes, versioning, preflight checks, or platform customization.

## Automation Contract

- Request `--format json` for bounded structured results and NDJSON only for supported streaming commands.
- Treat stdout as data and stderr as diagnostics.
- Core documented exit codes are `0` for success, `1` for general failure, and `130` for cancellation; handle documented command-specific codes such as test failure separately.
- Do not parse animated human progress output. Piped output can default to TSV.
- Apply explicit timeouts to status, test, build, and live-command calls.
- Validate `success`, `errors`, and `warnings` fields rather than relying only on the process exit code when the release emits a structured envelope.

## Security Boundaries

- Pipeline and live evaluation execute code inside the Editor process, on the main thread, with the Editor's filesystem and project access.
- Keep access token-gated and localhost-only. Do not expose the local HTTP API to an untrusted network.
- Enable Player control only in development or QA builds, never a production build.
- Inspect a proposed `eval` payload before execution. Prefer read-only expressions; require scoped authorization for destructive asset, project, license, installation, or source-control operations.
- Do not pass credentials, signing passwords, license serials, or tokens in shell arguments, logs, source files, screenshots, or generated reports.

## Editor Fallback

On macOS the Editor executable is normally:

```text
/Applications/Unity/Hub/Editor/<version>/Unity.app/Contents/MacOS/Unity
```

Use the exact version from `ProjectSettings/ProjectVersion.txt`. Established automation uses combinations of:

```text
-projectPath <path>
-batchmode
-quit
-logFile <path>
-executeMethod Namespace.Type.Method
-runTests
-testPlatform EditMode|PlayMode
-testResults <path>
-buildTarget <target>
-activeBuildProfile <asset-path>
-build <output-path>
```

Do not assume one process can build multiple targets: target switches trigger assembly reloads and require separate Editor invocations.

## Official Sources

- [Unity CLI introduction](https://docs.unity.com/en-us/unity-cli)
- [Use the Unity CLI](https://docs.unity.com/en-us/hub/use-unity-cli)
- [Unity CLI reference](https://docs.unity.com/en-us/unity-cli/unity-cli-reference)
- [Unity CLI release notes](https://docs.unity.com/en-us/unity-cli/release-notes)
- [Meet the Unity CLI](https://unity.com/blog/meet-the-unity-cli)
- [Unity Pipeline package](https://docs.unity.com/en-us/unity-production-pipeline/local-tools-cli/unity-pipeline-package)
- [Unity Pipeline architecture](https://docs.unity.com/en-us/unity-production-pipeline/overview)
- [Unity Editor command-line arguments](https://docs.unity3d.com/6000.5/Documentation/Manual/EditorCommandLineArguments.html)
