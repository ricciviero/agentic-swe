# Unity Project Architecture

Use these defaults for small games and vertical slices. Preserve stronger conventions already present in an existing project.

## Contents

- [Project shape](#project-shape)
- [Assembly boundaries](#assembly-boundaries)
- [Gameplay code](#gameplay-code)
- [Input, timing, and physics](#input-timing-and-physics)
- [Data and state](#data-and-state)
- [Scenes, prefabs, and Editor automation](#scenes-prefabs-and-editor-automation)
- [UI and game flow](#ui-and-game-flow)
- [Version control and assets](#version-control-and-assets)
- [Playable-slice checklist](#playable-slice-checklist)
- [Official sources](#official-sources)

## Project Shape

Keep a small demo navigable without building an enterprise framework:

```text
Assets/Game/
├── Art/
├── Audio/
├── Input/
├── Prefabs/
├── Scenes/
├── Settings/
├── Scripts/
│   ├── Runtime/
│   └── Editor/
└── Tests/
    ├── EditMode/
    └── PlayMode/
```

Organize by feature below `Runtime/` when the project grows, for example `Player/`, `Enemies/`, `Scoring/`, and `GameFlow/`. Do not create folders that remain empty or architecture layers with only one pass-through class.

Read the active packages and render pipeline before importing or generating content. Do not mix Built-in, URP, and HDRP shaders or materials casually.

## Assembly Boundaries

Use assembly definitions when they improve compile isolation and enforce a real boundary:

```text
Game.Runtime        -> Unity runtime and pinned package assemblies
Game.Editor         -> Game.Runtime + UnityEditor; editor platforms only
Game.EditModeTests  -> Game.Runtime; test assembly; editor only
Game.PlayModeTests  -> Game.Runtime; test assembly
```

Keep `UnityEditor` types out of player assemblies. Reference assemblies explicitly and avoid cyclic dependencies. For a tiny one-scene experiment, a single runtime assembly plus test assemblies is enough.

## Gameplay Code

- Put deterministic rules in plain C# types that can run without a scene.
- Treat `MonoBehaviour` as an adapter for lifecycle, input, physics, animation, audio, rendering, and serialized references.
- Keep components cohesive: movement, health, scoring, spawning, and game flow should not collapse into one large controller.
- Prefer `[SerializeField] private` fields or properties over public mutable fields. Validate authoring constraints in `OnValidate` where useful.
- Subscribe in `OnEnable` and unsubscribe in `OnDisable`. Clean up created objects, callbacks, and cancellation sources.
- Cache required component references. Use `GetComponent` during initialization when appropriate; do not call object-wide searches every frame.
- Fail clearly on missing required references in development instead of silently inventing fallback objects that hide broken scene wiring.
- Use interfaces or C# events at feature boundaries. Avoid a global event bus or service locator for a small demo.

## Input, Timing, and Physics

- Use logical Input System actions and the action asset already pinned by the project.
- Prefer generated action wrappers or explicit `InputActionReference`/`PlayerInput` integration over stringly typed messages.
- Support the target control schemes defined by the demo, normally keyboard/mouse plus gamepad for desktop unless scope says otherwise.
- Sample user intent in `Update`. Apply Rigidbody movement, forces, and physics-dependent state in `FixedUpdate`.
- Scale continuous non-physics motion by `Time.deltaTime`; do not scale impulses or already time-based APIs twice.
- Keep gameplay rules independent from raw devices so tests can drive commands directly. Use Input System test fixtures only for binding or device integration behavior.
- Pause intentionally: decide which systems follow scaled time and which use unscaled time.

## Data and State

Use `ScriptableObject` for shared authored configuration such as tuning, waves, item definitions, or audio catalogs. Use plain serializable data or a dedicated persistence layer for mutable save data.

Model the game flow explicitly, for example:

```text
Boot -> Ready -> Playing -> Won/Lost -> Restarting
```

Keep score, remaining time, and terminal state owned by one clear runtime authority. Make restart deterministic by resetting or recreating state instead of relying on scene leftovers.

Avoid singletons unless the object's lifetime and uniqueness are genuine project requirements. Do not persist scene references across loads accidentally.

## Scenes, Prefabs, and Editor Automation

For agent-driven work, create an idempotent Editor bootstrap operation that can:

1. create required folders and assets if absent;
2. create or open the target scene;
3. create materials and configuration assets;
4. create or update prefabs;
5. place and wire scene instances through serialized properties;
6. configure camera, lighting, input, UI, and game flow;
7. add scenes to the active build profile;
8. save assets and the scene;
9. validate that a second run produces no duplicate objects or unstable references.

Use `AssetDatabase` for project assets, `PrefabUtility` for prefabs, `EditorSceneManager` for scenes, and `SerializedObject`/`SerializedProperty` for serialized wiring. Use `Undo` and mark objects dirty for interactive tools. Save assets explicitly after script-driven Edit Mode changes.

Prefer project-owned Editor code or a narrow Pipeline command over repeated opaque live-evaluation payloads. Keep custom automation static, deterministic, bounded, and explicit about its target scene or asset paths.

Do not manually generate `.meta` GUIDs or copy a scene/prefab without its metadata. Avoid direct YAML edits because file IDs, object references, importer state, and serialization format can change.

## UI and Game Flow

A playable demo needs more than the central mechanic:

- visible objective or controls;
- score/progress when relevant;
- pause or exit path;
- win/lose feedback;
- restart path;
- clear focus and input behavior;
- readable layout at the target aspect ratios;
- no critical information conveyed only by color.

Use the UI system already present. Keep UI presentation subscribed to game state rather than owning core rules. Test transitions and button wiring in Play Mode.

## Version Control and Assets

Commit:

- `Assets/` and every associated `.meta` file;
- `Packages/manifest.json` and `Packages/packages-lock.json`;
- `ProjectSettings/`;
- source-controlled build profiles and project-owned settings.

Ignore generated or local state such as `Library/`, `Temp/`, `Obj/`, `Logs/`, `UserSettings/`, IDE caches, and build output. Use Git LFS for large binary assets when the repository adopts it.

Set visible meta files and force text serialization for collaborative Git workflows. Never discard a `.meta` file while retaining the asset, because its GUID anchors serialized references.

Start prototypes with Unity primitives, procedural materials, and original or compatibly licensed content. Record licenses and notices before adding third-party art, fonts, audio, shaders, packages, or Asset Store content.

## Playable-Slice Checklist

- The game starts into a valid scene without Console errors.
- Controls work on the stated devices.
- The player can understand the goal without developer explanation.
- The core interaction produces visible and audible feedback appropriate to scope.
- Success, failure, and restart paths work repeatedly.
- No required object or serialized reference is missing.
- The scene is present in the build profile.
- Tests cover deterministic rules and critical scene behavior.
- A player build launches and completes the same loop as the Editor.

## Official Sources

- [Assembly definitions](https://docs.unity3d.com/6000.5/Documentation/Manual/assembly-definitions-intro.html)
- [ScriptableObject](https://docs.unity3d.com/6000.5/Documentation/Manual/class-ScriptableObject.html)
- [Input System package](https://docs.unity3d.com/6000.5/Documentation/Manual/com.unity.inputsystem.html)
- [Prefabs](https://docs.unity3d.com/6000.5/Documentation/Manual/Prefabs.html)
- [Version control](https://docs.unity3d.com/6000.5/Documentation/Manual/VersionControl.html)
- [Version control settings](https://docs.unity3d.com/6000.5/Documentation/Manual/class-VersionControlSettings.html)
- [Unity Pipeline package](https://docs.unity.com/en-us/unity-production-pipeline/local-tools-cli/unity-pipeline-package)
