import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAddDeviceRequest,
  buildBatchAddDevicesRequest,
  buildListDevicesRequest,
  buildListModelsRequest,
  buildListSitesRequest,
  buildTokenRequest,
  extractYmcsMessage,
  normalizeMac,
  validateDeviceInput
} from "../src/lib/ymcsClient.js";

const sampleEnv = {
  YMCS_BASE_URL: "eu-api.ymcs.yealink.com",
  YMCS_ACCESS_KEY_ID: "key-123",
  YMCS_ACCESS_KEY_SECRET: "secret-456",
  YMCS_REGION: "EU"
};

test("normalizeMac strips separators and lowercases", () => {
  assert.equal(normalizeMac("AA:BB-CC.dd EEff"), "aabbccddeeff");
});

test("validateDeviceInput requires serial number", () => {
  assert.throws(
    () => validateDeviceInput({ mac: "aabbccddeeff", modelId: "model-id-1" }),
    /Machine ID/
  );
});

test("buildTokenRequest builds Basic auth request for client credentials", () => {
  const request = buildTokenRequest(sampleEnv, {
    timestamp: 1730000000000,
    nonce: "nonce-123"
  });

  assert.equal(request.url, "https://eu-api.ymcs.yealink.com/v2/token");
  assert.deepEqual(request.body, { grant_type: "client_credentials" });
  assert.equal(request.headers.Authorization, "Basic a2V5LTEyMzpzZWNyZXQtNDU2");
  assert.equal(request.headers.timestamp, "1730000000000");
  assert.equal(request.headers.nonce, "nonce-123");
  assert.equal(request.headers.Accept, "application/json");
  assert.equal(request.headers["Content-Type"], "application/json;charset=UTF-8");
});

test("buildAddDeviceRequest builds bearer-token request", () => {
  const request = buildAddDeviceRequest(
    {
      name: "Lobby Phone",
      mac: "AA:BB:CC:DD:EE:FF",
      sn: "SN-12345",
      modelId: "61e659e4d78d42ebada88ef1eb751b64",
      siteId: "site-1"
    },
    sampleEnv,
    {
      accessToken: "token-789",
      timestamp: 1730000000000,
      nonce: "nonce-123"
    }
  );

  assert.equal(request.url, "https://eu-api.ymcs.yealink.com/v2/dm/devices");
  assert.equal(request.body.mac, "aabbccddeeff");
  assert.equal(request.body.sn, "SN-12345");
  assert.equal(request.body.deviceType, 1);
  assert.equal(request.body.modelId, "61e659e4d78d42ebada88ef1eb751b64");
  assert.equal(request.body.name, "Lobby Phone");
  assert.equal(request.body.siteId, "site-1");
  assert.equal(request.headers.Authorization, "Bearer token-789");
  assert.equal(request.headers.nonce, "nonce-123");
  assert.equal(request.headers.timestamp, "1730000000000");
  assert.equal(request.headers.Accept, "application/json");
  assert.equal(request.headers["Content-Type"], "application/json;charset=UTF-8");
});

test("buildBatchAddDevicesRequest builds YMCS batch payload", () => {
  const request = buildBatchAddDevicesRequest(
    {
      devices: [
        {
          name: "Lobby Phone",
          mac: "AA:BB:CC:DD:EE:FF",
          sn: "SN-12345",
          modelId: "61e659e4d78d42ebada88ef1eb751b64"
        },
        {
          name: "Warehouse",
          mac: "11:22:33:44:55:66",
          sn: "SN-999",
          modelId: "1549deee08c940faa861c60d764ab0cd",
          siteId: "site-2"
        }
      ]
    },
    sampleEnv,
    {
      accessToken: "token-789",
      timestamp: 1730000000000,
      nonce: "nonce-123"
    }
  );

  assert.equal(request.url, "https://eu-api.ymcs.yealink.com/v2/dm/addDevices");
  assert.equal(request.body.length, 2);
  assert.equal(request.body[0].mac, "aabbccddeeff");
  assert.equal(request.body[1].siteId, "site-2");
  assert.equal(request.headers.Authorization, "Bearer token-789");
});

test("buildListModelsRequest targets YMCS models endpoint without site info", () => {
  const request = buildListModelsRequest(
    {
      deviceType: 1,
      siteId: "site-should-not-be-used"
    },
    sampleEnv,
    {
      accessToken: "token-789",
      timestamp: 1730000000000,
      nonce: "nonce-123"
    }
  );

  assert.equal(request.url, "https://eu-api.ymcs.yealink.com/v2/dm/models?deviceType=1");
  assert.equal(request.bodyJson, "");
  assert.equal(request.headers.Authorization, "Bearer token-789");
  assert.equal(request.headers.nonce, "nonce-123");
  assert.equal(request.headers.timestamp, "1730000000000");
  assert.equal(request.headers.Accept, "application/json");
  assert.equal(request.headers["Content-Type"], undefined);
});

test("buildListSitesRequest targets YMCS site list endpoint", () => {
  const request = buildListSitesRequest(
    {
      skip: 0,
      limit: 250,
      autoCount: true
    },
    sampleEnv,
    {
      accessToken: "token-789",
      timestamp: 1730000000000,
      nonce: "nonce-123"
    }
  );

  assert.equal(request.url, "https://eu-api.ymcs.yealink.com/v2/dm/listSites");
  assert.deepEqual(request.body, {
    skip: 0,
    limit: 250,
    autoCount: true
  });
  assert.equal(request.headers.Authorization, "Bearer token-789");
  assert.equal(request.headers.nonce, "nonce-123");
  assert.equal(request.headers.timestamp, "1730000000000");
  assert.equal(request.headers.Accept, "application/json");
  assert.equal(request.headers["Content-Type"], "application/json;charset=UTF-8");
});

test("buildListDevicesRequest targets YMCS device list endpoint", () => {
  const request = buildListDevicesRequest(
    {
      skip: 0,
      limit: 200,
      siteId: "site-2"
    },
    sampleEnv,
    {
      accessToken: "token-789",
      timestamp: 1730000000000,
      nonce: "nonce-123"
    }
  );

  assert.equal(request.url, "https://eu-api.ymcs.yealink.com/v2/dm/listDevices");
  assert.deepEqual(request.body, {
    skip: 0,
    limit: 200,
    autoCount: true,
    siteId: "site-2"
  });
  assert.equal(request.headers.Authorization, "Bearer token-789");
  assert.equal(request.headers["Content-Type"], "application/json;charset=UTF-8");
});

test("extractYmcsMessage prefers structured message fields", () => {
  assert.equal(extractYmcsMessage({ message: "bad request" }), "bad request");
  assert.equal(extractYmcsMessage({ errors: [{ message: "first failure" }] }), "first failure");
  assert.equal(extractYmcsMessage({ id: "abc123" }), "Device created successfully.");
});
