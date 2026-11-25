import { useEffect, useRef, useCallback } from 'react';

const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'v0.7.0';
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

export function useVersionCheck({ isInGame = false } = {}) {
  const reloadingRef = useRef(false);
  const isInGameRef = useRef(isInGame);
  const pendingVersionRef = useRef(null);

  const triggerHardReload = useCallback(async (targetVersion) => {
    if (reloadingRef.current || !targetVersion) return;
    reloadingRef.current = true;
    await clearBrowserCaches();
    const url = new URL(window.location.href);
    url.searchParams.set('v', targetVersion);
    window.location.replace(url.toString());
  }, []);

  useEffect(() => {
    isInGameRef.current = isInGame;
    if (!isInGame && pendingVersionRef.current && !reloadingRef.current) {
      triggerHardReload(pendingVersionRef.current);
    }
  }, [isInGame, triggerHardReload]);

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

        const isLevel2All = remote.patchType === 'hard_all' || remote.patchLevel === 2;
        const isLevel1Hard = remote.patchType === 'hard' || remote.patchLevel === 1;

        if (isLevel2All) {
          // Level 2: Force reload ALL users immediately (including users in-game)
          await triggerHardReload(remote.version);
        } else if (isLevel1Hard) {
          // Level 1: Auto-reload immediately, or defer until active game finishes
          if (isInGameRef.current) {
            pendingVersionRef.current = remote.version;
          } else {
            await triggerHardReload(remote.version);
          }
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
  }, [triggerHardReload]);

  return CURRENT_VERSION;
}

export default useVersionCheck;
