import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExistingDeviceConflictMessage,
  findExistingDeviceConflicts
} from "../src/lib/deviceConflicts.js";

test("findExistingDeviceConflicts matches existing devices by normalized MAC", () => {
  const conflicts = findExistingDeviceConflicts(
    [{
      mac: "44:DB:D2:D0:97:8D",
      sn: "801013H030001076"
    }],
    [{
      mac: "44dbd2d0978d",
      sn: "801013H030001076",
      siteName: "Support_Team",
      name: "Lobby",
      model: "AX83H"
    }]
  );

  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].mac, "44dbd2d0978d");
  assert.equal(conflicts[0].existing.siteName, "Support_Team");
});

test("buildExistingDeviceConflictMessage explains that duplicates are blocked", () => {
  const message = buildExistingDeviceConflictMessage({
    index: 0,
    mac: "44dbd2d0978d",
    sn: "801013H030001076",
    existing: {
      siteName: "Support_Team",
      name: "Lobby",
      model: "AX83H"
    }
  }, { includeRow: true });

  assert.match(message, /Row 1:/);
  assert.match(message, /already exists in YMCS under site "Support_Team"/);
  assert.match(message, /Duplicate adds are blocked to avoid silent updates/);
});
