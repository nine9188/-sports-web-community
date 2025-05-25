'use client';

import { useMemo } from 'react';

/**
 * 날짜 문자열을 상대적 시간으로 포맷팅하는 훅
 * @param dateString 날짜 문자열
 * @returns 포맷팅된 상대적 시간 문자열
 */
export function useFormatDate(dateString: string | undefined | null) {
  return useMemo(() => {
    // 입력값이 없으면 '-' 반환
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      
      // 유효하지 않은 날짜인 경우
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      // 🔧 Hydration 불일치 방지 - 서버 환경에서는 고정된 날짜 형식만 사용
      if (typeof window === 'undefined') {
        // 서버 환경에서는 YYYY-MM-DD 형식으로 고정
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      const now = new Date();
      
      // 시간 차이 계산 (밀리초)
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      // 시간 차이에 따른 표시 방식 결정 (클라이언트에서만)
      if (diffSec < 60) {
        return '방금 전';
      } else if (diffMin < 60) {
        return `${diffMin}분 전`;
      } else if (diffHour < 24) {
        return `${diffHour}시간 전`;
      } else if (diffDay < 7) {
        return `${diffDay}일 전`;
      } else {
        // YYYY-MM-DD 형식으로 표시
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // 오류 발생 시 원본 문자열 또는 '-' 반환
      return dateString || '-';
    }
  }, [dateString]);
}

/**
 * 타임스탬프를 시간 문자열로 포맷팅하는 함수 (memoize되지 않은 버전)
 * 컴포넌트 외부에서 사용 가능한 유틸리티 함수
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
    
  try {
    const date = new Date(dateString);
    
    // 유효하지 않은 날짜인 경우
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    // 🔧 Hydration 불일치 방지 - 서버 환경에서는 고정된 날짜 형식만 사용
    if (typeof window === 'undefined') {
      // 서버 환경에서는 YYYY-MM-DD 형식으로 고정
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    const now = new Date();
    
    // 시간 차이 계산 (밀리초)
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    // 시간 차이에 따른 표시 방식 결정 (클라이언트에서만)
    if (diffSec < 60) {
      return '방금 전';
    } else if (diffMin < 60) {
      return `${diffMin}분 전`;
    } else if (diffHour < 24) {
      return `${diffHour}시간 전`;
    } else if (diffDay < 7) {
      return `${diffDay}일 전`;
    } else {
      // YYYY-MM-DD 형식으로 표시
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // 오류 발생 시 원본 문자열 또는 '-' 반환
    return dateString || '-';
  }
}
