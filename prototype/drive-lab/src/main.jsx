import { registerSessionCache } from "./session/register-cache.js";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./phone-cockpit.css";
import "./motion/motion.css";
import "./contextual-rail.css";

const phoneCompanion = new URLSearchParams(window.location.search).get("motion") === "phone";
const Surface = phoneCompanion ? React.lazy(() => import("./motion/phone.jsx").then((module) => ({ default: module.MotionPhone }))) : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <React.Suspense fallback={<p>Loading…</p>}><Surface /></React.Suspense>
  </React.StrictMode>,
);

if (!phoneCompanion) {
  void registerSessionCache();
  window.addEventListener('online', () => void registerSessionCache());
  window.addEventListener('pageshow', () => void registerSessionCache());
}
