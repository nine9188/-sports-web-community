/**
 * 날짜를 한국어 형식으로 변환하는 유틸리티 함수
 */

/**
 * 주어진 날짜를 한국어 형식으로 포맷팅
 * @param date Date 객체
 * @returns 한국어 형식의 날짜 문자열 (예: 2024년 5월 1일 (수) 오후 3시 30분)
 */
export function formatDateToKorean(date: Date): string {
  try {
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
 * 타임스탬프를 한국어 형식으로 변환
 * @param timestamp 유닉스 타임스탬프 (초 단위)
 * @returns 한국어 형식의 날짜 문자열
 */
export function timestampToKoreanDate(timestamp: number): string {
  try {
    const date = new Date(timestamp * 1000); // 초 단위 타임스탬프를 밀리초로 변환
    return formatDateToKorean(date);
  } catch (error) {
    console.error('타임스탬프 변환 오류:', error);
    return '날짜 정보 없음';
  }
}

/**
 * 날짜 객체에서 시간을 한국어 형식으로 추출
 * @param date Date 객체
 * @returns 한국어 형식의 시간 문자열 (예: 오후 3시 30분)
 */
export function formatTimeToKorean(date: Date): string {
  try {
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

/**
 * 날짜를 '오늘', '내일', '어제' 또는 날짜 형식으로 반환
 * @param date Date 객체
 * @returns 상대적 날짜 또는 날짜 형식 문자열
 */
export function getRelativeDateString(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 날짜만 비교하기 위해 시간 정보 제거
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  
  if (targetDate.getTime() === todayDate.getTime()) {
    return '오늘';
  } else if (targetDate.getTime() === yesterdayDate.getTime()) {
    return '어제';
  } else if (targetDate.getTime() === tomorrowDate.getTime()) {
    return '내일';
  } else {
    return formatDateToKorean(date);
  }
}

/**
 * 두 날짜 사이의 차이를 한국어로 표현
 * @param start 시작 날짜
 * @param end 종료 날짜 (기본값: 현재)
 * @returns 날짜 차이 (예: 3일 전, 2시간 후)
 */
export function getDateDifference(start: Date, end: Date = new Date()): string {
  try {
    // 🔧 Hydration 불일치 방지 - 서버 환경에서는 고정된 날짜 형식 사용
    if (typeof window === 'undefined') {
      // 서버에서는 YYYY-MM-DD 형식으로 고정
      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay}일 ${diffMs > 0 ? '전' : '후'}`;
    } else if (diffHour > 0) {
      return `${diffHour}시간 ${diffMs > 0 ? '전' : '후'}`;
    } else if (diffMin > 0) {
      return `${diffMin}분 ${diffMs > 0 ? '전' : '후'}`;
    } else {
      return '방금';
    }
  } catch (error) {
    console.error('날짜 차이 계산 오류:', error);
    return '날짜 정보 없음';
  }
} 