'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;

interface UseVisibilityActivityRefreshOptions {
  enabled: boolean;
  intervalMs: number;
  onRefresh: () => void | Promise<void>;
  idleTimeoutMs?: number;
}

export function useVisibilityActivityRefresh({
  enabled,
  intervalMs,
  onRefresh,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
}: UseVisibilityActivityRefreshOptions) {
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    let lastActivityAt = Date.now();
    let isRefreshing = false;

    const markActivity = () => {
      lastActivityAt = Date.now();
    };

    const canRefresh = () => (
      document.visibilityState === 'visible' &&
      Date.now() - lastActivityAt <= idleTimeoutMs
    );

    const refresh = () => {
      if (!canRefresh() || isRefreshing) return;

      isRefreshing = true;
      Promise.resolve(refreshRef.current()).finally(() => {
        isRefreshing = false;
      });
    };

    const refreshAfterResume = () => {
      markActivity();
      refresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAfterResume();
      }
    };

    const intervalId = window.setInterval(refresh, intervalMs);
    window.addEventListener('focus', refreshAfterResume);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshAfterResume);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
    };
  }, [enabled, idleTimeoutMs, intervalMs]);
}
