import dotenv from "dotenv";
import crypto from "crypto";
import http from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  addDevice,
  addDevices,
  addSite,
  addSipAccount,
  bindAccountsToDevice,
  listAccounts,
  listDevices,
  listModels,
  listSites
} from "./lib/ymcsClient.js";
import {
  getBatchFailureRows,
  getBatchErrorEntries,
  isBatchSuccessful,
  mapBatchMessage,
  summarizeBatchResult
} from "./lib/ymcsBatchResult.js";
import {
  buildExistingDeviceConflictMessage,
  findExistingDeviceConflicts
} from "./lib/deviceConflicts.js";
import {
  buildIpConfigLookupUrl,
  buildIpstackLookupUrl,
  isValidIpAddress,
  mergeIpLookupPayloads,
  summarizeIpLookupPayload
} from "./lib/ipLookup.js";
import { phoneModels, searchPhoneModels } from "./config/deviceModels.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const imageDir = path.join(__dirname, "..", "image");
const port = Number(process.env.PORT || 3000);
const sessionTtlMs = Number(process.env.SESSION_TTL_MS || 30 * 24 * 60 * 60 * 1000);
const sessionCookieName = "ymcs_admin_session";
const supabaseUrl = String(
  process.env.SUPABASE_URL
  || process.env.VITE_SUPABASE_URL
  || process.env.NEXT_PUBLIC_SUPABASE_URL
  || ""
).trim().replace(/\/+$/, "");
const supabaseAnonKey = String(
  process.env.SUPABASE_ANON_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
  || process.env.SUPABASE_PUBLISHABLE_KEY
  || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || ""
).trim();
const adminEmail = String(process.env.ADMIN_EMAIL || "support@nimbusip.com").trim().toLowerCase();
const siteCreationRestrictedEmails = new Set([
  "yosef@nimbusip.com",
  "mustafa.h@nimbusip.com"
]);
const userSiteScopeMap = parseUserSiteScopes(process.env.USER_SITE_SCOPES);
const searchServerConfigs = parseSearchServers(process.env.YMCS_SEARCH_SERVERS);

const contentTypes = new Map([
  [".html", "text/html; charset=UTF-8"],
  [".css", "text/css; charset=UTF-8"],
  [".js", "application/javascript; charset=UTF-8"],
  [".json", "application/json; charset=UTF-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);
const modelCacheTtlMs = Number(process.env.YMCS_MODELS_CACHE_MS || 5 * 60 * 1000);
const siteCacheTtlMs = Number(process.env.YMCS_SITES_CACHE_MS || 5 * 60 * 1000);
const accountCacheTtlMs = Number(process.env.YMCS_ACCOUNTS_CACHE_MS || 60 * 1000);
const ipLookupCacheTtlMs = Number(process.env.IPSTACK_CACHE_MS || 15 * 60 * 1000);
const sessionSecret = String(
  process.env.SESSION_SECRET
  || process.env.YMCS_ACCESS_KEY_SECRET
  || process.env.SUPABASE_ANON_KEY
  || ""
).trim();
let cachedModels = {
  expiresAt: 0,
  items: []
};
let cachedSites = {
  expiresAt: 0,
  items: []
};
let cachedDevices = {
  expiresAt: 0,
  items: []
};
let cachedAccounts = {
  expiresAt: 0,
  items: []
};
const cachedIpLookups = new Map();

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=UTF-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=UTF-8" });
  res.end(text);
}

function parseUserSiteScopes(rawValue) {
  const map = new Map();
  const rawEntries = String(rawValue || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of rawEntries) {
    const [emailPart, siteIdPart, siteNamePart, serverIdPart] = entry
      .split("|")
      .map((part) => String(part || "").trim());
    const email = emailPart.toLowerCase();

    if (!email || !siteIdPart || !siteNamePart) {
      continue;
    }

    map.set(email, {
      siteId: siteIdPart,
      name: siteNamePart,
      locked: true,
      hideSiteId: true,
      searchServerId: serverIdPart || ""
    });
  }

  return map;
}

function parseSearchServers(rawValue) {
  const entries = String(rawValue || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const parsed = entries
    .map((entry) => {
      const [id, label, baseUrl, accessKeyId, accessKeySecret] = entry
        .split("|")
        .map((part) => String(part || "").trim());

      if (!id || !label || !baseUrl || !accessKeyId || !accessKeySecret) {
        return null;
      }

      return {
        id,
        label,
        env: {
          ...process.env,
          YMCS_BASE_URL: baseUrl,
          YMCS_ACCESS_KEY_ID: accessKeyId,
          YMCS_ACCESS_KEY_SECRET: accessKeySecret
        }
      };
    })
    .filter(Boolean);

  if (parsed.length > 0) {
    return parsed;
  }

  return [{
    id: "default",
    label: "Default",
    env: process.env
  }];
}

function createCookie(name, value, maxAgeSeconds = null) {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax"
  ];

  if (maxAgeSeconds != null) {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function sendJsonWithCookie(res, statusCode, payload, cookie) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=UTF-8",
    "Set-Cookie": cookie
  });
  res.end(JSON.stringify(payload));
}

function parseCookies(req) {
  const rawCookies = String(req.headers.cookie || "").split(";");
  const parsed = {};

  for (const entry of rawCookies) {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();

    if (key) {
      parsed[key] = value;
    }
  }

  return parsed;
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signSessionPayload(payload) {
  if (!sessionSecret) {
    throw new Error("Missing SESSION_SECRET or fallback secret for signing sessions.");
  }

  return crypto
    .createHmac("sha256", sessionSecret)
    .update(payload)
    .digest("base64url");
}

function createSessionCookieValue(user) {
  const payload = JSON.stringify({
    email: String(user?.email || "").trim().toLowerCase(),
    authProvider: String(user?.authProvider || "supabase").trim(),
    exp: Date.now() + sessionTtlMs
  });
  const encodedPayload = toBase64Url(payload);
  const signature = signSessionPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function getUserFromSessionCookie(req) {
  const cookies = parseCookies(req);
  const rawValue = cookies[sessionCookieName];

  if (!rawValue) {
    return null;
  }

  const [encodedPayload, signature] = String(rawValue).split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  let payload = null;

  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return null;
  }

  if (!payload?.email || Number(payload.exp || 0) <= Date.now()) {
    return null;
  }

  return buildAuthorizedUser([payload.email], payload.authProvider);
}

function getAuthUser(req) {
  return getUserFromSessionCookie(req);
}

function getUserSiteScope(email) {
  return userSiteScopeMap.get(String(email || "").trim().toLowerCase()) || null;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isSiteCreationRestrictedUser(user) {
  return siteCreationRestrictedEmails.has(normalizeEmail(user?.email));
}

function assertSiteCreationAllowed(user) {
  if (isSiteCreationRestrictedUser(user)) {
    throw new Error("This account cannot create sites.");
  }
}

function buildAuthorizedUser(emailCandidates = [], authProvider = "supabase") {
  const candidates = Array.from(new Set(
    emailCandidates
      .map((email) => normalizeEmail(email))
      .filter(Boolean)
  ));

  for (const email of candidates) {
    const userSiteScope = getUserSiteScope(email);
    if (email === adminEmail || userSiteScope) {
      return {
        email,
        role: email === adminEmail ? "admin" : "worker",
        authProvider: String(authProvider || "supabase").trim(),
        siteScope: userSiteScope
      };
    }
  }

  return null;
}

function getAvailableSearchServers(user) {
  if (user?.role !== "admin") {
    return [];
  }

  return searchServerConfigs.map((server) => ({
    id: server.id,
    label: server.label
  }));
}

function getSearchServerConfigById(serverId) {
  const normalizedId = String(serverId || "").trim();

  if (!normalizedId) {
    return null;
  }

  return searchServerConfigs.find((server) => server.id === normalizedId) || null;
}

function getYmcsEnvForUser(user) {
  const scopedServerId = String(user?.siteScope?.searchServerId || "").trim();
  const scopedServer = getSearchServerConfigById(scopedServerId);
  return scopedServer?.env || process.env;
}

function isPublicRequest(method, pathname) {
  if (pathname === "/" || pathname === "/index.html" || pathname === "/styles.css" || pathname === "/app.js") {
    return true;
  }

  if (pathname.startsWith("/image/")) {
    return true;
  }

  if (pathname === "/api/health") {
    return true;
  }

  if (pathname === "/api/auth/session" || pathname === "/api/auth/login" || pathname === "/api/auth/logout") {
    return true;
  }

  return method === "GET" && !pathname.startsWith("/api/");
}

function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    sendJson(res, 401, {
      ok: false,
      message: "Authentication required."
    });
    return null;
  }

  return user;
}

async function signInWithSupabase(email, password) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing. Add SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL, plus SUPABASE_ANON_KEY, SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.msg || data?.error_description || data?.message || "Supabase login failed.");
  }

  return data;
}

