# Native UI on iOS and Android

## Choose the Rendering Boundary

React Native screens, @expo/ui SwiftUI/Jetpack Compose controls, and custom native modules can coexist. Keep shared application logic in TypeScript and use a platform adapter or .ios.tsx/.android.tsx file when behavior differs. Do not rebuild the app in Swift/Kotlin merely to adopt a native control.

@expo/ui exposes real native primitives; its SwiftUI and Jetpack Compose APIs were declared production-ready in SDK 56. Consult the selected SDK for individual component/API availability and universal API coverage. Do not assume that package status applies to every component or that iOS and Android APIs are identical.

Use platform-native controls where they improve system behavior, accessibility, or interaction. Preserve approved visual requirements for custom content. Decide which layer owns layout, state, scroll behavior, and navigation before mixing renderers.

## Hosting and Styling

- Import iOS controls from @expo/ui/swift-ui and Android controls from @expo/ui/jetpack-compose; use universal components when their supported API covers the need.
- Respect the native Host boundary and its size/insets behavior. SwiftUI modifiers and Compose modifiers are not interchangeable with React Native style props.
- Use the documented host adapter when nesting React Native content inside native UI. Avoid manually guessed height calculations, nested scrolling conflicts, or duplicate safe-area padding.
- Keep state changes, disabled/loading behavior, labels, focus, and accessibility coherent across the boundary.

## iOS and Liquid Glass

Use expo-glass-effect for native UIKit glass around React Native content, or @expo/ui/swift-ui glass modifiers when rendering SwiftUI controls. A blur is a different effect and is not evidence that native Liquid Glass is implemented.

Liquid Glass requires compatible build tooling and iOS 26+. In Expo, check isLiquidGlassAvailable() and the documented runtime API availability check before custom glass use. expo-glass-effect falls back to a regular view on unsupported platforms; supply the intended readable background rather than assuming the fallback provides a material.

Respect Reduce Transparency, contrast, and motion preferences. Apple positions glass primarily in controls/navigation above content. Avoid glass on every content row and stacked glass layers. Use the native container for interacting glass surfaces. Current GlassEffect documentation warns that setting glass/parent opacity to zero can suppress rendering; use the supported effect transition or verified workaround instead.

## Navigation

Use the project's stable stack/tab APIs by default. Native system tabs can automatically adopt platform styling, including Liquid Glass on compatible iOS versions.

Verify Router API status for the selected SDK. On SDK 57, native tabs use expo-router/unstable-native-tabs; SDK 58 documentation uses expo-router/native-tabs. Adoption on SDK 57 requires a deliberate experimental API choice within the approved scope. Do not upgrade the entire SDK merely to rename the import.

Keep route authorization separate from disabled/hidden tab styling. Handle deep links, restoration, tab reselection, and back behavior according to the project's navigation contract.

## Android

Use Jetpack Compose/Material 3 controls when native Android behavior is desired. A React Native Material-themed component library can be useful but does not itself expose Compose primitives. Choose deliberately rather than mixing several UI systems by default.

Respect edge-to-edge layouts, system insets, IME/keyboard movement, hardware/gesture back, and predictive-back behavior supported by the navigation stack. Do not disable modern system behavior to hide a layout bug. Apply dynamic colors only when compatible with approved branding and contrast.

Request permissions as needed and support denial or restricted access. Location, notification channels, map providers, and sharing have platform-specific behavior. Foreground location is a separate requirement from background services/tracking.

## Official Sources

- [Expo UI](https://docs.expo.dev/versions/latest/sdk/ui/)
- [SwiftUI](https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/)
- [Jetpack Compose](https://docs.expo.dev/versions/latest/sdk/ui/jetpack-compose/)
- [GlassEffect](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- [Native tabs](https://docs.expo.dev/router/advanced/native-tabs/)
- [Apple Liquid Glass guidance](https://developer.apple.com/videos/play/wwdc2025/219/)
- [Android target-36 behavior](https://developer.android.com/about/versions/16/behavior-changes-16)
