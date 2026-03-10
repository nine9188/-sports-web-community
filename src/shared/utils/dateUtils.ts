/**
 * 통합 날짜/시간 유틸리티
 *
 * 모든 날짜 관련 함수를 한 곳에서 관리
 * - KST(한국 표준시) 기준으로 동작
 * - Hydration 불일치 방지 처리 포함
 */

// ========================================
// 내부 헬퍼 함수
// ========================================

/**
 * KST 기준 년/월/일 추출
 */
function extractYMD(formatter: Intl.DateTimeFormat, date: Date): [string, string, string] {
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value ?? '';
  const month = parts.find(p => p.type === 'month')?.value ?? '';
  const day = parts.find(p => p.type === 'day')?.value ?? '';
  return [year, month, day];
}

/**
 * KST 기준 년/월/일/시/분 추출
 */
function extractYMDHM(formatter: Intl.DateTimeFormat, date: Date): [string, string, string, string, string] {
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value ?? '';
  const month = parts.find(p => p.type === 'month')?.value ?? '';
  const day = parts.find(p => p.type === 'day')?.value ?? '';
  const hour = parts.find(p => p.type === 'hour')?.value ?? '00';
  const minute = parts.find(p => p.type === 'minute')?.value ?? '00';
  return [year, month, day, hour, minute];
}

/**
 * KST 기준 타임스탬프(ms) 계산
 */
function getKSTTimestamp(date: Date): number {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const y = Number(parts.find(p => p.type === 'year')?.value ?? '1970');
  const m = Number(parts.find(p => p.type === 'month')?.value ?? '01');
  const d = Number(parts.find(p => p.type === 'day')?.value ?? '01');
  const hh = Number(parts.find(p => p.type === 'hour')?.value ?? '00');
  const mm = Number(parts.find(p => p.type === 'minute')?.value ?? '00');
  const ss = Number(parts.find(p => p.type === 'second')?.value ?? '00');
  return Date.UTC(y, m - 1, d, hh, mm, ss);
}

/**
 * KST 포맷터 생성
 */
function createKSTFormatter(options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    ...options,
  });
}

// ========================================
// 날짜 비교 함수
// ========================================

/**
 * 두 날짜가 동일한 날짜인지 확인
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 주어진 날짜가 오늘인지 확인
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 주어진 날짜가 어제인지 확인
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

/**
 * 주어진 날짜가 내일인지 확인
 */
export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
}

// ========================================
// 파싱 함수
// ========================================

/**
 * ISO 형식 문자열을 Date 객체로 변환
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Unix 타임스탬프(초 단위)를 Date 객체로 변환
 */
export function fromUnixTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

// ========================================
// 포맷팅 함수 - 기본
// ========================================

/**
 * 기본 날짜 포맷 (YYYY-MM-DD 또는 YYYY-MM-DD HH:mm)
 */
export function formatDateBasic(dateInput: Date | string, includeTime = false): string {
  if (!dateInput) return '';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const kstFormatter = createKSTFormatter({
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
      hour12: false,
    });

    if (!includeTime) {
      const [y, m, d] = extractYMD(kstFormatter, date);
      return `${y}-${m}-${d}`;
    }
    const [y, m, d, hh, mm] = extractYMDHM(kstFormatter, date);
    return `${y}-${m}-${d} ${hh}:${mm}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '';
  }
}

/**
 * OP.GG 스타일 날짜 포맷팅
 * 오늘: 시간만 표시 (예: "16:29")
 * 어제 이전: 날짜만 표시 (예: "2025.06.05")
 */
export function formatDateOpgg(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);

    // 상대 시간 표시
    if (diffMin < 1) return '방금';
    if (diffHour < 1) return `${diffMin}분 전`;
    if (diffDay < 1) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    if (diffDay < 30) return `${diffWeek}주 전`;
    if (diffMonth < 12) return `${diffMonth}달 전`;

    // 1년 이상: YY.MM.DD
    const kstFormatter = createKSTFormatter({
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const [yy, mm, dd] = extractYMD(kstFormatter, date);
    return `${yy.slice(2)}.${mm}.${dd}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '';
  }
}

// ========================================
// 포맷팅 함수 - 한국어
// ========================================

/**
 * 날짜를 한국어 형식으로 포맷팅 (요일 포함)
 * @returns 한국어 형식의 날짜 문자열 (예: "2024년 5월 1일 (수)")
 */
