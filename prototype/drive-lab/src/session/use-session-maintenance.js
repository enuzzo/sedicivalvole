import { useEffect, useRef, useState } from 'react';
import { createUpdateController } from './update-controller.js';

export function useSessionMaintenance(safe) {
  const safeRef = useRef(safe); safeRef.current = safe;
  const owner = useRef(null);
  const [state, setState] = useState({ due: false });
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const controller = createUpdateController({ current: `${__APP_BUILD__}.${__APP_COMMIT__}`,
      available: () => navigator.onLine !== false && document.visibilityState !== 'hidden',
      safe: () => safeRef.current(), reload: () => window.location.reload(), onState: setState,
    });
    owner.current = controller;
    const wake = () => controller.wake();
    const interact = () => controller.interact();
    window.addEventListener("pointerdown", interact, true); window.addEventListener("keydown", interact, true);
    window.addEventListener('online', wake); window.addEventListener('offline', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      controller.dispose(); owner.current = null;
      window.removeEventListener("pointerdown", interact, true); window.removeEventListener("keydown", interact, true);
      window.removeEventListener('online', wake); window.removeEventListener('offline', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, []);
  return { ...state, apply: () => owner.current?.requestReload() };
}
