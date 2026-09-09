import { registerSessionCache } from "./session/register-cache.js";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./phone-cockpit.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

void registerSessionCache();
window.addEventListener('online', () => void registerSessionCache());
window.addEventListener('pageshow', () => void registerSessionCache());
