import { useEffect, useRef, useState } from "react";
import { classifyPhoneLayout } from "./phone-layout.js";

const readLayout = () => classifyPhoneLayout({ width: window.innerWidth, height: window.innerHeight,
  coarsePointer: window.matchMedia("(pointer: coarse)").matches });

export function usePhoneLayout() {
  const [layout, setLayout] = useState(readLayout);
  useEffect(() => {
    const pointer = window.matchMedia("(pointer: coarse)");
    const update = () => setLayout(readLayout());
    window.addEventListener("resize", update);
    pointer.addEventListener("change", update);
    update();
    return () => { window.removeEventListener("resize", update); pointer.removeEventListener("change", update); };
  }, []);
  return layout;
}

/** This sibling masks interaction only; the running session remains mounted. */
export function PhoneRotationNotice({ active }) {
  const noticeRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement;
    const masked = new Map();
    const maskPortals = () => {
      for (const surface of [...document.body.children, ...document.querySelectorAll("#root > *")]) {
        if (!(surface instanceof HTMLElement) || surface.contains(noticeRef.current)
          || ["SCRIPT", "STYLE", "LINK"].includes(surface.tagName) || surface.classList.contains("app")) continue;
        if (!masked.has(surface)) masked.set(surface, surface.inert);
        surface.inert = true;
      }
    };
    const retainFocus = event => {
      if (!noticeRef.current?.contains(event.target)) noticeRef.current?.focus({ preventScroll: true });
    };
    maskPortals();
    const observer = new MutationObserver(maskPortals);
    observer.observe(document.body, { childList: true });
    const root = document.getElementById("root");
    if (root) observer.observe(root, { childList: true });
    document.addEventListener("focusin", retainFocus, true);
    noticeRef.current?.focus({ preventScroll: true });
    return () => {
      observer.disconnect(); document.removeEventListener("focusin", retainFocus, true);
      for (const [surface, wasInert] of masked) surface.inert = wasInert;
      if (previous?.isConnected) previous.focus?.({ preventScroll: true });
    };
  }, [active]);
  if (!active) return null;
  return <section className="phone-rotation-notice" role="dialog" aria-modal="true"
    aria-labelledby="phone-rotation-title" aria-describedby="phone-rotation-detail"
    tabIndex={-1} ref={noticeRef} onKeyDown={event => { event.stopPropagation(); if (event.key === "Tab") event.preventDefault(); }}>
    <div className="phone-rotation-symbol" aria-hidden="true"><span /></div>
    <small>SEDICIVALVOLE · PHONE COCKPIT</small>
    <h1 id="phone-rotation-title">Turn your phone sideways</h1>
    <p id="phone-rotation-detail">The cockpit works in landscape.<br />Your session and audio stay as they are.</p>
  </section>;
}
