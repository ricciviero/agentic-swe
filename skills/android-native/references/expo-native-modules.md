# Kotlin Modules in Expo and React Native

## Pick the Smallest Native Surface

Check maintained SDK modules and @expo/ui/jetpack-compose first. Use a local Expo module when a missing Android capability actually requires Kotlin. Existing manually maintained React Native modules may follow their established architecture; do not migrate them as a side effect.

Define the TypeScript contract, supported platforms, result/error shapes, lifecycle, and permission ownership before implementing the module. Keep native code concerned with the platform capability and shared business rules in the owning application layer.

## Generated Project Ownership

For CNG projects, use a local module and config plugin for durable native behavior/configuration. Do not hand-edit generated android/ files as the only source of a permission, dependency, or manifest entry. Read the selected SDK's regeneration behavior and preserve any manual changes before prebuild.

For manually maintained native projects, use the project's module/package registration and Gradle conventions. Preserve variants, namespaces, signing, and dependency management.

## Module Lifecycle and Threading

- Use the supported Expo Modules API or existing native module architecture; verify current async function, view, and event APIs for the installed version.
- Run UI work on the appropriate UI thread and avoid blocking JavaScript or the UI thread with I/O.
- Own subscriptions/resources explicitly. Release listeners, sensors, callbacks, and references when the module/view or owning lifecycle ends.
- Handle missing/destroyed activity/context and permission denial as expected outcomes. Avoid retaining an Activity across recreation.
- Define asynchronous cancellation/completion and avoid emitting results into disposed views or expired sessions.
- Treat JS arguments as untrusted inputs. Validate native boundary parameters and expose stable, sanitized errors.

## Builds and Verification

A newly installed module, plugin, or native dependency requires rebuilding the development binary. Expo Go cannot load arbitrary new native modules. Test a real development build and a release variant where minification, native packaging, or ABI behavior matters.

Keep Android JDK/Gradle/AGP/Kotlin compatible with the selected Expo SDK. For example, the EAS SDK 57 Android image used JDK 17 in the 2026-10-08 snapshot; Java 25 in a Spring backend is independent.

If a module contains native C/C++ or links .so dependencies, validate ABI/page-size support and the selected NDK. Platform permissions and background services remain feature decisions, not automatic module prerequisites.

## Sources

- [Create a native module](https://docs.expo.dev/modules/native-module-tutorial/)
- [Expo Modules API](https://docs.expo.dev/modules/module-api/)
- [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [EAS build images](https://docs.expo.dev/build-reference/infrastructure/)
