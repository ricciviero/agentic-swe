# Data, Storage, and Library Selection

Select the smallest maintained set needed for implemented behavior. Check the SDK, New Architecture compatibility, native setup, platform support, and release status before adding a package. SDK-managed packages use compatible versions selected by expo install.

## Data Access and State

Reuse the existing axios/fetch client. Centralize the base URL, authentication, timeouts/cancellation, and mapping of network/HTTP/domain failures. Type responses and validate untrusted payloads where needed; a TypeScript annotation or as ApiError does not validate a runtime value. Preserve useful error categories without returning server traces or logging tokens.

TanStack Query is a candidate for API cache, mutations, invalidation, and request lifecycle. Integrate its online/focus managers with the chosen network API and React Native AppState when using reconnect/focus refetch. Decide freshness and retries per operation; blindly retrying non-idempotent writes can duplicate work.

Use React local state for transient screen state. Add Zustand/context or another shared store only for actual shared application/UI state. Avoid duplicating server-cache records and loading flags across a store and query layer. Include account/tenant scope in cache ownership and clear relevant data on session changes.

Persisted cache does not constitute a complete offline feature. An approved offline workflow needs explicit freshness, authorization, expiration, synchronization/conflict behavior, and handling of logout. Offline map tiles also depend on the selected provider and licensing.

## Library Candidates

| Need | Candidate | Selection constraint |
| --- | --- | --- |
| Navigation | Expo Router | Preserve existing routing; verify native tab/API status for the SDK |
| API server state | TanStack Query | Connect native focus/online lifecycle; retain centralized services |
| Forms | React Hook Form and optionally Zod | Adapt controlled native inputs; server validation remains authoritative |
| Session secrets | expo-secure-store | Sensitive credentials/tokens; not the only source of irreplaceable data |
| Preferences | AsyncStorage | Non-sensitive local state only |
| Offline structured data | expo-sqlite | Introduce only for an approved persistent/offline need |
| Insets and keyboard | safe-area-context; keyboard controller if needed | Avoid duplicate inset ownership and unnecessary dependencies |
| Gestures/animation | Gesture Handler, Reanimated, Worklets | Use the SDK-compatible set and native configuration |
| Large lists | FlatList; FlashList if justified | Profile representative release data before switching |
| Images | expo-image | Match caching and authenticated-resource behavior |
| Maps | react-native-maps or a selected provider | Verify native API keys/configuration; expo-maps was alpha in the SDK 57 snapshot |
| Position | expo-location | Foreground unless background behavior is explicitly required |
| Documents | FileSystem, DocumentPicker, Sharing | Add only needed capabilities; follow current FileSystem APIs |
| Notifications | expo-notifications | Choose delivery backend and test native credentials/configuration |

## Permissions and Storage

Ask for permission required by the current action and handle denial, restricted/approximate access, revocation, and return from settings. Explain the actual user benefit. Do not add background location, tracking identifiers, contacts access, or notification enrollment to an unrelated feature.

SecureStore uses platform-protected storage but uninstall/persistence behavior differs between iOS and Android. Treat the backend as the authority for session validity. Logout must remove credentials and session-owned caches; do not infer that deleting the app always clears every iOS Keychain item.

## Verification and Sources

Use focused component/service tests and native/device verification where the boundary requires it. For a chosen E2E workflow, tools such as Maestro can exercise actual apps; adding a testing platform is a project decision, not an automatic dependency.

- [TanStack Query in React Native](https://tanstack.com/query/latest/docs/framework/react/react-native)
- [React Hook Form](https://github.com/react-hook-form/react-hook-form)
- [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [SDK packages and third-party integrations](https://docs.expo.dev/versions/latest/)
- [React Native Maps](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
