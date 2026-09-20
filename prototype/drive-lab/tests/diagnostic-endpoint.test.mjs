import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const ENDPOINT = resolve(TEST_DIR, "../public/api/send-diagnostic.php");

test("diagnostic endpoint accepts ten times the original request budget", async () => {
  const endpointSource = await readFile(ENDPOINT, "utf8");
  assert.match(endpointSource, /const MAX_BODY_BYTES = 1966080;/);
  assert.doesNotMatch(endpointSource, /\$reportJson = json_encode\([\s\S]*?JSON_PRETTY_PRINT/);
});

function buildMailWithPhp(report) {
  const endpointLiteral = JSON.stringify(ENDPOINT);
  const phpSource = [
    "define('SEDICIVALVOLE_DIAGNOSTIC_LIBRARY_ONLY', true);",
    `require ${endpointLiteral};`,
    "$report = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);",
    "$mail = buildDiagnosticMail($report, '2026-08-28T06:51:35+00:00', 'diagnostics@example.test', '=_test_boundary');",
    "echo json_encode([",
    "  'message' => base64_encode($mail['message']),",
    "  'headers' => base64_encode($mail['headers']),",
    "  'attachmentName' => $mail['attachmentName'],",
    "], JSON_THROW_ON_ERROR);",
  ].join("\n");
  return new Promise((resolveMail, reject) => {
    const php = spawn("php", ["-r", phpSource], { stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    php.stdout.on("data", (chunk) => stdout.push(chunk));
    php.stderr.on("data", (chunk) => stderr.push(chunk));
    php.once("error", reject);
    php.once("exit", (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(stderr).toString("utf8")));
        return;
      }
      resolveMail(JSON.parse(Buffer.concat(stdout).toString("utf8")));
    });
    php.stdin.end(JSON.stringify(report));
  });
}

test("diagnostic mail carries the complete accepted report as verified JSON gzip", async () => {
  const marker = "complete-flight-recorder-evidence";
  const report = {
    generatedAt: "2026-08-28T06:51:24.999Z",
    app: { build: "20260828-0127", commit: "9d045ff", source: "GPS" },
    flightRecorder: {
      samples: Array.from({ length: 157 }, (_, index) => [index * 2, index % 93, marker]),
    },
    runtimeIssues: [],
  };
  const result = await buildMailWithPhp(report);
  const rawMail = Buffer.from(result.message, "base64").toString("utf8").replaceAll("\r\n", "\n");
  const headers = Buffer.from(result.headers, "base64").toString("utf8").replaceAll("\r\n", "\n");

  assert.match(headers, /Content-Type: multipart\/mixed; boundary="=_test_boundary"/i);
  assert.match(rawMail, /Complete report: attached as gzip-compressed JSON\./);
  assert.equal(
    result.attachmentName,
    "sedicivalvole-diagnostic-20260828T065135Z-build-20260828-0127.json.gz",
  );
  assert.match(rawMail, new RegExp(`filename="${result.attachmentName}"`));
  assert.doesNotMatch(rawMail.split("Content-Type: application/gzip")[0], new RegExp(marker));

  const attachmentPart = rawMail
    .split("--=_test_boundary")
    .find((part) => /Content-Type: application\/gzip/i.test(part));
  assert.ok(attachmentPart, "gzip MIME part is missing");
  const encoded = attachmentPart.split("\n\n").slice(1).join("\n\n").replace(/\s/g, "");
  const gzip = Buffer.from(encoded, "base64");
  const attachmentJson = gunzipSync(gzip).toString("utf8");
  const attachment = JSON.parse(attachmentJson);

  assert.equal(attachment.schema, "sedicivalvole.tesla-diagnostic.v4");
  assert.equal(attachment.serverAcceptedAt, "2026-08-28T06:51:35+00:00");
  assert.deepEqual(attachment.report, report);
  assert.match(rawMail, new RegExp(`JSON SHA-256: ${createHash("sha256").update(attachmentJson).digest("hex")}`));
  assert.match(rawMail, new RegExp(`GZIP SHA-256: ${createHash("sha256").update(gzip).digest("hex")}`));
  assert.ok(gzip.byteLength < Buffer.byteLength(attachmentJson));
});

