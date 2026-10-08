---
name: react-native-expo
description: Build, configure, or review React Native apps using Expo and TypeScript for iOS and Android. Use for Expo Router, development builds, CNG/config plugins, native UI through Expo UI, mobile APIs, data access, and release workflows. Native Swift-only or Kotlin-only tasks belong to the corresponding native skill.
---

# React Native Expo

Build iOS and Android apps using the project's Expo SDK, TypeScript conventions, and approved product scope. A request to inspect a mockup or research a stack does not authorize scaffolding, dependency installation, or starting the app.

## First Pass

Read project instructions, package manifest and lockfile, Expo app config, Router layouts, EAS profiles if present, native directories, services, storage, and tests. Establish whether native directories are generated with CNG or maintained manually before editing them.

Resolve compatibility as a set: Expo SDK, React Native, React, native packages, Node, minimum OS versions, Xcode, Android SDK, Gradle, and Android JDK. Check official documentation for the selected SDK; do not combine independent latest versions or silently upgrade an existing app. A backend's Java version does not select the Android build JDK.

## Focused References

- App config, environment variables, and generated native projects: [expo-config.md](references/expo-config.md).
- Development builds, toolchains, signing, EAS, and updates: [development-and-release.md](references/development-and-release.md).
- SwiftUI, Jetpack Compose, Liquid Glass, navigation, and platform adaptation: [native-ui.md](references/native-ui.md).
- API state, storage, permissions, and useful libraries: [data-and-libraries.md](references/data-and-libraries.md).

Load only the references needed for the current task.

## Implementation

1. Define the route and user-visible states for the requested feature.
2. Establish typed API/domain boundaries and a centralized service client.
3. Build the UI and connect state, lifecycle, permissions, and navigation.
4. Validate the changed behavior on the relevant platforms.

Keep an established folder structure. For a new app, feature folders plus Router routes, reusable UI, services, and storage boundaries are a useful starting point; do not create empty layers or stores merely to match a template.

- Use Expo Router when selected or already present; preserve another established navigation setup unless migration is requested.
- Keep domain logic and data access separate from rendering. API DTOs and domain models may differ.
- Keep transient UI state local. A server-state cache such as TanStack Query and an optional shared UI store solve different problems; do not mirror fetched records into a second store without a reason.
- Query hooks may fetch declaratively. For manual requests, cancel obsolete work and prevent stale responses from replacing current state.
- Effects synchronize external systems. Compute derived state directly and clean up subscriptions, timers, and location listeners.
- Prefer the existing styling approach. React Native layouts, Expo UI native controls, and native view modifiers have different APIs; do not apply CSS or StyleSheet assumptions to SwiftUI/Compose children.
- Use platform files or small adapters where iOS/Android behavior differs while sharing domain logic.

## Native and Security Boundaries

- Develop production features with a development build containing the actual native dependencies. Expo Go is useful within its supported library set; it is not evidence that a custom native integration works.
- Use config plugins/local Expo modules for reproducible native changes in CNG projects. Do not patch generated native files and then discard those edits with prebuild.
- Treat API names containing unstable, alpha/beta packages, and SDK-specific imports according to their actual status. Choose them deliberately and keep fallbacks where required.
- EXPO_PUBLIC_* values are public client configuration, not secrets. Keep server credentials and signing secrets outside the client bundle.
- Store sensitive session material in SecureStore; use ordinary local storage only for appropriate non-sensitive data. Clear session-owned caches and credentials on logout.
- Request the minimum permission required at the moment it is needed. Foreground location does not imply approval for background tracking.
- Preserve accessibility, safe areas, keyboard behavior, readable contrast, Dynamic Type/font scaling, and platform navigation.

## Verification

Install SDK-managed libraries with npx expo install (or the existing package-manager equivalent), then check compatibility with Expo's dependency checks and expo-doctor when dependencies change. Do not use forced peer resolution to conceal incompatible versions.

Use the smallest meaningful checks for the changed surface: typecheck, lint, focused component/service tests, and native/device checks for native behavior. Test permission denial, interrupted requests, session expiry, loading/empty/error states, and accessibility where relevant. Performance claims require representative release builds and profiling; add memoization or alternate list renderers only when justified.

Report exactly which platform/build was exercised and any remaining limitation. Documentation-only changes do not require running an unrelated app.
