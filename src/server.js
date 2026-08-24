import dotenv from "dotenv";
import crypto from "crypto";
import http from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { addDevice, addDevices, listDevices, listModels, listSites } from "./lib/ymcsClient.js";
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
    const [emailPart, siteIdPart, siteNamePart] = entry.split("|").map((part) => String(part || "").trim());
    const email = emailPart.toLowerCase();

    if (!email || !siteIdPart || !siteNamePart) {
      continue;
    }

    map.set(email, {
      siteId: siteIdPart,
      name: siteNamePart,
      locked: true,
      hideSiteId: true
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

  const normalizedEmail = String(payload.email).trim().toLowerCase();
  const userSiteScope = getUserSiteScope(normalizedEmail);

  if (normalizedEmail !== adminEmail && !userSiteScope) {
    return null;
  }

  return {
    email: normalizedEmail,
    role: normalizedEmail === adminEmail ? "admin" : "worker",
    authProvider: String(payload.authProvider || "supabase").trim(),
    siteScope: userSiteScope
  };
}

function getAuthUser(req) {
  return getUserFromSessionCookie(req);
}

function getUserSiteScope(email) {
  return userSiteScopeMap.get(String(email || "").trim().toLowerCase()) || null;
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
    return {
      mainSite: {
        ...scopedSite,
        name: user.siteScope.name
      },
      allowedSiteIds: new Set([scopedSite.siteId])
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

function mapBatchMessage(result) {
  const successCount = Number(result?.payload?.successCount ?? 0);
  const failureCount = Number(result?.payload?.failureCount ?? 0);
  const total = Number(result?.payload?.total ?? result?.requestBody?.length ?? successCount + failureCount);

  if (total > 0 && failureCount === 0 && successCount === total) {
    return `${successCount} devices created successfully.`;
  }

  if (successCount > 0 || failureCount > 0) {
    return `${successCount} devices created, ${failureCount} failed.`;
  }

  return result?.message || "Batch request completed.";
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
      const normalizedEmail = String(authResult?.user?.email || email).trim().toLowerCase();
      const userSiteScope = getUserSiteScope(normalizedEmail);

      if (normalizedEmail !== adminEmail && !userSiteScope) {
        sendJson(res, 403, {
          ok: false,
          message: "This account does not have admin access."
        });
        return;
      }

      const user = {
        email: normalizedEmail,
        role: normalizedEmail === adminEmail ? "admin" : "worker",
        authProvider: "supabase",
        siteScope: userSiteScope
      };

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

    try {
      const ymcsSites = await getYmcsSites();
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
        const [sites, devices] = await Promise.all([
          getYmcsSites(process.env),
          getYmcsDevices(process.env)
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

  if (req.method === "POST" && url.pathname === "/api/devices") {
    try {
      const user = getAuthUser(req);
      const body = applyUserSiteScopeToDevicePayload(await readJsonBody(req), user);
      const result = await addDevice(body);
      cachedDevices = {
        expiresAt: 0,
        items: []
      };
      sendJson(res, result.ok ? 200 : result.status || 502, result);
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
      const result = await addDevices(body);
      cachedDevices = {
        expiresAt: 0,
        items: []
      };

      sendJson(res, result.ok ? 200 : result.status || 502, {
        ...result,
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
