const UNAUTHENTICATED_DRY_RUN_WARNING =
  /^npm warn This command requires you to be logged in to https:\/\/registry\.npmjs\.org\/ \(dry-run\)$/i;

export function unexpectedPublishWarnings(stderr: string): string[] {
  return stderr
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => /^npm warn\b/i.test(line))
    .filter((line) => !UNAUTHENTICATED_DRY_RUN_WARNING.test(line));
}
