import { useState, useEffect } from "react";
import { supportMomentumCount, supportMomentumFrame, SUPPORT_COUNT_DURATION_MS, decodeSuggestionAddress } from "../support-model.js";
// Keep the support QR inside the already-loaded application bundle so opening
// the panel does not depend on a later image request over a weak connection.
import buyMeCoffeeQr from "../assets/bmc_qr.png?inline";
import { DialogSurface } from "./dialog-surface.jsx";

function parseSupportUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" && /(^|\.)buymeacoffee\.com$/i.test(url.hostname)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

const DEFAULT_SUPPORT_URL = "https://buymeacoffee.com/enuzzo";

const SUPPORT_URL = parseSupportUrl(import.meta.env.VITE_SUPPORT_URL) || DEFAULT_SUPPORT_URL;

function SupportMomentumCounter({ reducedMotion }) {
  const [momentumTarget] = useState(() => supportMomentumCount());
  const [momentumValue, setMomentumValue] = useState(0);
  const momentum = String(momentumValue).padStart(3, "0");
  const momentumLabel = String(momentumTarget).padStart(3, "0");

  useEffect(() => {
    if (reducedMotion) {
      setMomentumValue(momentumTarget);
      return undefined;
    }

    let frameId = 0;
    const startedAt = performance.now();
    const tick = (timestamp) => {
      const nextValue = supportMomentumFrame(momentumTarget, timestamp - startedAt);
      setMomentumValue((currentValue) => currentValue === nextValue ? currentValue : nextValue);
      if (nextValue < momentumTarget) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [momentumTarget, reducedMotion]);

  return (
    <div
      className="support-momentum"
      aria-label={`Project sparks ${momentumLabel}, counted over ${SUPPORT_COUNT_DURATION_MS / 1000} seconds`}
    >
      <small>PROJECT SPARKS</small>
      <strong aria-hidden="true">{momentum}</strong>
      <span>PLAYFUL SIGNAL · NOT PURCHASES</span>
    </div>
  );
}

export function SupportPanel({ onClose, reducedMotion }) {
  const suggestionAddress = decodeSuggestionAddress();
  const mailSubject = encodeURIComponent("sedicivalvole suggestion");

  return (
    <DialogSurface
      className="support-overlay"
      labelledBy="support-title"
      onClose={onClose}
      backdropClass="support-backdrop"
      panelClass="support-panel"
    >
      <header className="support-heading">
        <div><small>OPEN CHANNEL</small><h2 id="support-title">Fuel the experiment</h2></div>
        <button data-dialog-initial-focus type="button" onClick={onClose}>CLOSE</button>
      </header>
      <div className="support-body">
        <img
          className="support-qr"
          src={buyMeCoffeeQr}
          width="700"
          height="700"
          loading="lazy"
          decoding="async"
          alt="QR code for the sedicivalvole Buy Me a Coffee page"
        />
        <div className="support-copy">
          <p>If this strange little road instrument made your drive better, you can leave a coffee.</p>
          <a
            className="support-primary-link"
            href={SUPPORT_URL}
          >
            BUY ME A COFFEE <span aria-hidden="true">→</span>
          </a>
          <SupportMomentumCounter reducedMotion={reducedMotion} />
        </div>
        <p className="support-suggestions">
          Suggestions are super welcome — coffee or not. Write to{" "}
          <a href={`mailto:${suggestionAddress}?subject=${mailSubject}`}>{suggestionAddress}</a>
        </p>
      </div>
    </DialogSurface>
  );
}
