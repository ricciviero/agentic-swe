import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { unexpectedPublishWarnings } from "./publish-warnings.js";

const PACKAGE_NAMES = ["core", "node", "skills", "cli"] as const;
const EXPECTED_VERSION = "0.1.0";
const REPOSITORY_URL = "git+https://github.com/ricciviero/agentic-swe.git";
const REGISTRY_URL = "https://registry.npmjs.org/";

interface PackageManifest {
  name?: string;
  version?: string;
  author?: string;
  keywords?: string[];
  homepage?: string;
  bugs?: { url?: string };
  repository?: { type?: string; url?: string; directory?: string };
  publishConfig?: { access?: string; registry?: string };
  bin?: Record<string, string>;
}

interface PublishResult {
  name?: string;
  version?: string;
  files?: Array<{ path?: string }>;
}

function publishedEntry(value: unknown, packageName: string): PublishResult | undefined {
  if (Array.isArray(value)) return value[0] as PublishResult | undefined;
  if (typeof value !== "object" || value === null) return undefined;
  return (value as Record<string, PublishResult>)[packageName];
}

for (const directory of PACKAGE_NAMES) {
  const manifestPath = `packages/${directory}/package.json`;
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as PackageManifest;
  const expectedName = `@agentic-swe/${directory}`;

  assert.equal(manifest.name, expectedName, `${manifestPath}: package name`);
  assert.equal(manifest.version, EXPECTED_VERSION, `${manifestPath}: aligned version`);
  assert.equal(manifest.author, "Riccardo Civiero", `${manifestPath}: author`);
  assert(manifest.keywords && manifest.keywords.length >= 4, `${manifestPath}: keywords`);
  assert.equal(manifest.repository?.type, "git", `${manifestPath}: repository type`);
  assert.equal(manifest.repository?.url, REPOSITORY_URL, `${manifestPath}: repository URL`);
  assert.equal(
    manifest.repository?.directory,
    `packages/${directory}`,
    `${manifestPath}: monorepo directory`,
  );
  assert.equal(
    manifest.homepage,
    "https://github.com/ricciviero/agentic-swe#readme",
    `${manifestPath}: homepage`,
  );
  assert.equal(
    manifest.bugs?.url,
    "https://github.com/ricciviero/agentic-swe/issues",
    `${manifestPath}: issue tracker`,
  );
  assert.equal(manifest.publishConfig?.access, "public", `${manifestPath}: public access`);
  assert.equal(manifest.publishConfig?.registry, REGISTRY_URL, `${manifestPath}: registry`);
  if (directory === "cli") {
    assert.equal(manifest.bin?.["agentic-swe"], "dist/bin.js", `${manifestPath}: CLI bin`);
  }

  const dryRun = spawnSync(
    "npm",
    ["publish", "--dry-run", "--json", `./packages/${directory}`],
    { encoding: "utf8" },
  );
  assert.equal(
    dryRun.status,
    0,
    `npm publish dry-run failed for ${expectedName}:\n${dryRun.stdout}${dryRun.stderr}`,
  );
  assert.deepEqual(
    unexpectedPublishWarnings(dryRun.stderr),
    [],
    `npm auto-corrected or emitted an unexpected warning about ${expectedName}:\n${dryRun.stderr}`,
  );
  const entry = publishedEntry(JSON.parse(dryRun.stdout), expectedName);
  assert.equal(entry?.name, expectedName, `${expectedName}: dry-run name`);
  assert.equal(entry?.version, EXPECTED_VERSION, `${expectedName}: dry-run version`);
  assert(
    entry?.files?.some((file) => file.path === "package.json"),
    `${expectedName}: dry-run package manifest missing`,
  );
  console.log(`${expectedName}@${EXPECTED_VERSION}: publish dry-run passed.`);
}
