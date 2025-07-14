'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import Image from 'next/image';
import { convertApiSportsUrl, isApiSportsUrl, getPlayerImageUrl } from '@/shared/utils/image-proxy';

interface PlayerImageProps {
  src: string | undefined;
  alt: string;
  className?: string;
  playerId?: number;
  priority?: boolean;
}

interface ImageState {
  url: string | null;
  loading: boolean;
  error: boolean;
  retryCount: number;
}

const PlayerImage = memo(function PlayerImage({ 
  src, 
  alt, 
  className = "", 
  playerId,
  priority = false 
}: PlayerImageProps) {
  const [imageState, setImageState] = useState<ImageState>({
    url: null,
    loading: true,
    error: false,
    retryCount: 0
  });
  
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // 에러 처리 및 재시도 로직
  const handleImageError = useCallback(() => {
    setImageState(prev => {
      const newRetryCount = prev.retryCount + 1;
      
      // 최대 3번까지 재시도
      if (newRetryCount <= 3) {
        // 지수 백오프: 1초, 2초, 4초 후 재시도
        const delay = Math.pow(2, newRetryCount - 1) * 1000;
        
        retryTimeoutRef.current = setTimeout(() => {
          setImageState(current => ({ 
            ...current, 
            retryCount: newRetryCount,
            loading: true,
            error: false 
          }));
        }, delay);

        return {
          ...prev,
          loading: false,
          error: true,
          retryCount: newRetryCount
        };
      }

      // 재시도 횟수 초과 시 최종 에러 상태
      return {
        ...prev,
        loading: false,
        error: true,
        retryCount: newRetryCount
      };
    });
  }, []);

  // 수동 재시도 함수
  const handleManualRetry = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      retryCount: 0,
      loading: true,
      error: false
    }));
  }, []);

  // Intersection Observer를 사용한 지연 로딩
  useEffect(() => {
    if (!imgRef.current || priority) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // 50px 전에 미리 로드
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [priority]);

  // 이미지 로딩 로직
  useEffect(() => {
    if (!isVisible) return;

    const loadImage = async () => {
      try {
        setImageState(prev => ({ ...prev, loading: true, error: false }));

        // TODO: 나중에 캐시된 이미지 확인 로직 추가
        // if (playerId) {
        //   const cachedResult = await getCachedPlayerImage(playerId);
        //   if (cachedResult.success && cachedResult.url) {
        //     setImageState({
        //       url: cachedResult.url,
        //       loading: false,
        //       error: false,
        //       retryCount: 0
        //     });
        //     return;
        //   }
        // }

        // 이미지 URL 처리 - 프록시 URL 사용
        let imageUrl = src;
        
        // playerId가 있으면 프록시 URL 생성
        if (playerId) {
          imageUrl = getPlayerImageUrl(playerId);
        } else if (src && isApiSportsUrl(src)) {
          // API-Sports URL인 경우 프록시 URL로 변환
          imageUrl = convertApiSportsUrl(src);
        }
        
        console.log(`[PlayerImage] 이미지 로딩 시도: ${imageUrl}`);
        
        if (imageUrl) {
          // 이미지 유효성 검사
          const img = new window.Image();
          img.onload = () => {
            console.log(`[PlayerImage] 이미지 로딩 성공: ${imageUrl}`);
            setImageState({
              url: imageUrl,
              loading: false,
              error: false,
              retryCount: 0
            });
          };
          img.onerror = () => {
            console.error(`[PlayerImage] 이미지 로딩 실패: ${imageUrl}`);
            handleImageError();
          };
          img.src = imageUrl;
        } else {
          console.warn('[PlayerImage] 이미지 URL이 없습니다');
          setImageState(prev => ({ ...prev, loading: false, error: true }));
        }
      } catch (error) {
        console.error('Error loading player image:', error);
        handleImageError();
      }
    };

    loadImage();
  }, [isVisible, src, playerId, handleImageError]);

  // 로딩 중이거나 아직 보이지 않는 경우
  if (!isVisible || imageState.loading) {
    return (
      <div 
        ref={imgRef}
        className={`relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200 ${className}`}
      >
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // 에러 상태 (재시도 가능한 경우)
  if (imageState.error && imageState.retryCount <= 3) {
    return (
      <div className={`relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200 ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
          <button
            onClick={handleManualRetry}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            title="이미지 다시 로드"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // 최종 에러 상태 (재시도 횟수 초과)
  if (imageState.error) {
    return (
      <div className={`relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200 ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="기본 이미지">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>
    );
  }

  // 성공적으로 로드된 이미지
  return (
    <div className={`relative w-10 h-10 overflow-hidden rounded-full border-2 border-gray-200 ${className}`}>
      <Image 
        src={imageState.url!}
        alt={alt}
        width={40}
        height={40}
        className="object-cover rounded-full"
        unoptimized
        onError={handleImageError}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
      />
    </div>
  );
});

export default PlayerImage; 