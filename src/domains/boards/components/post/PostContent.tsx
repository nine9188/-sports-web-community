'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import PredictionChart from '@/domains/prediction/components/PredictionChart';
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
  registerMatchCardHoverHandler
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

    // 소셜 임베드 처리
    const socialEmbedElements = rootElement.querySelectorAll('div[data-type="social-embed"]');
    socialEmbedElements.forEach((element) => {
      processSocialEmbed(element);
    });

    // 예측 차트 하이드레이션
    const predictionChartElements = rootElement.querySelectorAll('div[data-type="prediction-chart"]');
    predictionChartElements.forEach((element) => {
      // 이미 하이드레이션 됐으면 스킵
      if (element.getAttribute('data-hydrated') === 'true') return;

      const chartDataStr = element.getAttribute('data-chart');
      if (!chartDataStr) return;

      try {
        const chartData = JSON.parse(decodeURIComponent(chartDataStr));

        // 새 컨테이너 생성
        const chartContainer = document.createElement('div');
        chartContainer.className = 'prediction-chart-hydrated my-4';

        import('react-dom/client').then(({ createRoot }) => {
          const root = createRoot(chartContainer);
          root.render(
            React.createElement(PredictionChart, {
              data: chartData,
              showRadar: true,
              showComparison: true,
              showPrediction: true
            })
          );

          // 기존 요소 교체
          element.innerHTML = '';
          element.appendChild(chartContainer);
          element.setAttribute('data-hydrated', 'true');
        }).catch((err) => {
          console.error('예측 차트 로드 실패:', err);
        });
      } catch (err) {
        console.error('예측 차트 데이터 파싱 실패:', err);
      }
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
