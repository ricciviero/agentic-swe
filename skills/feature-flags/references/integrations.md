# Workflow Integrations

This file describes how `feature-flags` should integrate with project workflow skills. Keep `AGENTS.md` canonical for repository workflow documentation.

## Iteration Planning

When a project uses local iteration planning, each non-trivial user-visible feature can propose a feature flag:

| Work type | Proposed scope | Key format |
|---|---|---|
| Server-only change | `backend` | `be:<iteration-name>` |
| UI-only change | `frontend` | `fe:<iteration-name>` |
| Full user-facing feature | `fullstack` | `fs:<iteration-name>` |

Do not propose flags for pure bug fixes, internal refactors, dependency bumps, or documentation-only work.

Suggested `task.md` section:

```markdown
## Feature flag

| Field | Value |
|---|---|
| Proposed key | `fs:checkout-v2` |
| Scope | fullstack |
| UI section | Checkout |
| Iteration ID | `03-checkout-v2` |

Lifecycle:
1. Create the flag with `enabled = false`.
2. Wrap new backend code with `isEnabled('fs:checkout-v2')`.
3. Wrap new frontend code with `<Feature flag="fs:checkout-v2">`.
4. Test with the flag off and on.
5. Enable from the developer admin UI.
6. After the feature is stable, remove the wrapper or keep the flag as a permanent kill switch.
```

Suggested `plan.md` step:

```markdown
## Step 0 - Feature flag setup

- [ ] Create `feature_flags` record with `key = fs:checkout-v2`, `enabled = false`.
- [ ] Backend: wrap the switch point with `featureFlags.isEnabled('fs:checkout-v2')`.
- [ ] Frontend: wrap the new UI with `<Feature flag="fs:checkout-v2">`.
- [ ] Verify E2E with flag OFF and ON.
```

## Project Setup

When a project setup workflow asks whether to include feature flags, add:

- The `feature-flags` skill to the workflow mapping.
- A feature flag section in `AGENTS.md`.
- Migration guidance for `feature_flags` and `users.is_developer`.
- Optional backend/frontend scaffold only after user confirmation.

Suggested `AGENTS.md` section:

```markdown
## Feature Flags

This project uses the `feature-flags` module as a self-hosted developer kill switch.

Rules:
- Keys use `<scope>:<kebab-name>` with scope `be`, `fe`, or `fs`.
- Every new flag starts disabled.
- New code behind a flag must compile and pass tests with the flag off.
- Backend checks use `isEnabled('key')`; frontend checks use `useFeatureFlag('key')` or `<Feature>`.
- Public clients receive only enabled flag keys and scope.
- Admin mutation requires developer-only access.

| Key | Section | Scope | State | Iteration |
|---|---|---|---|---|
| (none) | - | - | - | - |
```

Do not reference installed local skill paths, private home directories, personal names, or private project inventories in public repository docs.
