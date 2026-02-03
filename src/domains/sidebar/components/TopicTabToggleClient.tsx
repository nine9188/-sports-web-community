'use client';

import { useState, ReactNode } from 'react';
import { Eye, ThumbsUp, MessageSquare, Flame } from 'lucide-react';
import { TabList, type TabItem } from '@/shared/components/ui';
import type { TabType } from '../types';

interface TopicTabToggleClientProps {
  /** HOT 탭 콘텐츠 (서버 렌더링) */
  hotContent: ReactNode;
  /** 조회수 탭 콘텐츠 (서버 렌더링) */
  viewsContent: ReactNode;
  /** 추천수 탭 콘텐츠 (서버 렌더링) */
  likesContent: ReactNode;
  /** 댓글수 탭 콘텐츠 (서버 렌더링) */
  commentsContent: ReactNode;
  /** 기본 활성 탭 */
  defaultTab?: TabType;
}

/**
 * 인기글 탭 토글 클라이언트 컴포넌트
 *
 * - 4개의 서버 렌더링된 콘텐츠를 받아서 탭 전환만 담당
 * - 각 탭 콘텐츠는 서버에서 이미 렌더링됨 (LCP 최적화)
 * - 클라이언트는 show/hide만 처리
 */
export default function TopicTabToggleClient({
  hotContent,
  viewsContent,
  likesContent,
  commentsContent,
  defaultTab = 'hot',
}: TopicTabToggleClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const tabs: TabItem[] = [
    { id: 'hot', label: 'HOT', icon: <Flame className="h-3 w-3" aria-hidden="true" /> },
    { id: 'views', label: '조회수', icon: <Eye className="h-3 w-3" aria-hidden="true" /> },
    { id: 'likes', label: '추천수', icon: <ThumbsUp className="h-3 w-3" aria-hidden="true" /> },
    { id: 'comments', label: '댓글수', icon: <MessageSquare className="h-3 w-3" aria-hidden="true" /> },
  ];

  return (
    <>
      <TabList
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabType)}
        variant="contained"
        className="mb-0"
      />

      <div>
        {/* 각 탭 콘텐츠 - 활성화된 탭만 표시 */}
        {activeTab === 'hot' && hotContent}
        {activeTab === 'views' && viewsContent}
        {activeTab === 'likes' && likesContent}
        {activeTab === 'comments' && commentsContent}
      </div>
    </>
  );
}
