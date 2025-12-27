import type { RssPost } from '../types';

/**
 * RSS 게시글 헤더 (원문 링크, 이미지) 렌더링
 */
export function renderRssHeader(rssPost: RssPost): string {
  const sourceUrl = rssPost.source_url;
  if (!sourceUrl) return '';

  const imageUrl = rssPost.imageUrl || rssPost.image_url;

  return `
    <div class="mb-6">
      ${imageUrl ? `
      <div class="mb-4 relative overflow-hidden rounded-lg">
        <img
          src="${imageUrl}"
          alt="기사 이미지"
          class="w-full h-auto"
          onerror="this.onerror=null;this.style.display='none';"
        />
      </div>` : ''}
      <div class="flex justify-between items-center mb-4">
        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-[#3F3F3F] rounded-md hover:bg-slate-700 dark:hover:bg-[#4A4A4A] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          원문 보기
        </a>
        <span class="text-xs text-gray-500 dark:text-gray-400">출처: 풋볼리스트(FOOTBALLIST)</span>
      </div>
    </div>
  `;
}

/**
 * RSS 콘텐츠 본문 렌더링
 */
export function renderRssContent(rssPost: RssPost): string {
  if (rssPost.description && typeof rssPost.description === 'string') {
    return `<div class="rss-description my-4">${rssPost.description}</div>`;
  }

  if (rssPost.content && typeof rssPost.content === 'string') {
    return `<div class="rss-content-full my-4">${rssPost.content}</div>`;
  }

  return '';
}

/**
 * RSS 게시글인지 확인
 */
export function isRssPost(content: Record<string, unknown>): content is RssPost {
  return Boolean('source_url' in content || (content as RssPost).source_url);
}
