# Developer Auth

Admin flag mutation is reserved for the application developer. Use three cumulative checks:

1. Environment identity, such as `DEVELOPER_EMAIL`.
2. Database marker, such as `users.is_developer = true`.
3. Middleware or guard, such as `requireDeveloper`.

Do not rely on only one of these checks.

## Required Behavior

- Unauthenticated user: `401`.
- Authenticated non-developer: `403`.
- Developer email mismatch: `403`.
- Missing `DEVELOPER_EMAIL` in production: fail closed and block admin mutation.
- Public flag reads remain unauthenticated.

## Pseudocode

```typescript
function requireDeveloper(req, res, next) {
  const user = req.user;
  const developerEmail = process.env.DEVELOPER_EMAIL;

  if (!user) return res.status(401).end();
  if (!developerEmail) return res.status(403).json({ error: "Developer access is not configured" });
  if (user.email !== developerEmail) return res.status(403).end();
  if (user.isDeveloper !== true) return res.status(403).end();

  return next();
}
```

## Database Marker

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_developer BOOLEAN NOT NULL DEFAULT FALSE;
```

Set the developer marker manually or through a protected admin bootstrap path. Do not seed a real personal email in public repositories.

## Project Documentation

When adding the module to a project, document the pattern in `AGENTS.md` and keep any real developer email in environment configuration, not in repo text.
