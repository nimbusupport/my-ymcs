import test from "node:test";
import assert from "node:assert/strict";
import {
  getBatchFailureRows,
  isBatchSuccessful,
  mapBatchMessage,
  summarizeBatchResult
} from "../src/lib/ymcsBatchResult.js";

test("summarizeBatchResult treats YMCS error entries as failures even on HTTP 200", () => {
  const result = {
    ok: true,
    message: "This Mac used by other site.",
    payload: {
      total: 1,
      successCount: 1,
      failureCount: 0,
      errors: [{
        index: 0,
        mac: "c4fc22000001",
        message: "This Mac used by other site."
      }]
    },
    requestBody: [{
      mac: "c4fc22000001",
      sn: "SN-001"
    }]
  };

  const summary = summarizeBatchResult(result);
  assert.equal(summary.ok, false);
  assert.equal(summary.failureCount, 1);
  assert.equal(isBatchSuccessful(result), false);
  assert.equal(mapBatchMessage(result), "0 devices created, 1 failed. YMCS: row 1, MAC c4fc22000001: This Mac used by other site.");
});

test("getBatchFailureRows supports nested YMCS failure lists", () => {
  const result = {
    ok: true,
    payload: {
      data: {
        failureList: [{
          mac: "AA:BB:CC:DD:EE:FF",
          sn: "SN-002",
          message: "Device already exists."
        }]
      }
    },
    requestBody: [{
      mac: "001122334455",
      sn: "SN-001"
    }, {
      mac: "aabbccddeeff",
      sn: "SN-002"
    }]
  };

  assert.deepEqual(getBatchFailureRows(result), [1]);
});
