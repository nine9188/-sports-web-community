'use client';

import { X, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';
import { SidebarProps } from '../types';
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';

export default function Sidebar({
  isOpen,
  onClose,
  children,
  authSection,
}: SidebarProps) {
  return (
    <div className="contents" suppressHydrationWarning>
      {/* Overlay - 모바일에서만 표시, CSS로 visibility 제어 */}
      <div
        className={`fixed inset-0 bg-black/70 z-[999] lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        suppressHydrationWarning
      />

      {/* 데스크탑 사이드바 (왼쪽에 고정) */}
      <div
        className="fixed lg:relative top-0 lg:top-0 left-0 h-[100dvh] lg:h-auto w-[300px]
          transform transition-transform duration-300 ease-in-out z-[1000] lg:z-30
          -translate-x-full lg:translate-x-0 hidden lg:block"
      >
        {/* 스크롤 영역 */}
        <div className="h-[calc(100dvh-56px)] lg:h-full overflow-y-auto pt-4">
          {/* 사용자 정보 섹션 */}
          <Container className="mb-4">
            <ContainerHeader>
              <p className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">계정</p>
            </ContainerHeader>
            <ContainerContent>
              {authSection}
            </ContainerContent>
          </Container>

          {/* 이용 가이드 바로가기 */}
          <Link
            href="/guide"
            className="flex items-center gap-2.5 mb-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 text-white md:rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-500 transition-all group"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[13px] font-bold">이용 가이드</span>
              <p className="text-[11px] text-blue-100">사이트 사용법을 확인하세요</p>
            </div>
            <svg className="w-4 h-4 text-white/60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* 사이드바 광고 - 카카오 */}
          <div className="mb-4">
            <KakaoAd adUnit={KAKAO.LEFT_SIDEBAR} adWidth={300} adHeight={250} />
          </div>

          {/* 게시판 이동 섹션 */}
          <Container className="mb-4">
            <ContainerHeader>
              <p className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">게시판 이동</p>
            </ContainerHeader>
            <ContainerContent className="px-0 py-0">
              {children}
            </ContainerContent>
          </Container>

        </div>
      </div>

      {/* 모바일 사이드바 (오른쪽에서 열림) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md
          bg-white transform transition-transform duration-300 ease-in-out z-[1000]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:hidden`}
      >
        {/* 모바일 닫기 버튼 */}
        <div className="flex items-center justify-between h-14 border-b border-black/7 dark:border-white/10 px-4">
          <span className="font-medium text-gray-900">커뮤니티</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="사이드바 닫기"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        {/* 스크롤 영역 */}
        <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
          {/* 모바일에서는 사용자 정보 섹션 제거 */}

          {/* 게시판 이동 섹션 */}
          <Container className="mb-4">
            <ContainerHeader>
              <p className="text-[13px] font-bold text-gray-900 dark:text-[#F0F0F0]">카테고리</p>
            </ContainerHeader>
            <ContainerContent>
              {children}
            </ContainerContent>
          </Container>

        </div>
      </div>
    </div>
  );
}
