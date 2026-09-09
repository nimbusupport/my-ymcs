import test from "node:test";
import assert from "node:assert/strict";
import {
  buildIpConfigLookupUrl,
  buildIpstackLookupUrl,
  flattenIpLookupFields,
  isValidIpAddress,
  mergeIpLookupPayloads,
  resolveIpstackAccessKey,
  summarizeIpLookupPayload
} from "../src/lib/ipLookup.js";

test("resolveIpstackAccessKey prefers explicit access key and falls back to legacy names", () => {
  assert.equal(resolveIpstackAccessKey({
    IPSTACK_ACCESS_KEY: "primary-key",
    IPSTACKKEY: "legacy-key",
    IPSTACKTOKEN: "token-key"
  }), "primary-key");

  assert.equal(resolveIpstackAccessKey({
    IPSTACKKEY: "legacy-key",
    IPSTACKTOKEN: "token-key"
  }), "legacy-key");

  assert.equal(resolveIpstackAccessKey({
    IPSTACKURL: "http://api.ipstack.com/check?access_key=url-key"
  }), "url-key");
});

test("isValidIpAddress accepts IPv4 and IPv6 values", () => {
  assert.equal(isValidIpAddress("147.235.219.220"), true);
  assert.equal(isValidIpAddress("2001:4860:4860::8888"), true);
  assert.equal(isValidIpAddress("not-an-ip"), false);
});

test("buildIpstackLookupUrl converts a requester-ip endpoint into a direct lookup", () => {
  const url = buildIpstackLookupUrl("147.235.219.220", {
    IPSTACKTOKEN: "live-token",
    IPSTACKURL: "http://api.ipstack.com/check?access_key=old-token"
  });

  assert.equal(
    url,
    "http://api.ipstack.com/147.235.219.220?access_key=live-token&format=1"
  );
});

test("buildIpConfigLookupUrl targets the JSON endpoint for direct IP lookups", () => {
  const url = buildIpConfigLookupUrl("5.29.86.42", {
    IPCONFIG_BASE_URL: "https://ipconfig.io"
  });

  assert.equal(url, "https://ipconfig.io/json?ip=5.29.86.42");
});

test("flattenIpLookupFields keeps nested object paths readable", () => {
  const fields = flattenIpLookupFields({
    ip: "147.235.219.220",
    connection: {
      isp: "Example ISP"
    },
    location: {
      languages: [
        { code: "en", name: "English" }
      ]
    }
  });

  assert.deepEqual(fields, [
    {
      path: "ip",
      label: "Ip",
      value: "147.235.219.220"
    },
    {
      path: "connection.isp",
      label: "Connection / Isp",
      value: "Example ISP"
    },
    {
      path: "location.languages.1.code",
      label: "Location / Languages / #1 / Code",
      value: "en"
    },
    {
      path: "location.languages.1.name",
      label: "Location / Languages / #1 / Name",
      value: "English"
    }
  ]);
});

test("summarizeIpLookupPayload extracts ISP-facing fields and full detail list", () => {
  const summary = summarizeIpLookupPayload({
    ip: "147.235.219.220",
    country_name: "United States",
    region_name: "California",
    city: "Los Angeles",
    connection_type: "broadband",
    connection: {
      isp: "Example ISP",
      carrier: "Example Carrier"
    }
  });

  assert.equal(summary.ip, "147.235.219.220");
  assert.equal(summary.isp, "Example ISP");
  assert.equal(summary.carrier, "Example Carrier");
  assert.equal(summary.connectionType, "broadband");
  assert.equal(summary.countryName, "United States");
  assert.equal(summary.fields.length > 0, true);
});

test("summarizeIpLookupPayload falls back to ASN organization fields", () => {
  const summary = summarizeIpLookupPayload({
    ip: "5.29.86.42",
    country: "Israel",
    region_name: "Central District",
    city: "Raanana",
    asn: "AS12849",
    asn_org: "Hot-Net internet services Ltd."
  });

  assert.equal(summary.isp, "Hot-Net internet services Ltd.");
  assert.equal(summary.organization, "Hot-Net internet services Ltd.");
  assert.equal(summary.countryName, "Israel");
});

test("mergeIpLookupPayloads preserves primary geo data and fills missing ISP metadata", () => {
  const merged = mergeIpLookupPayloads(
    {
      ip: "5.29.86.42",
      country_name: "Israel",
      region_name: "Hadarom",
      city: "Eilat",
      connection_type: "cable"
    },
    {
      ip: "5.29.86.42",
      region_name: "Central District",
      city: "Raanana",
      asn: "AS12849",
      asn_org: "Hot-Net internet services Ltd.",
      hostname: "host.example.test"
    }
  );

  assert.equal(merged.country_name, "Israel");
  assert.equal(merged.region_name, "Hadarom");
  assert.equal(merged.city, "Eilat");
  assert.equal(merged.hostname, "host.example.test");
  assert.equal(merged.connection.isp, "Hot-Net internet services Ltd.");
  assert.equal(merged.organization, "Hot-Net internet services Ltd.");
});
