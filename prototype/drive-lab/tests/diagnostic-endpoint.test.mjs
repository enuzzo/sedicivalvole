import assert from "node:assert/strict";
import { spawn } from "node:child_process";
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

  assert.equal(attachment.schema, "sedicivalvole.tesla-diagnostic.v3");
  assert.equal(attachment.serverAcceptedAt, "2026-08-28T06:51:35+00:00");
  assert.deepEqual(attachment.report, report);
  assert.match(rawMail, new RegExp(`JSON SHA-256: ${createHash("sha256").update(attachmentJson).digest("hex")}`));
  assert.match(rawMail, new RegExp(`GZIP SHA-256: ${createHash("sha256").update(gzip).digest("hex")}`));
  assert.ok(gzip.byteLength < Buffer.byteLength(attachmentJson));
});