function canonicalizeModelText(value) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function filterModels(items, query) {
  const needle = canonicalizeModelText(query);

  if (!needle) {
    return items;
  }

  return items.filter((item) => canonicalizeModelText(item.shortType).includes(needle));
}

function filterSites(items, query) {
  const needle = canonicalizeModelText(query);

  if (!needle) {
    return items;
  }

  return items.filter((item) => (
    canonicalizeModelText(item.name).includes(needle) ||
    canonicalizeModelText(item.siteId).includes(needle) ||
    canonicalizeModelText(item.parentName).includes(needle)
  ));
}

function getCatalogModels(query) {
  return searchPhoneModels(query).map((model) => ({
    shortType: model.shortType,
    modelId: model.modelId || "",
    hasModelId: Boolean(model.modelId)
  }));
}

function normalizeYmcsModel(item) {
  const shortType = String(item?.name ?? item?.shortType ?? "").trim();
  const modelId = String(item?.id ?? item?.modelId ?? "").trim();

  if (!shortType) {
    return null;
  }

  return {
    shortType,
    modelId,
    hasModelId: Boolean(modelId)
  };
}

function normalizeYmcsSite(item) {
  const name = String(item?.name ?? item?.siteName ?? "").trim();
  const siteId = String(item?.id ?? item?.siteId ?? "").trim();

  if (!name || !siteId) {
    return null;
  }

  return {
    name,
    siteId,
    parentId: item?.parentId == null ? "" : String(item.parentId).trim(),
    parentName: String(item?.parentName ?? item?.parentSiteName ?? "").trim(),
    description: String(item?.description ?? "").trim()
  };
}

function applySiteNameOverrides(items) {
  return items.map((item) => {
    const scopedById = Array.from(userSiteScopeMap.values()).find((scope) => scope.siteId === item.siteId);
    if (!scopedById) {
      return item;
    }

    return {
      ...item,
      name: scopedById.name,
      siteName: scopedById.name
    };
  });
}

function normalizeYmcsDevice(item) {
  const deviceId = String(item?.id ?? "").trim();
  const mac = String(item?.mac ?? "").trim().toLowerCase();
  const name = String(item?.name ?? "").trim();

  if (!deviceId || !mac) {
    return null;
  }

  return {
    id: deviceId,
    name,
    mac,
    model: String(item?.modelName ?? item?.shortType ?? "").trim(),
    modelId: String(item?.modelId ?? "").trim(),
    status: String(item?.deviceStatus ?? "").trim(),
    firmwareVersion: String(item?.programVersion ?? "").trim(),
    wanIp: String(item?.wanIp ?? "").trim(),
    lanIp: String(item?.lanIp ?? "").trim(),
    siteId: String(item?.siteId ?? "").trim(),
    siteName: String(item?.siteName ?? "").trim(),
    description: String(item?.description ?? "").trim(),
    sn: String(item?.sn ?? "").trim(),
    connectWay: String(item?.connectWay ?? "").trim(),
    accountStatus: String(item?.accountStatus ?? item?.accountName ?? name).trim()
  };
}

