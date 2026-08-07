---
name: build-unity-games
description: Build, modify, automate, test, run, and package Unity games with C# and minimal manual Editor work. Use for Unity projects, gameplay systems, MonoBehaviours, ScriptableObjects, scenes, prefabs, Input System, physics, UI, Editor tooling, the official Unity CLI, the Unity Pipeline package, Edit Mode or Play Mode tests, player builds, and agent-driven Unity demo development.
---

# Build Unity Games

Own the Unity implementation loop from repository discovery through a playable, verified build. Prefer code and deterministic Editor automation over asking the user to wire scenes or Inspector fields by hand.

## Load References

- Read [official-unity-cli.md](references/official-unity-cli.md) before installing or invoking the experimental Unity CLI or `com.unity.pipeline`.
- Read [project-architecture.md](references/project-architecture.md) when creating a project, feature, scene, prefab, or gameplay system.
- Read [testing-and-builds.md](references/testing-and-builds.md) before defining validation or reporting a Unity task complete.

## Discover the Environment

1. Find the Unity project root by locating `Assets/`, `Packages/`, and `ProjectSettings/`.
2. Read `ProjectSettings/ProjectVersion.txt`, `Packages/manifest.json`, existing assembly definitions, scenes, build profiles, tests, repository instructions, and Git status.
3. Inspect the installed CLI with `unity --version`, `unity --help`, and command-level `--help`. Treat installed help as authoritative because the CLI is experimental.
4. If `unity` is unavailable, locate the matching Editor executable and use supported Editor command-line arguments. Do not install or upgrade the CLI, Hub, Editor, modules, packages, or licenses without user authorization.
5. Detect a running Editor and the project it owns before starting a batch process. Do not open the same project concurrently in multiple Editor processes.

## Define the Playable Slice

Turn an underspecified demo request into one small, complete loop:

- one player verb;
- one objective;
- one success or score condition;
- one failure or pressure condition when the concept needs it;
- restart and exit paths;
- explicit target platform and controls;
- a coherent placeholder visual and audio direction.

Choose reversible defaults when the user has not expressed a preference. Ask only for decisions that materially change the game concept, licensed content, target device, or delivery scope.

## Create or Adapt the Project

- Prefer the project's existing render pipeline, input stack, folder conventions, package pins, and supported Editor version.
- For a new project, select a built-in template that matches the intended 2D/3D/rendering target and record the exact Editor version.
- Keep package changes minimal and pin them through `Packages/manifest.json` and `Packages/packages-lock.json`.
- Configure text serialization and visible `.meta` files for Git. Commit source assets with their `.meta` files; exclude generated caches.
- Create a deterministic bootstrap scene and ensure every required scene is included in the active build profile.

## Implement for Agent Ownership

- Keep rules, scoring, progression, and calculations in plain C# where practical. Keep `MonoBehaviour` components focused on Unity lifecycle and scene integration.
- Use private serialized fields, explicit references, small interfaces, and constructor or initializer injection for non-Unity services. Avoid hidden mutable global state.
- Use the Input System already pinned by the project. Model actions such as Move, Jump, Interact, Pause, and Restart instead of scattering physical-key checks.
- Read frame input in `Update`; apply `Rigidbody` physics in `FixedUpdate`. Scale continuous non-physics motion by elapsed time.
- Use `ScriptableObject` assets for shared authored configuration, not as an implicit runtime save system.
- Separate runtime, Editor, and test code. Runtime assemblies must not depend on `UnityEditor`.
- Avoid per-frame object searches, string-based wiring, silent missing-reference fallbacks, and premature framework layers.

## Automate Scenes and Assets

- Do not hand-edit Unity YAML for scenes, prefabs, materials, or serialized assets unless the change is a verified mechanical operation with stable IDs.
- Write idempotent Editor tooling under an Editor-only assembly to create or update scenes, prefabs, materials, input assets, configuration assets, and build settings.
- Prefer Unity APIs such as `AssetDatabase`, `PrefabUtility`, `EditorSceneManager`, `SerializedObject`, and build-profile APIs supported by the installed version.
- With Pipeline installed, expose repeatable project operations as narrowly scoped custom commands. Use live evaluation for inspection or one-off experiments, then move durable behavior into versioned code.
- Save and refresh assets explicitly, wait for compilation/import completion, and inspect Console errors after automation.

## Close the Loop

Run the smallest relevant loop after each coherent change, then the complete loop before delivery:

1. compile/import with zero unexpected errors;
2. Edit Mode tests for pure logic and Editor tooling;
3. Play Mode tests for lifecycle, scene wiring, physics, input, and UI flows;
4. build the intended player target;
5. launch the game or development Player and exercise the real gameplay loop;
6. inspect logs and, for visual work, capture and review actual rendered output.

Compilation or unit tests alone do not prove scene references, controls, physics, rendering, animation, audio, UI layout, or game feel. State precisely which Editor, Player, and visual checks actually ran.

## Delivery Rules

- Preserve user changes and generated asset identities. Never discard `.meta` files independently of their assets.
- Do not commit `Library/`, `Temp/`, `Obj/`, `Logs/`, local build output, credentials, license files, or machine-specific paths.
- Do not introduce Asset Store or third-party content without compatible licensing and preserved notices.
- Keep `eval`, custom Pipeline commands, and development-Player control local, scoped, and disabled in production builds.
- Report the Editor/CLI versions, changed scenes and packages, test results, build artifact, runtime evidence, visual-validation limits, and any unavoidable manual step.
