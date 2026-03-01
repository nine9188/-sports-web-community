'use client';

import { useSyncExternalStore } from 'react';

let listeners: Set<() => void> = new Set();
let currentIsDark = false;

// 브라우저 환경에서만 MutationObserver 초기화 (싱글턴)
if (typeof document !== 'undefined') {
  currentIsDark = document.documentElement.classList.contains('dark');

  const observer = new MutationObserver(() => {
    const newIsDark = document.documentElement.classList.contains('dark');
    if (newIsDark !== currentIsDark) {
      currentIsDark = newIsDark;
      listeners.forEach((fn) => fn());
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return currentIsDark;
}

function getServerSnapshot() {
  return false;
}

/**
 * 글로벌 싱글턴 다크모드 훅
 *
 * MutationObserver를 컴포넌트당 1개씩 생성하는 대신
 * 전역에서 1개만 운영하고 useSyncExternalStore로 구독.
 * 50+개 이미지 컴포넌트에서도 옵저버 1개만 사용.
 */
export function useDarkMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
