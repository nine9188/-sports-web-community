import type { TipTapDoc, TipTapNode } from '../types';
import { renderMatchCard } from './matchCardRenderer';
import { renderTeamCard } from './teamCardRenderer';
import { renderPlayerCard } from './playerCardRenderer';
import { renderPredictionChart } from './predictionChartRenderer';
import { renderEntityCardGroup } from './entityCardGroupRenderer';
import { normalizeDisplayImageUrl } from '@/shared/images/urls';

function isEntityCardNode(node: TipTapNode | undefined): boolean {
  return node?.type === 'teamCard' || node?.type === 'playerCard';
}

function isEmptyParagraphNode(node: TipTapNode | undefined): boolean {
  if (node?.type !== 'paragraph') {
    return false;
  }

  return !Array.isArray(node.content) || node.content.length === 0;
}

/**
 * Render a TipTap node to HTML.
 */
export function renderTipTapNode(node: TipTapNode): string {
  if (node.type === 'entityCardGroup' && node.attrs) {
    return renderEntityCardGroup({
      columns: node.attrs.columns,
      items: node.attrs.items,
      content: node.content,
    });
  }

  if (node.type === 'matchCard' && node.attrs) {
    const { matchId, matchData } = node.attrs;
    const matchDataRecord = matchData as Record<string, unknown> | undefined;
    const resolvedMatchId = matchId ?? matchDataRecord?.id;

    return renderMatchCard({
      matchId: resolvedMatchId as string | number | undefined,
      matchData: matchDataRecord ?? {}
    });
  }

  if (node.type === 'teamCard' && node.attrs) {
    const { teamId, teamData } = node.attrs;
    return renderTeamCard({
      teamId: teamId as string | number,
      teamData: teamData as Record<string, unknown>
    });
  }

  if (node.type === 'playerCard' && node.attrs) {
    const { playerId, playerData } = node.attrs;
    return renderPlayerCard({
      playerId: playerId as string | number,
      playerData: playerData as Record<string, unknown>
    });
  }

  if (node.type === 'predictionChart' && node.attrs) {
    const { fixtureId, chartData } = node.attrs;
    return renderPredictionChart({
      fixtureId: fixtureId as string | number,
      chartData: chartData as Record<string, unknown>
    });
  }

  if (node.type === 'pollBlock') {
    return '<div data-type="post-poll-placeholder"></div>';
  }

  if (node.type === 'horizontalRule') {
    return '<hr class="my-6 border-gray-300" />';
  }

  if (node.type === 'table' && Array.isArray(node.content)) {
    const rows = node.content
      .filter((row) => row.type === 'tableRow')
      .map((row) => renderTipTapNode(row))
      .join('');

    return `<div class="table-wrapper"><table><tbody>${rows}</tbody></table></div>`;
  }

  if (node.type === 'tableRow' && Array.isArray(node.content)) {
    const cells = node.content
      .filter((cell) => cell.type === 'tableCell' || cell.type === 'tableHeader')
      .map((cell) => renderTipTapNode(cell))
      .join('');

    return `<tr>${cells}</tr>`;
  }

  if ((node.type === 'tableCell' || node.type === 'tableHeader') && Array.isArray(node.content)) {
    const tag = node.type === 'tableHeader' ? 'th' : 'td';
    const content = node.content.map((child) => renderTipTapNode(child)).join('') || '<p></p>';

    return `<${tag}>${content}</${tag}>`;
  }

  if (node.type === 'image' && node.attrs?.src) {
    const imageSrc = normalizeDisplayImageUrl(node.attrs.src as string, { proxyExternal: true });

    return `
      <div class="my-6 text-center">
        <img
          src="${imageSrc}"
          alt="${node.attrs.alt || '기사 이미지'}"
          title="${node.attrs.title || ''}"
          class="max-w-full h-auto mx-auto rounded-lg shadow-md post-image"
          data-type="post-image"
        />
      </div>
    `;
  }

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

  if (node.type === 'youtube' && node.attrs?.src) {
    const src = node.attrs.src as string;
    let videoId = '';
    const youtubeMatch = src.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
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

  if (node.type === 'socialEmbed' && node.attrs) {
    const platform = node.attrs.platform as string;
    const url = node.attrs.url as string;

    if (platform === 'youtube' && url) {
      const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
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

    if (platform === 'video' && url) {
      return `
        <div class="video-wrapper my-6">
          <video
            src="${url}"
            controls
            playsinline
            preload="metadata"
            class="max-w-full h-auto mx-auto rounded-lg"
            style="max-height: 500px;"
          >
            브라우저가 비디오를 지원하지 않습니다.
          </video>
        </div>
      `;
    }

    return `
      <div data-type="social-embed" data-platform="${platform}" data-url="${url}" class="my-6">
        <div class="social-embed-placeholder p-4 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-lg text-center">
          <p class="text-[13px] text-gray-500 dark:text-gray-400">소셜 미디어 콘텐츠 로딩 중...</p>
        </div>
      </div>
    `;
  }

  if (node.type === 'paragraph' && node.content && Array.isArray(node.content)) {
    let paragraphContent = '';

    node.content.forEach((textNode) => {
      if (textNode.type === 'text' && textNode.text) {
        let text = textNode.text;

        const chartMarkerRegex = /\[MATCH_STATS_CHART:(.*?)\]/g;
        text = text.replace(chartMarkerRegex, '경기 통계 차트');

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

  if (node.type === 'blockquote' && Array.isArray(node.content)) {
    let quoteContent = '';
    node.content.forEach((childNode) => {
      quoteContent += renderTipTapNode(childNode);
    });
    return `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg italic text-gray-700 dark:text-gray-300">${quoteContent}</blockquote>`;
  }

  return '';
}

/**
 * Render a TipTap document to HTML.
 */
export function renderTipTapDoc(doc: TipTapDoc): string {
  if (!doc.content || !Array.isArray(doc.content)) {
    return '';
  }

  let html = '';
  for (let i = 0; i < doc.content.length; i += 1) {
    const node = doc.content[i];

    if (isEntityCardNode(node)) {
      const cards: TipTapNode[] = [];

      while (i < doc.content.length) {
        const current = doc.content[i];

        if (isEntityCardNode(current)) {
          cards.push(current);
          i += 1;
          continue;
        }

        if (isEmptyParagraphNode(current) && isEntityCardNode(doc.content[i + 1])) {
          i += 1;
          continue;
        }

        break;
      }

      i -= 1;

      if (cards.length > 1) {
        const rows: string[] = [];
        for (let rowStart = 0; rowStart < cards.length; rowStart += 4) {
          rows.push(`<div class="entity-card-group-row">${cards.slice(rowStart, rowStart + 4).map(renderTipTapNode).join('')}</div>`);
        }

        html += `<div class="entity-card-scroll" data-type="entity-card-group">${rows.join('')}</div>`;
        continue;
      }

      html += renderTipTapNode(cards[0]);
      continue;
    }

    html += renderTipTapNode(node);
  }

  return html;
}
