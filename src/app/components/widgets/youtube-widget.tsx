'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// 유튜브 비디오 데이터 인터페이스
interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  videoId: string;
  post_number: number;
}

// API 응답 데이터 인터페이스
interface VideoData {
  id: string;
  title: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  channelTitle?: string;
  channel_title?: string;
  publishedAt?: string;
  published_at?: string;
  videoId?: string;
  video_id?: string;
  post_number?: number;
  [key: string]: unknown;
}

interface YouTubeWidgetProps {
  initialVideos?: YouTubeVideo[];
  boardSlug?: string;
}

export default function YouTubeWidget({ 
  initialVideos = [], 
  boardSlug = 'kbs-sports'
}: YouTubeWidgetProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialVideos);
  const [loading, setLoading] = useState<boolean>(initialVideos.length === 0);
  const [error, setError] = useState<string | null>(null);
  const isDataFetched = useRef<boolean>(false);
  
  // 스와이프를 위한 ref
  const touchStartXRef = useRef<number | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  
  useEffect(() => {
    // 이미 데이터를 가져왔거나 초기 비디오가 있으면 API 호출 스킵
    if (isDataFetched.current || initialVideos.length > 0) return;

    const fetchYouTubeVideos = async () => {
      try {
        setLoading(true);
        
        // 유튜브 데이터 가져오기 API
        const response = await fetch(`/api/youtube/videos?boardSlug=${boardSlug}&limit=5`);
        
        if (!response.ok) {
          throw new Error('유튜브 영상 목록을 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        // 빈 배열인 경우 정상적으로 처리
        if (!Array.isArray(data)) {
          setVideos([]);
          return;
        }
        
        if (data.length === 0) {
          setVideos([]);
          return;
        }
        
        // 받은 데이터를 YouTubeVideo 형식으로 변환
        const formattedVideos: YouTubeVideo[] = data.map((video: VideoData) => {
          return {
            id: video.id || `video-${Math.random().toString(36).substring(2, 9)}`,
            title: video.title || '제목 없음',
            thumbnailUrl: video.thumbnailUrl || video.thumbnail_url || `/public/sample/youtube-placeholder.jpg`,
            channelTitle: video.channelTitle || video.channel_title || 'KBS 스포츠',
            publishedAt: video.publishedAt || video.published_at || new Date().toISOString(),
            videoId: video.videoId || video.video_id || '',
            post_number: video.post_number || 0
          };
        });
        
        setVideos(formattedVideos);
        isDataFetched.current = true;
      } catch {
        setError('유튜브 영상 목록을 불러오는데 실패했습니다.');
        isDataFetched.current = true; // 에러가 발생해도 중복 호출 방지
      } finally {
        setLoading(false);
      }
    };

    fetchYouTubeVideos();
  }, [initialVideos.length, boardSlug]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // 날짜가 유효하지 않으면 '방금 전' 반환
      if (isNaN(date.getTime())) return '방금 전';
      
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return `${diffMinutes}분 전`;
        }
        return `${diffHours}시간 전`;
      } else if (diffDays < 7) {
        return `${diffDays}일 전`;
      } else if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)}주 전`;
      } else {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      }
    } catch {
      return '날짜 정보 없음';
    }
  };

  // 제목 길이 제한
  const truncateTitle = (title: string, maxLength: number = 80) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = () => {
    // 필요한 경우 여기에 로직 추가
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || !cardContainerRef.current) return;
    
    // 스와이프 로직 제거 - 자연스러운 스크롤만 사용
    
    touchStartXRef.current = null;
  };

  // 로딩 상태
  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <div className="w-full aspect-video animate-pulse bg-gray-200 dark:bg-gray-700" />
              <div className="p-3">
                <div className="w-full h-4 mb-2 animate-pulse bg-gray-200 dark:bg-gray-700" />
                <div className="w-3/4 h-4 mb-2 animate-pulse bg-gray-200 dark:bg-gray-700" />
                <div className="w-1/2 h-4 animate-pulse bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error && videos.length === 0) {
    return (
      <div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (videos.length === 0) {
    return null; // 아무것도 표시하지 않음
  }

  return (
    <div>
      <div className="relative">
        {/* 비디오 목록 */}
        <div 
          ref={cardContainerRef}
          className="flex overflow-x-auto gap-4 scroll-smooth hide-scrollbar pb-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            scrollPaddingLeft: '16px', 
            scrollPaddingRight: '16px',
            overflowX: 'auto',
            display: 'flex',
            flexDirection: 'row',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {videos.map((video, index) => (
            <Link
              key={video.id}
              href={video.id.startsWith('sample') 
                ? `https://www.youtube.com/watch?v=${video.videoId}` 
                : `/boards/${boardSlug}/${typeof video.post_number === 'number' ? video.post_number : 0}`}
              target={video.id.startsWith('sample') ? "_blank" : undefined}
              rel={video.id.startsWith('sample') ? "noopener noreferrer" : undefined}
              ref={(el) => { cardRefs.current[index] = el; }}
              className="flex-none w-[85%] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-13px)] bg-white rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group hover:translate-y-[-2px] hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
              style={{
                WebkitTapHighlightColor: 'transparent',
                transform: 'translate3d(0,0,0)' // 하드웨어 가속 추가
              }}
            >
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  sizes="(max-width: 640px) 85vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  className="object-cover transform transition-transform group-hover:scale-[1.02]"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                />
                {/* 재생 버튼 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute top-0 right-0 bg-black/70 text-white px-2 py-1 text-xs">
                  {formatDate(video.publishedAt)}
                </div>
              </div>
              <div className="p-2 md:p-3 bg-white">
                <h3 className="font-medium text-xs md:text-sm line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors">{truncateTitle(video.title)}</h3>
              </div>
            </Link>
          ))}
          
          {/* 좌우 끝에 패딩 역할을 하는 빈 div */}
          <div className="flex-none w-4"></div>
        </div>
      </div>
      
      {/* CSS 스타일 */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
} 