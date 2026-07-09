# Frontend Patterns

All frontends expose the same concepts:

- Provider/service that loads `GET /api/feature-flags` once at app boot.
- Realtime subscription to `/ws/feature-flags` or `/sse/feature-flags`.
- Polling fallback every 5 seconds when realtime fails.
- Hook/helper such as `useFeatureFlag('key')`.
- Declarative guard component such as `<Feature flag="key">...</Feature>`.

## React / Next.js

```tsx
export function useFeatureFlag(key: string): boolean {
  const flags = useContext(FeatureFlagsContext);
  return flags.enabledKeys.has(key);
}

export function Feature({
  flag,
  fallback = null,
  children,
}: {
  flag: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return useFeatureFlag(flag) ? <>{children}</> : <>{fallback}</>;
}
```

Mount the provider at the app root so the flag state is available throughout the UI. For Next.js App Router, keep the provider in a client component.

## Angular

- Use a singleton `FeatureFlagsService`.
- Store enabled keys in a signal or RxJS stream.
- Provide a structural directive such as `*appFeature="'fs:checkout-v2'"`.
- Subscribe to realtime updates in the service, not in each component.

## React Native / Expo

- Use a root provider under the navigation layout.
- Load public flags from the API at app startup.
- Use WebSocket where supported; otherwise use polling fallback.
- Keep token or base URL handling in the existing API client.

## Behavior Rules

- Missing flags evaluate to `false`.
- UI must have deterministic loading behavior; do not briefly reveal gated content before flags load.
- Realtime events update local state idempotently.
- Polling fallback must diff the enabled-key set before updating state.
- Do not expose admin metadata to public clients.
