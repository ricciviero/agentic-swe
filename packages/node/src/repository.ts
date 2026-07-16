import { access, realpath, stat } from "node:fs/promises";
import { dirname, join, parse, resolve } from "node:path";

async function exists(path: string): Promise<boolean> {
  return access(path).then(() => true, () => false);
}

export async function findRepositoryRoot(startPath = process.cwd()): Promise<string> {
  let current = await realpath(resolve(startPath));
  const metadata = await stat(current);
  if (!metadata.isDirectory()) current = dirname(current);
  let instructionCandidate: string | undefined;

  while (true) {
    if (await exists(join(current, ".git"))) return current;
    if (
      instructionCandidate === undefined &&
      ((await exists(join(current, "AGENTS.md"))) ||
        (await exists(join(current, ".agentic", "config.yaml"))))
    ) {
      instructionCandidate = current;
    }
    const parent = dirname(current);
    if (parent === current || current === parse(current).root) break;
    current = parent;
  }

  if (instructionCandidate) return instructionCandidate;
  throw new Error(`No repository root found from: ${startPath}`);
}
