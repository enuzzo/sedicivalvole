import { useRef, useEffect, useCallback } from "react";

const DIALOG_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function DialogSurface({
  className,
  inert,
  labelledBy,
  onClose,
  backdropClass = "drawer-backdrop",
  panelClass = "drawer-panel",
  dismissDirection = "right",
  focusKey,
  children,
}) {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    return () => previousFocusRef.current?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const initial = panel?.querySelector("[data-dialog-initial-focus]")
        ?? panel?.querySelector(DIALOG_FOCUSABLE_SELECTOR);
      if (initial instanceof HTMLElement) initial.focus({ preventScroll: true });
      else panel?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frameId);
  }, [focusKey]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panelRef.current?.querySelectorAll(DIALOG_FOCUSABLE_SELECTOR) ?? [])
      .filter((element) => element instanceof HTMLElement && element.tabIndex >= 0);
    if (focusable.length === 0) {
      event.preventDefault();
      panelRef.current?.focus({ preventScroll: true });
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const finishDrag = useCallback((shouldClose = false) => {
    const panel = panelRef.current;
    const drag = dragRef.current;
    if (panel) {
      panel.style.removeProperty("--drawer-drag-x");
      panel.style.removeProperty("--drawer-drag-y");
      panel.classList.remove("is-dragging");
    }
    if (drag?.pointerId != null) panel?.releasePointerCapture?.(drag.pointerId);
    dragRef.current = null;
    if (shouldClose) onClose();
  }, [onClose]);

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target instanceof Element
      && event.target.closest("button, a, input, select, textarea, summary, [role='slider'], [contenteditable='true']")) return;
    const panel = panelRef.current;
    if (!panel) return;
    if (dismissDirection === "right" && event.clientX < 28) return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollTop: panel.scrollTop,
      startedAt: performance.now(),
      active: false,
    };
    panel.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !panel) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    const primary = dismissDirection === "down" ? Math.max(0, deltaY) : Math.max(0, deltaX);
    const cross = dismissDirection === "down" ? Math.abs(deltaX) : Math.abs(deltaY);
    const scrollAllowed = dismissDirection !== "down" || (drag.scrollTop <= 1 && panel.scrollTop <= 1);
    const travel = scrollAllowed && primary > cross * 1.18 ? primary : 0;
    if (!drag.active && travel < 12) return;
    drag.active = true;
    panel.classList.add("is-dragging");
    const elasticTravel = Math.min(190, travel * (travel < 90 ? 0.9 : 0.72));
    panel.style.setProperty("--drawer-drag-x", `${dismissDirection === "right" ? elasticTravel : 0}px`);
    panel.style.setProperty("--drawer-drag-y", `${dismissDirection === "down" ? elasticTravel : 0}px`);
    event.preventDefault();
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = Math.max(0, event.clientX - drag.x);
    const deltaY = Math.max(0, event.clientY - drag.y);
    const travel = dismissDirection === "down" ? deltaY : deltaX;
    const elapsed = Math.max(16, performance.now() - drag.startedAt);
    const velocity = travel / elapsed;
    const distanceThreshold = Math.min(150, Math.max(76, panelRef.current.clientWidth * 0.18));
    finishDrag(drag.active && (travel >= distanceThreshold || (travel >= 44 && velocity >= 0.62)));
  };

  return (
    <section
      className={className}
      inert={inert}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      data-dismiss-direction={dismissDirection}
      onKeyDown={handleKeyDown}
    >
      <button className={backdropClass} type="button" tabIndex={-1} onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onClose(); }} aria-label="Close" />
      <div
        ref={panelRef}
        className={panelClass}
        role="document"
        tabIndex={-1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => finishDrag(false)}
      >
        {children}
      </div>
    </section>
  );
}