export function formatDateKorean(date: Date): string {
  try {
    if (!date || isNaN(date.getTime())) {
      return '날짜 정보 없음';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '날짜 정보 없음';
  }
}

/**
 * 날짜를 한국어 형식으로 포맷팅 (시간 포함)
 * @returns 한국어 형식의 날짜/시간 문자열 (예: "2024년 5월 1일 15:30")
 */
export function formatDateTimeKorean(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const now = new Date();

  if (isToday(date)) {
    return `오늘 ${hours}:${minutes}`;
  }
  if (isYesterday(date)) {
    return `어제 ${hours}:${minutes}`;
  }
  if (isTomorrow(date)) {
    return `내일 ${hours}:${minutes}`;
  }

  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
}

/**
 * 시간을 한국어 형식으로 포맷팅
 * @returns 한국어 형식의 시간 문자열 (예: "오후 3시 30분")
 */
export function formatTimeKorean(date: Date): string {
  try {
    if (!date || isNaN(date.getTime())) {
      return '시간 정보 없음';
    }
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('시간 포맷팅 오류:', error);
    return '시간 정보 없음';
  }
}

// ========================================
// 포맷팅 함수 - 경기/라이브스코어
// ========================================

/**
 * 경기 시간을 포맷팅
 * @returns "오늘 15:30", "내일 20:00", "5월 1일 15:30"
 */
export function formatMatchTime(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  if (isToday(date)) {
    return `오늘 ${formattedTime}`;
  }
  if (isTomorrow(date)) {
    return `내일 ${formattedTime}`;
  }
  if (isYesterday(date)) {
    return `어제 ${formattedTime}`;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일 ${formattedTime}`;
}

/**
 * Unix 타임스탬프를 한국어 날짜로 변환
 */
export function timestampToKoreanDate(timestamp: number): string {
  try {
    const date = fromUnixTimestamp(timestamp);
    return formatDateKorean(date);
  } catch (error) {
    console.error('타임스탬프 변환 오류:', error);
    return '날짜 정보 없음';
  }
}

// ========================================
// 상대 시간 함수
// ========================================

/**
 * 날짜를 '오늘', '내일', '어제' 또는 날짜 형식으로 반환
 */
export function getRelativeDateLabel(date: Date): string {
  if (isToday(date)) return '오늘';
  if (isYesterday(date)) return '어제';
  if (isTomorrow(date)) return '내일';
  return formatDateKorean(date);
}

/**
 * 현재 시간으로부터 얼마나 지났는지 표시
 * @returns '방금 전', '3분 전', '2시간 전', '5일 전' 등
 *
 * 참고: 서버 환경에서는 Hydration 불일치 방지를 위해 YYYY-MM-DD 형식 반환
 */
export function getRelativeTime(dateInput: Date | string): string {
  if (!dateInput) return '';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '알 수 없음';

    // 🔧 Hydration 불일치 방지 - 서버 환경에서는 고정된 날짜 형식 사용
    if (typeof window === 'undefined') {
      return formatDateBasic(date);
    }

    const now = new Date();
    const dateMs = getKSTTimestamp(date);
    const nowMs = getKSTTimestamp(now);

    const diffInMs = nowMs - dateMs;
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHour = Math.floor(diffInMin / 60);
    const diffInDay = Math.floor(diffInHour / 24);

    if (diffInSec < 60) {
      return '방금 전';
    } else if (diffInMin < 60) {
      return `${diffInMin}분 전`;
    } else if (diffInHour < 24) {
      return `${diffInHour}시간 전`;
    } else if (diffInDay < 7) {
      return `${diffInDay}일 전`;
    } else if (diffInDay < 30) {
      const weeks = Math.floor(diffInDay / 7);
      return `${weeks}주 전`;
    } else if (diffInDay < 365) {
      const months = Math.floor(diffInDay / 30);
      return `${months}개월 전`;
    } else {
      const years = Math.floor(diffInDay / 365);
      return `${years}년 전`;
    }
  } catch (error) {
    console.error('상대 시간 계산 오류:', error);
    return '';
  }
}

/**
 * 두 날짜 사이의 차이를 한국어로 표현
 * @returns 날짜 차이 (예: "3일 전", "2시간 후")
 *
 * 참고: 서버 환경에서는 Hydration 불일치 방지를 위해 YYYY-MM-DD 형식 반환
 */
export function getDateDifference(start: Date, end: Date = new Date()): string {
  try {
    // 🔧 Hydration 불일치 방지 - 서버 환경에서는 고정된 날짜 형식 사용
    if (typeof window === 'undefined') {
      return formatDateBasic(start);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.floor(Math.abs(diffMs) / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const suffix = diffMs > 0 ? '전' : '후';

    if (diffDay > 0) {
      return `${diffDay}일 ${suffix}`;
    } else if (diffHour > 0) {
      return `${diffHour}시간 ${suffix}`;
    } else if (diffMin > 0) {
      return `${diffMin}분 ${suffix}`;
    } else {
      return '방금';
    }
  } catch (error) {
    console.error('날짜 차이 계산 오류:', error);
    return '날짜 정보 없음';
  }
}

// ========================================
// 레거시 호환성 (기존 코드 마이그레이션용)
// ========================================

/** @deprecated formatDateOpgg 사용을 권장합니다 */
export const formatDate = formatDateOpgg;

/** @deprecated formatDateKorean 또는 formatDateTimeKorean 사용을 권장합니다 */
export const formatDateToKorean = formatDateKorean;

/** @deprecated getRelativeTime 사용을 권장합니다 */
export const getRelativeTimeFromNow = getRelativeTime;

/** @deprecated getRelativeTime 사용을 권장합니다 */
export const getRelativeTimeString = getRelativeTime;

/** @deprecated getRelativeDateLabel 사용을 권장합니다 */
export const getRelativeDateString = getRelativeDateLabel;
