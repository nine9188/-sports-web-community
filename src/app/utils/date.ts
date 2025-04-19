/**
 * 상대적인 시간 형식으로 변환하는 함수
 * @param date Date 객체
 * @returns 상대적 시간 문자열 (예: "3분 전", "2시간 전", "5일 전" 등)
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // 1분 이내
  if (diffInSeconds < 60) {
    return '방금 전';
  }
  
  // 1시간 이내
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  // 24시간 이내
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  // 30일 이내
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }
  
  // 12개월 이내
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }
  
  // 1년 이상
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
}

/**
 * 날짜를 YYYY.MM.DD 형식으로 변환
 * @param dateStr ISO 형식의 날짜 문자열
 * @returns YYYY.MM.DD 형식의 문자열
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // 시간 차이 계산 (밀리초)
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    // 시간 차이에 따른 표시
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
    return dateString || '-';
  }
}

/**
 * 상세 날짜와 시간을 포맷팅하는 함수
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 포맷팅된 날짜 및 시간 문자열
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // YYYY-MM-DD HH:MM 형식으로 표시
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return dateString || '-';
  }
} 