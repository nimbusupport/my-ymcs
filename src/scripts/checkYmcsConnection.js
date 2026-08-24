import dotenv from "dotenv";
import {
  buildAddDeviceRequest,
  buildListDevicesRequest,
  buildListModelsRequest,
  buildListSitesRequest,
  buildTokenRequest,
  extractYmcsMessage,
  getAccessToken,
  listDevices,
  listSites
} from "../lib/ymcsClient.js";

dotenv.config();

function getCheckTarget() {
  return String(process.argv[2] || process.env.YMCS_CHECK_TARGET || "models").trim().toLowerCase();
}

function parseJsonEnv(name) {
  const raw = process.env[name];
  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
}

function buildProbeRequest(env) {
  const target = getCheckTarget();

  if (target === "device-add") {
    const input = parseJsonEnv("YMCS_CHECK_BODY") ?? {
      name: env.YMCS_DEVICE_NAME || "ZuraAPI",
      mac: env.YMCS_DEVICE_MAC || "C4FC22707CEE",
      sn: env.YMCS_DEVICE_SN || "802017H120040531",
      modelId: env.YMCS_DEVICE_MODEL_ID || "1549deee08c940faa861c60d764ab0cd",
      siteId: env.YMCS_SITE_ID || ""
    };

    return {
      label: "Device add probe",
      method: "POST",
      input
    };
  }

  if (target === "sites") {
    const input = parseJsonEnv("YMCS_CHECK_QUERY") ?? {
      skip: Number(env.YMCS_CHECK_SKIP || 0),
      limit: Number(env.YMCS_CHECK_LIMIT || 200)
    };

    return {
      label: "Site list probe",
      method: "POST",
      input
    };
  }

  if (target === "devices") {
    const input = parseJsonEnv("YMCS_CHECK_QUERY") ?? {
      skip: Number(env.YMCS_CHECK_SKIP || 0),
      limit: Number(env.YMCS_CHECK_LIMIT || 200),
      siteId: env.YMCS_SITE_ID || ""
    };

    return {
      label: "Device list probe",
      method: "POST",
      input
    };
  }

  const input = parseJsonEnv("YMCS_CHECK_QUERY") ?? {
    deviceType: Number(env.YMCS_DEVICE_TYPE || 1)
  };

  return {
    label: "Model list probe",
    method: "GET",
    input
  };
}

async function run() {
  const env = process.env;
  const target = getCheckTarget();
  const tokenPreview = buildTokenRequest(env);
  console.log("YMCS base URL:", env.YMCS_BASE_URL || "https://eu-api.ymcs.yealink.com");
  console.log("YMCS token URL:", tokenPreview.url);
  console.log("YMCS check target:", target);

  console.log("\nToken request preview:");
  console.log(JSON.stringify({
    method: "POST",
    url: tokenPreview.url,
    body: tokenPreview.body,
    headers: {
      ...tokenPreview.headers,
      Authorization: "Basic ***"
    }
  }, null, 2));

  const accessToken = await getAccessToken(env);
  const probe = buildProbeRequest(env);
  if (target === "device-add") {
    probe.request = buildAddDeviceRequest(probe.input, env, { accessToken });
  } else if (target === "sites") {
    probe.request = buildListSitesRequest(probe.input, env, { accessToken });
  } else if (target === "devices") {
    probe.request = buildListDevicesRequest(probe.input, env, { accessToken });
  } else {
    probe.request = buildListModelsRequest(probe.input, env, { accessToken });
  }

  console.log("YMCS request URL:", probe.request.url);

  console.log(`\n${probe.label}:`);
  console.log(JSON.stringify({
    method: probe.method,
    url: probe.request.url,
    body: probe.request.body,
    headers: {
      ...probe.request.headers,
      Authorization: "Bearer ***"
    }
  }, null, 2));

  if (target === "sites" || target === "devices") {
    const result = target === "sites"
      ? await listSites(probe.input, env)
      : await listDevices(probe.input, env);
    const query = String(env.YMCS_CHECK_MATCH || "").trim().toUpperCase();
    const matchedItems = query
      ? result.items.filter((item) => JSON.stringify(item).toUpperCase().includes(query))
      : result.items;

    console.log(JSON.stringify({
      ok: result.ok,
      status: result.status,
      statusText: result.statusText,
      requestUrl: result.requestUrl,
      message: result.message,
      totalItems: result.items.length,
      matchQuery: query || null,
      matchedItems: matchedItems.slice(0, 25)
    }, null, 2));
    return;
  }

  const response = await fetch(probe.request.url, {
    method: probe.method,
    headers: probe.request.headers,
    ...(probe.method === "POST" ? { body: probe.request.bodyJson } : {})
  });

  const rawText = await response.text();
  let payload = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  console.log(JSON.stringify({
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    responseHeaders: Object.fromEntries(response.headers.entries()),
    message: extractYmcsMessage(payload),
    responseBody: payload
  }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
