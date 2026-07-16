import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const protocolPath = resolve(repositoryRoot, "protocol/v1/protocol.yaml");
const schemasDirectory = resolve(repositoryRoot, "protocol/v1/schemas");
const outputPath = resolve(
  repositoryRoot,
  "packages/core/src/generated/protocol-v1.generated.ts",
);

const schemaFiles = [
  "common.schema.json",
  "project-config.schema.json",
  "behavior-state.schema.json",
  "behavior-event.schema.json",
  "behavior-input.schema.json",
  "behavior-plan.schema.json",
  "protocol.schema.json",
  "conformance-case.schema.json",
] as const;

async function render(): Promise<string> {
  const protocol = parse(await readFile(protocolPath, "utf8")) as unknown;
  const entries = await Promise.all(
    schemaFiles.map(async (filename): Promise<readonly [string, unknown]> => [
      filename,
      JSON.parse(await readFile(resolve(schemasDirectory, filename), "utf8")) as unknown,
    ]),
  );
  const schemas = Object.fromEntries(entries);

  return [
    "/* This file is generated from protocol/v1. Do not edit it directly. */",
    "export const embeddedProtocolV1: unknown = JSON.parse(" +
      JSON.stringify(JSON.stringify(protocol)) +
      ");",
    "export const embeddedSchemasV1: Readonly<Record<string, unknown>> = Object.freeze(JSON.parse(" +
      JSON.stringify(JSON.stringify(schemas)) +
      "));",
    "",
  ].join("\n");
}

const expected = await render();
const checkOnly = process.argv.includes("--check");

if (checkOnly) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== expected) {
    console.error("Generated protocol assets are stale. Run: npm run protocol:generate");
    process.exitCode = 1;
  } else {
    console.log("Generated protocol assets are current.");
  }
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, expected, "utf8");
  console.log("Generated packages/core/src/generated/protocol-v1.generated.ts");
}
