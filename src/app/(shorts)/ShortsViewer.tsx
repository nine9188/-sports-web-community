'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Short } from './types';
import Link from 'next/link';

interface ShortsViewerProps {
  currentShortId: string;
  shorts: Short[];
}

export default function ShortsViewer({ currentShortId, shorts }: ShortsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shortsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);
  const isScrolling = useRef<boolean>(false);

  // 이전 쇼츠로 이동
  const handlePrevShort = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      if (shortsRefs.current[prevIndex]) {
        shortsRefs.current[prevIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentIndex(prevIndex); // 인덱스 업데이트 추가
      }
    }
  }, [currentIndex]);

  // 다음 쇼츠로 이동
  const handleNextShort = useCallback(() => {
    if (currentIndex < shorts.length - 1) {
      const nextIndex = currentIndex + 1;
      if (shortsRefs.current[nextIndex]) {
        shortsRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentIndex(nextIndex); // 인덱스 업데이트 추가
      }
    }
  }, [currentIndex, shorts.length]);

  // 글로벌 스타일 적용
  useEffect(() => {
    // 오버스크롤 방지 및 고정 배경색
    document.body.style.backgroundColor = 'black';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    
    return () => {
      // 스타일 복원
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
    };
  }, []);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 현재 쇼츠 ID에 해당하는 인덱스 찾기
  useEffect(() => {
    const index = shorts.findIndex(short => short.id === currentShortId);
    if (index !== -1) {
      setCurrentIndex(index);
      // 페이지 로드 시 현재 쇼츠로 스크롤
      setTimeout(() => {
        shortsRefs.current[index]?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [currentShortId, shorts]);

  // IntersectionObserver를 사용하여 화면에 보이는 쇼츠 감지
  useEffect(() => {
    if (isSnapping) return;

    // 이전 observer 해제
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        if (isSnapping) return;

        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
          // 가장 가시성이 높은 쇼츠 찾기
          const mostVisibleEntry = visibleEntries.reduce((prev, current) => 
            (current.intersectionRatio > prev.intersectionRatio) ? current : prev
          );
          
          const shortElement = mostVisibleEntry.target as HTMLElement;
          const shortId = shortElement.dataset.shortId;
          
          if (shortId) {
            const newIndex = shorts.findIndex(short => short.id === shortId);
            if (newIndex !== -1 && newIndex !== currentIndex) {
              setCurrentIndex(newIndex);
              // URL 업데이트 (네이버 클립처럼)
              window.history.replaceState(null, '', `/shorts/${shortId}`);
            }
          }
        }
      },
      {
        threshold: 0.7, // 임계값 조정: 화면에 70% 이상 보일 때 감지
        root: null
      }
    );

    // 모든 쇼츠 요소를 관찰 대상으로 등록
    shortsRefs.current.forEach(ref => {
      if (ref) observer.current?.observe(ref);
    });

    const currentObserver = observer.current;

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [shorts, currentIndex, isSnapping]);

  // 스크롤 이벤트 처리 - 한 번에 한 쇼츠씩 이동 (영상 영역 외부만)
  useEffect(() => {
    if (isMobile) return; // 모바일에서는 사용 안함

    const handleWheel = (e: WheelEvent) => {
      // 타겟 요소가 iframe이나 video인 경우(또는 그 내부 요소인 경우) 이벤트 무시
      const target = e.target as HTMLElement;
      const isVideoElement = target.tagName === 'VIDEO' || 
                             target.tagName === 'IFRAME' || 
                             target.closest('video') || 
                             target.closest('iframe');
      
      if (isVideoElement) {
        // 영상 내부에서는 자연스러운 스크롤 허용
        return;
      }
      
      if (isScrolling.current) return;
      
      isScrolling.current = true;
      
      // 스크롤 방향에 따라 다음/이전 쇼츠로 이동
      if (e.deltaY > 0) {
        handleNextShort();
      } else {
        handlePrevShort();
      }
      
      // 스크롤 디바운싱 (빠른 연속 스크롤 방지)
      setTimeout(() => {
        isScrolling.current = false;
      }, 300);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentIndex, isMobile, handleNextShort, handlePrevShort]);

  // 스크롤 이벤트 처리 - 한 번에 한 쇼츠씩 이동 (모든 영역)
  useEffect(() => {
    if (isMobile) return; // 모바일에서는 사용 안함

    const handleWheel = (e: WheelEvent) => {
      if (isScrolling.current) return;
      
      // 기본 스크롤 방지
      e.preventDefault();
      
      isScrolling.current = true;
      
      // 스크롤 방향에 따라 다음/이전 쇼츠로 이동
      if (e.deltaY > 0) {
        handleNextShort();
      } else {
        handlePrevShort();
      }
      
      // 스크롤 디바운싱 (빠른 연속 스크롤 방지)
      setTimeout(() => {
        isScrolling.current = false;
      }, 300);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentIndex, isMobile, handleNextShort, handlePrevShort]);

  // 키보드 화살표로 이동 기능 추가
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        handlePrevShort();
      } else if (e.key === 'ArrowDown') {
        handleNextShort();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, handleNextShort, handlePrevShort]);

  // 터치 스와이프 처리 - 모바일 전용
  useEffect(() => {
    if (!isMobile) return; // 모바일에서만 실행
    
    let touchStartY = 0;
    let touchEndY = 0;
    let startTime = 0;
    let isTouching = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      // 터치 시작 지점 저장
      if (isScrolling.current) return;
      
      // 모든 영역에서 터치 이벤트 처리
      touchStartY = e.touches[0].clientY;
      startTime = Date.now();
      isTouching = true;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching) return;
      
      touchEndY = e.touches[0].clientY;
      
      // 모든 영역에서 스와이프 중에 기본 스크롤 동작 방지 (1쇼츠 1스크롤)
      const swipeDistance = touchStartY - touchEndY;
      if (Math.abs(swipeDistance) > 5) {
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = () => {
      if (isScrolling.current || !isTouching) return;
      
      const swipeDistanceY = touchStartY - touchEndY;
      const swipeTime = Date.now() - startTime;
      
      // 충분한 스와이프 거리이거나 빠른 스와이프인 경우 처리
      if (Math.abs(swipeDistanceY) > 50 || (Math.abs(swipeDistanceY) > 20 && swipeTime < 300)) {
        isScrolling.current = true;
        setIsSnapping(true);
        
        if (swipeDistanceY > 0) {
          // 위로 스와이프 - 다음 쇼츠
          handleNextShort();
        } else {
          // 아래로 스와이프 - 이전 쇼츠
          handlePrevShort();
        }
        
        setTimeout(() => {
          isScrolling.current = false;
          setIsSnapping(false);
        }, 500);
      }
      
      isTouching = false;
    };
    
    // 터치 이벤트를 문서 레벨에 적용
    const addEventListeners = () => {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      // 모바일에서 스크롤이 작동하도록 스타일 조정
      const container = containerRef.current;
      if (container) {
        container.style.overflowY = 'auto';
        container.style.overscrollBehavior = 'contain';
      }
      
      // iframe 내 객체에 대한 포인터 이벤트 허용
      const frames = document.querySelectorAll('iframe');
      frames.forEach(frame => {
        // 모든 iframe에 대한 포인터 이벤트 허용
        frame.style.pointerEvents = 'auto';
      });
    };
    
    addEventListeners();
    
    // cleanup 함수에서 사용할 현재 container 참조 저장
    const currentContainer = containerRef.current;
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      // 정리 시 스타일 복원 (저장된 참조 사용)
      if (currentContainer) {
        currentContainer.style.overflowY = '';
        currentContainer.style.overscrollBehavior = '';
      }
      
      // 정리 시 iframe 원래대로 복원
      const frames = document.querySelectorAll('iframe');
      frames.forEach(frame => {
        frame.style.pointerEvents = 'auto';
      });
    };
  }, [isMobile, currentIndex, handleNextShort, handlePrevShort]);

  // 쇼츠 컨테이너 높이 계산 (헤더와 푸터 고려)
  const containerHeight = 'calc(100vh)'; // 전체 화면 높이 사용
  
  // 현재 인덱스가 변경될 때 비디오 재생 관리 - 강화된 버전
  useEffect(() => {
    // 모든 비디오 강제 정지
    const pauseAllVideos = () => {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        try {
          const videoElement = video as HTMLVideoElement;
          videoElement.pause();
          videoElement.currentTime = 0;
        } catch (err: unknown) {
          console.error('비디오 정지 실패:', err);
        }
      });
    };
    
    // 모든 YouTube 영상 정지 (src 재설정을 통해)
    const resetAllYouTubeVideos = () => {
      const iframes = document.querySelectorAll('iframe[src*="youtube.com"]');
      iframes.forEach(iframe => {
        try {
          const iframeIndex = parseInt(iframe.getAttribute('data-index') || '-1');
          const src = iframe.getAttribute('src');
          if (src) {
            if (iframeIndex !== currentIndex) {
              // autoplay=0으로 설정하여 재생 중지
              let newSrc = src;
              newSrc = newSrc.replace(/autoplay=1/g, 'autoplay=0');
              newSrc = newSrc.replace(/mute=0/g, 'mute=1');
              if (src !== newSrc) {
                iframe.setAttribute('src', newSrc);
              }
            } else {
              // 현재 인덱스는 재생
              let newSrc = src;
              newSrc = newSrc.replace(/autoplay=0/g, 'autoplay=1');
              newSrc = newSrc.replace(/mute=1/g, 'mute=0');
              if (src !== newSrc) {
                iframe.setAttribute('src', newSrc);
              }
            }
          }
        } catch (e) {
          console.error('YouTube 영상 재설정 실패:', e);
        }
      });
    };
    
    // 현재 인덱스 비디오 재생
    const playCurrentVideo = () => {
      const videos = document.querySelectorAll(`video[data-index="${currentIndex}"]`);
      videos.forEach(video => {
        try {
          const videoElement = video as HTMLVideoElement;
          if (videoElement.paused) {
            videoElement.play().catch((err: Error) => console.error('비디오 재생 실패:', err));
          }
        } catch (err: unknown) {
          console.error('비디오 재생 실패:', err);
        }
      });
    };
    
    // 실행 순서 중요: 모두 정지 -> 현재 영상 재생
    pauseAllVideos();
    resetAllYouTubeVideos();
    setTimeout(playCurrentVideo, 100); // 약간의 지연 후 현재 비디오 재생
    
    // 페이지가 언마운트되거나 인덱스가 바뀌기 전에 모든 영상 정지
    return () => {
      pauseAllVideos();
    };
  }, [currentIndex]);

  // 현재 인덱스 변경 시 처리
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < shorts.length) {
      const currentPost = shorts[currentIndex];
      // URL 업데이트 (히스토리에 추가하지 않음)
      const newUrl = `/shorts/${currentPost.id}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentIndex, shorts]);

  if (!shorts.length) {
    return <div className="w-full text-center py-8">쇼츠를 찾을 수 없습니다.</div>;
  }

  // 헤더 컴포넌트 - 항상 상단에 고정
  const Header = () => (
    <div className="fixed top-0 left-0 right-0 p-4 md:bg-white md:shadow-sm bg-transparent pointer-events-auto">
      <Link href="/" className="inline-block">
        <div className="flex items-center">
          <span className="text-3xl font-bold md:text-black text-white">SPORTS</span>
          <span className="ml-1 px-2 py-1 bg-gray-200 text-xs font-semibold rounded">Shorts</span>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      {isMobile ? (
        // 모바일 레이아웃
        <div className="fixed inset-0 bg-black w-screen h-screen overflow-hidden snap-y snap-mandatory" ref={containerRef}>
          {shorts.map((short, index) => (
            <div 
              key={short.id}
              ref={(el) => { shortsRefs.current[index] = el; }}
              data-short-id={short.id}
              className="relative w-full h-screen flex justify-center items-center snap-start snap-always"
            >
              {/* YouTube 영상 표시 */}
              {short.youtubeId && (
                <div className="relative w-full h-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${short.youtubeId}?autoplay=${index === currentIndex ? 1 : 0}&controls=1&rel=0&mute=${index !== currentIndex ? 1 : 0}&enablejsapi=1&playsinline=1&fs=0&loop=1&playlist=${short.youtubeId}`}
                    title={short.title}
                    className="w-full h-full absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-index={index}
                    id={`youtube-${short.id}`}
                  ></iframe>
                </div>
              )}

              {/* 비디오 출처 표시가 아닌 경우 */}
              {!short.youtubeId && short.videoUrl && (
                <div className="relative w-full h-full">
                  <video
                    src={short.videoUrl}
                    className="w-full h-full absolute inset-0 object-cover"
                    controls
                    autoPlay={index === currentIndex}
                    playsInline
                    muted={index !== currentIndex}
                    loop
                    data-index={index}
                  ></video>
                </div>
              )}

              {/* 모바일에서는 제목과 설명을 제거 */}
            </div>
          ))}
        </div>
      ) : (
        // 데스크탑 레이아웃 (기존 코드)
        <div 
          ref={containerRef} 
          className="flex flex-col items-center w-full overflow-y-auto relative md:pt-[70px]"
          style={{ 
            height: containerHeight,
            position: 'relative'
          }}
        >
          <div className="w-full overflow-y-auto h-full pb-16">
            {shorts.map((short, index) => (
              <div 
                key={short.id}
                ref={(el) => { shortsRefs.current[index] = el; }}
                data-short-id={short.id}
                className="relative w-full flex justify-center items-start"
                style={{ 
                  height: 'calc(93vh)',
                  marginBottom: index < shorts.length - 1 ? '-80px' : '0',
                  position: 'relative'
                }}
              >
                <div 
                  className="flex flex-col items-center justify-start w-full"
                  style={{
                    height: '100%',
                    position: 'relative'
                  }}
                >
                  <div className="relative mx-auto bg-black overflow-hidden rounded-xl"
                      style={{ 
                        width: '380px', 
                        height: '100%', 
                        maxHeight: '660px',
                        paddingTop: '0'
                      }}>
                    {/* YouTube 영상 표시 */}
                    {short.youtubeId && (
                      <div className="relative w-full h-full">
                        <iframe
                          src={`https://www.youtube.com/embed/${short.youtubeId}?autoplay=${index === currentIndex ? 1 : 0}&controls=1&rel=0&mute=${index !== currentIndex ? 1 : 0}&enablejsapi=1&playsinline=1&fs=0&loop=1&playlist=${short.youtubeId}`}
                          title={short.title}
                          className="w-full h-full rounded-xl"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          data-index={index}
                          id={`youtube-${short.id}`}
                        ></iframe>
                      </div>
                    )}

                    {/* 비디오 출처 표시가 아닌 경우 */}
                    {!short.youtubeId && short.videoUrl && (
                      <div className="relative w-full h-full">
                        <video
                          src={short.videoUrl}
                          className="w-full h-full object-cover rounded-xl"
                          controls
                          autoPlay={index === currentIndex}
                          playsInline
                          muted={index !== currentIndex}
                          loop
                          data-index={index}
                        ></video>
                      </div>
                    )}

                    {/* PC에서도 제목과 설명 제거 */}
                  </div>

                  {/* 네비게이션 버튼 (오른쪽에 배치) */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-6 z-30">
                    <button
                      onClick={handlePrevShort}
                      disabled={currentIndex === 0}
                      className={`p-2 rounded-full ${
                        currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200/20'
                      } bg-gray-800/50 text-white`}
                      aria-label="이전 쇼츠"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextShort}
                      disabled={currentIndex === shorts.length - 1}
                      className={`p-2 rounded-full ${
                        currentIndex === shorts.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200/20'
                      } bg-gray-800/50 text-white`}
                      aria-label="다음 쇼츠"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* 현재 쇼츠 표시기 (오른쪽에 배치) */}
                  <div className="absolute right-4 bottom-20 flex flex-col space-y-1 z-30">
                    {shorts.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 h-3 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 헤더 컴포넌트를 z-999로 설정하여 영상 위에 배치 */}
      <div style={{ zIndex: '999' }} className="fixed top-0 left-0 right-0">
        <Header />
      </div>
    </>
  );
}