import { useEffect, useRef } from 'react';

/** Outside tap is consumed; scrolling/pinching never dismisses or clicks through. */
export function useOutsideDismiss(container, open, onClose) {
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!open) return;
    let gesture = null;
    const down = event => {
      if (container.current?.contains(event.target)) { gesture = null; return; }
      if (gesture) { gesture.cancelled = true; return; }
      gesture = { id:event.pointerId, x:event.clientX, y:event.clientY, cancelled:false };
      event.preventDefault(); event.stopPropagation();
    };
    const move = event => {
      if (gesture && (gesture.id !== event.pointerId || Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>8)) gesture.cancelled=true;
    };
    const click = event => {
      if (container.current?.contains(event.target)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const dismiss = gesture && !gesture.cancelled; gesture=null;
      if (dismiss) close.current();
    };
    const cancel = () => { gesture = null; };
    document.addEventListener('pointerdown',down,true); document.addEventListener('pointermove',move,true);
    document.addEventListener('click',click,true); document.addEventListener('pointercancel',cancel,true);
    return () => { document.removeEventListener('pointerdown',down,true); document.removeEventListener('pointermove',move,true); document.removeEventListener('click',click,true); document.removeEventListener('pointercancel',cancel,true); };
  }, [container,open]);
}
