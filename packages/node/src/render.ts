import {
  agenticProtocolMarkdownV1,
  claudeProjectAdapterV1,
  projectAgenticSectionV1,
  projectConfigTemplateV1,
} from "@agenticswe/core";

export const AGENTIC_BEGIN_MARKER = "<!-- agentic-swe:begin -->";
export const AGENTIC_END_MARKER = "<!-- agentic-swe:end -->";
export const GENERATED_ADAPTER_SIGNATURE =
  "Generated from protocol/v1/protocol.yaml";

export const ADAPTER_KINDS = [
  "protocol",
  "codex",
  "claude",
  "project-config",
  "project-agents-section",
  "project-claude",
] as const;

export type AdapterKind = (typeof ADAPTER_KINDS)[number];

export function renderManagedBlock(content: string): string {
  return `${AGENTIC_BEGIN_MARKER}\n${content.trimEnd()}\n${AGENTIC_END_MARKER}\n`;
}

export function renderAdapter(kind: AdapterKind): string {
  switch (kind) {
    case "protocol":
      return agenticProtocolMarkdownV1;
    case "codex":
    case "claude":
      return renderManagedBlock(agenticProtocolMarkdownV1);
    case "project-config":
      return projectConfigTemplateV1;
    case "project-agents-section":
      return projectAgenticSectionV1;
    case "project-claude":
      return claudeProjectAdapterV1;
  }
}

export function isGeneratedAdapter(content: string): boolean {
  return content.includes(GENERATED_ADAPTER_SIGNATURE);
}
