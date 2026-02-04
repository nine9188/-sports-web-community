/**
 * 서버 사이드 콘텐츠 → HTML 변환기
 *
 * - TipTap JSON, RSS 객체, 문자열 콘텐츠를 HTML로 변환
 * - 서버에서 실행되어 초기 HTML에 콘텐츠 포함
 * - 클라이언트 깜빡임 방지
 * - isomorphic-dompurify로 XSS 방지 (서버/클라이언트 모두 동작)
 */

import DOMPurify from 'isomorphic-dompurify';
import {
  renderTipTapDoc,
  renderRssHeader,
  renderRssContent,
  isRssPost
} from '@/domains/boards/components/post/post-content/renderers';
import type { TipTapDoc, RssPost } from '@/domains/boards/components/post/post-content/types';

/**
 * 허용할 CSS 속성 whitelist
 * - 레이아웃/스타일링에 필요한 안전한 속성만 허용
 * - javascript:, expression() 등 위험 패턴 원천 차단
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

/**
 * 서버용 DOMPurify 설정
 * - 위험한 이벤트 핸들러 금지
 * - SVG 위험 요소 차단 (foreignObject, animate 등)
 * - CSS는 whitelist 방식으로 검증
 */
const DOMPURIFY_CONFIG: DOMPurify.Config = {
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
    // SVG 기본 요소 (아이콘용 - 위험 요소는 FORBID_TAGS에서 차단)
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
 * - 허용된 CSS 속성만 남기고 나머지 제거
 * - URL 포함 속성(background, background-image 등)은 제거
 */
function sanitizeStyleAttribute(styleValue: string): string {
  if (!styleValue) return '';

  const sanitizedParts: string[] = [];

  // CSS 속성 파싱 (간단한 방식)
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
 * HTML 문자열 정화 (XSS 방지)
 * - CSS는 whitelist 방식으로 검증
 * - 위험한 SVG 요소/속성 제거
 */
function sanitizeHTML(html: string): string {
  // DOMPurify 훅으로 style 속성 whitelist 적용
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'style' && data.attrValue) {
      data.attrValue = sanitizeStyleAttribute(data.attrValue);
    }

    // SVG xlink:href 차단 (use 태그 등에서 외부 리소스 로드 방지)
    if (data.attrName === 'xlink:href' || (node.tagName && node.tagName.toLowerCase() === 'use' && data.attrName === 'href')) {
      data.attrValue = '';
    }
  });

  const result = DOMPurify.sanitize(html, DOMPURIFY_CONFIG);

  // 훅 제거 (다른 호출에 영향 방지)
  DOMPurify.removeHook('uponSanitizeAttribute');

  return result;
}

type ContentInput = string | TipTapDoc | RssPost | Record<string, unknown> | null | undefined;

/**
 * 객체 콘텐츠를 HTML로 변환 (내부용 - sanitize 전)
 */
function processObjectContentUnsafe(content: TipTapDoc | RssPost | Record<string, unknown>): string {
  try {
    let htmlContent = '<div class="rss-content">';

    // RSS 게시글이면 헤더 추가
    if (isRssPost(content)) {
      htmlContent += renderRssHeader(content);
    }

    // TipTap 형식인 경우
    if ('type' in content && content.type === 'doc' && 'content' in content) {
      htmlContent += renderTipTapDoc(content as TipTapDoc);
    } else if (isRssPost(content)) {
      // RSS 콘텐츠 본문
      htmlContent += renderRssContent(content);
    } else {
      // 다른 형태의 JSON - 읽기 가능한 형태로 출력
      htmlContent += `
        <div class="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-md overflow-auto text-sm font-mono">
          <pre class="text-gray-900 dark:text-[#F0F0F0]">${escapeHtml(JSON.stringify(content, null, 2))}</pre>
        </div>
      `;
    }

    htmlContent += '</div>';
    return htmlContent;
  } catch {
    return '<div class="text-red-500">오류: 게시글 내용을 표시할 수 없습니다.</div>';
  }
}

/**
 * HTML 특수문자 이스케이프 (JSON 출력용)
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * 콘텐츠를 HTML로 변환 (서버 사이드)
 *
 * - 모든 출력은 DOMPurify로 정화되어 XSS 공격 방지
 * - script, onclick, onerror 등 위험 요소 자동 제거
 *
 * @param content - 게시글 콘텐츠 (문자열, TipTap JSON, RSS 객체 등)
 * @returns 정화된 HTML 문자열
 */
export function processContentToHtml(content: ContentInput): string {
  if (!content) return '';

  let rawHtml = '';

  // 문자열인 경우
  if (typeof content === 'string') {
    // JSON 형태인지 확인
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsedContent = JSON.parse(content);
        rawHtml = processObjectContentUnsafe(parsedContent);
      } catch {
        // JSON 파싱 실패 - 일반 문자열로 처리
        rawHtml = content;
      }
    } else {
      // 일반 문자열 (HTML 또는 텍스트)
      rawHtml = content;
    }
  } else if (typeof content === 'object') {
    // 객체인 경우
    rawHtml = processObjectContentUnsafe(content as TipTapDoc | RssPost | Record<string, unknown>);
  }

  // 모든 출력을 DOMPurify로 정화 (XSS 방지)
  return sanitizeHTML(rawHtml);
}