function normalizeYmcsAccount(item) {
  const id = String(item?.id ?? item?.accountId ?? "").trim();
  const username = String(item?.username ?? "").trim();

  if (!id || !username) {
    return null;
  }

  return {
    id,
    username,
    registerName: String(item?.registerName ?? item?.registerInfo ?? "").trim(),
    serverAddress: String(item?.serverAddress ?? item?.accountServer ?? "").trim(),
    accountType: Number.isInteger(item?.accountType) ? item.accountType : Number(item?.accountType ?? 0),
    remark: String(item?.remark ?? item?.description ?? "").trim(),
    createTime: Number(item?.createTime ?? 0),
    siteId: String(item?.siteId ?? "").trim(),
    siteName: String(item?.siteName ?? "").trim(),
    siteParentName: String(item?.siteParentName ?? "").trim()
  };
}

async function getYmcsModels() {
  if (cachedModels.expiresAt > Date.now() && cachedModels.items.length > 0) {
    return cachedModels.items;
  }

  const result = await listModels({ deviceType: 1 });
  if (!result.ok) {
    throw new Error(result.message || `YMCS model lookup failed with status ${result.status}.`);
  }

  const items = result.items
    .map(normalizeYmcsModel)
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error("YMCS model lookup returned no models.");
  }

  cachedModels = {
    expiresAt: Date.now() + modelCacheTtlMs,
    items
  };

  return items;
}

