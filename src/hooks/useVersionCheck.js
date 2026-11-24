import { useEffect, useRef } from 'react';

const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v0.2.24112601';
const CHECK_INTERVAL_MS = 60 * 1000;

async function clearBrowserCaches() {
  try {
    if ('caches' in window) {
      const names = await window.caches.keys();
      await Promise.all(names.map((name) => window.caches.delete(name)));
    }
  } catch (e) {
    // Ignore cache storage errors
  }

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch (e) {
    // Ignore service worker errors
  }
}

export function useVersionCheck() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const checkVersion = async () => {
      if (reloadingRef.current) return;
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok || !active) return;

        const remote = await res.json();
        if (!remote?.version || remote.version === CURRENT_VERSION) return;

        // Hard patch: clear caches and force-reload to the latest version
        if (remote.patchType === 'hard') {
          reloadingRef.current = true;
          await clearBrowserCaches();
          const url = new URL(window.location.href);
          url.searchParams.set('v', remote.version);
          window.location.replace(url.toString());
        }
        // Soft patch: do not auto-refresh; user gets the update on their next manual refresh
      } catch (e) {
        // Ignore transient network errors
      }
    };

    checkVersion();
    const intervalId = setInterval(checkVersion, CHECK_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return CURRENT_VERSION;
}

export default useVersionCheck;
