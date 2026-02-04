'use client';

import React, { useEffect, useRef } from 'react';
import { processSocialEmbed } from './post-content/renderers';
import {
  populateEmptyMatchCards,
  updateMatchCardImages,
  setupMatchCardHover,
  cleanupMatchCardHover,
  registerMatchCardHoverHandler
} from './post-content/utils';

// 전역 호버 핸들러 등록
registerMatchCardHoverHandler();

interface PostContentProps {
  /** 서버에서 미리 처리된 HTML */
  processedHtml: string;
  meta?: Record<string, unknown> | null;
}

/**
 * 게시글 본문 컴포넌트
 *
 * - 서버에서 처리된 HTML을 바로 렌더링 (깜빡임 없음)
 * - 클라이언트에서 DOM 후처리만 수행 (소셜 임베드, 차트 등)
 */
export default function PostContent({ processedHtml, meta }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // DOM 후처리: 소셜 임베드, 매치카드, 예측 차트, 이미지 에러 핸들링
  useEffect(() => {
    if (!contentRef.current) return;

    const currentRef = contentRef.current;
    let observer: MutationObserver | undefined;
    let rafId: number;

    // requestAnimationFrame 2번으로 레이아웃 안정 후 실행
    const runAfterPaint = (callback: () => void) => {
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(callback);
      });
    };

    runAfterPaint(() => {
      // 1. 이미지 에러 핸들링 (onerror 대체)
      const images = currentRef.querySelectorAll('img[data-type="post-image"]');
      images.forEach((img) => {
        const imgEl = img as HTMLImageElement;
        imgEl.onerror = () => {
          imgEl.style.display = 'none';
          imgEl.onerror = null;
        };
      });

      // 2. 소셜 임베드 처리 (Twitter, Instagram 등)
      const socialEmbedElements = currentRef.querySelectorAll('div[data-type="social-embed"]');
      socialEmbedElements.forEach((element) => {
        processSocialEmbed(element);
      });

      // 3. 예측 차트 하이드레이션
      const predictionChartElements = currentRef.querySelectorAll('div[data-type="prediction-chart"]');
      predictionChartElements.forEach((element) => {
        if (element.getAttribute('data-hydrated') === 'true') return;

        const chartDataStr = element.getAttribute('data-chart');
        if (!chartDataStr) return;

        // data-chart 크기 제한 (50KB)
        if (chartDataStr.length > 50000) {
          console.warn('차트 데이터가 너무 큽니다 (50KB 초과)');
          return;
        }

        try {
          const chartData = JSON.parse(decodeURIComponent(chartDataStr));

          const chartContainer = document.createElement('div');
          chartContainer.className = 'prediction-chart-hydrated my-4';

          Promise.all([
            import('react-dom/client'),
            import('@/domains/prediction/components/PredictionChart')
          ]).then(([{ createRoot }, { default: PredictionChart }]) => {
            const root = createRoot(chartContainer);
            root.render(
              React.createElement(PredictionChart, {
                data: chartData,
                showRadar: true,
                showComparison: true,
                showPrediction: true
              })
            );

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

      // 4. 매치카드 처리
      populateEmptyMatchCards(currentRef);
      updateMatchCardImages(currentRef);
      observer = setupMatchCardHover(currentRef);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      if (currentRef) cleanupMatchCardHover(currentRef);
    };
  }, [processedHtml]);

  // 다크모드 변경 감지
  useEffect(() => {
    if (!contentRef.current) return;

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
  }, []);

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
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </>
  );
}
