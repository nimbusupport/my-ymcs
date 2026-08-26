import test from "node:test";
import assert from "node:assert/strict";

import { createDownloadName } from "../public/yealink-cfg.js";

test("createDownloadName includes domain and extension for desk cfg files", () => {
  const result = createDownloadName({
    domainPrefix: "1234",
    extension: "200",
    isW70B: false,
  });

  assert.equal(result, "1234_200.cfg");
});

test("createDownloadName uses only the domain for W70B cfg files", () => {
  const result = createDownloadName({
    domainPrefix: "1234",
    extension: "200",
    isW70B: true,
  });

  assert.equal(result, "1234.cfg");
});
