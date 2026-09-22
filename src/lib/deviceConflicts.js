function normalizeMacLike(value) {
  return String(value ?? "").replace(/[^a-fA-F0-9]/g, "").toLowerCase();
}

function normalizeSerialLike(value) {
  return String(value ?? "").trim().toLowerCase();
}

function describeSite(existingDevice) {
  const siteName = String(existingDevice?.siteName ?? "").trim();
  return siteName ? ` under site "${siteName}"` : "";
}

export function findExistingDeviceConflicts(requestedDevices = [], existingDevices = []) {
  const existingByMac = new Map();
  const existingBySn = new Map();

  existingDevices.forEach((device) => {
    const normalizedMac = normalizeMacLike(device?.mac);
    const normalizedSn = normalizeSerialLike(device?.sn);

    if (normalizedMac && !existingByMac.has(normalizedMac)) {
      existingByMac.set(normalizedMac, device);
    }

    if (normalizedSn && !existingBySn.has(normalizedSn)) {
      existingBySn.set(normalizedSn, device);
    }
  });

  return requestedDevices
    .map((device, index) => {
      const normalizedMac = normalizeMacLike(device?.mac);
      const normalizedSn = normalizeSerialLike(device?.sn);
      const macMatch = normalizedMac ? existingByMac.get(normalizedMac) || null : null;
      const snMatch = normalizedSn ? existingBySn.get(normalizedSn) || null : null;
      const existing = macMatch || snMatch;

      if (!existing) {
        return null;
      }

      return {
        index,
        mac: normalizedMac,
        sn: String(device?.sn ?? "").trim(),
        existing,
        macMatch: Boolean(macMatch),
        snMatch: Boolean(snMatch)
      };
    })
    .filter(Boolean);
}

export function buildExistingDeviceConflictMessage(conflict, options = {}) {
  const includeRow = options.includeRow === true;
  const rowPrefix = includeRow && Number.isInteger(conflict?.index) ? `Row ${conflict.index + 1}: ` : "";
  const identifiers = [
    conflict?.mac ? `MAC ${conflict.mac}` : "",
    conflict?.sn ? `SN ${conflict.sn}` : ""
  ].filter(Boolean).join(" and ");
  const identifierText = identifiers || "This device";
  const existing = conflict?.existing || {};
  const currentName = String(existing.name ?? "").trim();
  const currentModel = String(existing.model ?? "").trim();
  const currentLabel = [currentName, currentModel].filter(Boolean).join(" / ");
  const currentSuffix = currentLabel ? ` Current device: ${currentLabel}.` : "";

  return `${rowPrefix}${identifierText} already exists in YMCS${describeSite(existing)}. Duplicate adds are blocked to avoid silent updates.${currentSuffix}`;
}
