import { realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export function normalizeRelativePath(path: string): string {
  return path.split(sep).join("/");
}

export function resolveWithinRepository(root: string, requestedPath: string): string {
  if (isAbsolute(requestedPath)) {
    throw new RangeError(`Absolute paths are not accepted: ${requestedPath}`);
  }
  const resolved = resolve(root, requestedPath);
  const relativePath = relative(root, resolved);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new RangeError(`Path escapes repository root: ${requestedPath}`);
  }
  return resolved;
}

export async function assertRealPathWithinRepository(root: string, target: string): Promise<string> {
  const [realRoot, realTarget] = await Promise.all([realpath(root), realpath(target)]);
  const relativePath = relative(realRoot, realTarget);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new RangeError(`Resolved path escapes repository root: ${target}`);
  }
  return realTarget;
}
