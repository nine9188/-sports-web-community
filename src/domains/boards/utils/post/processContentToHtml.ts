/**
 * 서버 사이드 콘텐츠 → HTML 변환기
 *
 * - TipTap JSON, RSS 객체, 문자열 콘텐츠를 HTML로 변환
 * - 서버에서 실행되어 초기 HTML에 콘텐츠 포함
 * - 클라이언트 깜빡임 방지
 * - sanitize-html로 XSS 방지 (순수 JS, 서버 호환)
 */

import sanitizeHtml from 'sanitize-html';
import {
  renderTipTapDoc,
  renderRssHeader,
  renderRssContent,
  isRssPost
} from '@/domains/boards/components/post/post-content/renderers';
import type { TipTapDoc, RssPost } from '@/domains/boards/components/post/post-content/types';

/**
 * sanitize-html 설정
 * - 안전한 태그/속성만 허용
 * - 위험한 이벤트 핸들러 및 프로토콜 차단
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
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
    // SVG 기본 요소 (아이콘용)
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g',
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'style', 'title'],
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'data-type', 'data-light-src', 'data-dark-src'],
    'video': ['src', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'poster', 'width', 'height'],
    'source': ['src', 'type'],
    'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow'],
    'div': ['data-type', 'data-match', 'data-match-id', 'data-platform', 'data-url', 'data-chart', 'data-hydrated', 'data-processed'],
    'svg': ['xmlns', 'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width'],
    'path': ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
    'circle': ['cx', 'cy', 'r', 'fill', 'stroke'],
    'rect': ['x', 'y', 'width', 'height', 'fill', 'stroke', 'rx', 'ry'],
    'th': ['colspan', 'rowspan'],
    'td': ['colspan', 'rowspan'],
  },
  // 허용할 URL 스키마 (javascript: 차단)
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
    iframe: ['https'],
  },
  // iframe 허용 도메인
  allowedIframeHostnames: [
    'www.youtube.com',
    'youtube.com',
    'www.youtube-nocookie.com',
    'player.vimeo.com',
    'www.facebook.com',
    'platform.twitter.com',
    'www.instagram.com',
  ],
  // CSS 속성 whitelist
  allowedStyles: {
    '*': {
      'color': [/.*/],
      'background-color': [/.*/],
      'font-size': [/.*/],
      'font-weight': [/.*/],
      'text-align': [/.*/],
      'margin': [/.*/],
      'margin-top': [/.*/],
      'margin-bottom': [/.*/],
      'margin-left': [/.*/],
      'margin-right': [/.*/],
      'padding': [/.*/],
      'padding-top': [/.*/],
      'padding-bottom': [/.*/],
      'padding-left': [/.*/],
      'padding-right': [/.*/],
      'width': [/.*/],
      'height': [/.*/],
      'max-width': [/.*/],
      'max-height': [/.*/],
      'display': [/.*/],
      'position': [/.*/],
      'border': [/.*/],
      'border-radius': [/.*/],
      'overflow': [/.*/],
      'aspect-ratio': [/.*/],
    },
  },
  // 위험한 태그 완전 제거
  disallowedTagsMode: 'discard',
};

type ContentInput = string | TipTapDoc | RssPost | Record<string, unknown> | null | undefined;

/**
 * 객체 콘텐츠를 HTML로 변환 (내부용)
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
 * - 모든 출력은 sanitize-html로 정화되어 XSS 공격 방지
 * - script, onclick, javascript: 등 위험 요소 자동 제거
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

  // sanitize-html로 정화 (XSS 방지)
  return sanitizeHtml(rawHtml, SANITIZE_OPTIONS);
}