test("a 24-hour fitted journey round-trips through the real PHP gzip attachment", async () => {
  const { createDriveTelemetry, recordDriveTelemetrySample, createDriveTelemetryReport,
    fitDiagnosticReportForTransport, DIAGNOSTIC_MAX_REQUEST_BODY_BYTES } = await import("../src/diagnostics-model.js");
  const telemetry = createDriveTelemetry(0);
  for (let second = 0; second <= 86400; second += 2) {
    recordDriveTelemetrySample(telemetry, { capturedAtMs: second * 1000, speedKmh: 80,
      averageFps: second === 10 ? 10 : 60, online: second !== 10 });
  }
  const report = fitDiagnosticReportForTransport({
    schema: "sedicivalvole.tesla-diagnostic.v4",
    generatedAt: "2026-09-05T00:00:00Z", app: { build: "20260905-0000" },
    flightRecorder: createDriveTelemetryReport(telemetry),
    events: Array.from({ length: 800 }, (_, sequence) => ({ sequence, priority: "significant", detail: "x".repeat(3000) })),
  });
  assert.ok(report.transport.requestBodyBytes <= DIAGNOSTIC_MAX_REQUEST_BODY_BYTES);
  assert.ok(report.transport.transmittedEvents < 800);
  const result = await buildMailWithPhp(report);
  const mail = Buffer.from(result.message, "base64").toString("utf8").replaceAll("\r\n", "\n");
  const part = mail.split("--=_test_boundary").find(value => /Content-Type: application\/gzip/i.test(value));
  const encoded = part.split("\n\n").slice(1).join("\n\n").replace(/\s/g, "");
  const restored = JSON.parse(gunzipSync(Buffer.from(encoded, "base64")));
  assert.deepEqual(restored.report, report);
  assert.equal(restored.report.flightRecorder.journey.windows[0].offlineSamples, 1);
  assert.equal(restored.report.flightRecorder.journey.windows.at(-1).toS, 86400);
});


test("automatic delivery requires Dev, explicit flags and a full driving interval", () => {
  const report={diagnosticDelivery:{mode:"dev",trigger:"automatic",automaticEnabled:true,intervalDrivingMs:900000,drivingMs:900001},privacy:{automaticRemoteTelemetry:true,transmissionRequiresExplicitGesture:false}};
  const validate=value=>{
    const result=spawnSync("php",["-r",`define('SEDICIVALVOLE_DIAGNOSTIC_LIBRARY_ONLY', true); require ${JSON.stringify(ENDPOINT)}; $r=json_decode(stream_get_contents(STDIN),true); echo validDiagnosticDelivery($r) ? 'yes' : 'no';`],{input:JSON.stringify(value),encoding:"utf8"});
    assert.equal(result.status,0,result.stderr);return result.stdout==="yes";
  };
  assert.equal(validate(report),true);assert.equal(validate({}),true);
  for(const patch of [{mode:"standard"},{automaticEnabled:false},{intervalDrivingMs:600000},{drivingMs:1000},{trigger:"unknown"}]) assert.equal(validate({...report,diagnosticDelivery:{...report.diagnosticDelivery,...patch}}),false);
  assert.equal(validate({...report,privacy:{automaticRemoteTelemetry:false,transmissionRequiresExplicitGesture:true}}),false);
});


test("active-session automatic delivery validates its own time basis and keeps older clients compatible", () => {
  const report={diagnosticDelivery:{mode:"dev",trigger:"automatic",automaticEnabled:true,timeBasis:"active-visible-session",intervalActiveMs:900000,activeMs:900001},privacy:{automaticRemoteTelemetry:true,transmissionRequiresExplicitGesture:false}};
  const validate=value=>{
    const result=spawnSync("php",["-r",`define('SEDICIVALVOLE_DIAGNOSTIC_LIBRARY_ONLY', true); require ${JSON.stringify(ENDPOINT)}; $r=json_decode(stream_get_contents(STDIN),true); echo validDiagnosticDelivery($r) ? 'yes' : 'no';`],{input:JSON.stringify(value),encoding:"utf8"});
    assert.equal(result.status,0,result.stderr);return result.stdout==="yes";
  };
  assert.equal(validate(report),true);
  for(const patch of [{timeBasis:"wall-clock"},{intervalActiveMs:600000},{activeMs:899999},{activeMs:null},{mode:"standard"},{automaticEnabled:false}]) assert.equal(validate({...report,diagnosticDelivery:{...report.diagnosticDelivery,...patch}}),false);
  assert.equal(validate({...report,diagnosticDelivery:{...report.diagnosticDelivery,timeBasis:"unknown",intervalDrivingMs:900000,drivingMs:900001}}),false);
});


