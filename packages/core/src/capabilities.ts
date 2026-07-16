import type { Capability } from "./types.js";

export function intersectCapabilities(
  requested: readonly Capability[],
  hostAllowed: readonly Capability[],
  userModeAllowed?: readonly Capability[],
): Capability[] {
  const host = new Set(hostAllowed);
  const user = userModeAllowed === undefined ? null : new Set(userModeAllowed);
  return [...new Set(requested)].filter(
    (capability) => host.has(capability) && (user === null || user.has(capability)),
  );
}
