---
name: android-native
description: Implement or review native Android code using Kotlin, Jetpack Compose, Android platform APIs, Gradle, or native modules used by Expo/React Native. Use for Android-native screens, lifecycle/state, permissions, build compatibility, and Kotlin integration work. Ordinary React Native screens and Expo UI TypeScript belong to react-native-expo.
---

# Native Android

Work within the existing Android project or requested native integration. Preserve the chosen application stack; adopting an Android API does not authorize rewriting a cross-platform app as a native app.

## First Pass

Read project instructions, Gradle wrapper/build files and version catalog, manifest, minimum/target/compile SDK, Kotlin/AGP/Compose versions, source sets, architecture, and tests. For Expo/React Native, also inspect the SDK, app config/plugins, native project ownership, and New Architecture requirements.

Verify compatibility against official documentation. Select Android's JDK from Gradle/AGP/Expo build requirements, independently of any Java backend. Do not upgrade Kotlin, AGP, or Gradle just to match an unrelated latest version.

## Native Screen Work

- Preserve the established architecture. For new Compose screens, use state flowing down and events flowing up; keep I/O and business rules out of composables.
- Use a ViewModel for screen-level state where appropriate, immutable UI state, lifecycle-aware collection, and structured coroutine cancellation. Keep derived state derived.
- Place transient UI state at the appropriate owner; use saveable state only when restoration is required. Distinguish configuration changes from process death and durable storage.
- Prefer supported Material 3 components and semantics. Check stability/opt-in requirements for each API rather than assuming every Material Expressive component is stable.
- Respect edge-to-edge, system/IME insets, font scaling, TalkBack, contrast, and keyboard/gesture navigation. Avoid duplicate inset consumption across hosting layers.
- Use lazy lists with stable item identity for substantial data. Profile before adding performance machinery.

## Platform Behavior

- Request only permissions needed by the authorized feature, at a meaningful user action. Handle denial, revocation, approximate/restricted access, and settings return.
- Foreground location does not imply background tracking or a foreground service. Match service declarations and current platform restrictions to actual requirements.
- Use the navigation stack's supported back handling and predictive-back behavior. Do not disable system navigation to conceal an application-state bug.
- Keep credentials out of code, resources, generated config, and logs. Use platform-protected storage appropriately; Keystore protects key material and does not itself serialize all application data.
- Check current target-SDK/store requirements for releases. If native .so libraries are present, verify required ABI and 16 KB page-size compatibility instead of assuming a Java/Kotlin build validates native binaries.

## Expo and React Native Integration

Read [expo-native-modules.md](references/expo-native-modules.md) before implementing Kotlin modules or modifying generated native configuration. Use Expo UI from TypeScript when it already provides the requested native control.

## Validation

For actual Kotlin/Gradle changes, run appropriate module/variant compilation and focused unit tests. Use instrumented/device tests for platform APIs and native UI behavior; a JVM unit test cannot validate Android permissions or system gesture integration. Exercise the minimum relevant OS and current target behavior when affected.

Use the Gradle wrapper and existing signing setup. Do not publish or deploy merely to validate a code change. Documentation-only tasks require documentation checks, not starting another application.

## Official Sources

- [Compose architecture](https://developer.android.com/develop/ui/compose/architecture)
- [Material 3](https://developer.android.com/develop/ui/compose/designsystems/material3)
- [Gradle JDK selection](https://developer.android.com/build/jdks)
- [Android 16 target behavior](https://developer.android.com/about/versions/16/behavior-changes-16)
- [16 KB page sizes](https://developer.android.com/guide/practices/page-sizes)
- [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
