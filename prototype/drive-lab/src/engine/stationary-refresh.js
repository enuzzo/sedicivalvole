/** The existing GPS owner renews stationary evidence when watchPosition goes quiet. */
export function startStationaryRefresh({ geolocation, eligible, onPosition, interval = setInterval, clear = clearInterval }) {
  if (!geolocation?.getCurrentPosition) return () => {};
  let cancelled = false, pending = false;
  const timer = interval(() => {
    if (cancelled || pending || !eligible()) return;
    pending = true;
    const finish = position => {
      pending = false;
      if (!cancelled && position && eligible()) onPosition(position);
    };
    try { geolocation.getCurrentPosition(finish, () => finish(), { enableHighAccuracy: true, maximumAge: 0, timeout: 3000 }); }
    catch { pending = false; }
  }, 1000);
  return () => { cancelled = true; clear(timer); };
}
