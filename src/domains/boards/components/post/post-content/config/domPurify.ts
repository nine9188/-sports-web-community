import DOMPurify from 'dompurify';

// DOMPurify 설정 - 허용할 태그와 속성 정의
export const DOMPURIFY_CONFIG: DOMPurify.Config = {
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
    // SVG 기본 요소
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
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
    // 데이터 속성 (매치카드용)
    'data-type', 'data-match', 'data-match-id', 'data-platform', 'data-url',
    'data-light-src', 'data-dark-src', 'data-processed',
    // 이벤트 핸들러 (매치카드 호버용) - 주의: 제한적 사용
    'onmouseenter', 'onmouseleave', 'onerror',
    // SVG 속성
    'xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd',
    // 테이블 속성
    'colspan', 'rowspan',
  ],
  // iframe 허용 (YouTube 임베드용)
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder'],
  // 안전하지 않은 속성 제거
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea'],
  FORBID_ATTR: ['onclick', 'ondblclick', 'onkeydown', 'onkeyup', 'onkeypress', 'onsubmit', 'onload'],
};

// HTML 콘텐츠 정화 함수
export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') return html; // SSR에서는 그대로 반환
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}
