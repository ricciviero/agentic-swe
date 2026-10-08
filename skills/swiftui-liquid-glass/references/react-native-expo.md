# Liquid Glass in React Native and Expo

## Select the Native API

Use expo-glass-effect when wrapping React Native content with the native UIKit glass effect. Use @expo/ui/swift-ui modifiers when the element is a SwiftUI control hosted through Expo UI. These are distinct rendering APIs; a CSS blur or generic BlurView does not implement native Liquid Glass.

Check the selected SDK's package versions, Xcode support, deployment target, and native build configuration. Install compatible packages through expo install and rebuild the development app when its native dependencies change.

## Availability and Fallback

Custom glass requires iOS 26+ and compatible build tooling. Check isLiquidGlassAvailable() for the compiled app's availability and isGlassEffectAPIAvailable() as documented for runtime API availability before using GlassView/GlassContainer.

GlassView falls back to a regular View on unsupported platforms. Provide an intentional readable background/layout for that path. Do not require iOS 26 for the whole app solely to enable this enhancement.

The availability function does not report every accessibility restriction. Check/honor Reduce Transparency through React Native AccessibilityInfo and ensure contrast, text scaling, and motion behavior remain usable.

## Containers, Animation, and Navigation

Use GlassContainer for related React Native glass surfaces; use the SwiftUI container APIs inside SwiftUI composition. Keep interactive behavior attached to an actual control and avoid layered glass over glass.

Current Expo documentation warns that opacity zero on GlassView or an ancestor can suppress glass rendering. Use supported native effect transitions or a verified workaround for the selected SDK/OS instead of assuming an ordinary fade is safe.

Native system tabs can adopt Liquid Glass automatically on compatible iOS versions. Verify Router status: SDK 57 uses expo-router/unstable-native-tabs; SDK 58 documents expo-router/native-tabs. Do not treat those imports as equivalent stable APIs across SDKs, or upgrade to a beta as an unrequested side effect.

On Android, preserve the selected platform design and use a deliberate fallback; iOS Liquid Glass APIs do not become Android native effects. Any visual imitation is a separate design choice.

## Sources

- [Expo GlassEffect](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- [Expo UI SwiftUI](https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/)
- [Native tabs](https://docs.expo.dev/router/advanced/native-tabs/)
- [React Native AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo)
