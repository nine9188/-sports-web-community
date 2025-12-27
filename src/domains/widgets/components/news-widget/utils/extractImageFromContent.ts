/**
 * 게시글 콘텐츠에서 첫 번째 이미지 URL을 추출합니다.
 * 다양한 형식을 지원: TipTap JSON, RSS, HTML, Markdown, URL 패턴
 */

// ==================== 추출 전략들 ====================

/** TipTap JSON 형식에서 이미지 추출 */
function extractFromTipTap(contentObj: Record<string, unknown>): string | null {
  if (contentObj.type !== 'doc' || !Array.isArray(contentObj.content)) {
    return null;
  }

  for (const node of contentObj.content) {
    // 직접 이미지 노드
    if (node.type === 'image' && node.attrs?.src) {
      return node.attrs.src;
    }

    // 문단 내 이미지
    if (node.type === 'paragraph' && Array.isArray(node.content)) {
      for (const subNode of node.content) {
        if (subNode.type === 'image' && subNode.attrs?.src) {
          return subNode.attrs.src;
        }
      }
    }
  }

  return null;
}

/** RSS Post 형식에서 이미지 추출 */
function extractFromRssPost(contentObj: Record<string, unknown>): string | null {
  if ('imageUrl' in contentObj && typeof contentObj.imageUrl === 'string') {
    return contentObj.imageUrl;
  }
  if ('image_url' in contentObj && typeof contentObj.image_url === 'string') {
    return contentObj.image_url;
  }
  return null;
}

/** HTML img 태그에서 이미지 추출 */
function extractFromHtml(content: string): string | null {
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = content.match(imgTagRegex);
  return match?.[1] || null;
}

/** 마크다운 이미지 문법에서 추출 */
function extractFromMarkdown(content: string): string | null {
  const markdownImgRegex = /!\[[^\]]*\]\(([^)]+)\)/i;
  const match = content.match(markdownImgRegex);
  return match?.[1] || null;
}

/** URL 패턴에서 이미지 추출 */
function extractFromUrl(content: string): string | null {
  const urlRegex = /(https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|gif|webp))/i;
  const match = content.match(urlRegex);
  return match?.[1] || null;
}

/** og:image 또는 twitter:image 메타 태그에서 추출 */
function extractFromMetaTags(content: string): string | null {
  // og:image
  const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
  const ogMatch = content.match(ogImageRegex);
  if (ogMatch?.[1]) return ogMatch[1];

  // twitter:image
  const twitterImageRegex = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
  const twitterMatch = content.match(twitterImageRegex);
  return twitterMatch?.[1] || null;
}

// ==================== 메인 함수 ====================

/**
 * 콘텐츠에서 이미지 URL을 추출합니다.
 * 여러 형식을 순차적으로 시도합니다.
 *
 * @param content - 게시글 콘텐츠 (JSON 문자열 또는 HTML)
 * @returns 이미지 URL 또는 빈 문자열
 */
export function extractImageFromContent(content: string): string {
  if (!content) return '';

  try {
    // 1. JSON 형식인지 확인하고 파싱 시도
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const contentObj = JSON.parse(content) as Record<string, unknown>;

        // TipTap 형식
        const tipTapImage = extractFromTipTap(contentObj);
        if (tipTapImage) return tipTapImage;

        // RSS Post 형식
        const rssImage = extractFromRssPost(contentObj);
        if (rssImage) return rssImage;
      } catch {
        // JSON 파싱 실패 시 무시하고 계속
      }
    }

    // 2. HTML img 태그
    const htmlImage = extractFromHtml(content);
    if (htmlImage) return htmlImage;

    // 3. 마크다운 이미지
    const markdownImage = extractFromMarkdown(content);
    if (markdownImage) return markdownImage;

    // 4. 일반 URL 패턴
    const urlImage = extractFromUrl(content);
    if (urlImage) return urlImage;

    // 5. 메타 태그
    const metaImage = extractFromMetaTags(content);
    if (metaImage) return metaImage;

  } catch (e) {
    console.error('이미지 URL 추출 오류:', e);
  }

  return '';
}
