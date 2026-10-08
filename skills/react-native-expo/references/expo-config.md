# Expo Configuration and Native Generation

## Discover Before Editing

Inspect app.json or app.config.*, the lockfile, Router entrypoint, config plugins, build profiles, and whether ios/ and android/ are generated or manually maintained. Preserve bundle/package identifiers and existing account ownership. Changing an app identifier is a release decision.

Use a stable SDK compatible with the project's requirements. Each SDK targets a specific React Native/React set. Native library installation, minimum OS support, and build toolchains must match that set; version examples are not instructions to migrate every app.

## Public Configuration and Secrets

- EXPO_PUBLIC_API_BASE_URL can provide the public API endpoint when that is the project's convention. Do not append /api/v1 in multiple layers or silently invent an API prefix.
- EXPO_PUBLIC_* values are inlined into the JavaScript bundle and readable by app users. EAS secret visibility does not make a value embedded in the app confidential.
- Keep signing credentials and build-only secrets in appropriate build/deployment secret storage. Keep backend credentials on the server.
- Validate required configuration at startup or build time and produce an actionable configuration error instead of requests to undefined.
- Distinguish a local physical device, Android emulator, iOS simulator, and browser when selecting a development API address. localhost refers to the process/device using it; Compose service names resolve only inside the Docker network.
- Keep HTTP development exceptions limited to the needed development environment. Production API connections use the intended HTTPS endpoint.

## CNG and Config Plugins

With Continuous Native Generation, app config, installed packages, plugins, and local native modules are durable inputs; native projects are reproducible outputs. Read the current SDK's prebuild behavior before running it: regeneration can discard hand-edited native files.

Use config plugins for declarative native configuration. Use a local Expo module when a needed native API has no suitable supported library. A native dependency/plugin change requires a new development build; Metro reload cannot add native code to an existing binary.

If the repo intentionally maintains native projects manually, preserve that workflow. Do not switch ownership modes or delete native directories without a requested migration and a recovery plan.

## Dependency Changes

Use the existing package manager and lockfile. expo install selects compatible versions for SDK-managed packages. For other packages, verify New Architecture support, required native configuration, platform support, and maintained releases. Run dependency checks after changing the set rather than installing independent latest native versions.

## Official Sources

- [App config](https://docs.expo.dev/workflow/configuration/)
- [Environment variables](https://docs.expo.dev/guides/environment-variables/)
- [SDK compatibility](https://docs.expo.dev/versions/latest/)
- [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)
- [Config plugins](https://docs.expo.dev/config-plugins/introduction/)
- [New Architecture](https://docs.expo.dev/guides/new-architecture/)
