'use client';

import { useEffect, useRef, useCallback } from 'react';
import { YouTubePlayer } from '@/app/(shorts)/types';

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: {
            autoplay?: 0 | 1;
            controls?: 0 | 1;
            rel?: 0 | 1;
            showinfo?: 0 | 1;
            mute?: 0 | 1;
            loop?: 0 | 1;
            modestbranding?: 0 | 1;
            fs?: 0 | 1;
            playsinline?: 0 | 1;
            enablejsapi?: 0 | 1;
          };
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeEmbedProps {
  videoId: string;
  isPlaying: boolean;
  isMuted: boolean;
  onEnded: () => void;
}

export default function YouTubeEmbed({ videoId, isPlaying, isMuted, onEnded }: YouTubeEmbedProps) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const apiLoadedRef = useRef<boolean>(false);
  const playerReadyRef = useRef<boolean>(false);

  // 플레이어 초기화 함수
  const initializePlayer = useCallback(() => {
    if (!apiLoadedRef.current || !playerContainerRef.current || !videoId) return;

    try {
      const uniqueId = `youtube-player-${videoId}`;
      const container = playerContainerRef.current;
      
      // 기존 요소 제거 후 새 요소 생성
      container.innerHTML = '';
      const playerElement = document.createElement('div');
      playerElement.id = uniqueId;
      container.appendChild(playerElement);

      // 새 플레이어 생성
      playerInstanceRef.current = new window.YT.Player(uniqueId, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          mute: isMuted ? 1 : 0,
          loop: 0,
          modestbranding: 1,
          fs: 0,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event) => {
            playerReadyRef.current = true;
            
            // 초기 상태 설정
            if (isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
            
            if (isMuted) {
              event.target.mute();
            } else {
              event.target.unMute();
            }
          },
          onStateChange: (event) => {
            // 비디오 종료 감지
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded();
            }
          },
          onError: (event) => {
            console.error('YouTube 플레이어 오류:', event.data);
          }
        }
      });
    } catch (error) {
      console.error('YouTube 플레이어 초기화 오류:', error);
    }
  }, [videoId, isPlaying, isMuted, onEnded]);

  // YouTube API 로드
  useEffect(() => {
    if (apiLoadedRef.current) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      apiLoadedRef.current = true;
      initializePlayer();
    };

    // 이미 API가 로드되어 있는 경우
    if (window.YT && window.YT.Player) {
      apiLoadedRef.current = true;
      initializePlayer();
    }

    return () => {
      // 컴포넌트 언마운트 시 플레이어 정리
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, [initializePlayer]);

  // 비디오 ID가 변경될 때 플레이어 재초기화
  useEffect(() => {
    if (apiLoadedRef.current && videoId && playerContainerRef.current) {
      // 기존 플레이어 제거
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
        playerReadyRef.current = false;
      }
      
      initializePlayer();
    }
  }, [videoId, initializePlayer]);

  // 재생 상태 변경 감지
  useEffect(() => {
    if (!playerInstanceRef.current || !playerReadyRef.current) return;

    if (isPlaying) {
      playerInstanceRef.current.playVideo();
    } else {
      playerInstanceRef.current.pauseVideo();
    }
  }, [isPlaying]);

  // 음소거 상태 변경 감지
  useEffect(() => {
    if (!playerInstanceRef.current || !playerReadyRef.current) return;

    if (isMuted) {
      playerInstanceRef.current.mute();
    } else {
      playerInstanceRef.current.unMute();
    }
  }, [isMuted]);

  return (
    <div 
      ref={playerContainerRef} 
      className="w-full h-full relative bg-black"
    ></div>
  );
} 