import { ReactNode } from 'react';
import ClientBoardNavigation from './ClientBoardNavigation';
import { Board } from '@/domains/layout/types/board';

interface BoardNavigationProps {
  boardData: Board[];
  // 전체글 개수 표시용 슬롯 (Suspense로 감싼 서버 컴포넌트 주입 예정)
  totalPostCountSlot?: ReactNode;
  isAdmin?: boolean;
}

// 서버 컴포넌트 - layout.tsx에서 데이터를 props로 전달받음
export default function BoardNavigation({
  boardData,
  totalPostCountSlot,
  isAdmin
}: BoardNavigationProps) {
  if (!boardData || boardData.length === 0) {
    return (
      <div className="rounded-md py-2">
        <p className="text-xs text-red-500">게시판 데이터를 불러오는데 실패했습니다.</p>
        <p className="text-xs text-gray-500 mt-1">잠시 후 다시 시도해주세요.</p>
      </div>
    );
  }

  return (
    <ClientBoardNavigation
      initialData={{ rootBoards: boardData, totalPostCountSlot }}
      showAdminLink={isAdmin}
    />
  );
}
