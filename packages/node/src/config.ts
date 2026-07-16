import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsModule, { type FormatsPlugin } from "ajv-formats";
import { CONFIG_VERSION, protocolSchemasV1, type ProjectConfig } from "@agenticswe/core";
import { parse } from "yaml";
import { assertRealPathWithinRepository } from "./paths.js";
import type { NodeDiagnostic, ProjectConfigResult } from "./types.js";

const addFormats = addFormatsModule as unknown as FormatsPlugin;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
for (const schema of Object.values(protocolSchemasV1)) ajv.addSchema(schema as object);
const embeddedValidator = ajv.getSchema("urn:agentic-swe:protocol:v1:schema:project-config");
if (!embeddedValidator) throw new Error("Embedded project config schema is unavailable.");
const validateProjectConfig: ValidateFunction = embeddedValidator;

function validationMessage(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("; ");
}

function versionOf(value: unknown): number | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const version = (value as Record<string, unknown>).version;
  return Number.isInteger(version) ? (version as number) : null;
}

export function validateProjectConfigData(value: unknown): ProjectConfigResult {
  const configVersion = versionOf(value);
  if (configVersion !== null && configVersion !== CONFIG_VERSION) {
    return {
      status: "incompatible",
      config: null,
      configVersion,
      diagnostics: [{
        code: "CONFIG_VERSION_INCOMPATIBLE",
        severity: "error",
        message: `Unsupported .agentic config version: ${configVersion}`,
      }],
    };
  }
  if (!validateProjectConfig(value)) {
    return {
      status: "invalid",
      config: null,
      configVersion,
      diagnostics: [{
        code: "CONFIG_INVALID",
        severity: "error",
        message: `Invalid .agentic/config.yaml: ${validationMessage(validateProjectConfig.errors)}`,
      }],
    };
  }
  return { status: "valid", config: value as ProjectConfig, configVersion: CONFIG_VERSION, diagnostics: [] };
}

export async function readProjectConfig(root: string): Promise<ProjectConfigResult> {
  const configPath = join(root, ".agentic", "config.yaml");
  if (!(await access(configPath).then(() => true, () => false))) {
    return { status: "missing", config: null, configVersion: null, diagnostics: [] };
  }
  try {
    await assertRealPathWithinRepository(root, configPath);
    const parsed = parse(await readFile(configPath, "utf8")) as unknown;
    return validateProjectConfigData(parsed);
  } catch (error) {
    const diagnostic: NodeDiagnostic = {
      code: "CONFIG_PARSE_FAILED",
      severity: "error",
      message: `Cannot parse .agentic/config.yaml: ${error instanceof Error ? error.message : String(error)}`,
      path: ".agentic/config.yaml",
    };
    return { status: "invalid", config: null, configVersion: null, diagnostics: [diagnostic] };
  }
}
