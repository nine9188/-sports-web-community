'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface LeagueToggleClientProps {
  /** 리그 헤더 (서버에서 렌더링된 HTML) */
  header: ReactNode;
  /** 경기 목록 (서버에서 렌더링된 HTML) */
  children: ReactNode;
  /** 초기 펼침 상태 (서버에서 결정) */
  defaultExpanded?: boolean;
  /** 경기 수 */
  matchCount: number;
}

/**
 * 리그별 토글 클라이언트 컴포넌트
 *
 * - 서버에서 렌더링된 HTML(header, children)을 받아서 펼침/접기만 담당
 * - 각 리그가 독립적인 로컬 state를 가짐
 * - children DOM을 재조립하지 않고 show/hide만 처리
 */
export default function LeagueToggleClient({
  header,
  children,
  defaultExpanded = false,
  matchCount,
}: LeagueToggleClientProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <>
      {/* 리그 헤더 - 클릭하면 토글 */}
      <Button
        variant="ghost"
        onClick={() => setExpanded(!expanded)}
        className="w-full h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-none"
      >
        {/* 서버에서 렌더링된 헤더 */}
        {header}

        {/* 토글 버튼 영역 */}
        <div className="flex items-center gap-3">
          <span className="bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-[#F0F0F0] text-xs font-medium px-2.5 py-1 rounded-full min-w-[28px] text-center">
            {matchCount}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          )}
        </div>
      </Button>

      {/* 경기 목록 - 펼쳐져 있을 때만 표시 (서버 HTML 그대로) */}
      {expanded && (
        <div className="bg-white dark:bg-[#1D1D1D]">
          {children}
        </div>
      )}
    </>
  );
}
