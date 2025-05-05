/**
 * 날짜 포맷 유틸리티
 */

/**
 * ISO 날짜 문자열을 'YYYY-MM-DD' 또는 'YYYY-MM-DD HH:mm' 형식으로 변환합니다.
 * @param dateString ISO 형식의 날짜 문자열 (예: '2023-07-21T15:30:00.000Z')
 * @param includeTime 시간 포함 여부
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(dateString: string, includeTime = false): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (!includeTime) {
      return `${year}-${month}-${day}`;
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '';
  }
}

/**
 * 현재 시간으로부터 얼마나 지났는지 표시 (예: '3분 전', '2시간 전')
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export function getRelativeTimeFromNow(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffInMs = now.getTime() - date.getTime();
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
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    console.error('상대 시간 계산 오류:', error);
    return '';
  }
} 