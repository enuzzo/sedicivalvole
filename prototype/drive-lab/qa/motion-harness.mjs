import { createMotionController } from "./motion-sensor.mjs";
import { createSyntheticPeer } from "./motion-link.mjs";

if (!import.meta.env.DEV) throw new Error("Motion probe is development-only");
const $ = (id) => document.getElementById(id);
const sensors = createMotionController();
let peers = [];
let session = null;
let generation = 0;
let busy = false;
const sessionId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
const notice = (text) => { $("notice").textContent = text; };
function disconnect() {
  generation += 1;
  for (const peer of peers) peer.close();
  peers = [];
  session = null;
  $("local").value = "";
  $("remote").value = "";
  busy = false;
}
function readRemote(type) {
  const text = $("remote").value;
  if (text.length > 32768) throw new Error("Invalid signaling packet");
  const packet = JSON.parse(text);
  if (packet?.v !== "sv-manual-probe-1" || !/^[a-f0-9]{32}$/.test(packet.session)
    || packet.description?.type !== type || typeof packet.description.sdp !== "string") throw new Error("Invalid signaling packet");
  return packet;
}
function writeLocal(description) {
  $("local").value = JSON.stringify({ v: "sv-manual-probe-1", session, description });
}
async function connect(action) {
  if (busy) return;
  const token = ++generation;
  busy = true;
  notice("Preparing synthetic connection…");
  try {
    await action(() => token === generation);
    if (token === generation) notice("Connection prepared. Inspect channel and freshness below; only an open channel proves delivery capability.");
  } catch {
    if (token === generation) {
      disconnect();
      // Do not print SDP, addresses or browser exception strings.
      notice("Connection unavailable or signaling invalid. Verify secure context, matching offer/answer and direct network reachability.");
    }
  } finally { if (token === generation) busy = false; }
}
$("start").onclick = () => { void sensors.start(); };
$("stop").onclick = () => sensors.stop();
$("calibrate").onclick = () => sensors.calibrate();
$("remount").onclick = () => sensors.remount();
$("disconnect").onclick = () => { disconnect(); notice("Disconnected. Signaling text cleared."); };
$("loopback").onclick = () => {
  disconnect();
  void connect(async (current) => {
    session = sessionId();
    const receiver = createSyntheticPeer({ role: "receiver", session });
    peers.push(receiver);
    const sender = createSyntheticPeer({ role: "sender", session });
    peers.push(sender);
    const offer = await receiver.offer();
    if (!current()) return;
    const answer = await sender.answer(offer);
    if (current()) await receiver.accept(answer);
  });
};
$("offer").onclick = () => {
  disconnect();
  void connect(async (current) => {
    session = sessionId();
    const peer = createSyntheticPeer({ role: "receiver", session });
    peers.push(peer);
    const offer = await peer.offer();
    if (current()) writeLocal(offer);
  });
};
$("answer").onclick = () => {
  if (busy) return;
  let packet;
  try { packet = readRemote("offer"); } catch { notice("Paste a valid receiver offer first."); return; }
  disconnect();
  void connect(async (current) => {
    session = packet.session;
    const peer = createSyntheticPeer({ role: "sender", session });
    peers.push(peer);
    const answer = await peer.answer(packet.description);
    if (current()) writeLocal(answer);
  });
};
$("accept").onclick = () => void connect(async () => {
  const packet = readRemote("answer");
  if (packet.session !== session || peers.length !== 1 || peers[0].summary().role !== "receiver") throw new Error("Session mismatch");
  await peers[0].accept(packet.description);
  $("local").value = "";
  $("remote").value = "";
});
function render() {
  const sensor = sensors.summary();
  $("sensor").textContent = JSON.stringify(sensor, null, 2);
  $("start").disabled = ["requesting", "listening", "waiting", "no-samples"].includes(sensor.state);
  $("calibrate").disabled = sensor.state !== "listening" || sensor.quality !== "complete";
  for (const id of ["loopback", "offer", "answer", "accept"]) $(id).disabled = busy;
  const summaries = peers.map((peer) => peer.summary());
  $("link").textContent = summaries.length ? JSON.stringify(summaries, null, 2) : "Not connected.";
  if (summaries.length && summaries.every((peer) => peer.connection === "closed")) {
    $("local").value = "";
    $("remote").value = "";
  }
}
const refresh = setInterval(render, 200);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") { disconnect(); notice("Suspended. Restart explicitly after returning."); }
});
window.addEventListener("pagehide", () => { sensors.stop(); disconnect(); });
window.addEventListener("pageshow", render);
window.addEventListener("beforeunload", () => { clearInterval(refresh); sensors.dispose(); disconnect(); });
render();
