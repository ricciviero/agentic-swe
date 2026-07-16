import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { PROTOCOL_VERSION } from "@agentic-swe/core";
import {
  ADAPTER_KINDS,
  createNodeRuntime,
  installGlobalAdapters,
  inspectRepository,
  linkSkillDirectories,
  renderAdapter,
  renderAdapterToFile,
  uninstallGlobalAdapters,
  unlinkSkillDirectories,
  verifyProject,
  type AdapterKind,
  type AdapterMutation,
  type GlobalAdapterOptions,
  type InstallTarget,
  type SkillLinkMutation,
  type SkillLinkTarget,
  type NodeEvaluationRequest,
  type NodeDiagnostic,
} from "@agentic-swe/node";
import {
  SKILLS_PACKAGE_VERSION,
  listSkills,
  skillAssetRoot,
  verifySkillIntegrity,
} from "@agentic-swe/skills";

export const CLI_VERSION = "0.1.0" as const;
export const EXIT_CODES = {
  ok: 0,
  unexpected: 1,
  usage: 2,
  invalidConfig: 3,
  incompatibleConfig: 4,
  verificationFailed: 5,
  conflict: 6,
} as const;

export interface CliIo {
  stdout(value: string): void;
  stderr(value: string): void;
}

interface ParsedArgs {
  positionals: string[];
  flags: Set<string>;
  values: Map<string, string>;
}

class CliUsageError extends Error {}

const usage = `Agentic SWE ${CLI_VERSION}

Usage:
  agentic-swe inspect [repository] [--planning-record <path>] [--json]
  agentic-swe evaluate [repository] --request-file <path>
  agentic-swe verify [repository] [--json]
  agentic-swe doctor [--target codex|claude|all] [--json]
  agentic-swe render <adapter> [--output <path>] [--dry-run] [--json]
  agentic-swe install [--target codex|claude|all] [--dry-run] [--json]
  agentic-swe uninstall [--target codex|claude|all] [--dry-run] [--json]
  agentic-swe link-skills --target codex|claude [--source-root <path>] [--dry-run] [--json]
  agentic-swe unlink-skills --target codex|claude [--source-root <path>] [--dry-run] [--json]

Adapters: ${ADAPTER_KINDS.join(", ")}
`;

function defaultIo(): CliIo {
  return {
    stdout: (value) => process.stdout.write(value),
    stderr: (value) => process.stderr.write(value),
  };
}

