---
name: swiftui-ios
description: Senior-level native iOS development with Swift and SwiftUI. Use for Swift code, SwiftUI views, ViewModels, iOS services, navigation, MVVM, async/await, SwiftData, Core Data, URLSession, accessibility, or iOS app architecture.
---

# SwiftUI iOS

Build native iOS features with modern Swift, SwiftUI, and the conventions already established by the app.

## First Pass

Inspect the deployment target, package dependencies, app entry point, navigation, state ownership, persistence, services, and tests before changing code. Prefer the APIs supported by the current deployment target.

## Architecture

- Prefer feature-oriented MVVM: Model -> Service -> ViewModel -> View -> Navigation -> Tests.
- Keep network DTOs separate from domain models.
- Keep services responsible for I/O and ViewModels responsible for presentation state and orchestration.
- Keep Views declarative, small, and free of direct networking or business rules.
- Use initializer-based dependency injection. Avoid hidden mutable singletons.

## State and Concurrency

- Use `async`/`await`, `Task`, and `@MainActor`; do not introduce direct `DispatchQueue` usage for normal UI work.
- Model loading, empty, error, success, and permission states explicitly.
- Cancel work that is no longer relevant and guard against stale async results updating a newer screen state.
- Keep derived state derived rather than duplicating it in mutable storage.

## UI and Navigation

- Use `NavigationStack` and explicit navigation state for new flows.
- Use SwiftUI controls and layouts before reaching for UIKit; document any UIKit bridge.
- Support Dynamic Type, VoiceOver labels and traits, sufficient contrast, and safe areas.
- Keep user-facing strings in the product language, not the skill language.

## Data and Security

- Use `URLSession` and `Codable` behind service boundaries.
- Store sensitive tokens in Keychain or `SecureStore`-equivalent storage, never `UserDefaults` or logs.
- Use SwiftData or Core Data only when persistent local state is required and consistent with the project.
- Do not hardcode secrets or server URLs.

## Quality

- Unit-test ViewModels and services with deterministic fakes.
- Test failure paths and state transitions, not just the happy path.
- Avoid force unwraps, `try!`, unstructured temporary code, and views tightly coupled to networking.
- Build and run the relevant target before reporting completion.
