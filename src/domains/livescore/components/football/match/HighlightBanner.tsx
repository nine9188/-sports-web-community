'use client';

import { useState, useEffect } from 'react';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import type { MatchHighlight } from '@/domains/livescore/types/highlight';

interface HighlightBannerProps {
  highlight: MatchHighlight | null;
  /** inline: 그 자리에서 재생 (모바일), modal: 모달로 재생 (데스크탑 사이드바) */
  mode?: 'inline' | 'modal';
}

export default function HighlightBanner({ highlight, mode = 'modal' }: HighlightBannerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ESC로 모달 닫기 + 스크롤 잠금
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  if (!highlight) return null;

  const thumbnailUrl =
    highlight.thumbnail_url ||
    `https://i.ytimg.com/vi/${highlight.video_id}/hqdefault.jpg`;

  const handlePlay = () => {
    if (mode === 'inline') {
      setIsPlaying(true);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-red-500 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
            </svg>
            <ContainerTitle>공식 하이라이트</ContainerTitle>
          </div>
        </ContainerHeader>

        {/* 영상 영역 */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {mode === 'inline' && isPlaying ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${highlight.video_id}?autoplay=1&rel=0`}
              title={highlight.video_title || '하이라이트'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={handlePlay}
              className="absolute inset-0 w-full h-full cursor-pointer group"
            >
              <img
                src={thumbnailUrl}
                alt={highlight.video_title || '하이라이트'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-5 h-5 text-white ml-0.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* 제목 + 채널명 */}
        {highlight.video_title && (
          <div className="px-4 py-2.5">
            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">
              {highlight.video_title}
            </p>
            {highlight.channel_name && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {highlight.channel_name}
              </p>
            )}
          </div>
        )}
      </Container>

      {/* 모달 - 데스크탑 전용 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors cursor-pointer"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{ paddingBottom: '56.25%' }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${highlight.video_id}?autoplay=1&rel=0`}
                title={highlight.video_title || '하이라이트'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {highlight.video_title && (
              <div className="mt-3">
                <p className="text-white text-[13px]">{highlight.video_title}</p>
                {highlight.channel_name && (
                  <p className="text-gray-400 text-xs mt-1">
                    {highlight.channel_name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
