import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ContainerHeader, ContainerTitle } from '@/shared/components/ui';

/**
 * 위젯 헤더 서버 컴포넌트
 *
 * - "오늘·내일 빅매치" 타이틀 + "전체 경기" 링크
 * - 서버에서 렌더링되어 LCP에 포함됨
 */
export default function WidgetHeader() {
  return (
    <ContainerHeader className="justify-between">
      <ContainerTitle>오늘·내일 빅매치</ContainerTitle>
      <Link
        href="/livescore/football"
        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5"
      >
        전체 경기
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </ContainerHeader>
  );
}
