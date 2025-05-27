/**
 * 댓글 전용 날짜 포맷팅 유틸리티
 */

/**
 * 댓글 작성 시간을 상대적 시간으로 표시
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 상대적 시간 문자열 (예: '3분 전', '2시간 전')
 */
export function formatCommentDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // 🔧 Hydration 불일치 방지 - 서버에서는 간단한 날짜만 표시
    if (typeof window === 'undefined') {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHour = Math.floor(diffInMin / 60);
    const diffInDay = Math.floor(diffInHour / 24);
    const diffInWeek = Math.floor(diffInDay / 7);
    const diffInMonth = Math.floor(diffInDay / 30);
    
    if (diffInSec < 60) {
      return '방금 전';
    } else if (diffInMin < 60) {
      return `${diffInMin}분 전`;
    } else if (diffInHour < 24) {
      return `${diffInHour}시간 전`;
    } else if (diffInDay < 7) {
      return `${diffInDay}일 전`;
    } else if (diffInWeek < 4) {
      return `${diffInWeek}주 전`;
    } else if (diffInMonth < 12) {
      return `${diffInMonth}달 전`;
    } else {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}년 ${month}월 ${day}일`;
    }
  } catch (error) {
    console.error('댓글 날짜 포맷 오류:', error);
    return '';
  }
} 