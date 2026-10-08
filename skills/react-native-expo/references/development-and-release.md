# Development Builds and Releases

## Version and Toolchain Selection

Check the selected SDK's documentation and the actual local/EAS image. Do not infer Android's JDK from the backend runtime, or Xcode support from the device OS alone.

Compatibility snapshot verified on 2026-10-08, for orientation rather than a permanent default:

| Selection | SDK 57 snapshot |
| --- | --- |
| Expo / React Native / React | Expo 57, React Native 0.86, React 19.2.3 |
| Node minimum | 22.13.x |
| Supported OS minimums | iOS 16.4+, Android 7+ |
| Android compile/target SDK | 36 |
| Minimum Xcode | 26.4+ |
| Android JDK in the EAS SDK 57 image | 17 |

SDK 58 was beta on that date. Recheck release status at implementation time. Do not choose a beta solely because a newer API has become stable there.

For SDK 57 builds using Xcode 27/iOS 27 SDK, Expo documents scene lifecycle support in expo@57.0.23+ with ios.enableSceneSupport in expo-build-properties. Check current migration instructions and any AppDelegate customization before using that toolchain.

## Development Workflow

- Use expo-dev-client and a development build for production feature development with real native dependencies. Rebuild after native package/config/plugin changes.
- Local iOS builds require macOS and compatible Xcode, command-line tools, simulator runtimes, and signing where required. Local Android builds require the compatible Android SDK, emulator/device, and JDK/Gradle toolchain.
- EAS Build can compile in the cloud; it is optional. Expo does not require hosting an application's backend on EAS.
- Keep development, internal preview, and store-release configuration explicit when those environments are requested. Match API endpoints, identifiers, signing, and distribution to the intended audience.
- Use native/React Native development tools for debugging. Inspect representative release builds for startup, memory, list scrolling, and animation performance.
- Docker may run backend/admin and supporting services. A Linux container does not provide an iOS simulator or macOS/Xcode build environment.

## Native UI Validation

Exercise platform-specific code on each affected platform. Include the minimum supported OS where the feature depends on availability, a recent OS, accessibility text sizes/settings, gesture/button navigation on Android where relevant, and a physical device for capabilities that a simulator cannot validate reliably.

Testing a JavaScript screen does not validate permissions, secure storage, push credentials, native map configuration, or signing. Match checks to the change; do not create new app infrastructure for a documentation task.

## Store Builds and Updates

Keep developer accounts, app identifiers, credentials, and ownership aligned with the publisher. Configure capabilities and privacy/permission declarations for actual implemented behavior. Check current Apple/Google submission requirements when preparing a release.

Use the appropriate signed iOS distribution and Android App Bundle for store delivery. Preview installation and store submission are separate operations; publish or submit only within the user's authorization.

If EAS Update is selected, an update must match the installed binary's native runtime. JavaScript/assets updates cannot add a native module, change native permission configuration, or upgrade a native SDK in an existing binary. Manage runtimeVersion, channels, staged delivery, and recovery consistently with the chosen workflow. Verify store-policy eligibility for the intended update.

For notifications, choose Expo Push Service or direct APNs/FCM integration according to the project. Both require appropriate native configuration/credentials. Keep sending credentials on the backend, handle token rotation, and test using a suitable development/release build rather than relying on Expo Go.

## Official Sources

- [SDK 57 compatibility](https://docs.expo.dev/versions/v57.0.0/)
- [SDK 57 release/toolchain notes](https://expo.dev/changelog/sdk-57)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Local native builds](https://docs.expo.dev/guides/local-app-development/)
- [EAS build images](https://docs.expo.dev/build-reference/infrastructure/)
- [Runtime versions and updates](https://docs.expo.dev/eas-update/runtime-versions/)
- [Push setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
