const UNAUTHENTICATED_DRY_RUN_WARNING =
  /^npm warn This command requires you to be logged in to https:\/\/registry\.npmjs\.org\/ \(dry-run\)$/i;

export function unexpectedPublishWarnings(stderr: string): string[] {
  return stderr
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => /^npm warn\b/i.test(line))
    .filter((line) => !UNAUTHENTICATED_DRY_RUN_WARNING.test(line));
}

export function isExpectedAlreadyPublishedDryRun(
  status: number | null,
  stdout: string,
  stderr: string,
  version: string,
): boolean {
  if (status !== 1) return false;
  const expected = `You cannot publish over the previously published versions: ${version}.`;
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return false;
  }
  if (typeof parsed !== "object" || parsed === null) return false;
  const error = (parsed as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return false;
  if ((error as { summary?: unknown }).summary !== expected) return false;
  return stderr.split(/\r?\n/u).some((line) => line.trim() === `npm error ${expected}`);
}
