import assert from "node:assert/strict";
import test from "node:test";

import { unexpectedPublishWarnings } from "./publish-warnings.js";

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