const phpEval = (body, input) => {
  const result = spawnSync("php", ["-r", `define('SEDICIVALVOLE_DIAGNOSTIC_LIBRARY_ONLY', true); require ${JSON.stringify(ENDPOINT)}; ${body}`], { input: input === undefined ? "" : JSON.stringify(input), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};
const deliveryValid = (delivery) => phpEval("$r=json_decode(stream_get_contents(STDIN),true); echo validDiagnosticDelivery($r) ? 'yes' : 'no';", { diagnosticDelivery: { mode: "dev", trigger: "automatic", automaticEnabled: true, timeBasis: "active-visible-session", intervalActiveMs: 900000, ...delivery }, privacy: { automaticRemoteTelemetry: true, transmissionRequiresExplicitGesture: false } }) === "yes";

test("catch-up delivery needs fifteen wall minutes and a minute of unsent active time", () => {
  const ok = { deliveryReason: "catch-up", activeMs: 588000, wallElapsedMs: 2520000 };
  assert.equal(deliveryValid(ok), true);
  for (const patch of [{ wallElapsedMs: 899999 }, { activeMs: 59999 }, { wallElapsedMs: null }, { wallElapsedMs: "2520000" }, { intervalActiveMs: 600000 }, { timeBasis: "wall-clock" }]) assert.equal(deliveryValid({ ...ok, ...patch }), false, JSON.stringify(patch));
});

test("hide-flush delivery needs five wall minutes and two active minutes; unknown reasons are refused", () => {
  const ok = { deliveryReason: "hide-flush", activeMs: 150000, wallElapsedMs: 300000 };
  assert.equal(deliveryValid(ok), true);
  for (const patch of [{ activeMs: 119999 }, { wallElapsedMs: 299999 }, { wallElapsedMs: undefined }]) assert.equal(deliveryValid({ ...ok, ...patch }), false, JSON.stringify(patch));
  assert.equal(deliveryValid({ ...ok, deliveryReason: "burst" }), false);
  assert.equal(deliveryValid({ deliveryReason: "interval", activeMs: 900000 }), true);
  assert.equal(deliveryValid({ activeMs: 900000 }), true, "clients without a reason stay compatible");
});

test("server floors: fifteen minutes for interval and catch-up, five for a close-time flush", () => {
  const floors = JSON.parse(phpEval("echo json_encode(array_map('automaticFloorSeconds', ['interval','catch-up','hide-flush', null, 'unknown']));"));
  assert.deepEqual(floors, [900, 900, 300, 900, 900]);
});

test("the mail names why an automatic report was sent", async () => {
  const report = { generatedAt: "2026-09-20T10:00:00.000Z", app: { build: "20260920-1000", commit: "abc1234" }, diagnosticDelivery: { trigger: "automatic", mode: "dev", deliveryReason: "catch-up" } };
  const mail = Buffer.from((await buildMailWithPhp(report)).message, "base64").toString("utf8").replaceAll("\r\n", "\n");
  assert.match(mail, /Delivery: automatic \/ dev\nReason: catch-up\n/);
  const plain = Buffer.from((await buildMailWithPhp({ ...report, diagnosticDelivery: { trigger: "manual", mode: "dev" } })).message, "base64").toString("utf8").replaceAll("\r\n", "\n");
  assert.doesNotMatch(plain, /Reason:/);
});

test("a manual packet cannot smuggle free text into the mail through deliveryReason", () => {
  const manual = (delivery) => phpEval("$r=json_decode(stream_get_contents(STDIN),true); echo validDiagnosticDelivery($r) ? 'yes' : 'no';", { diagnosticDelivery: { mode: "dev", trigger: "manual", automaticEnabled: true, ...delivery }, privacy: { automaticRemoteTelemetry: true, transmissionRequiresExplicitGesture: false } }) === "yes";
  assert.equal(manual({}), true, "a manual report without a reason stays valid");
  assert.equal(manual({ deliveryReason: null }), true);
  assert.equal(manual({ deliveryReason: "interval" }), true, "a known reason on a manual packet is harmless");
  // The Reason: line is written into the mail summary verbatim, so an unknown reason must never reach it.
  assert.equal(manual({ deliveryReason: "burst" }), false);
  assert.equal(manual({ deliveryReason: "x\r\nPrivacy: coordinates were collected and stored." }), false);
  assert.equal(manual({ deliveryReason: 42 }), false);
});

test("the mail summary keeps exactly one Reason line and no injected lines", async () => {
  const report = { generatedAt: "2026-09-20T10:00:00.000Z", app: { build: "b" }, diagnosticDelivery: { trigger: "automatic", mode: "dev", deliveryReason: "hide-flush" } };
  const mail = Buffer.from((await buildMailWithPhp(report)).message, "base64").toString("utf8").replaceAll("\r\n", "\n");
  assert.equal(mail.split("\n").filter((line) => line.startsWith("Reason: ")).length, 1);
  assert.equal(mail.split("\n").filter((line) => line.startsWith("Privacy: ")).length, 1);
});
