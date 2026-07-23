'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import CoupangPartnersAd from './CoupangPartnersAd';

export default function FloatingBottomAd() {
  const { user, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading || user) return;

    // 페이지 진입 후 PC는 3초, 모바일은 4초 뒤에 부드럽게 노출 (사용자 피로감 최소화)
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const delay = isMobile ? 4000 : 3000;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isMounted, isLoading, user]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isMounted || isLoading || user) return null;

  return (
    <div
      // Mobile: 우측 하단 배치 및 140px 아담한 사이즈
      // PC (md 이상): 우측 하단 배치 및 290px 사이즈
      // 디자인: 테두리가 없는 보더리스 카드, 부드러운 그림자와 호버 효과
      className={`fixed z-50 flex flex-col items-center overflow-hidden rounded-none md:rounded-2xl bg-white dark:bg-[#1E1E1E] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] w-[140px] md:w-[290px] bottom-28 right-4 md:bottom-6 md:right-6 transition-all duration-500 ease-out transform hover:shadow-2xl hover:shadow-[#002FA7]/10 dark:hover:shadow-[#002FA7]/20 hover:-translate-y-1 ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* 광고 본체 영역 */}
      <div className="flex flex-col items-center justify-center w-full bg-white dark:bg-[#1E1E1E] overflow-hidden">
        
        {/* PC 광고 (300x250 배너를 290x240으로 크롭하여 쿠팡 자체의 둥근 모서리/테두리를 완전히 제거) */}
        <div className="hidden md:flex flex-col w-full">
          <div className="flex items-center justify-between w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 rounded-t-2xl">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-extrabold text-[#002FA7] dark:text-[#6690DD] bg-[#E6EAFB] dark:bg-[#002FA7]/25 px-1.5 py-0.5 rounded">
                AD
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold">
                스폰서 광고
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              aria-label="광고 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* 5px 크롭 영역 컨테이너 */}
          <div className="w-[290px] h-[240px] overflow-hidden relative bg-white dark:bg-[#1E1E1E]">
            <div className="absolute -top-[5px] -left-[5px] w-[300px] h-[250px]">
              <CoupangPartnersAd
                adWidth={300}
                adHeight={250}
              />
            </div>
          </div>
        </div>

        {/* 모바일 광고 (150x150 배너를 140x140으로 크롭 + 모바일 헤더 바 추가) */}
        <div className="flex md:hidden flex-col w-[140px]">
          <div className="flex items-center justify-between w-full px-2 py-1.5 bg-neutral-50 dark:bg-neutral-900">
            <div className="flex items-center gap-1.5">
              <span className="text-[7px] font-extrabold text-[#002FA7] dark:text-[#6690DD] bg-[#E6EAFB] dark:bg-[#002FA7]/25 px-1 py-0.5 rounded">
                AD
              </span>
              <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-semibold">
                스폰서 광고
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center w-5.5 h-5.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              aria-label="광고 닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* 5px 크롭 영역 컨테이너 */}
          <div className="w-[140px] h-[140px] overflow-hidden relative bg-white dark:bg-[#1E1E1E]">
            <div className="absolute -top-[5px] -left-[5px] w-[150px] h-[150px]">
              <iframe
                src="https://ads-partners.coupang.com/widgets.html?id=1009445&template=carousel&trackingCode=AF3145564&subId=&width=150&height=150&tsource="
                width="150"
                height="150"
                frameBorder="0"
                scrolling="no"
                referrerPolicy="unsafe-url"
                className="border-0 overflow-hidden shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 공정위 제휴 링크 노출 문구 (쿠팡 파트너스 법적 규정 준수) */}
      <div className="w-full text-center px-2.5 py-2 bg-white dark:bg-[#1E1E1E]">
        <p className="text-[8px] md:text-[9px] text-neutral-400 dark:text-neutral-500 leading-tight break-keep">
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </p>
      </div>

      {/* 광고 푸터 컨트롤 (로그인 유도 및 혜택 안내) */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 rounded-none md:rounded-b-2xl gap-1 md:gap-0">
        <span className="text-[8px] md:text-[9px] text-neutral-400 dark:text-neutral-500 font-medium">
          로그인 시 광고 미노출
        </span>
        <Link
          href="/auth/login"
          className="text-[9px] md:text-[10px] text-[#002FA7] dark:text-[#6690DD] font-bold hover:underline transition-colors tracking-tight"
        >
          로그인하기
        </Link>
      </div>
    </div>
  );
}
