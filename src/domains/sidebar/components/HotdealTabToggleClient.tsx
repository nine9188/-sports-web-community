'use client';

import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Eye, ThumbsUp, MessageSquare, Flame, Percent } from 'lucide-react';
import { Container, ContainerHeader, ContainerTitle, TabList, type TabItem } from '@/shared/components/ui';
import { HOTDEAL_BOARD_SLUGS } from '@/domains/boards/types/hotdeal';
import type { HotdealTabType } from '../types/hotdeal';

interface HotdealTabToggleClientProps {
  /** HOT 탭 콘텐츠 (서버 렌더링) */
  hotContent: ReactNode;
  /** 할인율 탭 콘텐츠 (서버 렌더링) */
  discountContent: ReactNode;
  /** 추천수 탭 콘텐츠 (서버 렌더링) */
  likesContent: ReactNode;
  /** 댓글수 탭 콘텐츠 (서버 렌더링) */
  commentsContent: ReactNode;
  /** 기간 표시용 */
  windowDays?: number;
  /** 기본 활성 탭 */
  defaultTab?: HotdealTabType;
}

/**
 * 핫딜 탭 토글 클라이언트 컴포넌트
 *
 * - 4개의 서버 렌더링된 콘텐츠를 받아서 탭 전환만 담당
 * - pathname 체크로 핫딜 페이지에서만 표시
 * - 클라이언트는 show/hide만 처리
 */
export default function HotdealTabToggleClient({
  hotContent,
  discountContent,
  likesContent,
  commentsContent,
  windowDays,
  defaultTab = 'hot',
}: HotdealTabToggleClientProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<HotdealTabType>(defaultTab);

  // 현재 페이지가 핫딜 게시판인지 확인
  const isHotdealPage = HOTDEAL_BOARD_SLUGS.some(slug =>
    pathname?.startsWith(`/boards/${slug}`)
  );

  // 핫딜 게시판이 아니면 렌더링하지 않음
  if (!isHotdealPage) {
    return null;
  }

  const tabs: TabItem[] = [
    { id: 'hot', label: 'HOT', icon: <Flame className="h-3 w-3" aria-hidden="true" /> },
    { id: 'discount', label: '할인율', icon: <Percent className="h-3 w-3" aria-hidden="true" /> },
    { id: 'likes', label: '추천수', icon: <ThumbsUp className="h-3 w-3" aria-hidden="true" /> },
    { id: 'comments', label: '댓글수', icon: <MessageSquare className="h-3 w-3" aria-hidden="true" /> },
  ];

  return (
    <Container className="mb-4 bg-white dark:bg-[#1D1D1D]">
      {/* 헤더 */}
      <ContainerHeader className="justify-between">
        <ContainerTitle>핫딜 베스트</ContainerTitle>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {windowDays ? `최근 ${windowDays}일 기준` : '최근 3일 기준'}
        </span>
      </ContainerHeader>

      {/* 탭 */}
      <TabList
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as HotdealTabType)}
        variant="contained"
        className="mb-0"
      />

      {/* 콘텐츠 - 활성화된 탭만 표시 */}
      <div>
        {activeTab === 'hot' && hotContent}
        {activeTab === 'discount' && discountContent}
        {activeTab === 'likes' && likesContent}
        {activeTab === 'comments' && commentsContent}
      </div>
    </Container>
  );
}
