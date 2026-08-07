# Unity Testing and Builds

Use validation evidence that matches the changed surface. Unity compilation is necessary but not sufficient for a playable result.

## Contents

- [Validation layers](#validation-layers)
- [Test assemblies](#test-assemblies)
- [Run tests](#run-tests)
- [Build players](#build-players)
- [Runtime and visual smoke](#runtime-and-visual-smoke)
- [Failure diagnosis](#failure-diagnosis)
- [Completion evidence](#completion-evidence)
- [Official sources](#official-sources)

## Validation Layers

| Layer | Proves | Does not prove |
| --- | --- | --- |
| Compile/import | C# and assets import for the selected Editor/target | Scene wiring, gameplay, visuals, input |
| Edit Mode tests | Pure rules, data transformations, Editor tools | Runtime lifecycle, rendering, physics |
| Play Mode tests | Frames, scenes, components, coroutines, physics, UI | Subjective feel or final platform build |
| Player build | Target-specific compilation and packaging | The built game launches or plays correctly |
| Runtime smoke | Startup and real gameplay loop in a Player | Broad device coverage or visual polish |
| Visual review | Actual rendered state and layout | Hidden logic branches not exercised |

Select all layers affected by the change. A gameplay demo normally requires every row at least once before delivery.

## Test Assemblies

Keep Edit Mode and Play Mode tests in separate test assemblies:

- Edit Mode tests should exercise plain C# rules, configuration validation, content-generation utilities, and Editor automation.
- Play Mode tests should load the real scene or a minimal fixture and exercise lifecycle, input integration, collisions, scoring, game-state transitions, and UI wiring.
- Reference the runtime assembly explicitly. Add Editor references only to Edit Mode tests that need them.
- Prefer deterministic setup and teardown. Destroy created objects and restore modified project settings or scenes.
- Use `[Test]` for synchronous logic and `[UnityTest]` only when the test must advance frames or yield Unity operations.
- Assert expected logs and fail on unexpected errors. Do not hide Console errors merely to make tests green.

For physics tests, control positions, velocities, timeouts, and layers explicitly. For Input System integration, use the package test fixture and synthetic devices rather than a real keyboard or controller.

## Run Tests

Prefer the installed standalone CLI when its help exposes `test`:

```bash
unity test /path/to/project --mode editmode \
  --output /path/to/artifacts/editmode-results.xml

unity test /path/to/project --mode playmode \
  --output /path/to/artifacts/playmode-results.xml
```

Inspect `unity test --help` for exact mode names, filtering, timeout, Editor selection, architecture, and install behavior. Treat process failure, structured errors, missing result files, and NUnit failures as failures. Current beta release notes reserve exit code `6` for completed test runs with failing tests.

Fallback to the Editor executable:

```bash
"<unity-editor>" \
  -batchmode \
  -projectPath "/path/to/project" \
  -runTests \
  -testPlatform EditMode \
  -testResults "/path/to/artifacts/editmode-results.xml" \
  -logFile "/path/to/artifacts/editmode.log"
```

Run Play Mode separately with `-testPlatform PlayMode`. Use a timeout outside the Editor process. Inspect the XML and log even when the process returns success, because import, licensing, crash, or test-runner failures can prevent a complete result.

## Build Players

Prefer `unity build` only when installed help covers the required target and options. Record the exact command and artifact path. Do not pass signing passwords or license credentials in arguments.

Use established Editor arguments for a portable fallback:

```bash
"<unity-editor>" \
  -batchmode \
  -quit \
  -projectPath "/path/to/project" \
  -buildTarget StandaloneOSX \
  -build "/path/to/artifacts/Demo.app" \
  -logFile "/path/to/artifacts/build.log"
```

For non-trivial builds, create a static Editor build method that:

1. validates required scenes, packages, settings, and output path;
2. chooses an explicit build target or active build profile;
3. sets deterministic version information from an approved source;
4. calls the supported Unity build API;
5. checks the build summary result and reported errors;
6. throws or exits nonzero on anything except success.

Invoke custom methods with `-executeMethod Namespace.Type.Method`. Specify the target or build profile on the Editor command line; do not switch targets inside the same batch method and expect reloaded assemblies. Run a separate Editor process per target.

Keep build output outside `Assets/` and normally outside version control. A dirty-build override is an explicit exception, not a default.

## Runtime and Visual Smoke

After a successful build:

1. launch the development Player for the intended platform;
2. wait for a positive ready signal or inspect logs with a bounded timeout;
3. exercise the complete loop: start, control, objective, success/failure, restart, exit;
4. check for exceptions, missing shaders/materials, broken input, incorrect aspect ratio, and scene-order issues;
5. capture actual rendered output for any visual or UI claim;
6. compare the result with the requested behavior, not only with the implementation plan.

When the development Player opts into Pipeline runtime control, keep it localhost-only and use command discovery before invocation. Remove or disable the runtime component in production builds.

For visual validation, use a project-owned screenshot command or a supported Unity capture API, then inspect the image. A screenshot proves only the captured state; use multiple states for menus, gameplay, win/lose, responsive UI, or animation changes as appropriate.

Subjective game feel still benefits from the user's final playtest, but the agent must first complete every deterministic implementation and verification step it can perform itself.

## Failure Diagnosis

Use this order:

1. confirm Editor version and project version match;
2. confirm licensing/authentication status without exposing credentials;
3. inspect CLI stderr or structured errors;
4. inspect the full Editor log from the first compiler/import error;
5. confirm the project is not already locked by another Editor;
6. confirm required modules and target support are installed;
7. confirm tests produced a complete XML result;
8. reproduce in the Editor only when batch evidence is insufficient;
9. rerun the narrowest failed layer after correction, then rerun the complete affected chain.

Do not delete `Library/` as a reflex. Cache deletion is expensive and can hide the actual package, import, or serialization problem; use it only after evidence points to corrupted generated state.

## Completion Evidence

Report:

- project and Editor versions;
- standalone CLI and Pipeline versions when used;
- package changes;
- Edit Mode and Play Mode counts and result files;
- build command, target, result, and artifact path;
- runtime scenario exercised and observed result;
- screenshots or direct visual inspection performed;
- warnings accepted with reasons;
- checks not run and the exact blocker.

Never report “playable,” “tested,” or “looks correct” from source inspection alone.

## Official Sources

- [Unity Test Framework introduction](https://docs.unity3d.com/6000.5/Documentation/Manual/test-framework/test-framework-introduction.html)
- [Edit Mode and Play Mode tests](https://docs.unity3d.com/6000.5/Documentation/Manual/test-framework/edit-mode-vs-play-mode-tests.html)
- [Create a test assembly](https://docs.unity3d.com/6000.5/Documentation/Manual/test-framework/workflow-create-test-assembly.html)
- [Run tests from the command line](https://docs.unity3d.com/6000.5/Documentation/Manual/test-framework/run-tests-from-command-line.html)
- [Build a player from the command line](https://docs.unity3d.com/6000.5/Documentation/Manual/build-command-line.html)
- [Unity Editor command-line arguments](https://docs.unity3d.com/6000.5/Documentation/Manual/EditorCommandLineArguments.html)
- [Unity CLI release notes](https://docs.unity.com/en-us/unity-cli/release-notes)
- [Unity Pipeline package](https://docs.unity.com/en-us/unity-production-pipeline/local-tools-cli/unity-pipeline-package)
