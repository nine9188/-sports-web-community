import DOMPurify from 'dompurify';

/**
 * 허용할 CSS 속성 whitelist
 * - 서버 설정(processContentToHtml.ts)과 동일하게 유지
 */
const ALLOWED_CSS_PROPERTIES = new Set([
  // 레이아웃
  'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'display', 'position', 'top', 'right', 'bottom', 'left',
  'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'gap',
  // 텍스트
  'color', 'font-size', 'font-weight', 'font-style', 'font-family',
  'text-align', 'text-decoration', 'line-height', 'letter-spacing',
  'white-space', 'word-break', 'overflow-wrap',
  // 배경/테두리 (URL 제외)
  'background-color', 'border', 'border-radius', 'border-color', 'border-width', 'border-style',
  'box-shadow', 'opacity',
  // 기타
  'overflow', 'overflow-x', 'overflow-y', 'z-index', 'cursor', 'visibility',
  'object-fit', 'object-position', 'aspect-ratio',
]);

// DOMPurify 설정 - 서버 설정과 동일하게 유지
export const DOMPURIFY_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    // 기본 텍스트 태그
    'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins',
    'blockquote', 'pre', 'code', 'hr',
    // 리스트
    'ul', 'ol', 'li',
    // 링크 & 미디어
    'a', 'img', 'video', 'source', 'iframe',
    // 테이블
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // 폼 요소 (읽기 전용 목적)
    'label',
    // SVG 기본 요소 (아이콘용)
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g',
  ],
  ALLOWED_ATTR: [
    // 일반 속성
    'class', 'id', 'style', 'title', 'alt', 'name',
    // 링크 속성
    'href', 'target', 'rel',
    // 이미지/미디어 속성
    'src', 'width', 'height', 'loading', 'decoding',
    // 비디오 속성
    'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'poster',
    // iframe 속성
    'frameborder', 'allowfullscreen', 'allow',
    // 데이터 속성 (매치카드, 소셜 임베드, 차트용)
    'data-type', 'data-match', 'data-match-id', 'data-platform', 'data-url',
    'data-light-src', 'data-dark-src', 'data-processed', 'data-chart', 'data-hydrated',
    // SVG 속성
    'xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd',
    // 테이블 속성
    'colspan', 'rowspan',
  ],
  // iframe 허용 (YouTube, Twitter 임베드용)
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
  // 위험한 태그 금지 (SVG 위험 요소 포함)
  FORBID_TAGS: [
    'script', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea',
    // SVG 위험 요소 - XSS 우회 가능
    'foreignObject', 'animate', 'animateMotion', 'animateTransform', 'set', 'use',
    'feImage', 'filter', 'switch', 'math', 'maction',
  ],
  // 모든 이벤트 핸들러 금지
  FORBID_ATTR: [
    'onclick', 'ondblclick', 'onkeydown', 'onkeyup', 'onkeypress', 'onsubmit',
    'onload', 'onerror', 'onmouseenter', 'onmouseleave', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'oninput', 'onanimationend', 'onanimationstart',
  ],
};

/**
 * CSS style 속성을 whitelist 방식으로 정화
 */
function sanitizeStyleAttribute(styleValue: string): string {
  if (!styleValue) return '';

  const sanitizedParts: string[] = [];
  const declarations = styleValue.split(';');

  for (const decl of declarations) {
    const trimmed = decl.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const property = trimmed.substring(0, colonIndex).trim().toLowerCase();
    const value = trimmed.substring(colonIndex + 1).trim();

    // 허용된 속성인지 확인
    if (!ALLOWED_CSS_PROPERTIES.has(property)) continue;

    // 값에 위험 패턴이 있는지 확인
    const lowerValue = value.toLowerCase();
    if (
      lowerValue.includes('javascript:') ||
      lowerValue.includes('expression(') ||
      lowerValue.includes('url(') ||
      lowerValue.includes('behavior:') ||
      lowerValue.includes('-moz-binding')
    ) {
      continue;
    }

    sanitizedParts.push(`${property}: ${value}`);
  }

  return sanitizedParts.join('; ');
}

/**
 * HTML 콘텐츠 정화 함수 (클라이언트 전용)
 *
 * 참고: 서버 사이드 정화는 processContentToHtml.ts에서 isomorphic-dompurify로 처리
 * 클라이언트에서 추가 정화는 방어층으로만 사용 (결과는 서버와 동일해야 함)
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // SSR: 서버 사이드 정화는 processContentToHtml.ts에서 처리됨
    return html;
  }

  // DOMPurify 훅으로 style 속성 whitelist 적용
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'style' && data.attrValue) {
      data.attrValue = sanitizeStyleAttribute(data.attrValue);
    }

    // SVG xlink:href 차단
    if (data.attrName === 'xlink:href' || (node.tagName?.toLowerCase() === 'use' && data.attrName === 'href')) {
      data.attrValue = '';
    }
  });

  const result = DOMPurify.sanitize(html, { ...DOMPURIFY_CONFIG, RETURN_TRUSTED_TYPE: false }) as string;

  // 훅 제거 (다른 호출에 영향 방지)
  DOMPurify.removeHook('uponSanitizeAttribute');

  return result;
}
