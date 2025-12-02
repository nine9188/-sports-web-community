'use client';

import { useMemo } from 'react';

/**
 * 날짜 문자열을 상대적 시간으로 포맷팅하는 훅
 * @param dateString 날짜 문자열
 * @returns 포맷팅된 상대적 시간 문자열
 */
export function useFormatDate(dateString: string | undefined | null) {
  return useMemo(() => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    // 서버 환경 (SSR)에서는 고정된 포맷으로만 표시
    if (typeof window === 'undefined') {
      return toYMD(date, '-');
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;

    return toYMD(date, '-');
  }, [dateString]);
}

/**
 * 타임스탬프를 시간 문자열로 포맷팅하는 함수
 * - 오늘 글이면 HH:mm
 * - 과거 글이면 YYYY.MM.DD
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (todayStart.getTime() === targetDate.getTime()) {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    return toYMD(date, '.');
  } catch {
    return dateString || '-';
  }
}

/**
 * 공통 YMD 포맷 함수
 * @param date Date 객체
 * @param sep 구분자 (예: '-', '.')
 * @returns YYYY-MM-DD 또는 YYYY.MM.DD
 */
function toYMD(date: Date, sep: string = '-'): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${sep}${m}${sep}${d}`;
}
