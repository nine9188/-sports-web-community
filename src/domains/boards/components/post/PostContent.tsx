'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import MatchStatsChart from './MatchStatsChart';
import { parseMatchStatsFromText } from './post-content/parsers';
import {
  renderTipTapDoc,
  renderRssHeader,
  renderRssContent,
  isRssPost,
  processSocialEmbed
} from './post-content/renderers';
import { sanitizeHTML } from './post-content/config';
import {
  populateEmptyMatchCards,
  updateMatchCardImages,
  setupMatchCardHover,
  cleanupMatchCardHover,
  registerMatchCardHoverHandler,
  convertChartData,
  hasMatchDataInText,
  isMatchHeader
} from './post-content/utils';
import type { TipTapDoc, RssPost, PostContentProps } from './post-content/types';

// 전역 호버 핸들러 등록
registerMatchCardHoverHandler();

export default function PostContent({ content, meta }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [processedContent, setProcessedContent] = useState<string>('');

  // 객체 콘텐츠를 HTML로 변환하는 함수
  const processObjectContent = useCallback((content: TipTapDoc | RssPost | Record<string, unknown>) => {
    if (typeof content === 'object') {
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
          // 다른 형태의 JSON
          htmlContent += `
            <div class="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-md overflow-auto text-sm font-mono">
              <pre class="text-gray-900 dark:text-[#F0F0F0]">${JSON.stringify(content, null, 2)}</pre>
            </div>
          `;
        }

        htmlContent += '</div>';
        return htmlContent;
      } catch {
        return `<div class="text-red-500">오류: 게시글 내용을 표시할 수 없습니다.</div>`;
      }
    }
    return '';
  }, []);

  // content를 HTML로 변환
  const processContent = useCallback(() => {
    if (!content) return '';

    if (typeof content === 'string') {
      // JSON 형태인지 확인
      if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
        try {
          const parsedContent = JSON.parse(content);
          return processObjectContent(parsedContent);
        } catch {
          return content;
        }
      }
      return content;
    }

    return processObjectContent(content);
  }, [content, processObjectContent]);

  // 소셜 임베드와 차트 처리
  const processEmbeds = useCallback(() => {
    if (!contentRef.current || !isMounted) return;
    const rootElement = contentRef.current;

    // 차트 데이터 처리
    let chartDataToRender = null;

    if (meta?.chart_data && Array.isArray(meta.chart_data)) {
      chartDataToRender = meta.chart_data.map((data: Record<string, unknown>) => convertChartData(data));
    } else {
      const textContent = rootElement.textContent || '';
      if (hasMatchDataInText(textContent)) {
        const parsedData = parseMatchStatsFromText(textContent);
        if (parsedData) {
          chartDataToRender = [parsedData];
        }
      }
    }

    // 차트 렌더링
    if (chartDataToRender && Array.isArray(chartDataToRender)) {
      const matchHeaders = rootElement.querySelectorAll('h2, h3');

      matchHeaders.forEach((header, index) => {
        if (index < chartDataToRender.length && chartDataToRender[index]) {
          const chartData = chartDataToRender[index];

          const existingChart = header.nextElementSibling?.querySelector('.match-stats-chart');
          if (existingChart) return;

          const headerText = header.textContent || '';
          if (!isMatchHeader(headerText)) return;

          const chartContainer = document.createElement('div');
          chartContainer.className = 'chart-container';

          import('react-dom/client').then(({ createRoot }) => {
            const root = createRoot(chartContainer);
            root.render(
              React.createElement(MatchStatsChart, {
                homeTeam: chartData.homeTeam || { name: '홈팀' },
                awayTeam: chartData.awayTeam || { name: '원정팀' },
                bettingOdds: chartData.bettingOdds || null
              })
            );
          }).catch(() => {
            chartContainer.innerHTML = `
              <div class="match-stats-chart-container my-8 p-6 bg-red-50 border border-red-200 rounded-xl">
                <div class="text-center text-red-600">
                  <p class="font-medium">차트를 로드할 수 없습니다</p>
                  <p class="text-sm mt-1">페이지를 새로고침해 주세요</p>
                </div>
              </div>
            `;
          });

          header.parentNode?.insertBefore(chartContainer, header.nextSibling);
        }
      });
    }

    // 소셜 임베드 처리
    const socialEmbedElements = rootElement.querySelectorAll('div[data-type="social-embed"]');
    socialEmbedElements.forEach((element) => {
      processSocialEmbed(element);
    });
  }, [isMounted, meta]);

  // 마운트 및 콘텐츠 처리
  useEffect(() => {
    setIsMounted(true);
    const rawContent = processContent();
    const sanitizedContent = sanitizeHTML(rawContent);
    setProcessedContent(sanitizedContent);
    return () => setIsMounted(false);
  }, [processContent]);

  // 임베드 및 매치카드 처리
  useEffect(() => {
    if (!isMounted || !contentRef.current) return;

    const currentRef = contentRef.current;
    let observer: MutationObserver | undefined;

    const timeoutId = setTimeout(() => {
      // HTML로 저장된 빈 매치카드를 먼저 채우기
      populateEmptyMatchCards(currentRef);
      processEmbeds();
      updateMatchCardImages(currentRef);
      observer = setupMatchCardHover(currentRef);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
      if (currentRef) cleanupMatchCardHover(currentRef);
    };
  }, [isMounted, processEmbeds]);

  // 다크모드 변경 감지
  useEffect(() => {
    if (!isMounted || !contentRef.current) return;

    const currentRef = contentRef.current;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateMatchCardImages(currentRef);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [isMounted]);

  return (
    <>
      <style jsx>{`
        /* 경기 카드 기본 스타일 */
        :global(.match-card),
        :global(.processed-match-card) {
          border: 1px solid rgba(0, 0, 0, 0.07) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          margin: 12px 0 !important;
          background: white !important;
          width: 100% !important;
          max-width: 100% !important;
          display: block !important;
          transition: all 0.2s ease !important;
        }

        :global(.dark .match-card),
        :global(.dark .processed-match-card) {
          background: #1D1D1D !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        :global(.match-card a),
        :global(.processed-match-card a) {
          display: block !important;
          text-decoration: none !important;
          color: inherit !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }

        :global(.match-card:hover),
        :global(.processed-match-card:hover) {
          background: #EAEAEA !important;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-2px) !important;
        }

        :global(.dark .match-card:hover),
        :global(.dark .processed-match-card:hover) {
          background: #333333 !important;
        }

        :global(.match-card:has(a:hover)),
        :global(.processed-match-card:has(a:hover)) {
          background: #EAEAEA !important;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-2px) !important;
        }

        :global(.dark .match-card:has(a:hover)),
        :global(.dark .processed-match-card:has(a:hover)) {
          background: #333333 !important;
        }

        :global(.match-card img),
        :global(.processed-match-card img) {
          object-fit: contain !important;
          flex-shrink: 0 !important;
          display: block !important;
        }

        :global(.match-card .league-header),
        :global(.processed-match-card .league-header) {
          padding: 12px !important;
          background-color: #f9fafb !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
          display: flex !important;
          align-items: center !important;
          height: 40px !important;
        }

        :global(.dark .match-card .league-header),
        :global(.dark .processed-match-card .league-header) {
          background-color: #262626 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        :global(.match-card .league-logo),
        :global(.processed-match-card .league-logo) {
          width: 24px !important;
          height: 24px !important;
          object-fit: contain !important;
          margin-right: 8px !important;
          flex-shrink: 0 !important;
        }

        :global(.match-card .league-name),
        :global(.processed-match-card .league-name) {
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #4b5563 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        :global(.dark .match-card .league-name),
        :global(.dark .processed-match-card .league-name) {
          color: #d1d5db !important;
        }

        :global(.match-card .match-main),
        :global(.processed-match-card .match-main) {
          padding: 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }

        :global(.match-card .team-info),
        :global(.processed-match-card .team-info) {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 40% !important;
        }

        :global(.match-card .team-logo),
        :global(.processed-match-card .team-logo) {
          width: 48px !important;
          height: 48px !important;
          object-fit: contain !important;
          margin-bottom: 8px !important;
          flex-shrink: 0 !important;
        }

        :global(.match-card .team-name),
        :global(.processed-match-card .team-name) {
          font-size: 14px !important;
          font-weight: 500 !important;
          text-align: center !important;
          line-height: 1.2 !important;
          color: #111827 !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }

        :global(.dark .match-card .team-name),
        :global(.dark .processed-match-card .team-name) {
          color: #F0F0F0 !important;
        }

        :global(.match-card .team-name.winner),
        :global(.processed-match-card .team-name.winner) {
          color: #2563eb !important;
        }

        :global(.match-card .score-area),
        :global(.processed-match-card .score-area) {
          text-align: center !important;
          flex-shrink: 0 !important;
          width: 20% !important;
        }

        :global(.match-card .score),
        :global(.processed-match-card .score) {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-bottom: 8px !important;
        }

        :global(.match-card .score-number),
        :global(.processed-match-card .score-number) {
          font-size: 24px !important;
          font-weight: bold !important;
          min-width: 24px !important;
          text-align: center !important;
        }

        :global(.match-card .score-separator),
        :global(.processed-match-card .score-separator) {
          color: #9ca3af !important;
          margin: 0 4px !important;
        }

        :global(.match-card .match-status),
        :global(.processed-match-card .match-status) {
          font-size: 12px !important;
          color: #6b7280 !important;
        }

        :global(.match-card .match-status.live),
        :global(.processed-match-card .match-status.live) {
          color: #059669 !important;
          font-weight: 500 !important;
        }

        :global(.match-card .match-footer),
        :global(.processed-match-card .match-footer) {
          padding: 8px 12px !important;
          background-color: #f9fafb !important;
          border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
          text-align: center !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        :global(.dark .match-card .match-footer),
        :global(.dark .processed-match-card .match-footer) {
          background-color: #262626 !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        :global(.match-card .footer-link),
        :global(.processed-match-card .footer-link) {
          font-size: 12px !important;
          color: #6b7280 !important;
          text-decoration: none !important;
        }

        :global(.dark .match-card .footer-link),
        :global(.dark .processed-match-card .footer-link) {
          color: #9ca3af !important;
        }

        :global(.video-wrapper video) {
          width: 100%;
          max-width: 800px;
          height: auto;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        @media (min-width: 1025px) {
          :global(.video-wrapper) {
            margin: 2rem auto;
            max-width: 900px;
          }
          :global(.video-wrapper video) {
            max-height: 650px;
          }
        }

        @media (min-width: 1441px) {
          :global(.video-wrapper) {
            margin: 2.5rem auto;
            max-width: 1000px;
          }
          :global(.video-wrapper video) {
            max-height: 750px;
          }
        }

        @media (max-width: 480px) {
          :global(.video-wrapper video) {
            max-height: none !important;
            height: auto !important;
            aspect-ratio: 16/9 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          :global(.video-wrapper) {
            margin: 0.5rem -1rem !important;
            border-radius: 0 !important;
          }
          :global(.prose .video-wrapper) {
            margin-left: -1rem !important;
            margin-right: -1rem !important;
            width: calc(100% + 2rem) !important;
            max-width: calc(100% + 2rem) !important;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          :global(.video-wrapper video) {
            max-height: none !important;
            height: auto !important;
            aspect-ratio: 16/9 !important;
          }
          :global(.video-wrapper) {
            margin: 0.5rem -0.5rem !important;
          }
          :global(.prose .video-wrapper) {
            margin-left: -0.5rem !important;
            margin-right: -0.5rem !important;
            width: calc(100% + 1rem) !important;
            max-width: calc(100% + 1rem) !important;
          }
        }

        :global(.rss-content) {
          line-height: 1.6;
        }

        :global(.rss-content img) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }

        :global(.prose img) {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px !important;
          margin: 16px auto !important;
          display: block !important;
        }
      `}</style>
      <div
        ref={contentRef}
        className="prose prose-sm sm:prose-sm lg:prose-base max-w-none prose-headings:font-bold prose-img:rounded-lg prose-img:mx-auto dark:prose-invert p-4 sm:p-6"
        dangerouslySetInnerHTML={{ __html: isMounted ? processedContent : '' }}
      />
    </>
  );
}
