import test from "node:test";
import assert from "node:assert/strict";
import QRCode from "qrcode";
import { createRemoteQr, remoteReceiverStatus } from "../src/remote/receiver-presentation.js";

const url = `https://sedicivalvole.app/?remote=phone&palette=underwater&appearance=dark#pair=${"a".repeat(32)}.${"b".repeat(64)}.${"c".repeat(64)}`;

test("QR keeps all payload modules and a four-module quiet zone on every edge", () => {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: "M" });
  const qr = createRemoteQr(url);
  assert.equal(qr.size, modules.size + 8);
  const cells = [...qr.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)].map(([, x, y]) => [Number(x), Number(y)]);
  assert.equal(cells.length, modules.data.reduce((count, cell) => count + (cell ? 1 : 0), 0));
  for (const [x, y] of cells) {
    assert.ok(x >= 4 && x < qr.size - 4 && y >= 4 && y < qr.size - 4);
    assert.equal(modules.data[(y - 4) * modules.size + x - 4], 1);
  }
  assert.ok(240 / qr.size >= 3, "production-shaped QR retains at least three CSS pixels per module");
});

test("missing or unencodable QR offers recovery instead of an empty pairing screen", () => {
  assert.equal(createRemoteQr(null), null);
  assert.equal(createRemoteQr("x".repeat(5000)), null);
  assert.equal(remoteReceiverStatus({ state: "pairing" }, { qrError: true }).retry, true);
});

test("only a connected online remote is presented as ready for commands", () => {
  assert.equal(remoteReceiverStatus({ state: "connected", networkState: "online" }).tone, "connected");
  for (const networkState of ["retrying", "offline", undefined]) {
    const status = remoteReceiverStatus({ state: "connected", networkState });
    assert.equal(status.label, "Reconnecting");
    assert.notEqual(status.retry, true, "an admitted pairing is retained during recovery");
  }
  assert.equal(remoteReceiverStatus({ state: "connecting" }).tone, "connecting");
});

test("terminal failures offer one QR recovery action and retain their reason", () => {
  for (const state of ["expired", "error", "unavailable", "invalid_pairing"]) {
    const status = remoteReceiverStatus({ state });
    assert.equal(status.retry, true);
    assert.equal(status.tone, "error");
    assert.notEqual(status.label, "Connect a phone");
  }
  assert.equal(remoteReceiverStatus({ state: "expired" }).label, "Pairing expired");
  assert.equal(remoteReceiverStatus({ state: "closed" }).label, "Phone disconnected");
});
