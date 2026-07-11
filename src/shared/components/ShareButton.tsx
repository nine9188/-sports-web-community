'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Share2, Link2, X as XIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { toast } from 'sonner';

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: {
          objectType: string;
          content: {
            title: string;
            description?: string;
            imageUrl?: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
        }) => void;
      };
    };
  }
}

interface ShareButtonProps {
  title?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline';
}

// 카카오 SDK 동적 로드
function loadKakaoSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject();
    if (window.Kakao) return resolve();
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

export default function ShareButton({
  title,
  description,
  className = '',
  size = 'sm',
  variant = 'ghost',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUrl = () => (typeof window !== 'undefined' ? window.location.href : '');
  const getTitle = () => title || (typeof document !== 'undefined' ? document.title : '');

  const handleShareClick = async () => {
    const url = getUrl();
    const shareTitle = getTitle();

    // 모바일: 네이티브 공유시트
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        // 취소 또는 실패 → 드롭다운으로 fallback
      }
    }
    // PC: 드롭다운 토글
    setIsOpen((prev) => !prev);
  };

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      toast.success('링크가 복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다.');
    }
    setIsOpen(false);
  }, []);

  const shareKakao = useCallback(async () => {
    const url = getUrl();
    const shareTitle = getTitle();
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;

    try {
      await loadKakaoSDK();
      if (window.Kakao && kakaoKey) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoKey);
        }
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: shareTitle,
            description: description || shareTitle,
            link: { mobileWebUrl: url, webUrl: url },
          },
        });
      } else {
        throw new Error('SDK not available');
      }
    } catch {
      // SDK 실패 시 카카오스토리 fallback
      window.open(
        `https://story.kakao.com/share?url=${encodeURIComponent(url)}`,
        '_blank',
        'width=550,height=450'
      );
    }
    setIsOpen(false);
  }, [description]);

  const shareTwitter = useCallback(() => {
    const url = getUrl();
    const shareTitle = getTitle();
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareTitle)}`,
      '_blank',
      'width=550,height=450'
    );
    setIsOpen(false);
  }, []);

  const shareFacebook = useCallback(() => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`,
      '_blank',
      'width=550,height=450'
    );
    setIsOpen(false);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        onClick={handleShareClick}
        className="text-xs sm:text-[13px] gap-1"
      >
        <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
        <span>공유</span>
      </Button>

      {isOpen && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-[#2A2A2A] border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden w-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* 링크 복사 */}
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#444] flex-shrink-0">
              <Link2 className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            </span>
            링크 복사
          </button>

          {/* 카카오톡 */}
          <button
            onClick={shareKakao}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#FEE500] flex-shrink-0">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-[#3C1E1E]">
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.67 1.47 5.02 3.74 6.52L4.5 21l4.3-2.24C9.55 19.2 10.76 19.4 12 19.4c5.52 0 10-3.34 10-7.6C22 6.48 17.52 3 12 3z" />
              </svg>
            </span>
            카카오톡
          </button>

          {/* X (트위터) */}
          <button
            onClick={shareTwitter}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-black flex-shrink-0">
              <XIcon className="h-3 w-3 text-white" />
            </span>
            X (트위터)
          </button>

          {/* 페이스북 */}
          <button
            onClick={shareFacebook}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#1877F2] flex-shrink-0">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </span>
            페이스북
          </button>
        </div>
      )}
    </div>
  );
}
