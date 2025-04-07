'use client';

import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // window 객체가 있는지 확인 (SSR 대응)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // 초기 값 설정
      setMatches(media.matches);

      // 리스너 함수
      const listener = (e: MediaQueryListEvent) => {
        setMatches(e.matches);
      };

      // 리스너 등록
      media.addEventListener('change', listener);

      // 클린업 함수
      return () => {
        media.removeEventListener('change', listener);
      };
    }
  }, [query]);

  return matches;
}; 