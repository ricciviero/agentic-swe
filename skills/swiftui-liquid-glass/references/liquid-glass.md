# Native Liquid Glass in SwiftUI

## Availability and Purpose

Inspect Xcode/SDK and the deployment target. Gate custom Liquid Glass APIs with #available(iOS 26, *) and provide readable older-OS UI when the app supports it. A visual effect is not a reason to raise the whole app's minimum OS without a product decision.

Apple describes Liquid Glass as a layer for navigation and controls above content. Prefer system controls' adopted appearance, and use custom glass where a requested interaction needs it. Avoid glass over every list row, stacked glass layers, and clear material over content that cannot support legibility.

## Composition

Apply glassEffect after modifiers establishing content appearance and geometry. Select a shape appropriate to the control. Tint should communicate the intended hierarchy and remain readable in light/dark contexts.

Use GlassEffectContainer for related glass surfaces that should share rendering, blend, or morph. Tune its spacing to the intended grouping; one shared container is not mandatory for unrelated surfaces across a screen.

Use interactive glass only where the element actually responds to input. Keep accessible labels, roles, target sizes, focus, and contrast consistent with the control.

For morphing changes, associate glassEffectID values with a stable namespace and animate the relevant view-hierarchy state change. Do not add morphing solely because the API supports it.

## Button Example

This illustrates availability and native button styling; labels/actions remain application decisions:

```swift
if #available(iOS 26, *) {
    Button("Continue", action: continueAction)
        .buttonStyle(.glassProminent)
} else {
    Button("Continue", action: continueAction)
        .buttonStyle(.borderedProminent)
}
```

A custom view can use glassEffect with an appropriate regular material and shape. Verify the selected API signature and platform availability from the installed SDK before composing advanced modifiers.

## Accessibility and Validation

Honor relevant transparency/motion preferences and readable contrast. Validate light/dark appearance and large text. Check that fallback content retains its hierarchy and interactions instead of relying on an unavailable material to make it visible.

Exercise grouped transitions when they are implemented, including interruption and navigation. Profile representative release builds before making rendering-cost claims. Do not assume a simulator screenshot establishes accessibility or performance.

## Apple Sources

- [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
- [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views)
- [GlassEffectContainer](https://developer.apple.com/documentation/swiftui/glasseffectcontainer)
- [GlassButtonStyle](https://developer.apple.com/documentation/swiftui/glassbuttonstyle)