function parseArgs(args: readonly string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const booleanFlags = new Set(["--json", "--dry-run", "--help"]);
  const valueFlags = new Set([
    "--planning-record",
    "--request-file",
    "--output",
    "--target",
    "--codex-home",
    "--claude-home",
    "--source-root",
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument) continue;
    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }
    if (booleanFlags.has(argument)) {
      flags.add(argument);
      continue;
    }
    if (!valueFlags.has(argument)) throw new CliUsageError(`Unknown option: ${argument}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new CliUsageError(`Missing value for: ${argument}`);
    values.set(argument, value);
    index += 1;
  }
  return { positionals, flags, values };
}

function globalSkillDirectories(env: NodeJS.ProcessEnv): string[] {
  const candidates = [
    skillAssetRoot(),
    env.AGENTIC_SWE_HOME ? join(env.AGENTIC_SWE_HOME, "skills") : undefined,
    join(env.CODEX_HOME ?? join(homedir(), ".codex"), "skills"),
    join(env.CLAUDE_HOME ?? join(homedir(), ".claude"), "skills"),
  ];
  return [...new Set(candidates.filter((value): value is string => value !== undefined).map((value) => resolve(value)))];
}

function json(io: CliIo, value: unknown): void {
  io.stdout(`${JSON.stringify(value, null, 2)}\n`);
}

function configExit(status: string): number {
  if (status === "incompatible") return EXIT_CODES.incompatibleConfig;
  if (status === "invalid") return EXIT_CODES.invalidConfig;
  return EXIT_CODES.ok;
}

function diagnosticLine(diagnostic: NodeDiagnostic): string {
  return `${diagnostic.severity.toUpperCase()} ${diagnostic.code}${diagnostic.path ? ` (${diagnostic.path})` : ""}: ${diagnostic.message}`;
}

function targetOf(value: string | undefined): InstallTarget {
  const target = value ?? "all";
  if (target === "codex" || target === "claude" || target === "all") return target;
  throw new CliUsageError(`Invalid target: ${target}`);
}

function skillTargetOf(value: string | undefined): SkillLinkTarget {
  if (value === "codex" || value === "claude") return value;
  throw new CliUsageError("Skill linking requires --target codex|claude.");
}

function mutationExit(results: readonly AdapterMutation[]): number {
  return results.some((result) => result.status === "conflict")
    ? EXIT_CODES.conflict
    : EXIT_CODES.ok;
}

function globalAdapterOptions(
  parsed: ParsedArgs,
  target: InstallTarget,
  dryRun: boolean,
): GlobalAdapterOptions {
  const codexHome = parsed.values.get("--codex-home");
  const claudeHome = parsed.values.get("--claude-home");
  return {
    target,
    dryRun,
    ...(codexHome ? { codexHome } : {}),
    ...(claudeHome ? { claudeHome } : {}),
  };
}

function printMutations(io: CliIo, results: readonly AdapterMutation[], asJson: boolean): void {
  if (asJson) json(io, results);
  else for (const result of results) io.stdout(`${result.target}: ${result.message} ${result.path}\n`);
}

function printSkillMutations(io: CliIo, results: readonly SkillLinkMutation[], asJson: boolean): void {
  if (asJson) json(io, results);
  else for (const result of results) io.stdout(`${result.skill}: ${result.message} ${result.path}\n`);
}

function assertOnly(positionals: readonly string[], maximum: number): void {
  if (positionals.length > maximum) throw new CliUsageError("Too many positional arguments.");
}

function isEvaluationRequest(value: unknown): value is NodeEvaluationRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { requestId?: unknown }).requestId === "string" &&
    typeof (value as { summary?: unknown }).summary === "string"
  );
}

export async function runCli(
  argv: readonly string[],
  io: CliIo = defaultIo(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<number> {
  try {
    const [command, ...rest] = argv;
    if (!command || command === "help" || command === "--help" || command === "-h") {
      io.stdout(usage);
      return EXIT_CODES.ok;
    }
    if (command === "--version" || command === "version") {
      io.stdout(`${CLI_VERSION}\n`);
      return EXIT_CODES.ok;
    }
    const parsed = parseArgs(rest);
    if (parsed.flags.has("--help")) {
      io.stdout(usage);
      return EXIT_CODES.ok;
    }
    const asJson = parsed.flags.has("--json");
    const skillDirectories = globalSkillDirectories(env);

    if (command === "inspect") {
      assertOnly(parsed.positionals, 1);
      const repository = parsed.positionals[0] ?? ".";
      const planningRecord = parsed.values.get("--planning-record");
      const inspection = await inspectRepository({
        startPath: repository,
        globalSkillDirectories: skillDirectories,
        ...(planningRecord ? { planningRecord } : {}),
      });
      if (asJson) json(io, inspection);
      else {
        io.stdout(`Repository: ${inspection.root}\n`);
        io.stdout(`Protocol: ${PROTOCOL_VERSION}\n`);
        io.stdout(`Config: ${inspection.config.status}${inspection.config.configVersion === null ? "" : ` (v${inspection.config.configVersion})`}\n`);
        io.stdout(`Instructions: ${inspection.instructionFiles.join(", ") || "none"}\n`);
        io.stdout(`Skills: ${inspection.availableSkills.map((skill) => skill.name).join(", ") || "none"}\n`);
        io.stdout(`Planning evidence: ${inspection.planningEvidence ? "present" : "missing"}\n`);
        for (const diagnostic of inspection.diagnostics) io.stdout(`${diagnosticLine(diagnostic)}\n`);
      }
      return configExit(inspection.config.status);
    }

    if (command === "evaluate") {
      assertOnly(parsed.positionals, 1);
      const requestPath = parsed.values.get("--request-file");
      if (!requestPath) throw new CliUsageError("evaluate requires --request-file <path>.");
      const request = JSON.parse(await readFile(resolve(requestPath), "utf8")) as unknown;
      if (!isEvaluationRequest(request)) throw new CliUsageError("Request file must contain requestId and summary strings.");
      const runtime = createNodeRuntime({
        startPath: parsed.positionals[0] ?? ".",
        globalSkillDirectories: skillDirectories,
      });
      const result = await runtime.evaluate(request);
      json(io, result);
      return configExit(result.inspection.config.status);
    }

    if (command === "verify") {
      assertOnly(parsed.positionals, 1);
      const result = await verifyProject({
        startPath: parsed.positionals[0] ?? ".",
        globalSkillDirectories: skillDirectories,
      });
      if (asJson) json(io, result);
      else {
        io.stdout(`${result.valid ? "PASS" : "FAIL"}: ${result.inspection.root}\n`);
        for (const diagnostic of result.diagnostics) io.stdout(`${diagnosticLine(diagnostic)}\n`);
      }
      const configCode = configExit(result.inspection.config.status);
      return configCode === EXIT_CODES.ok
        ? result.valid ? EXIT_CODES.ok : EXIT_CODES.verificationFailed
        : configCode;
    }

    if (command === "doctor") {
      assertOnly(parsed.positionals, 0);
      const target = targetOf(parsed.values.get("--target"));
      const adapters = await installGlobalAdapters(globalAdapterOptions(parsed, target, true));
      const integrity = await Promise.all(
        listSkills().map(async (skill) => ({ name: skill.name, valid: await verifySkillIntegrity(skill.name) })),
      );
      const report = {
        cliVersion: CLI_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        skillsPackageVersion: SKILLS_PACKAGE_VERSION,
        runtime: { node: process.versions.node, bun: process.versions.bun ?? null },
        skills: { count: integrity.length, invalid: integrity.filter((entry) => !entry.valid).map((entry) => entry.name) },
        adapters,
      };
      if (asJson) json(io, report);
      else {
        io.stdout(`Agentic SWE CLI: ${CLI_VERSION}\nProtocol: ${PROTOCOL_VERSION}\n`);
        io.stdout(`Skills: ${report.skills.count} (${report.skills.invalid.length} invalid)\n`);
        for (const adapter of adapters) io.stdout(`${adapter.target}: ${adapter.message} ${adapter.path}\n`);
      }
      return report.skills.invalid.length > 0 ? EXIT_CODES.verificationFailed : mutationExit(adapters);
    }

    if (command === "render") {
      assertOnly(parsed.positionals, 1);
      const kind = parsed.positionals[0];
      if (!kind || !ADAPTER_KINDS.includes(kind as AdapterKind)) {
        throw new CliUsageError(`render requires an adapter: ${ADAPTER_KINDS.join(", ")}`);
      }
      const output = parsed.values.get("--output");
      if (!output) {
        io.stdout(renderAdapter(kind as AdapterKind));
        return EXIT_CODES.ok;
      }
      const result = await renderAdapterToFile({
        kind: kind as AdapterKind,
        path: output,
        dryRun: parsed.flags.has("--dry-run"),
      });
      printMutations(io, [result], asJson);
      return mutationExit([result]);
    }

    if (command === "install" || command === "uninstall") {
      assertOnly(parsed.positionals, 0);
      const options = globalAdapterOptions(
        parsed,
        targetOf(parsed.values.get("--target")),
        parsed.flags.has("--dry-run"),
      );
      const results = command === "install"
        ? await installGlobalAdapters(options)
        : await uninstallGlobalAdapters(options);
      printMutations(io, results, asJson);
      return mutationExit(results);
    }

    if (command === "link-skills" || command === "unlink-skills") {
      assertOnly(parsed.positionals, 0);
      const target = skillTargetOf(parsed.values.get("--target"));
      const sourceRoot = parsed.values.get("--source-root") ?? skillAssetRoot();
      const codexHome = parsed.values.get("--codex-home");
      const claudeHome = parsed.values.get("--claude-home");
      const options = {
        target,
        sourceRoot,
        dryRun: parsed.flags.has("--dry-run"),
        ...(codexHome ? { codexHome } : {}),
        ...(claudeHome ? { claudeHome } : {}),
      };
      const results = command === "link-skills"
        ? await linkSkillDirectories(options)
        : await unlinkSkillDirectories(options);
      printSkillMutations(io, results, asJson);
      return results.some((result) => result.status === "conflict")
        ? EXIT_CODES.conflict
        : EXIT_CODES.ok;
    }

    throw new CliUsageError(`Unknown command: ${command}`);
  } catch (error) {
    io.stderr(`agentic-swe: ${error instanceof Error ? error.message : String(error)}\n`);
    return error instanceof CliUsageError || error instanceof SyntaxError
      ? EXIT_CODES.usage
      : EXIT_CODES.unexpected;
  }
}
