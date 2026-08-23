import { resolveModelSelection } from "../config/deviceModels.js";

const TOKEN_API_PATH = "v2/token";
const DEVICE_API_PATH = "v2/dm/devices";
const BATCH_DEVICE_API_PATH = "v2/dm/addDevices";
const MODELS_API_PATH = "v2/dm/models";
const LIST_SITES_API_PATH = "v2/dm/listSites";
const LIST_DEVICES_API_PATH = "v2/dm/listDevices";
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const tokenCache = new Map();

function normalizeRegion(value) {
  const region = String(value || "EU").trim().toUpperCase();
  return region || "EU";
}

function getDefaultBaseUrl(region) {
  return `https://${normalizeRegion(region).toLowerCase()}-api.ymcs.yealink.com`;
}

function ensureBaseUrl(value, region) {
  const base = String(value || getDefaultBaseUrl(region)).trim();
  return base.startsWith("http://") || base.startsWith("https://") ? base : `https://${base}`;
}

function createNonce() {
  return globalThis.crypto.randomUUID().replace(/-/g, "");
}

function encodeBasicCredentials(accessKeyId, accessKeySecret) {
  return Buffer.from(`${accessKeyId}:${accessKeySecret}`, "utf8").toString("base64");
}

function buildFormattedQueryString(queryEntries) {
  return queryEntries
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`)
    .join("&");
}

function parseYmcsPayload(rawText) {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function getRequestIdentity(options = {}) {
  return {
    timestamp: String(options.timestamp ?? Date.now()),
    nonce: options.nonce ?? createNonce()
  };
}

function getTokenCacheKey(baseUrl, accessKeyId) {
  return `${baseUrl}|${accessKeyId}`;
}

export function buildTokenRequest(env = process.env, options = {}) {
  const accessKeyId = env.YMCS_ACCESS_KEY_ID;
  const accessKeySecret = env.YMCS_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    throw new Error("Missing YMCS_ACCESS_KEY_ID or YMCS_ACCESS_KEY_SECRET in the environment.");
  }

  const baseUrl = ensureBaseUrl(env.YMCS_BASE_URL, env.YMCS_REGION);
  const tokenPath = String(env.YMCS_TOKEN_PATH || TOKEN_API_PATH).replace(/^\/+/, "");
  const { timestamp, nonce } = getRequestIdentity(options);
  const body = {
    grant_type: String(env.YMCS_TOKEN_GRANT_TYPE || "client_credentials")
  };
  const bodyJson = JSON.stringify(body);

  return {
    url: `${baseUrl.replace(/\/$/, "")}/${tokenPath}`,
    body,
    bodyJson,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${encodeBasicCredentials(accessKeyId, accessKeySecret)}`,
      "Content-Type": "application/json;charset=UTF-8",
      timestamp,
      nonce
    }
  };
}

function buildAuthorizedRequest(method, apiPath, env, options = {}) {
  const accessToken = String(options.accessToken ?? env.YMCS_ACCESS_TOKEN ?? "").trim();

  if (!accessToken) {
    throw new Error("Missing YMCS access token. Call getAccessToken() first or provide options.accessToken.");
  }

  const baseUrl = ensureBaseUrl(env.YMCS_BASE_URL, env.YMCS_REGION);
  const { timestamp, nonce } = getRequestIdentity(options);
  const queryEntries = Array.isArray(options.queryEntries) ? options.queryEntries : [];
  const formattedQuery = buildFormattedQueryString(queryEntries);
  const body = options.body ?? null;
  const bodyJson = body ? JSON.stringify(body) : "";
  const url = `${baseUrl.replace(/\/$/, "")}/${apiPath}${formattedQuery ? `?${formattedQuery}` : ""}`;

  return {
    url,
    body,
    bodyJson,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      timestamp,
      nonce,
      ...(bodyJson ? { "Content-Type": "application/json;charset=UTF-8" } : {}),
    }
  };
}

export function normalizeMac(value) {
  return String(value ?? "").replace(/[^a-fA-F0-9]/g, "").toLowerCase();
}

export function validateDeviceInput(input) {
  const name = String(input?.name ?? "").trim();
  const mac = normalizeMac(input?.mac);
  const sn = String(input?.sn ?? input?.machineId ?? "").trim();
  const model = resolveModelSelection(input?.modelInput ?? input?.modelId);
  const siteId = String(input?.siteId ?? "").trim();

  if (!mac || mac.length < 12 || mac.length > 17) {
    throw new Error("MAC must contain 12 to 17 hexadecimal characters.");
  }

  if (!sn) {
    throw new Error("Machine ID(Serial Number) is required.");
  }

  if (sn.length > 128) {
    throw new Error("Machine ID(Serial Number) must be 128 characters or fewer.");
  }

  if (name.length > 128) {
    throw new Error("Device Name must be 128 characters or fewer.");
  }

  if (!model.ok) {
    throw new Error(model.message);
  }

  return {
    mac,
    sn,
    name,
    siteId,
    modelId: model.modelId,
    shortType: model.shortType,
    modelSource: model.source
  };
}

