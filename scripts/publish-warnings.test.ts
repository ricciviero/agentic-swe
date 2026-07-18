import assert from "node:assert/strict";
import test from "node:test";

import {
  isExpectedAlreadyPublishedDryRun,
  unexpectedPublishWarnings,
} from "./publish-warnings.js";

test("accepts only npm's unauthenticated publish dry-run warning", () => {
  assert.deepEqual(
    unexpectedPublishWarnings(
      "npm warn This command requires you to be logged in to https://registry.npmjs.org/ (dry-run)\n",
    ),
    [],
  );
});

test("retains npm manifest auto-correction warnings", () => {
  const warning = "npm warn publish npm auto-corrected some errors in your package.json when publishing";
  assert.deepEqual(unexpectedPublishWarnings(`${warning}\n`), [warning]);
});

test("retains unexpected npm warnings beside the allowed dry-run warning", () => {
  const unexpected = "npm warn deprecated dependency";
  assert.deepEqual(
    unexpectedPublishWarnings(
      [
        "npm warn This command requires you to be logged in to https://registry.npmjs.org/ (dry-run)",
        unexpected,
      ].join("\n"),
    ),
    [unexpected],
  );
});

test("accepts npm's exact already-published dry-run refusal for the expected version", () => {
  const summary = "You cannot publish over the previously published versions: 0.1.0.";
  assert.equal(
    isExpectedAlreadyPublishedDryRun(
      1,
      JSON.stringify({ error: { summary, detail: "" } }),
      `npm error ${summary}\nnpm error A complete log is available`,
      "0.1.0",
    ),
    true,
  );
});

test("rejects unrelated or wrong-version publish failures", () => {
  assert.equal(
    isExpectedAlreadyPublishedDryRun(
      1,
      JSON.stringify({
        error: { summary: "You cannot publish over the previously published versions: 0.2.0." },
      }),
      "npm error You cannot publish over the previously published versions: 0.2.0.",
      "0.1.0",
    ),
    false,
  );
  assert.equal(
    isExpectedAlreadyPublishedDryRun(1, "not json", "npm error network timeout", "0.1.0"),
    false,
  );
});
