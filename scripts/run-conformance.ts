import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  PROTOCOL_VERSION,
  evaluateBehavior,
  type BehaviorInput,
  type BehaviorPlan,
} from "@agenticswe/core";

interface ConformanceCase {
  name: string;
  protocolVersion: string;
  input: BehaviorInput;
  expected: BehaviorPlan;
}

const directory = resolve("protocol/v1/conformance");
const files = (await readdir(directory))
  .filter((filename) => filename.endsWith(".json"))
  .sort();

let passed = 0;
for (const filename of files) {
  const fixture = JSON.parse(await readFile(resolve(directory, filename), "utf8")) as ConformanceCase;
  assert.equal(fixture.protocolVersion, PROTOCOL_VERSION, `${filename}: protocol version`);
  const actual = evaluateBehavior(fixture.input);
  assert.deepStrictEqual(actual, fixture.expected, `${filename}: ${fixture.name}`);
  passed += 1;
}

console.log(`Agentic SWE conformance: ${passed}/${files.length} cases passed.`);
