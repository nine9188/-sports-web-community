// 게시글 내용에 특정 요소가 포함되어 있는지 확인하는 함수
export const checkContentType = (content: string) => {
  if (!content) return { hasImage: false, hasVideo: false, hasYoutube: false, hasLink: false };
  
  // 이미지 및 비디오 감지
  const hasImage = content.includes('<img') || content.includes('![');
  const hasVideo = content.includes('<video') || content.includes('mp4');
  
  // 모든 URL 찾기
  const urlPattern = /https?:\/\/[^\s<>"']+/g;
  const urls = content.match(urlPattern) || [];
  
  // 각 URL 유형을 확인하기 위한 플래그
  let hasYoutube = false;
  let hasLink = false;
  
  // 각 URL을 검사하여 유튜브 URL과 일반 URL 구분
  for (const url of urls) {
    if (/youtube\.com|youtu\.be/i.test(url)) {
      // 유튜브 URL 발견
      hasYoutube = true;
    } else {
      // 일반 URL 발견
      hasLink = true;
    }
    
    // 둘 다 찾았으면 더 이상 검사할 필요 없음
    if (hasYoutube && hasLink) break;
  }
  
  // 직접 체크할 패턴들
  if (!hasYoutube) {
    hasYoutube = content.includes('youtube.com') || content.includes('youtu.be');
  }
  
  if (!hasLink) {
    hasLink = content.includes('http://') || content.includes('https://');
  }
  
  return { hasImage, hasVideo, hasYoutube, hasLink };
};

// 날짜 포맷팅 함수
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // 오늘 작성된 글이면 시간만 표시
  if (postDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  
  // 1년 이내면 월-일 표시
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (date > oneYearAgo) {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
  }
  
  // 1년 이상이면 연-월-일 표시
  return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
};

// 게시판 ID에서 slug로 변환하는 함수
export const getBoardSlug = (boardId: string, boardsData: Record<string, { slug?: string }>) => {
  return boardsData[boardId]?.slug || boardId;
};

// 아이콘 URL 가져오는 함수
export const getIconUrl = (iconId: number | null | undefined, iconsData: Record<number, { image_url: string }> = {}) => {
  if (!iconId) return null;
  return iconsData[iconId]?.image_url || null;
};

// getIconUrl 함수는 삭제하고 사용하지 않음 