export function buildAddDeviceRequest(input, env = process.env, options = {}) {
  const device = validateDeviceInput(input);

  const body = {
    mac: device.mac,
    sn: device.sn,
    deviceType: 1,
    modelId: device.modelId
  };

  if (device.name) {
    body.name = device.name;
  }

  if (device.siteId) {
    body.siteId = device.siteId;
  }

  const request = buildAuthorizedRequest("POST", DEVICE_API_PATH, env, {
    body,
    accessToken: options.accessToken,
    timestamp: options.timestamp,
    nonce: options.nonce
  });

  return {
    ...request,
    device,
    body
  };
}

export function buildBatchAddDevicesRequest(input = {}, env = process.env, options = {}) {
  const rawDevices = Array.isArray(input?.devices) ? input.devices : [];

  if (rawDevices.length === 0) {
    throw new Error("At least one device is required.");
  }

  if (rawDevices.length > 100) {
    throw new Error("YMCS batch add accepts at most 100 devices per request.");
  }

  const devices = rawDevices.map((item) => validateDeviceInput(item));
  const body = devices.map((device) => {
    const payload = {
      mac: device.mac,
      sn: device.sn,
      deviceType: 1,
      modelId: device.modelId
    };

    if (device.name) {
      payload.name = device.name;
    }

    if (device.siteId) {
      payload.siteId = device.siteId;
    }

    return payload;
  });

  const request = buildAuthorizedRequest("POST", BATCH_DEVICE_API_PATH, env, {
    body,
    accessToken: options.accessToken,
    timestamp: options.timestamp,
    nonce: options.nonce
  });

  return {
    ...request,
    devices,
    body
  };
}

export function buildListModelsRequest(input = {}, env = process.env, options = {}) {
  const deviceType = Number(input?.deviceType ?? 1);

  if (!Number.isInteger(deviceType)) {
    throw new Error("deviceType must be an integer.");
  }

  return buildAuthorizedRequest("GET", MODELS_API_PATH, env, {
    queryEntries: [["deviceType", deviceType]],
    accessToken: options.accessToken,
    timestamp: options.timestamp,
    nonce: options.nonce
  });
}

export function buildListSitesRequest(input = {}, env = process.env, options = {}) {
  const skip = Number(input?.skip ?? 0);
  const limit = Number(input?.limit ?? 500);
  const autoCount = input?.autoCount ?? true;

  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error("skip must be a non-negative integer.");
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("limit must be a positive integer.");
  }

  return buildAuthorizedRequest("POST", LIST_SITES_API_PATH, env, {
    body: {
      skip,
      limit,
      autoCount: Boolean(autoCount)
    },
    accessToken: options.accessToken,
    timestamp: options.timestamp,
    nonce: options.nonce
  });
}

export function buildListDevicesRequest(input = {}, env = process.env, options = {}) {
  const skip = Number(input?.skip ?? 0);
  const limit = Number(input?.limit ?? 200);
  const autoCount = input?.autoCount ?? true;
  const siteId = String(input?.siteId ?? "").trim();

  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error("skip must be a non-negative integer.");
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("limit must be a positive integer.");
  }

  const body = {
    skip,
    limit,
    autoCount: Boolean(autoCount)
  };

  if (siteId) {
    body.siteId = siteId;
  }

  return buildAuthorizedRequest("POST", LIST_DEVICES_API_PATH, env, {
    body,
    accessToken: options.accessToken,
    timestamp: options.timestamp,
    nonce: options.nonce
  });
}

export function extractYmcsMessage(payload) {
  if (!payload) {
    return "No response payload was returned from YMCS.";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload.message === "string" && payload.message) {
    return payload.message;
  }

  if (typeof payload.msg === "string" && payload.msg) {
    return payload.msg;
  }

  if (typeof payload.error === "string" && payload.error) {
    return payload.error;
  }

  if (payload.error && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (typeof first === "string") {
      return first;
    }

    if (first && typeof first.message === "string") {
      return first.message;
    }
  }

  if (payload.id) {
    return "Device created successfully.";
  }

  return "YMCS responded without a standard message field.";
}

