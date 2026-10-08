---
name: swiftui-liquid-glass
description: Implement or review native iOS Liquid Glass in SwiftUI or React Native/Expo. Use for glass API availability, native containers and button styles, accessibility, fallbacks, and design alignment. Ordinary SwiftUI or Expo UI work without Liquid Glass belongs to its platform skill.
---

# iOS Liquid Glass

Use native Liquid Glass APIs appropriate to the actual rendering layer and supported OS/build toolchain. Preserve the application's chosen stack and visual requirements.

## Choose the Rendering Layer

- SwiftUI: read [liquid-glass.md](references/liquid-glass.md) for glassEffect, containers, button styles, and availability.
- React Native/Expo: read [react-native-expo.md](references/react-native-expo.md) for expo-glass-effect versus Expo UI SwiftUI controls and SDK-specific navigation.

Do not paste SwiftUI modifiers into React Native views or represent an ordinary blur as native Liquid Glass.

## Design and Availability

- Inspect deployment target, Xcode/SDK, and rendering layer before editing. Native iOS Liquid Glass requires iOS 26+ and supported build tooling; the app can retain an earlier deployment target with an explicit fallback.
- Use glass primarily for controls/navigation floating above content, following Apple guidance. Avoid applying it to every content card/row or stacking glass layers.
- Respect Reduce Transparency, contrast, motion settings, text scaling, and readable foreground content. Availability alone does not establish accessibility.
- Use a glass container for related surfaces that should interact or morph; unrelated elements do not need one shared container simply because more than one exists.
- Apply glass after the intended SwiftUI layout/appearance modifiers. Keep shapes and grouping coherent; interactive effects belong to interactive controls.
- Add morphing transitions only for a required animated state change, with stable IDs and an appropriate namespace.

## Verification

Verify the actual native effect on a compatible device/simulator, earlier-OS fallback when supported, and relevant accessibility settings. Use release profiling for a performance claim. For a review or documentation-only task, report findings without starting or changing an unrelated application.

Prefer the current Apple and selected Expo SDK documentation when an API or status differs from an example.
