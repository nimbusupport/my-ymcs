import test from "node:test";
import assert from "node:assert/strict";

import { buildTemplateConfig, createDownloadName } from "../public/yealink-cfg.js";

test("buildTemplateConfig prepends account 1 codec defaults", () => {
  const result = buildTemplateConfig();

  assert.match(
    result,
    /^#!version:1\.0\.0\.1\r?\n\r?\naccount\.1\.codec\.pcmu\.enable = 0\r?\naccount\.1\.codec\.pcma\.priority = 1\r?\naccount\.1\.codec\.g729\.enable = 0\r?\naccount\.1\.codec\.g722\.enable = 0\r?\ndm\.file_upload\.http_method = 1/m,
  );
});

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