export async function getAccessToken(env = process.env, fetchImpl = fetch) {
  const baseUrl = ensureBaseUrl(env.YMCS_BASE_URL, env.YMCS_REGION);
  const accessKeyId = env.YMCS_ACCESS_KEY_ID;

  if (!accessKeyId) {
    throw new Error("Missing YMCS_ACCESS_KEY_ID in the environment.");
  }

  const cacheKey = getTokenCacheKey(baseUrl, accessKeyId);
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  const request = buildTokenRequest(env);
  const response = await fetchImpl(request.url, {
    method: "POST",
    headers: request.headers,
    body: request.bodyJson
  });
  const rawText = await response.text();
  const payload = parseYmcsPayload(rawText);

  if (!response.ok) {
    throw new Error(extractYmcsMessage(payload) || `YMCS token request failed with status ${response.status}.`);
  }

  const accessToken = String(payload?.access_token ?? "").trim();

  if (!accessToken) {
    throw new Error("YMCS token response did not include access_token.");
  }

  const expiresInSeconds = Number(payload?.expires_in ?? 0);
  const safeExpiresAt = expiresInSeconds > 0
    ? Date.now() + Math.max(0, (expiresInSeconds * 1000) - TOKEN_REFRESH_BUFFER_MS)
    : Date.now();

  tokenCache.set(cacheKey, {
    accessToken,
    expiresAt: safeExpiresAt
  });

  return accessToken;
}

export async function addDevice(input, env = process.env) {
  const accessToken = await getAccessToken(env);
  const request = buildAddDeviceRequest(input, env, { accessToken });
  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: request.bodyJson
  });

  const rawText = await response.text();
  const payload = parseYmcsPayload(rawText);

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    message: extractYmcsMessage(payload),
    payload,
    requestBody: request.body
  };
}

export async function addDevices(input = {}, env = process.env) {
  const accessToken = await getAccessToken(env);
  const request = buildBatchAddDevicesRequest(input, env, { accessToken });
  const response = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: request.bodyJson
  });

  const rawText = await response.text();
  const payload = parseYmcsPayload(rawText);

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    message: extractYmcsMessage(payload),
    payload,
    requestBody: request.body
  };
}

export async function listModels(input = {}, env = process.env) {
  const accessToken = await getAccessToken(env);
  const request = buildListModelsRequest(input, env, { accessToken });
  const response = await fetch(request.url, {
    method: "GET",
    headers: request.headers
  });

  const rawText = await response.text();
  const payload = parseYmcsPayload(rawText);

  const items = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    message: extractYmcsMessage(payload),
    payload,
    items,
    requestUrl: request.url
  };
}

export async function listSites(input = {}, env = process.env) {
  const accessToken = await getAccessToken(env);
  const initialRequest = buildListSitesRequest(input, env, { accessToken });
  const collectedItems = [];
  let lastPayload = null;
  let skip = Number(input?.skip ?? 0);
  const limit = Number(input?.limit ?? 500);
  let total = null;

  while (true) {
    const request = buildListSitesRequest({ skip, limit, autoCount: true }, env, { accessToken });
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.bodyJson
    });

    const rawText = await response.text();
    const payload = parseYmcsPayload(rawText);
    lastPayload = payload;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        message: extractYmcsMessage(payload),
        payload,
        items: [],
        requestUrl: request.url
      };
    }

    const pageItems = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

    collectedItems.push(...pageItems);
    total = Number.isInteger(payload?.total) ? payload.total : Number(payload?.total ?? collectedItems.length);

    if (pageItems.length < limit || collectedItems.length >= total) {
      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        message: extractYmcsMessage(payload),
        payload: lastPayload,
        items: collectedItems,
        requestUrl: initialRequest.url
      };
    }

    skip += pageItems.length;
  }
}

export async function listDevices(input = {}, env = process.env) {
  const accessToken = await getAccessToken(env);
  const initialRequest = buildListDevicesRequest(input, env, { accessToken });
  const collectedItems = [];
  let lastPayload = null;
  let skip = Number(input?.skip ?? 0);
  const limit = Number(input?.limit ?? 200);
  const siteId = String(input?.siteId ?? "").trim();

  while (true) {
    const request = buildListDevicesRequest({ skip, limit, autoCount: true, siteId }, env, { accessToken });
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: request.bodyJson
    });

    const rawText = await response.text();
    const payload = parseYmcsPayload(rawText);
    lastPayload = payload;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        message: extractYmcsMessage(payload),
        payload,
        items: [],
        requestUrl: request.url
      };
    }

    const pageItems = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    const total = Number(payload?.total ?? collectedItems.length + pageItems.length);

    collectedItems.push(...pageItems);

    if (pageItems.length < limit || collectedItems.length >= total) {
      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        message: extractYmcsMessage(lastPayload),
        payload: lastPayload,
        items: collectedItems,
        requestUrl: initialRequest.url
      };
    }

    skip += pageItems.length;
  }
}
