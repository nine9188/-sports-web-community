import type { TipTapDoc, TipTapNode } from '../types';
import { renderMatchCard } from './matchCardRenderer';

/**
 * TipTap 노드를 HTML로 변환
 */
export function renderTipTapNode(node: TipTapNode): string {
  if (node.type === 'matchCard' && node.attrs) {
    const { matchId, matchData } = node.attrs;
    return renderMatchCard({
      matchId: matchId as string,
      matchData: matchData as Record<string, unknown>
    });
  }

  if (node.type === 'horizontalRule') {
    return '<hr class="my-6 border-gray-300" />';
  }

  if (node.type === 'image' && node.attrs?.src) {
    return `
      <div class="my-6 text-center">
        <img
          src="${node.attrs.src}"
          alt="${node.attrs.alt || '기사 이미지'}"
          title="${node.attrs.title || ''}"
          class="max-w-full h-auto mx-auto rounded-lg shadow-md"
          style="max-height: 500px; object-fit: contain;"
          onerror="this.onerror=null;this.style.display='none';"
        />
      </div>
    `;
  }

  // 비디오 노드 처리
  if (node.type === 'video' && node.attrs?.src) {
    return `
      <div class="video-wrapper my-6">
        <video
          src="${node.attrs.src}"
          controls
          playsinline
          class="max-w-full h-auto mx-auto rounded-lg"
          style="max-height: 500px;"
        >
          브라우저가 비디오를 지원하지 않습니다.
        </video>
      </div>
    `;
  }

  // YouTube 노드 처리
  if (node.type === 'youtube' && node.attrs?.src) {
    const src = node.attrs.src as string;
    // YouTube ID 추출
    let videoId = '';
    const youtubeMatch = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      videoId = youtubeMatch[1];
    } else if (src.length === 11) {
      videoId = src;
    }

    if (videoId) {
      return `
        <div class="youtube-wrapper my-6">
          <div class="relative w-full" style="padding-bottom: 56.25%;">
            <iframe
              src="https://www.youtube.com/embed/${videoId}"
              class="absolute top-0 left-0 w-full h-full rounded-lg"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      `;
    }
  }

  // 소셜 임베드 노드 처리 (YouTube URL 붙여넣기, Twitter, Instagram 등)
  if (node.type === 'socialEmbed' && node.attrs) {
    const platform = node.attrs.platform as string;
    const url = node.attrs.url as string;

    // YouTube인 경우 iframe으로 렌더링
    if (platform === 'youtube' && url) {
      const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      const videoId = youtubeMatch ? youtubeMatch[1] : null;

      if (videoId) {
        return `
          <div class="youtube-wrapper my-6">
            <div class="relative w-full" style="padding-bottom: 56.25%;">
              <iframe
                src="https://www.youtube.com/embed/${videoId}"
                class="absolute top-0 left-0 w-full h-full rounded-lg"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        `;
      }
    }

    // 페이스북인 경우 iframe으로 렌더링
    if (platform === 'facebook' && url) {
      const encodedUrl = encodeURIComponent(url);
      return `
        <div class="facebook-embed my-6 flex justify-center">
          <iframe
            src="https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500"
            width="500"
            height="500"
            style="border:none;overflow:hidden"
            scrolling="no"
            frameborder="0"
            allowfullscreen="true"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          ></iframe>
        </div>
      `;
    }

    // 다른 소셜 플랫폼 (Twitter, Instagram, TikTok, LinkedIn)
    return `
      <div data-type="social-embed" data-platform="${platform}" data-url="${url}" class="my-6">
        <div class="social-embed-placeholder p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
          <p class="text-sm text-gray-500">소셜 미디어 콘텐츠 로딩 중...</p>
        </div>
      </div>
    `;
  }

  if (node.type === 'paragraph' && node.content && Array.isArray(node.content)) {
    let paragraphContent = '';

    node.content.forEach((textNode) => {
      if (textNode.type === 'text' && textNode.text) {
        let text = textNode.text;

        // 차트 마커 제거 (단순 텍스트로 처리)
        const chartMarkerRegex = /\[MATCH_STATS_CHART:(.*?)\]/g;
        text = text.replace(chartMarkerRegex, '📊 경기 통계 차트');

        // 텍스트 마크업 적용
        if (textNode.marks && Array.isArray(textNode.marks)) {
          textNode.marks.forEach((mark) => {
            if (mark.type === 'bold') {
              text = `<strong>${text}</strong>`;
            } else if (mark.type === 'italic') {
              text = `<em>${text}</em>`;
            } else if (mark.type === 'link' && mark.attrs?.href) {
              const href = mark.attrs.href;
              const target = mark.attrs.target || '_blank';
              const rel = mark.attrs.rel || 'noopener noreferrer';
              text = `<a href="${href}" target="${target}" rel="${rel}">${text}</a>`;
            }
          });
        }

        paragraphContent += text;
      }
    });

    if (paragraphContent.trim()) {
      return `<p>${paragraphContent}</p>`;
    }
    return '';
  }

  if (node.type === 'heading' && Array.isArray(node.content)) {
    const level = node.attrs?.level || 2;
    let headingContent = '';
    node.content.forEach((textNode) => {
      if (textNode.type === 'text') {
        headingContent += textNode.text || '';
      }
    });
    return `<h${level} class="font-bold text-lg mb-3 mt-6">${headingContent}</h${level}>`;
  }

  if (node.type === 'bulletList' && Array.isArray(node.content)) {
    let listContent = '<ul class="list-disc list-inside mb-4">';
    node.content.forEach((listItem) => {
      if (listItem.type === 'listItem' && Array.isArray(listItem.content)) {
        listContent += '<li>';
        listItem.content.forEach((para) => {
          if (para.type === 'paragraph' && Array.isArray(para.content)) {
            para.content.forEach((textNode) => {
              if (textNode.type === 'text') {
                listContent += textNode.text || '';
              }
            });
          }
        });
        listContent += '</li>';
      }
    });
    listContent += '</ul>';
    return listContent;
  }

  return '';
}

/**
 * TipTap 문서를 HTML로 변환
 */
export function renderTipTapDoc(doc: TipTapDoc): string {
  if (!doc.content || !Array.isArray(doc.content)) {
    return '';
  }

  let html = '';
  doc.content.forEach((node) => {
    html += renderTipTapNode(node);
  });
  return html;
}
