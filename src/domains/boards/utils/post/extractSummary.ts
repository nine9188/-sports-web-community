/**
 * 게시글 콘텐츠에서 요약(plain text) 추출
 *
 * 서버/클라이언트 양쪽 import 가능한 순수 함수.
 * - 게시글 생성/수정 시 posts.summary 컬럼 저장용
 * - 뉴스 위젯, 검색 결과 snippet 등에서 재사용
 *
 * TipTap JSON을 재귀 탐색하여 모든 text 노드의 text를 공백 연결 후 maxLength로 자름.
 *
 * @param content - 게시글 콘텐츠 (TipTap JSON 문자열 or TipTap 객체 or HTML 문자열)
 * @param maxLength - 최대 길이 (기본 150자)
 * @returns 요약 문자열 (빈 콘텐츠면 빈 문자열)
 */
export function extractSummary(
  content: unknown,
  maxLength = 150
): string {
  if (!content) return '';

  try {
    let obj: unknown = content;

    // 문자열이면 파싱 시도
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          obj = JSON.parse(trimmed);
        } catch {
          // JSON이 아니면 HTML로 취급
          return stripHtml(content).slice(0, maxLength);
        }
      } else {
        return stripHtml(content).slice(0, maxLength);
      }
    }

    // TipTap doc 형식
    if (typeof obj === 'object' && obj !== null) {
      const doc = obj as Record<string, unknown>;
      if (doc.type === 'doc' && Array.isArray(doc.content)) {
        const text = collectTexts(doc.content);
        return text.slice(0, maxLength);
      }

      const rssText = extractRssText(doc);
      if (rssText) {
        return rssText.slice(0, maxLength);
      }
    }
  } catch {
    // 무시
  }

  return '';
}

/**
 * TipTap 노드 트리에서 text 값을 재귀적으로 수집
 */
function collectTexts(nodes: unknown[]): string {
  const parts: string[] = [];

  const walk = (node: unknown) => {
    if (typeof node !== 'object' || node === null) return;
    const n = node as Record<string, unknown>;

    // matchCard/teamCard/playerCard 등 카드 노드는 텍스트 추출에서 제외
    if (
      n.type === 'matchCard' ||
      n.type === 'teamCard' ||
      n.type === 'playerCard' ||
      n.type === 'entityCardGroup' ||
      n.type === 'predictionChart' ||
      n.type === 'image' ||
      n.type === 'video' ||
      n.type === 'youtube' ||
      n.type === 'socialEmbed'
    ) {
      return;
    }

    if (n.type === 'text' && typeof n.text === 'string') {
      parts.push(n.text);
    }

    if (Array.isArray(n.content)) {
      for (const child of n.content) {
        walk(child);
      }
    }
  };

  for (const node of nodes) walk(node);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * HTML 문자열에서 태그 제거
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractRssText(content: Record<string, unknown>): string {
  const candidates = [content.description, content.content, content.title];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;

    const text = stripHtml(candidate);
    if (text) return text;
  }

  return '';
}
