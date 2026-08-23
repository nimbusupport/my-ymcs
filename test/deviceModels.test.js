import test from "node:test";
import assert from "node:assert/strict";
import { resolveModelSelection, searchPhoneModels } from "../src/config/deviceModels.js";

test("searchPhoneModels finds short types with normalized input", () => {
  const results = searchPhoneModels("t 54 w", [{ shortType: "SIP-T54W", modelId: "", searchKey: "SIPT54W" }]);
  assert.equal(results.length, 1);
  assert.equal(results[0].shortType, "SIP-T54W");
});

test("resolveModelSelection returns configured model id for known model", () => {
  const result = resolveModelSelection("sip-t54w", [
    { shortType: "SIP-T54W", modelId: "real-model-id-1", searchKey: "SIPT54W" }
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.modelId, "real-model-id-1");
  assert.equal(result.shortType, "SIP-T54W");
  assert.equal(result.source, "catalog");
});

test("resolveModelSelection fails when known short type has no configured model id", () => {
  const result = resolveModelSelection("W70B", [
    { shortType: "W70B", modelId: "", searchKey: "W70B" }
  ]);

  assert.equal(result.ok, false);
  assert.match(result.message, /not configured/i);
});

test("resolveModelSelection returns configured model id for W70B in catalog", () => {
  const result = resolveModelSelection("W70B");

  assert.equal(result.ok, true);
  assert.equal(result.modelId, "1549deee08c940faa861c60d764ab0cd");
  assert.equal(result.shortType, "W70B");
  assert.equal(result.source, "catalog");
});

test("resolveModelSelection accepts raw model ids", () => {
  const result = resolveModelSelection("61e659e4d78d42ebada88ef1eb751b64", []);

  assert.equal(result.ok, true);
  assert.equal(result.modelId, "61e659e4d78d42ebada88ef1eb751b64");
  assert.equal(result.source, "raw");
});
