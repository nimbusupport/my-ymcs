import net from "node:net";

const DEFAULT_IPSTACK_BASE_URL = "http://api.ipstack.com/";
const DEFAULT_IPCONFIG_BASE_URL = "https://ipconfig.io/json";

function firstNonEmpty(...values) {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeBaseUrl(rawValue, fallbackUrl = DEFAULT_IPSTACK_BASE_URL) {
  const normalized = String(rawValue || "").trim();

  if (!normalized) {
    return new URL(fallbackUrl);
  }

  try {
    return new URL(normalized);
  } catch {
    try {
      return new URL(`http://${normalized.replace(/^\/+/, "")}`);
    } catch {
      return new URL(fallbackUrl);
    }
  }
}

function parseAccessKeyFromUrl(rawValue) {
  const normalized = String(rawValue || "").trim();

  if (!normalized) {
    return "";
  }

  try {
    return String(new URL(normalized).searchParams.get("access_key") || "").trim();
  } catch {
    return "";
  }
}

function formatFieldSegment(segment) {
  const raw = String(segment || "").trim();

  if (!raw) {
    return "";
  }

  if (/^\d+$/.test(raw)) {
    return `#${raw}`;
  }

  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatFieldLabel(path) {
  return path.map((segment) => formatFieldSegment(segment)).filter(Boolean).join(" / ");
}

function formatFieldValue(value) {
  if (value == null || value === "") {
    return "-";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => formatFieldValue(item)).join(", ") : "-";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

export function resolveIpstackAccessKey(env = process.env) {
  return firstNonEmpty(
    env.IPSTACK_ACCESS_KEY,
    env.IPSTACKKEY,
    env.IPSTACKTOKEN,
    parseAccessKeyFromUrl(env.IPSTACKURL)
  );
}

export function isValidIpAddress(value) {
  return net.isIP(String(value || "").trim()) !== 0;
}

export function buildIpstackLookupUrl(ipAddress, env = process.env) {
  const normalizedIp = String(ipAddress || "").trim();

  if (!isValidIpAddress(normalizedIp)) {
    throw new Error("A valid IP address is required for the lookup.");
  }

  const accessKey = resolveIpstackAccessKey(env);
  if (!accessKey) {
    throw new Error("Missing IPSTACK access key configuration.");
  }

  const url = normalizeBaseUrl(
    firstNonEmpty(env.IPSTACK_BASE_URL, env.IPSTACKURL, DEFAULT_IPSTACK_BASE_URL),
    DEFAULT_IPSTACK_BASE_URL
  );

  url.pathname = `/${encodeURIComponent(normalizedIp)}`;
  url.searchParams.set("access_key", accessKey);
  if (!url.searchParams.has("format")) {
    url.searchParams.set("format", "1");
  }

  return url.toString();
}

export function buildIpConfigLookupUrl(ipAddress, env = process.env) {
  const normalizedIp = String(ipAddress || "").trim();

  if (!isValidIpAddress(normalizedIp)) {
    throw new Error("A valid IP address is required for the lookup.");
  }

  const url = normalizeBaseUrl(
    firstNonEmpty(env.IPCONFIG_LOOKUP_URL, env.IPCONFIG_BASE_URL, DEFAULT_IPCONFIG_BASE_URL),
    DEFAULT_IPCONFIG_BASE_URL
  );

  if (!String(url.pathname || "").trim() || url.pathname === "/") {
    url.pathname = "/json";
  }

  url.searchParams.set("ip", normalizedIp);
  return url.toString();
}

export function flattenIpLookupFields(value, path = []) {
  if (Array.isArray(value)) {
    if (value.every((entry) => entry == null || typeof entry !== "object")) {
      return [{
        path: path.join("."),
        label: formatFieldLabel(path),
        value: formatFieldValue(value)
      }];
    }

    return value.flatMap((entry, index) => flattenIpLookupFields(entry, [...path, String(index + 1)]));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => flattenIpLookupFields(nestedValue, [...path, key]));
  }

  if (path.length === 0) {
    return [];
  }

  return [{
    path: path.join("."),
    label: formatFieldLabel(path),
    value: formatFieldValue(value)
  }];
}

export function summarizeIpLookupPayload(payload, requestedIp = "") {
  const source = payload && typeof payload === "object" ? payload : {};
  const connection = source.connection && typeof source.connection === "object" ? source.connection : {};
  const fields = flattenIpLookupFields(source);
  const asnOrganization = firstNonEmpty(source.asn_org, source.as_name, source.org);

  return {
    ip: firstNonEmpty(source.ip, requestedIp),
    isp: firstNonEmpty(connection.isp, source.isp, asnOrganization),
    organization: firstNonEmpty(
      connection.organization,
      connection.organization_name,
      source.organization,
      source.organization_name,
      asnOrganization
    ),
    carrier: firstNonEmpty(connection.carrier),
    hostname: firstNonEmpty(source.hostname),
    connectionType: firstNonEmpty(source.connection_type, connection.type),
    countryName: firstNonEmpty(source.country_name, source.country),
    regionName: firstNonEmpty(source.region_name, source.region),
    city: firstNonEmpty(source.city),
    fields
  };
}

export function mergeIpLookupPayloads(primaryPayload, fallbackPayload) {
  const primary = primaryPayload && typeof primaryPayload === "object" ? primaryPayload : {};
  const fallback = fallbackPayload && typeof fallbackPayload === "object" ? fallbackPayload : {};
  const primaryConnection = primary.connection && typeof primary.connection === "object" ? primary.connection : {};
  const fallbackConnection = fallback.connection && typeof fallback.connection === "object" ? fallback.connection : {};
  const fallbackIsp = firstNonEmpty(
    fallbackConnection.isp,
    fallback.isp,
    fallback.asn_org,
    fallback.as_name,
    fallback.org
  );
  const fallbackOrganization = firstNonEmpty(
    fallbackConnection.organization,
    fallbackConnection.organization_name,
    fallback.organization,
    fallback.organization_name,
    fallback.org,
    fallback.asn_org
  );

  const mergedConnection = {
    ...fallbackConnection,
    ...primaryConnection,
    isp: firstNonEmpty(primaryConnection.isp, fallbackIsp),
    organization: firstNonEmpty(
      primaryConnection.organization,
      primaryConnection.organization_name,
      fallbackOrganization
    ),
    organization_name: firstNonEmpty(primaryConnection.organization_name, fallbackOrganization),
    carrier: firstNonEmpty(primaryConnection.carrier, fallbackConnection.carrier)
  };

  return {
    ...fallback,
    ...primary,
    ip: firstNonEmpty(primary.ip, fallback.ip),
    hostname: firstNonEmpty(primary.hostname, fallback.hostname),
    isp: firstNonEmpty(primary.isp, fallback.isp, fallbackIsp),
    organization: firstNonEmpty(primary.organization, fallback.organization, fallbackOrganization),
    organization_name: firstNonEmpty(
      primary.organization_name,
      fallback.organization_name,
      fallbackOrganization
    ),
    country_name: firstNonEmpty(primary.country_name, fallback.country_name, fallback.country),
    region_name: firstNonEmpty(primary.region_name, fallback.region_name, fallback.region),
    city: firstNonEmpty(primary.city, fallback.city),
    connection_type: firstNonEmpty(primary.connection_type, fallback.connection_type, fallbackConnection.type),
    asn: firstNonEmpty(primary.asn, fallback.asn),
    asn_org: firstNonEmpty(primary.asn_org, fallback.asn_org),
    connection: mergedConnection
  };
}