async function getYmcsSites(env = process.env) {
  if (env === process.env && cachedSites.expiresAt > Date.now() && cachedSites.items.length > 0) {
    return cachedSites.items;
  }

  const result = await listSites({ skip: 0, limit: 500 }, env);
  if (!result.ok) {
    throw new Error(result.message || `YMCS site lookup failed with status ${result.status}.`);
  }

  const items = result.items
    .map(normalizeYmcsSite)
    .filter(Boolean);
  const siteNamesById = new Map(items.map((item) => [item.siteId, item.name]));
  const hydratedItems = items
    .map((item) => ({
      ...item,
      parentName: item.parentName || siteNamesById.get(item.parentId) || ""
    }))
    .map((item) => {
      const scopedById = Array.from(userSiteScopeMap.values()).find((scope) => scope.siteId === item.siteId);
      return scopedById
        ? {
            ...item,
            name: scopedById.name
          }
        : item;
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  if (env === process.env) {
    cachedSites = {
      expiresAt: Date.now() + siteCacheTtlMs,
      items: hydratedItems
    };
  }

  return hydratedItems;
}

function getMainSiteContext(sites, user = null) {
  const scopedSite = user?.siteScope
    ? sites.find((site) => site.siteId === user.siteScope.siteId) || {
        siteId: user.siteScope.siteId,
        name: user.siteScope.name,
        parentId: "",
        parentName: "",
        description: ""
      }
    : null;

  if (scopedSite) {
    const allowedSiteIds = new Set([scopedSite.siteId]);
    let changed = true;

    while (changed) {
      changed = false;

      for (const site of sites) {
        if (site.parentId && allowedSiteIds.has(site.parentId) && !allowedSiteIds.has(site.siteId)) {
          allowedSiteIds.add(site.siteId);
          changed = true;
        }
      }
    }

    return {
      mainSite: {
        ...scopedSite,
        name: user.siteScope.name
      },
      allowedSiteIds
    };
  }

  const preferredId = String(process.env.YMCS_MAIN_SITE_ID || "").trim();
  const preferredName = String(process.env.YMCS_ENTERPRISE_NAME || "NIMBUSIP").trim();
  const rootSites = sites.filter((site) => !site.parentId);
  const mainSite = sites.find((site) => site.siteId === preferredId)
    || rootSites.find((site) => site.name === preferredName)
    || rootSites[0]
    || sites[0]
    || null;

  if (!mainSite) {
    return {
      mainSite: null,
      allowedSiteIds: new Set()
    };
  }

  const allowedSiteIds = new Set([mainSite.siteId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const site of sites) {
      if (site.parentId && allowedSiteIds.has(site.parentId) && !allowedSiteIds.has(site.siteId)) {
        allowedSiteIds.add(site.siteId);
        changed = true;
      }
    }
  }

  return {
    mainSite,
    allowedSiteIds
  };
}

function canonicalizeSearchText(value) {
  return String(value ?? "").trim().toUpperCase();
}

function filterDevices(items, query, allowedSiteIds) {
  const needle = canonicalizeSearchText(query);
  const scopedItems = allowedSiteIds?.size
    ? items.filter((item) => allowedSiteIds.has(item.siteId))
    : items;

  if (!needle) {
    return scopedItems.slice();
  }

  return scopedItems.filter((item) => [
    item.id,
    item.name,
    item.mac,
    item.sn,
    item.wanIp,
    item.lanIp,
    item.description,
    item.siteId,
    item.siteName,
    item.siteParentId,
    item.siteParentName,
    item.sitePath,
    item.accountStatus,
    item.model,
    item.searchServerLabel
  ].some((value) => canonicalizeSearchText(value).includes(needle)));
}

function applyDeviceScope(items, user) {
  if (!user?.siteScope) {
    return items;
  }

  return items.map((item) => (
    item.siteId === user.siteScope.siteId
      ? {
          ...item,
          siteName: user.siteScope.name
        }
      : item
  ));
}

function attachSearchServerLabel(items, serverLabel) {
  return items.map((item) => ({
    ...item,
    searchServerLabel: serverLabel
  }));
}

function attachSiteContextToDevices(devices, sites) {
  const sitesById = new Map(sites.map((site) => [site.siteId, site]));

  return devices.map((device) => {
    const site = sitesById.get(device.siteId);

    if (!site) {
      return {
        ...device,
        siteParentId: "",
        siteParentName: "",
        sitePath: device.siteName || ""
      };
    }

    const pathNames = [];
    let currentSite = site;

    while (currentSite) {
      if (currentSite.name) {
        pathNames.unshift(currentSite.name);
      }

      if (!currentSite.parentId) {
        break;
      }

      currentSite = sitesById.get(currentSite.parentId) || null;
    }

    return {
      ...device,
      siteParentId: site.parentId || "",
      siteParentName: site.parentName || "",
      sitePath: pathNames.join(" / ")
    };
  });
}

function applyUserSiteScopeToSiteList(items, user) {
  if (!user?.siteScope) {
    return items;
  }

  return items
    .filter((item) => item.siteId === user.siteScope.siteId)
    .map((item) => ({
      ...item,
      name: user.siteScope.name
    }));
}

function applyUserSiteScopeToDevicePayload(body, user) {
  if (!user?.siteScope) {
    return body;
  }

  if (String(body?.createSiteName ?? "").trim()) {
    return {
      ...body,
      siteId: String(body?.siteId ?? "").trim()
    };
  }

  return {
    ...body,
    siteId: user.siteScope.siteId
  };
}

function applyUserSiteScopeToBatchPayload(body, user) {
  if (!user?.siteScope) {
    return body;
  }

  const scopedDevices = Array.isArray(body?.devices)
    ? body.devices.map((device) => ({
        ...device,
        siteId: user.siteScope.siteId
      }))
    : [];

  return {
    ...body,
    devices: scopedDevices
  };
}

function buildSipAccountSuccessMessage(result) {
  const payload = result?.payload || {};
  const username = String(payload.username || result?.requestBody?.username || "").trim();
  return username
    ? `SIP account "${username}" created successfully.`
    : "SIP account created successfully.";
}

function buildSipAccountBatchMessage(result) {
  const total = Number(result?.total ?? 0);
  const successCount = Number(result?.successCount ?? 0);
  const failureCount = Number(result?.failureCount ?? 0);
  const errorDetails = Array.isArray(result?.errors)
    ? result.errors
      .map((entry) => {
        const row = Number(entry?.index ?? -1) + 1;
        const username = String(entry?.username ?? "").trim();
        const message = String(entry?.message ?? "").trim();
        const prefix = row > 0 ? `Row ${row}` : "Row";
        const subject = username ? `${prefix} (${username})` : prefix;
        return message ? `${subject}: ${message}` : subject;
      })
      .filter(Boolean)
    : [];

  if (total > 0 && failureCount === 0 && successCount === total) {
    return `${successCount} SIP account${successCount === 1 ? "" : "s"} created successfully.`;
  }

  if (successCount > 0 || failureCount > 0) {
    const summary = `${successCount} SIP account${successCount === 1 ? "" : "s"} created, ${failureCount} failed.`;
    return errorDetails.length > 0 ? `${summary} YMCS: ${errorDetails.join(" | ")}` : summary;
  }

  return "SIP account request completed.";
}

async function addSipAccountsBatch(accounts, env) {
  const items = Array.isArray(accounts) ? accounts : [];

  if (items.length === 0) {
    throw new Error("At least one SIP account is required.");
  }

  if (items.length > 100) {
    throw new Error("You can add at most 100 SIP accounts at a time.");
  }

  const created = [];
  const errors = [];
  let lastStatus = 200;

  for (let index = 0; index < items.length; index += 1) {
    const input = items[index];
    const result = await addSipAccount(input, env);

    if (result.ok) {
      created.push({
        index,
        payload: result.payload,
        requestBody: result.requestBody
      });
      continue;
    }

    errors.push({
      index,
      username: String(input?.username ?? "").trim(),
      message: result.message || "SIP account request failed."
    });
    lastStatus = result.status || lastStatus;
  }

  const summary = {
    ok: errors.length === 0,
    partial: created.length > 0 && errors.length > 0,
    status: errors.length === 0 ? 200 : lastStatus || 502,
    total: items.length,
    successCount: created.length,
    failureCount: errors.length,
    created,
    items: created.map((entry) => entry.payload),
    errors,
    requestBody: items
  };

  return {
    ...summary,
    message: buildSipAccountBatchMessage(summary)
  };
}

function getConfiguredDeviceSiteParent() {
  return {
    parentId: String(process.env.YMCS_DEVICE_SITE_PARENT_ID || "edihwhhe").trim(),
    parentName: String(process.env.YMCS_DEVICE_SITE_PARENT_NAME || "Nimbus").trim(),
    ancestorId: String(process.env.YMCS_MAIN_SITE_ID || "4llm4r7e").trim(),
    ancestorName: String(process.env.YMCS_ENTERPRISE_NAME || "NIMBUSIP").trim()
  };
}

function findDeviceSiteParent(sites, user) {
  if (user?.siteScope) {
    return sites.find((site) => site.siteId === user.siteScope.siteId) || {
      siteId: user.siteScope.siteId,
      name: user.siteScope.name,
      parentId: "",
      parentName: ""
    };
  }

  const configured = getConfiguredDeviceSiteParent();
  return sites.find((site) => site.siteId === configured.parentId)
    || sites.find((site) => (
      site.name === configured.parentName
      && (site.parentId === configured.ancestorId || site.parentName === configured.ancestorName)
    ))
    || sites.find((site) => site.name === configured.parentName)
    || getMainSiteContext(sites, user).mainSite
    || null;
}

function findSiteByNameUnderParent(sites, name, parentId) {
  const normalizedName = canonicalizeSearchText(name);
  const normalizedParentId = String(parentId || "").trim();

  if (!normalizedName || !normalizedParentId) {
    return null;
  }

  return sites.find((site) => (
    canonicalizeSearchText(site.name) === normalizedName
    && String(site.parentId || "").trim() === normalizedParentId
  )) || null;
}

async function createOrReuseDeviceSite(createSiteName, env, user) {
  assertSiteCreationAllowed(user);

  const sites = await getYmcsSites(env);
  const parentSite = findDeviceSiteParent(sites, user);

  if (!parentSite?.siteId) {
    throw new Error("Unable to resolve the parent site for creating a new device site.");
  }

  const existingSite = findSiteByNameUnderParent(sites, createSiteName, parentSite.siteId);
  if (existingSite) {
    return {
      site: existingSite,
      message: `Using existing site "${existingSite.name}" under ${parentSite.name}.`,
      reused: true
    };
  }

  const createSiteResult = await addSite({
    name: createSiteName,
    parentId: parentSite.siteId
  }, env);

  if (!createSiteResult.ok) {
    throw new Error(createSiteResult.message || "Unable to create the YMCS site for this device.");
  }

  cachedSites = {
    expiresAt: 0,
    items: []
  };

  const createdSite = {
    siteId: String(createSiteResult?.payload?.id || "").trim(),
    name: String(createSiteResult?.payload?.name || createSiteName).trim(),
    parentId: String(createSiteResult?.payload?.parentId || parentSite.siteId).trim(),
    parentName: parentSite.name,
    description: ""
  };

  if (!createdSite.siteId) {
    throw new Error("The site was created, but YMCS did not return a site ID.");
  }

  return {
    site: createdSite,
    message: `Created site "${createdSite.name}" under ${parentSite.name}.`,
    reused: false
  };
}

async function prepareDeviceSiteAssignment(body, env, user) {
  const createSiteName = String(body?.createSiteName ?? "").trim();
  if (!createSiteName) {
    return {
      body,
      createdSite: null,
      siteMessage: ""
    };
  }

  const preparedSite = await createOrReuseDeviceSite(createSiteName, env, user);

  return {
    body: {
      ...body,
      siteId: preparedSite.site.siteId
    },
    createdSite: preparedSite.site,
    siteMessage: preparedSite.message
  };
}

function buildBindAccountsMessage(result) {
  const payload = result?.payload || {};
  const successCount = Number(payload.successCount ?? 0);
  const failureCount = Number(payload.failureCount ?? 0);
  const total = Number(payload.total ?? successCount + failureCount);
  const errors = Array.isArray(payload.errors)
    ? payload.errors
      .map((item) => {
        const field = String(item?.field ?? "").trim();
        const msg = String(item?.msg ?? item?.message ?? "").trim();
        return field && msg ? `${field}: ${msg}` : (msg || field);
      })
      .filter(Boolean)
    : [];

  if (total > 0 && failureCount === 0 && successCount === total) {
    return `${successCount} SIP account binding${successCount === 1 ? "" : "s"} completed successfully.`;
  }

  if (successCount > 0 || failureCount > 0) {
    const summary = `${successCount} binding${successCount === 1 ? "" : "s"} succeeded, ${failureCount} failed.`;
    return errors.length > 0 ? `${summary} YMCS: ${errors.join(" | ")}` : summary;
  }

  return result?.message || "SIP account binding completed.";
}

function isBindAccountsSuccessful(result) {
  if (!result?.ok) {
    return false;
  }

  const payload = result?.payload || {};
  const hasOperationCounts = ["total", "successCount", "failureCount"].some((key) => payload[key] != null);
  if (!hasOperationCounts) {
    return true;
  }

  const successCount = Number(payload.successCount ?? 0);
  const failureCount = Number(payload.failureCount ?? 0);
  const total = Number(payload.total ?? successCount + failureCount);

  if (total > 0) {
    return failureCount === 0 && successCount === total;
  }

  return failureCount === 0;
}

function shouldRetryBindAccounts(result) {
  if (isBindAccountsSuccessful(result)) {
    return false;
  }

  const status = Number(result?.status ?? 0);
  if (status === 401 || status === 403) {
    return false;
  }

  const message = String(result?.message ?? "").toLowerCase();
  const payloadText = JSON.stringify(result?.payload ?? "").toLowerCase();
  const combined = `${message} ${payloadText}`;

  return (
    status === 404
    || status === 409
    || status === 429
    || status >= 500
    || combined.includes("does not exist")
    || combined.includes("has been deleted")
    || combined.includes("not found")
    || combined.includes("resource")
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function bindAccountsToDeviceWithRetry(bindingInput, env) {
  const delaysMs = [0, 700, 1400, 2200];
  let lastResult = null;

  for (let index = 0; index < delaysMs.length; index += 1) {
    if (delaysMs[index] > 0) {
      await wait(delaysMs[index]);
    }

    lastResult = await bindAccountsToDevice(bindingInput, env);
    if (!shouldRetryBindAccounts(lastResult) || index === delaysMs.length - 1) {
      return lastResult;
    }
  }

  return lastResult;
}

async function addDeviceWithOptionalSipBinding(body, env) {
  const result = await addDevice(body, env);

  if (!result.ok) {
    return result;
  }

  const accountId = String(body?.sipBinding?.accountId ?? "").trim();
  if (!accountId) {
    return {
      ...result,
      message: result.message || "Device created successfully.",
      deviceCreated: true,
      bindResult: null
    };
  }

  const deviceId = String(result?.payload?.id ?? "").trim();
  if (!deviceId) {
    return {
      ...result,
      ok: false,
      message: "Device was created, but YMCS did not return a device ID for SIP account binding.",
      deviceCreated: true,
      bindResult: null
    };
  }

  const bindResult = await bindAccountsToDeviceWithRetry({
    deviceId,
    accounts: [{
      accountId,
      lineId: Number(body?.sipBinding?.lineId ?? 1),
      accountType: Number(body?.sipBinding?.accountType ?? 0)
    }]
  }, env);

  if (isBindAccountsSuccessful(bindResult)) {
    return {
      ...result,
      message: `${result.message || "Device created successfully."} SIP account bound successfully.`,
      deviceCreated: true,
      bindResult
    };
  }

  return {
    ...result,
    ok: false,
    message: `${result.message || "Device created successfully."} SIP account binding failed. ${buildBindAccountsMessage(bindResult)}`,
    deviceCreated: true,
    bindResult
  };
}

async function getExistingDeviceConflicts(devices, env) {
  const existingDevices = await getYmcsDevices(env);
  return findExistingDeviceConflicts(devices, existingDevices);
}

function remapBatchErrorEntries(entries, keptIndexes) {
  return entries.map((entry) => {
    if (!entry || typeof entry !== "object") {
      return entry;
    }

    const rawIndex = Number(entry.index);
    if (!Number.isInteger(rawIndex) || rawIndex < 0 || rawIndex >= keptIndexes.length) {
      return entry;
    }

    return {
      ...entry,
      index: keptIndexes[rawIndex]
    };
  });
}

async function addDevicesWithDuplicateGuard(body, env) {
  const requestedDevices = Array.isArray(body?.devices) ? body.devices : [];
  const conflicts = await getExistingDeviceConflicts(requestedDevices, env);

  if (conflicts.length === 0) {
    return addDevices(body, env);
  }

  const blockedIndexes = new Set(conflicts.map((conflict) => conflict.index));
  const keptIndexes = requestedDevices
    .map((_, index) => index)
    .filter((index) => !blockedIndexes.has(index));
  const devicesToCreate = keptIndexes.map((index) => requestedDevices[index]);
  const ymcsResult = devicesToCreate.length > 0
    ? await addDevices({ ...body, devices: devicesToCreate }, env)
    : null;
  const ymcsSummary = ymcsResult ? summarizeBatchResult(ymcsResult) : {
    successCount: 0,
    failureCount: 0
  };
  const ymcsErrors = ymcsResult ? remapBatchErrorEntries(getBatchErrorEntries(ymcsResult.payload), keptIndexes) : [];
  const duplicateErrors = conflicts.map((conflict) => ({
    index: conflict.index,
    mac: conflict.mac,
    sn: conflict.sn,
    message: buildExistingDeviceConflictMessage(conflict)
  }));

  return {
    ok: ymcsResult ? ymcsResult.ok : false,
    status: ymcsResult
      ? ymcsResult.status
      : 409,
    statusText: ymcsResult?.statusText || "Conflict",
    message: duplicateErrors[0]?.message || ymcsResult?.message || "Duplicate devices were blocked.",
    payload: {
      total: requestedDevices.length,
      successCount: ymcsSummary.successCount,
      failureCount: duplicateErrors.length + ymcsSummary.failureCount,
      errors: [...duplicateErrors, ...ymcsErrors]
    },
    requestBody: requestedDevices
  };
}


async function getYmcsDevices(env = process.env) {
  if (env === process.env && cachedDevices.expiresAt > Date.now() && cachedDevices.items.length > 0) {
    return cachedDevices.items;
  }

  const result = await listDevices({ skip: 0, limit: 500 }, env);
  if (!result.ok) {
    throw new Error(result.message || `YMCS device lookup failed with status ${result.status}.`);
  }

  const items = result.items
    .map(normalizeYmcsDevice)
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name) || left.mac.localeCompare(right.mac));

  if (env === process.env) {
    cachedDevices = {
      expiresAt: Date.now() + Number(process.env.YMCS_DEVICES_CACHE_MS || 60 * 1000),
      items
    };
  }

  return items;
}

function attachSiteContextToAccounts(accounts, sites) {
  const sitesById = new Map(sites.map((site) => [site.siteId, site]));

  return accounts.map((account) => {
    if (!account.siteId) {
      return account;
    }

    const site = sitesById.get(account.siteId);
    if (!site) {
      return account;
    }

    return {
      ...account,
      siteName: account.siteName || site.name,
      siteParentName: account.siteParentName || site.parentName || ""
    };
  });
}

function filterAccounts(items, query) {
  const needle = canonicalizeSearchText(query);

  if (!needle) {
    return items.slice();
  }

  return items.filter((item) => [
    item.id,
    item.username,
    item.registerName,
    item.serverAddress,
    item.remark,
    item.siteId,
    item.siteName,
    item.siteParentName
  ].some((value) => canonicalizeSearchText(value).includes(needle)));
}

function applyUserSiteScopeToAccountPayload(body, user) {
  if (!user?.siteScope) {
    return body;
  }

  if (Array.isArray(body?.accounts)) {
    return {
      ...body,
      accounts: body.accounts.map((account) => ({
        ...account,
        siteId: user.siteScope.siteId
      }))
    };
  }

  return {
    ...body,
    siteId: user.siteScope.siteId
  };
}

function applyUserSiteScopeToAccountList(items, user) {
  if (!user?.siteScope) {
    return items;
  }

  return items
    .filter((item) => !item.siteId || item.siteId === user.siteScope.siteId)
    .map((item) => (
      item.siteId === user.siteScope.siteId
        ? {
            ...item,
            siteName: user.siteScope.name
          }
        : item
    ));
}

async function getYmcsAccounts(env = process.env) {
  if (env === process.env && cachedAccounts.expiresAt > Date.now() && cachedAccounts.items.length > 0) {
    return cachedAccounts.items;
  }

  const result = await listAccounts({ skip: 0, limit: 500 }, env);
  if (!result.ok) {
    throw new Error(result.message || `YMCS account lookup failed with status ${result.status}.`);
  }

  const normalizedAccounts = result.items
    .map(normalizeYmcsAccount)
    .filter(Boolean);
  const sites = await getYmcsSites(env).catch(() => []);
  const hydratedAccounts = applySiteNameOverrides(attachSiteContextToAccounts(normalizedAccounts, sites))
    .sort((left, right) => (
      String(left.username || "").localeCompare(String(right.username || ""))
      || String(left.registerName || "").localeCompare(String(right.registerName || ""))
    ));

  if (env === process.env) {
    cachedAccounts = {
      expiresAt: Date.now() + accountCacheTtlMs,
      items: hydratedAccounts
    };
  }

  return hydratedAccounts;
}

async function lookupIpDetails(ipAddress, env = process.env) {
  let primaryPayload = {};
  let primaryError = null;

  try {
    primaryPayload = await fetchIpLookupPayload(buildIpstackLookupUrl(ipAddress, env));
  } catch (error) {
    primaryError = error;
  }

  const primarySummary = summarizeIpLookupPayload(primaryPayload, ipAddress);
  const shouldUseFallback = Boolean(
    primaryError
    || !primarySummary.isp
    || !primarySummary.organization
    || !primarySummary.hostname
  );

  if (!shouldUseFallback) {
    return primaryPayload;
  }

  try {
    const fallbackPayload = await fetchIpLookupPayload(buildIpConfigLookupUrl(ipAddress, env));
    return mergeIpLookupPayloads(primaryPayload, fallbackPayload);
  } catch (fallbackError) {
    if (!primaryError) {
      return primaryPayload;
    }

    const primaryMessage = primaryError instanceof Error ? primaryError.message : "Primary IP lookup failed.";
    const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "Fallback IP lookup failed.";
    throw new Error(`${primaryMessage} Fallback provider: ${fallbackMessage}`);
  }
}

async function fetchIpLookupPayload(lookupUrl) {
  const cachedEntry = cachedIpLookups.get(lookupUrl);

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.payload;
  }

  const response = await fetch(lookupUrl, {
    headers: {
      Accept: "application/json"
    }
  });
  const responseText = await response.text();
  let payload = {};

  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new Error("IP lookup returned an invalid response.");
    }
  }

  if (!response.ok) {
    throw new Error(
      payload?.error?.info
      || payload?.error?.type
      || `IP lookup failed with status ${response.status}.`
    );
  }

  if (payload?.success === false || payload?.error) {
    throw new Error(payload?.error?.info || payload?.error?.type || "IP lookup failed.");
  }

  cachedIpLookups.set(lookupUrl, {
    expiresAt: Date.now() + ipLookupCacheTtlMs,
    payload
  });

  return payload;
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk.toString("utf8");
      if (raw.length > 1024 * 1024) {
        reject(new Error("Request body is too large."));
      }
    });

    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    req.on("error", reject);
  });
}

