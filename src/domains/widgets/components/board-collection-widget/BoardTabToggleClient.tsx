'use client';

import { useState, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';

interface BoardTab {
  id: string;
  name: string;
  desktopContent: ReactNode;
  mobileContent: ReactNode;
}

interface BoardTabToggleClientProps {
  tabs: BoardTab[];
  defaultTabIndex?: number;
}

/**
 * 게시판 탭 토글 클라이언트 컴포넌트
 *
 * - 서버에서 렌더링된 콘텐츠를 받아서 탭 전환만 담당
 * - 데스크톱/모바일 각각의 콘텐츠 show/hide 처리
 */
export default function BoardTabToggleClient({
  tabs,
  defaultTabIndex = 0,
}: BoardTabToggleClientProps) {
  const [selectedIndex, setSelectedIndex] = useState(defaultTabIndex);
  const totalTabs = tabs.length;

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % totalTabs);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + totalTabs) % totalTabs);
  };

  const currentTab = tabs[selectedIndex];

  return (
    <>
      {/* 데스크톱 버전 */}
      <Container className="hidden md:block bg-white dark:bg-[#1D1D1D]">
        {/* 헤더 */}
        <ContainerHeader className="justify-between">
          <ContainerTitle>게시판</ContainerTitle>
          {/* 페이지네이션 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedIndex + 1} / {totalTabs}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label="이전"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label="다음"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </ContainerHeader>

        {/* 게시판 탭 */}
        <div className="flex border-b border-black/5 dark:border-white/10">
          {tabs.map((tab, index) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setSelectedIndex(index)}
              className={`flex-1 text-xs py-2 px-1 h-auto rounded-none whitespace-nowrap ${
                index === selectedIndex
                  ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0] font-medium text-gray-900 dark:text-[#F0F0F0]'
                  : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
            >
              {tab.name}
            </Button>
          ))}
        </div>

        {/* 컨텐츠 - 활성화된 탭만 표시 */}
        <div>
          {currentTab.desktopContent}
        </div>
      </Container>

      {/* 모바일 버전 */}
      <Container className="md:hidden bg-white dark:bg-[#1D1D1D]">
        {/* 헤더 */}
        <ContainerHeader className="justify-between">
          <ContainerTitle>게시판</ContainerTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {selectedIndex + 1} / {totalTabs}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label="이전 게시판"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              aria-label="다음 게시판"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </ContainerHeader>

        {/* 게시판 탭 */}
        <div className="flex border-b border-black/5 dark:border-white/10">
          {tabs.map((tab, index) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setSelectedIndex(index)}
              className={`flex-1 text-xs py-2 px-1 h-auto rounded-none whitespace-nowrap ${
                index === selectedIndex
                  ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0] font-medium text-gray-900 dark:text-[#F0F0F0]'
                  : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
            >
              {tab.name}
            </Button>
          ))}
        </div>

        {/* 컨텐츠 - 활성화된 탭만 표시 */}
        <div className="flex flex-col">
          {currentTab.mobileContent}
        </div>
      </Container>
    </>
  );
}
