---
name: react-native-expo
description: Senior-level React Native mobile development with Expo and TypeScript. Use this skill whenever the user asks to create, modify, or review React Native code, Expo Router navigation, mobile components, hooks, services, or stores. Trigger on any mention of React Native, Expo, Expo Router, mobile app, iOS, Android, or TypeScript mobile. Also trigger when the user mentions mobile navigation, StyleSheet, SafeArea, or mobile-specific patterns like useEffect with API calls. When in doubt, use this skill for any React Native or Expo mobile task.
---

# React Native Expo

Act as a senior mobile engineer for iOS and Android apps built with React Native, Expo, and TypeScript. Write code, comments, and explanations in clear technical English unless the project explicitly uses another language.

## Required Pattern

Build sequentially, one feature at a time:

```text
Route/Layout -> Types -> Services -> UI Components -> Hooks/Stores -> Tests
```

## Project Shape

```text
src/
  app/
    _layout.tsx
    index.tsx
    (auth)/
    (tabs)/
  components/
    layout/
    ui/
    features/
  hooks/
  services/
    apiClient.ts
    axiosConfig.ts
  stores/
  types/
    api/
    domain/
  lib/
    storage/
    validators/
  constants/
  assets/
```

## Naming

| Element | Convention | Example |
|---|---|---|
| Expo Router route | lowercase | `home.tsx`, `user-profile.tsx` |
| Component | PascalCase `.tsx` | `UserCard.tsx` |
| Hook | `use` prefix | `useUserProfile.ts` |
| Non-component file | camelCase | `axiosConfig.ts` |
| Folder | lowercase | `components/`, `services/` |

Avoid anonymous components, dead code, unresolved TODOs, and components with more than one responsibility.

## Core Principles

- Use the Expo managed workflow.
- Use strict TypeScript and explicit typing.
- Use Expo Router file-based navigation.
- Support iOS and Android; prioritize iOS when unspecified.
- Keep state local by default; use global state only when necessary.
- Centralize networking through axios configuration.
- Protect performance through controlled re-renders and virtualized lists.

## Development Cycle

1. **Routing and navigation**: define routes and layouts with Expo Router. Use `_layout.tsx` for stacks, tabs, and modals.
2. **Data modeling**: define types first. Separate API DTOs from domain models.
3. **Data fetching**: call APIs only through `services/`; never call axios directly in components. Always handle loading, error, and empty states.
4. **UI and interaction**: use typed props, basic accessibility (`accessibilityLabel`, `accessibilityRole`), minimal render logic, and Safe Area handling.
5. **State and side effects**: prefer local `useState`; put effects in `useEffect` or custom hooks. Do not auto-fetch inside shared hooks unless the existing project pattern requires it.
6. **Tests and verification**: keep components testable in isolation. Log only in development.

## Data Flow

- **Types**: types and enums only; use `import type`; keep API DTOs separate from domain models.
- **Services**: pure functions using `apiClient`; type all params and returns; propagate errors instead of silently catching.
- **Stores**: only for state shared across screens; represent state with `loading` and `error`; persist only through `lib/storage`.
- **Hooks**: expose `state` and `actions`; avoid UI logic.

## Axios and Fetching

- Centralize configuration in `axiosConfig.ts`.
- Read `baseURL` from `EXPO_PUBLIC_API_BASE_URL`.
- Set explicit timeouts.
- Use interceptors for auth and error mapping.
- Normalize failures into an `ApiError` type.

## React Hooks

- Do not call synchronous `setState` inside `useEffect`.
- Do not use `useEffect` as a generic trigger.
- Derived state should be computed, not stored separately.
- Keep dependency arrays explicit and complete.
- Do not add unexplained `eslint-disable` comments.

## UI, Performance, and Security

- Use `StyleSheet.create()`; avoid complex inline styles.
- Keep design constants in `constants/`.
- Use `FlatList` or `FlashList` for lists.
- Add dark mode only when required or already supported.
- Use `React.memo`, `useCallback`, and `useMemo` only when justified.
- Do not hardcode secrets. Use Expo env variables and `SecureStore` for tokens.
- Do not log sensitive data.

Read [references/expo-config.md](references/expo-config.md) for templates and configuration details.
