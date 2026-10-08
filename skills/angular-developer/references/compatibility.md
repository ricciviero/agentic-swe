# Angular Compatibility and New Workspaces

Inspect package.json, the lockfile, angular.json, TypeScript configuration, Node/package-manager selection, UI packages, forms, and tests. Check the official compatibility table and package peer requirements for the actual Angular version before scaffolding or upgrading.

A snapshot verified on 2026-10-08 was Angular 22.2.x with Node 24.15+ in the Node 24 line and TypeScript >=6.0 <6.1. The public version table listed Angular 22.0.x; compiler-cli 22.2.1's peer requirements separately confirmed that TypeScript range. Recheck the current table and package requirements rather than treating a snapshot as a global default.

- Keep Angular core/compiler/router/forms packages compatible, the CLI supported, and Material/CDK aligned with their supported Angular major.
- A React Native/Expo package in the same repo may use another TypeScript range. Keep frontend package boundaries explicit rather than forcing one TypeScript version across incompatible projects.
- Use the existing package manager and lockfile. Preserve the established build/test setup and investigate peer conflicts instead of hiding them with force/legacy resolution.
- Standalone components and signals are appropriate for new supported work; preserve existing modules when an unrelated change does not require migration.
- Check zoneless behavior/defaults against the selected major and dependencies. Do not blindly remove zone.js from a working older application.
- Reactive Forms remain supported. Select Signal Forms based on the actual API status, control integrations, and project decision; an Angular major alone does not authorize replacing every form.
- Angular Material/CDK is a candidate for admin forms, dialogs, tables, overlays, and accessibility when the project wants that UI system. Do not add it or another design system just because the app is an admin portal.
- For a client-only SPA, production can serve the built static assets. SSR/hydration and a Node runtime are separate requirements, not implicit deployment prerequisites.

## Official Sources

- [Version compatibility](https://angular.dev/reference/versions)
- [Release/support schedule](https://angular.dev/reference/releases)
- [Signal Forms](https://angular.dev/guide/forms/signals/overview)
- [Reactive Forms](https://angular.dev/guide/forms/reactive-forms)
- [Zoneless](https://angular.dev/guide/zoneless)
- [Angular Material](https://material.angular.dev/)