async function serveStatic(req, res, pathname) {
  const target = pathname === "/" ? "/index.html" : pathname;
  const baseDir = target.startsWith("/image/") ? imageDir : publicDir;
  const relativeTarget = target.startsWith("/image/") ? target.replace(/^\/image/, "") : target;
  const normalized = path.normalize(relativeTarget).replace(/^(\.\.[\\/])+/, "");
  const filePath = path.join(baseDir, normalized);

  if (!filePath.startsWith(baseDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    const extension = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": contentTypes.get(extension) || "application/octet-stream"
    });
    res.end(content);
  } catch {
    sendText(res, 404, "Not found");
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const isPublic = isPublicRequest(req.method, url.pathname);

  if (!isPublic && url.pathname.startsWith("/api/")) {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/session") {
    const user = getAuthUser(req);
    if (user) {
      sendJsonWithCookie(res, 200, {
        ok: true,
        authenticated: true,
        user
      }, createCookie(
        sessionCookieName,
        createSessionCookieValue(user),
        Math.floor(sessionTtlMs / 1000)
      ));
      return;
    }

    sendJson(res, 200, {
      ok: true,
      authenticated: false,
      user: null
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    try {
      const body = await readJsonBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!email || !password) {
        sendJson(res, 400, {
          ok: false,
          message: "Email and password are required."
        });
        return;
      }

      const authResult = await signInWithSupabase(email, password);
      const providerEmail = normalizeEmail(authResult?.user?.email);
      const user = buildAuthorizedUser([providerEmail, email], "supabase");

      if (!user) {
        const recognizedEmail = providerEmail || email;
        sendJson(res, 403, {
          ok: false,
          message: `This account is not allowed for this app. Signed in as ${recognizedEmail}.`
        });
        return;
      }

      const cookie = createCookie(
        sessionCookieName,
        createSessionCookieValue(user),
        Math.floor(sessionTtlMs / 1000)
      );

      sendJsonWithCookie(res, 200, {
        ok: true,
        user
      }, cookie);
    } catch (error) {
      sendJson(res, 401, {
        ok: false,
        message: error instanceof Error ? error.message : "Login failed."
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    sendJsonWithCookie(res, 200, {
      ok: true
    }, createCookie(sessionCookieName, "", 0));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/models") {
    const query = url.searchParams.get("q") || "";
    try {
      const ymcsModels = await getYmcsModels();
      const items = filterModels(ymcsModels, query);

      sendJson(res, 200, {
        items,
        total: ymcsModels.length,
        source: "ymcs"
      });
    } catch (error) {
      const items = getCatalogModels(query);

      sendJson(res, 200, {
        items,
        total: phoneModels.length,
        source: "catalog",
        fallbackReason: error instanceof Error ? error.message : "YMCS model lookup failed."
      });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/sites") {
    const query = url.searchParams.get("q") || "";
    const user = getAuthUser(req);
    const userEnv = getYmcsEnvForUser(user);

    try {
      const ymcsSites = await getYmcsSites(userEnv);
      const scopedSites = applyUserSiteScopeToSiteList(ymcsSites, user);
      const items = filterSites(scopedSites, query);

      sendJson(res, 200, {
        items,
        total: scopedSites.length,
        source: "ymcs",
        scope: user?.siteScope || null
      });
    } catch (error) {
      sendJson(res, 200, {
        items: [],
        total: 0,
        source: "empty",
        scope: user?.siteScope || null,
        fallbackReason: error instanceof Error ? error.message : "YMCS site lookup failed."
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/sites") {
    try {
      const user = getAuthUser(req);
      assertSiteCreationAllowed(user);
      const body = await readJsonBody(req);
      const name = String(body?.name ?? "").trim();

      if (!name) {
        sendJson(res, 400, {
          ok: false,
          message: "Site name is required."
        });
        return;
      }

      const result = await createOrReuseDeviceSite(name, getYmcsEnvForUser(user), user);
      sendJson(res, 200, {
        ok: true,
        reused: result.reused,
        site: result.site,
        message: result.message
      });
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        message: error instanceof Error ? error.message : "Site creation failed."
      });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/accounts") {
    const query = url.searchParams.get("q") || "";
    const user = getAuthUser(req);
    const userEnv = getYmcsEnvForUser(user);

    try {
      const ymcsAccounts = await getYmcsAccounts(userEnv);
      const scopedAccounts = applyUserSiteScopeToAccountList(ymcsAccounts, user);
      const items = filterAccounts(scopedAccounts, query);

      sendJson(res, 200, {
        items,
        total: scopedAccounts.length,
        source: "ymcs",
        scope: user?.siteScope || null
      });
    } catch (error) {
      sendJson(res, 200, {
        items: [],
        total: 0,
        source: "empty",
        scope: user?.siteScope || null,
        fallbackReason: error instanceof Error ? error.message : "YMCS account lookup failed."
      });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/search") {
    const query = url.searchParams.get("q") || "";
    const user = getAuthUser(req);

    try {
      const isAdminSearch = user?.role === "admin";
      const searchedServers = isAdminSearch
        ? getAvailableSearchServers(user)
        : [];
      let items = [];
      let scope = null;

      if (isAdminSearch) {
        const serverResults = await Promise.allSettled(searchServerConfigs.map(async (server) => {
          const [sites, devices] = await Promise.all([
            getYmcsSites(server.env),
            getYmcsDevices(server.env)
          ]);
          const hydratedDevices = attachSiteContextToDevices(devices, sites);
          return attachSearchServerLabel(filterDevices(hydratedDevices, query, null), server.label);
        }));

        items = serverResults
          .filter((result) => result.status === "fulfilled")
          .flatMap((result) => result.value)
          .sort((left, right) => (
            String(left.name || "").localeCompare(String(right.name || ""))
            || String(left.mac || "").localeCompare(String(right.mac || ""))
          ));
        scope = {
          name: "All Admin Servers"
        };
      } else {
        const userEnv = getYmcsEnvForUser(user);
        const [sites, devices] = await Promise.all([
          getYmcsSites(userEnv),
          getYmcsDevices(userEnv)
        ]);
        const { mainSite, allowedSiteIds } = getMainSiteContext(sites, user);
        const hydratedDevices = attachSiteContextToDevices(devices, sites);
        items = applyDeviceScope(filterDevices(hydratedDevices, query, allowedSiteIds), user);
        scope = user?.siteScope
          ? user.siteScope
          : mainSite
            ? {
                siteId: mainSite.siteId,
                name: mainSite.name
              }
            : null;
      }

      sendJson(res, 200, {
        items,
        total: items.length,
        scope,
        searchedServers
      });
    } catch (error) {
      const isAdminSearch = user?.role === "admin";
      sendJson(res, 200, {
        items: [],
        total: 0,
        scope: user?.siteScope || (isAdminSearch ? { name: "All Admin Servers" } : null),
        searchedServers: isAdminSearch ? getAvailableSearchServers(user) : [],
        fallbackReason: error instanceof Error ? error.message : "YMCS device lookup failed."
      });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/ip-lookup") {
    const ipAddress = String(url.searchParams.get("ip") || "").trim();

    if (!ipAddress) {
      sendJson(res, 400, {
        ok: false,
        message: "IP address is required."
      });
      return;
    }

    if (!isValidIpAddress(ipAddress)) {
      sendJson(res, 400, {
        ok: false,
        message: "Please provide a valid IPv4 or IPv6 address."
      });
      return;
    }

    try {
      const payload = await lookupIpDetails(ipAddress);
      sendJson(res, 200, {
        ok: true,
        ...summarizeIpLookupPayload(payload, ipAddress)
      });
    } catch (error) {
      sendJson(res, 502, {
        ok: false,
        message: error instanceof Error ? error.message : "IP lookup failed."
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/devices") {
    try {
      const user = getAuthUser(req);
      const scopedBody = applyUserSiteScopeToDevicePayload(await readJsonBody(req), user);
      const env = getYmcsEnvForUser(user);
      const [existingConflict] = await getExistingDeviceConflicts([scopedBody], env);
      if (existingConflict) {
        sendJson(res, 409, {
          ok: false,
          message: buildExistingDeviceConflictMessage(existingConflict),
          payload: null
        });
        return;
      }

      const prepared = await prepareDeviceSiteAssignment(scopedBody, env, user);
      const result = await addDeviceWithOptionalSipBinding(prepared.body, env);
      cachedDevices = {
        expiresAt: 0,
        items: []
      };
      sendJson(res, result.ok || result.deviceCreated ? 200 : result.status || 502, {
        ...result,
        createdSite: prepared.createdSite,
        message: [prepared.siteMessage, result.message].filter(Boolean).join(" ")
      });
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
        payload: null
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/accounts") {
    try {
      const user = getAuthUser(req);
      const body = applyUserSiteScopeToAccountPayload(await readJsonBody(req), user);
      const isBatchRequest = Array.isArray(body?.accounts);
      const result = isBatchRequest
        ? await addSipAccountsBatch(body.accounts, getYmcsEnvForUser(user))
        : await addSipAccount(body, getYmcsEnvForUser(user));
      cachedAccounts = {
        expiresAt: 0,
        items: []
      };
      sendJson(
        res,
        isBatchRequest ? 200 : (result.ok ? 200 : result.status || 502),
        {
          ...result,
          message: isBatchRequest
            ? result.message
            : (result.ok ? buildSipAccountSuccessMessage(result) : result.message)
        }
      );
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
        payload: null
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/devices/batch") {
    try {
      const user = getAuthUser(req);
      const body = applyUserSiteScopeToBatchPayload(await readJsonBody(req), user);
      const result = await addDevicesWithDuplicateGuard(body, getYmcsEnvForUser(user));
      cachedDevices = {
        expiresAt: 0,
        items: []
      };
      const batchOk = isBatchSuccessful(result);
      const failedRows = getBatchFailureRows(result);

      sendJson(res, result.ok ? 200 : result.status || 502, {
        ...result,
        ok: batchOk,
        failedRows,
        message: mapBatchMessage(result)
      });
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
        payload: null
      });
    }
    return;
  }

  await serveStatic(req, res, url.pathname);
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    sendJson(res, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Unexpected server error"
    });
  });
});

server.listen(port, () => {
  console.log(`YMCS device app running at http://localhost:${port}`);
});
