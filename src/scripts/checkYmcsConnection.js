import dotenv from "dotenv";
import {
  buildAddDeviceRequest,
  buildListModelsRequest,
  buildTokenRequest,
  extractYmcsMessage,
  getAccessToken
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
  const tokenPreview = buildTokenRequest(env);
  console.log("YMCS base URL:", env.YMCS_BASE_URL || "https://eu-api.ymcs.yealink.com");
  console.log("YMCS token URL:", tokenPreview.url);
  console.log("YMCS check target:", getCheckTarget());

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
  probe.request = probe.method === "POST"
    ? buildAddDeviceRequest(probe.input, env, { accessToken })
    : buildListModelsRequest(probe.input, env, { accessToken });

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
