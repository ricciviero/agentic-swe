# Data Model

Use one table or collection for flags and one developer marker on users. Do not add audit-log, per-user, or per-tenant tables unless the user explicitly changes scope.

## Conceptual Schema

```text
feature_flags
  id            uuid PK
  key           varchar(120) UNIQUE NOT NULL
  name          varchar(200) NOT NULL
  description   text NULL
  section       varchar(100) NOT NULL
  scope         enum('backend','frontend','fullstack') NOT NULL
  enabled       bool NOT NULL DEFAULT false
  iteration_id  varchar(120) NULL
  created_at    timestamp NOT NULL DEFAULT now()
  updated_at    timestamp NOT NULL DEFAULT now()

users
  is_developer  bool NOT NULL DEFAULT false
```

## PostgreSQL

```sql
CREATE TABLE feature_flags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           VARCHAR(120) NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  section       VARCHAR(100) NOT NULL DEFAULT 'General',
  scope         VARCHAR(20) NOT NULL CHECK (scope IN ('backend','frontend','fullstack')),
  enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  iteration_id  VARCHAR(120),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_section ON feature_flags(section);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_feature_flags_iteration ON feature_flags(iteration_id) WHERE iteration_id IS NOT NULL;

CREATE OR REPLACE FUNCTION feature_flags_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION feature_flags_updated_at();

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_developer BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_developer ON users(is_developer) WHERE is_developer = TRUE;
```

## MySQL

```sql
CREATE TABLE feature_flags (
  id            CHAR(36) PRIMARY KEY,
  `key`         VARCHAR(120) NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  section       VARCHAR(100) NOT NULL DEFAULT 'General',
  scope         ENUM('backend','frontend','fullstack') NOT NULL,
  enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  iteration_id  VARCHAR(120),
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section (section),
  INDEX idx_enabled (enabled),
  INDEX idx_iteration (iteration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE users ADD COLUMN is_developer BOOLEAN NOT NULL DEFAULT FALSE;
```

## SQLite

```sql
CREATE TABLE feature_flags (
  id            TEXT PRIMARY KEY,
  key           TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  section       TEXT NOT NULL DEFAULT 'General',
  scope         TEXT NOT NULL CHECK (scope IN ('backend','frontend','fullstack')),
  enabled       INTEGER NOT NULL DEFAULT 0,
  iteration_id  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_feature_flags_section ON feature_flags(section);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
```

## MongoDB

```js
db.createCollection("featureFlags", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["key", "name", "section", "scope", "enabled"],
      properties: {
        key: { bsonType: "string", maxLength: 120 },
        name: { bsonType: "string", maxLength: 200 },
        description: { bsonType: "string" },
        section: { bsonType: "string", maxLength: 100 },
        scope: { enum: ["backend", "frontend", "fullstack"] },
        enabled: { bsonType: "bool" },
        iterationId: { bsonType: ["string", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

db.featureFlags.createIndex({ key: 1 }, { unique: true });
db.featureFlags.createIndex({ section: 1 });
db.featureFlags.createIndex({ enabled: 1 });
db.users.updateMany({}, { $set: { isDeveloper: false } });
```

## Migration Guidance

- Flyway: add a new `V<number>__create_feature_flags.sql` under `src/main/resources/db/migration/`.
- EF Core: use `dotnet ef migrations add AddFeatureFlags`.
- Alembic: create a revision and map booleans/timestamps to the actual dialect.
- SQLx: add a timestamped migration in the project migration folder.
- Prisma: add a `FeatureFlag` model and run the project migration command.

Never modify an already-applied migration in a shared environment.
