/**
 * 날짜/시간 관련 유틸리티 함수
 */

/**
 * 경기 시간을 포맷팅하는 함수
 * @param date 날짜 객체
 * @returns 포맷팅된 날짜/시간 문자열
 */
export const formatMatchTime = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 오늘, 내일, 어제인지 확인
  const isToday = isSameDay(date, now);
  const isTomorrow = isSameDay(date, tomorrow);
  const isYesterday = isSameDay(date, yesterday);
  
  // 시간 포맷팅
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // 오늘/내일/어제 여부에 따른 표시
  if (isToday) {
    return `오늘 ${formattedTime}`;
  } else if (isTomorrow) {
    return `내일 ${formattedTime}`;
  } else if (isYesterday) {
    return `어제 ${formattedTime}`;
  }
  
  // 그 외 날짜
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일 ${formattedTime}`;
};

/**
 * 두 날짜가 동일한 날짜인지 확인
 * @param date1 첫번째 날짜
 * @param date2 두번째 날짜
 * @returns 동일한 날짜면 true, 아니면 false
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * ISO 형식 문자열을 Date 객체로 변환
 * @param isoString ISO 형식 날짜 문자열
 * @returns Date 객체
 */
export const parseISODate = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * 상대적 시간 포맷팅 (n분 전, n시간 전, n일 전 등)
 * @param date 날짜 객체
 * @returns 상대적 시간 문자열
 */
export const getRelativeTimeString = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '알 수 없음';
  }
  
  // 🔧 Hydration 불일치 방지 - 서버 환경에서는 고정된 날짜 형식 사용
  if (typeof window === 'undefined') {
    // 서버에서는 YYYY-MM-DD 형식으로 고정
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '방금 전';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
};

/**
 * 날짜를 한국어 형식으로 포맷팅 (예: '2023년 7월 21일 15:30')
 * @param date 날짜 객체
 * @returns 한국어 형식의 날짜 문자열
 */
export const formatDateToKorean = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  const now = new Date();

  // 오늘인지 확인
  if (isSameDay(date, now)) {
    return `오늘 ${hours}:${minutes}`;
  }

  // 어제인지 확인
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `어제 ${hours}:${minutes}`;
  }

  // 내일인지 확인
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, tomorrow)) {
    return `내일 ${hours}:${minutes}`;
  }

  // 기본 형식
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
}; 