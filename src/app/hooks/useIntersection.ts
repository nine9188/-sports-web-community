'use client';

import { useEffect, useState } from 'react';

/**
 * 특정 DOM 요소가 뷰포트 내에 들어왔는지 감지하는 훅
 * 주로 무한 스크롤 구현에 사용됩니다.
 * 
 * @param elementRef 관찰할 요소의 ref 객체
 * @param options IntersectionObserver 설정 옵션
 * @returns 요소가 뷰포트 내에 있는지 여부 (boolean)
 */
export function useIntersection(
  elementRef: React.RefObject<HTMLElement | HTMLDivElement | null>,
  options: IntersectionObserverInit = {
    threshold: 0,
    root: null,
    rootMargin: '0px',
  }
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    // 브라우저가 IntersectionObserver를 지원하는지 확인
    if (!('IntersectionObserver' in window)) {
      console.warn('현재 브라우저는 IntersectionObserver를 지원하지 않습니다.');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
} 