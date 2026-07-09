---
name: ai-sdk-agents
description: 'Use when building agents or LLM applications with the Vercel AI SDK (`ai` package): tool-calling loops, streamText/generateText, tool definitions with tool()+zod, multi-step agent loops, terminal token streaming, provider abstraction (Anthropic / OpenAI / OpenAI-compatible local models through MLX, LM Studio, Ollama, vLLM), structured output, abort handling, and error handling. Trigger on: AI SDK, ai-sdk, ai-sdk.dev, `ai` package, streamText, generateText, generateObject, streamObject, tool(), inputSchema, agent loop, stopWhen, stepCountIs, ToolLoopAgent, toolChoice, fullStream, textStream, createOpenAICompatible, @ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/openai-compatible, convertToModelMessages, ModelMessage.'
---

# AI SDK Agents

Use this skill to build LLM applications and agents with the Vercel AI SDK (`ai`): tool calling, `streamText`, `generateText`, multi-step loops, structured output, provider abstraction, terminal streaming, aborts, and OpenAI-compatible local endpoints.

## Load References

Inspect the installed SDK version and official provider documentation before relying on version-specific APIs or provider-specific behavior.

## Core Stack

- Core package: `ai`.
- Tool schemas: `tool()` plus Zod.
- Providers: `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/openai-compatible` as needed.
- Multi-step loops: prefer SDK-native `stopWhen: stepCountIs(n)` or agent APIs over a handwritten loop unless you need precise control.

## Core Workflow

1. Centralize model/provider construction.
2. Define tools with explicit names, descriptions, input schemas, and safe execution boundaries.
3. Use `streamText` for interactive/terminal UX and `generateText` for one-shot tasks.
4. Use structured output APIs when the result must be machine-readable.
5. Add abort handling, timeouts, and error paths before considering an agent production-ready.
6. Log/tool-result surfaces should be useful without leaking secrets.

## Non-Negotiables

- Do not scatter model IDs through the codebase.
- Do not accept untyped tool arguments.
- Do not let tool execution mutate external state without an explicit permission/safety boundary.
- Do not reimplement multi-step tool loops when SDK primitives are sufficient.
- Handle provider differences at the adapter/config layer, not throughout business logic.
- For local OpenAI-compatible models, isolate base URL, API key behavior, and model naming.

## Delivery Checklist

- Tool schemas match runtime behavior.
- Agent loop has a bounded step count.
- Streaming handles text deltas, tool calls/results, completion, abort, and errors.
- Tests or fixtures cover at least one tool-call path when feasible.
