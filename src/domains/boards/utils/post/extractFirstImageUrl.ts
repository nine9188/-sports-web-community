/**
 * 게시글 콘텐츠에서 첫 번째 이미지 URL 추출
 *
 * 서버/클라이언트 양쪽에서 import 가능한 순수 함수.
 * - 게시글 생성/수정 시 thumbnail_url 컬럼 저장용 (서버)
 * - 리스트 렌더링 시 fallback 추출용 (클라이언트)
 *
 * TipTap JSON 형식: { type: 'doc', content: [...] } 재귀 탐색하여
 * 최초 image 노드의 attrs.src 반환. matchCard 노드는 건너뜀.
 *
 * @param content - 게시글 콘텐츠 (TipTap JSON 문자열 또는 HTML 문자열)
 * @returns 첫 번째 이미지 URL 또는 null
 */
export function extractFirstImageUrl(content?: string): string | null {
  if (!content) return null;

  try {
    if (content.trim().startsWith('{')) {
      try {
        const obj = JSON.parse(content);
        if (obj?.type === 'doc' && Array.isArray(obj.content)) {
          const findImageUrl = (nodes: unknown[]): string | null => {
            for (const node of nodes) {
              if (typeof node !== 'object' || node === null) continue;
              const nodeObj = node as Record<string, unknown>;

              if (nodeObj.type === 'matchCard') continue;

              if (nodeObj.type === 'image') {
                const attrs = nodeObj.attrs as Record<string, unknown> | undefined;
                if (attrs?.src && typeof attrs.src === 'string') {
                  return attrs.src;
                }
              }

              if (Array.isArray(nodeObj.content)) {
                const found = findImageUrl(nodeObj.content);
                if (found) return found;
              }
            }
            return null;
          };

          const imageUrl = findImageUrl(obj.content);
          if (imageUrl) return imageUrl;

          return null;
        }
        if (obj?.imageUrl) return obj.imageUrl as string;
        if (obj?.image_url) return obj.image_url as string;

        return null;
      } catch {
        // JSON 파싱 실패 시 HTML로 처리
      }
    }

    const hasMatchCard = content.includes('match-card') || content.includes('data-type="match-card"');

    if (hasMatchCard) {
      const beforeMatchCard = content.split(/class="[^"]*match-card/i)[0] || '';

      const imgTag = beforeMatchCard.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
      if (imgTag?.[1]) return imgTag[1];

      return null;
    }

    const imgTag = content.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
    if (imgTag?.[1]) return imgTag[1];

    const mdImg = content.match(/!\[[^\]]*\]\(([^)]+)\)/i);
    if (mdImg?.[1]) return mdImg[1];

    const url = content.match(/(https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|gif|webp))/i);
    if (url?.[1]) return url[1];
  } catch (error) {
    console.error('Failed to extract image URL:', error);
  }

  return null;
}
