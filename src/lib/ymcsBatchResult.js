function asObject(value) {
  return value && typeof value === "object" ? value : null;
}

function readCount(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

function normalizeMacLike(value) {
  return String(value ?? "").replace(/[^a-fA-F0-9]/g, "").toLowerCase();
}

function looksLikeFailureMessage(message) {
  const text = String(message ?? "").trim().toLowerCase();
  if (!text) {
    return false;
  }

  return [
    "other site",
    "other enterprise",
    "used by other",
    "added by other",
    "already exists",
    "already used",
    "duplicate",
    "failed",
    "failure",
    "not found",
    "does not exist",
    "has been deleted"
  ].some((fragment) => text.includes(fragment));
}

export function getBatchErrorEntries(payload) {
  const source = asObject(payload);
  if (!source) {
    return [];
  }

  const data = asObject(source.data);
  const candidates = [
    source.errors,
    source.errorList,
    source.failures,
    source.failureList,
    source.failedList,
    data?.errors,
    data?.errorList,
    data?.failures,
    data?.failureList,
    data?.failedList
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
}

export function summarizeBatchResult(result) {
  const payload = asObject(result?.payload) || {};
  const data = asObject(payload.data);
  const errorEntries = getBatchErrorEntries(payload);
  const requestTotal = Array.isArray(result?.requestBody) ? result.requestBody.length : null;
  const fallbackTotal = (
    requestTotal
    ?? readCount(
      readCount(payload.successCount, data?.successCount) + readCount(payload.failureCount, data?.failureCount)
    )
  );

  const total = readCount(payload.total, data?.total, requestTotal, fallbackTotal) ?? 0;
  const explicitFailureCount = readCount(payload.failureCount, payload.failedCount, payload.failCount, data?.failureCount, data?.failedCount, data?.failCount);
  const explicitSuccessCount = readCount(payload.successCount, payload.succeededCount, payload.passCount, data?.successCount, data?.succeededCount, data?.passCount);
  const failureCount = Math.max(explicitFailureCount ?? 0, errorEntries.length);
  const maxSuccessCount = total > 0 ? Math.max(total - failureCount, 0) : null;
  const successCount = explicitSuccessCount != null
    ? (maxSuccessCount != null ? Math.min(explicitSuccessCount, maxSuccessCount) : explicitSuccessCount)
    : (maxSuccessCount ?? 0);
  const hasFailureMessage = looksLikeFailureMessage(result?.message);

  return {
    total,
    successCount,
    failureCount,
    errorEntries,
    hasFailureMessage,
    ok: Boolean(result?.ok) && failureCount === 0 && errorEntries.length === 0 && !hasFailureMessage && (total === 0 || successCount === total)
  };
}

export function getBatchErrorDetails(payload) {
  const rawErrors = getBatchErrorEntries(payload);

  return rawErrors
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }

      if (!entry || typeof entry !== "object") {
        return "";
      }

      const message = String(
        entry.message
        || entry.msg
        || entry.error
        || entry.errorMessage
        || entry.description
        || ""
      ).trim();
      const mac = String(entry.mac || entry.deviceMac || entry.deviceId || "").trim();
      const serial = String(entry.sn || entry.serial || entry.machineId || "").trim();
      const rowIndex = Number.isInteger(entry.index) ? entry.index + 1 : null;
      const context = [
        rowIndex ? `row ${rowIndex}` : "",
        mac ? `MAC ${mac}` : "",
        serial ? `SN ${serial}` : ""
      ].filter(Boolean).join(", ");

      if (context && message) {
        return `${context}: ${message}`;
      }

      return message || context;
    })
    .filter(Boolean);
}

export function getBatchFailureRows(result) {
  const requestBody = Array.isArray(result?.requestBody) ? result.requestBody : [];
  const rawErrors = getBatchErrorEntries(result?.payload);
  const usedIndexes = new Set();

  return rawErrors
    .map((entry) => resolveBatchFailureRowIndex(entry, requestBody, usedIndexes))
    .filter((index) => Number.isInteger(index));
}

function resolveBatchFailureRowIndex(entry, requestBody, usedIndexes) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const directIndex = Number(entry.index);
  if (Number.isInteger(directIndex) && directIndex >= 0 && directIndex < requestBody.length && !usedIndexes.has(directIndex)) {
    usedIndexes.add(directIndex);
    return directIndex;
  }

  const targetMac = normalizeMacLike(entry.mac || entry.deviceMac || entry.deviceId || "");
  const targetSn = String(entry.sn || entry.serial || entry.machineId || "").trim();

  for (let index = 0; index < requestBody.length; index += 1) {
    if (usedIndexes.has(index)) {
      continue;
    }

    const item = requestBody[index] || {};
    const itemMac = normalizeMacLike(item.mac || "");
    const itemSn = String(item.sn || "").trim();
    const macMatches = targetMac ? itemMac === targetMac : true;
    const snMatches = targetSn ? itemSn === targetSn : true;

    if (macMatches && snMatches && (targetMac || targetSn)) {
      usedIndexes.add(index);
      return index;
    }
  }

  return null;
}

export function mapBatchMessage(result) {
  const summary = summarizeBatchResult(result);
  const errorDetails = getBatchErrorDetails(result?.payload);

  if (summary.total > 0 && summary.ok) {
    return `${summary.successCount} devices created successfully.`;
  }

  if (summary.successCount > 0 || summary.failureCount > 0) {
    const message = `${summary.successCount} devices created, ${summary.failureCount} failed.`;
    return errorDetails.length > 0 ? `${message} YMCS: ${errorDetails.join(" | ")}` : message;
  }

  if (errorDetails.length > 0) {
    return `YMCS: ${errorDetails.join(" | ")}`;
  }

  return result?.message || "Batch request completed.";
}

export function isBatchSuccessful(result) {
  return summarizeBatchResult(result).ok;
}
