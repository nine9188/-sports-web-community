/**
 * PostList 커스텀 훅
 */

'use client';

import { useState, useEffect, startTransition } from 'react';
import { MOBILE_BREAKPOINT, RESIZE_DEBOUNCE_DELAY } from './constants';

/**
 * 모바일 화면 감지 훅
 *
 * - 디바운스 적용으로 resize 이벤트 성능 최적화
 * - React 18 startTransition 사용으로 메인 스레드 블로킹 방지
 *
 * @returns isMobile - 현재 화면이 모바일인지 여부
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 초기 화면 크기 체크
    const checkMobile = () => {
      startTransition(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      });
    };

    checkMobile();

    // 디바운스 적용된 resize 핸들러
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        startTransition(() => {
          setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        });
      }, RESIZE_DEBOUNCE_DELAY);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return isMobile;
}
