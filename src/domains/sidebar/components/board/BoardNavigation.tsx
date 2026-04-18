import { ReactNode } from 'react';
import ClientBoardNavigation from './ClientBoardNavigation';
import { Board } from '@/domains/layout/types/board';

interface BoardNavigationProps {
  boardData: Board[];
  totalPostCountSlot?: ReactNode;
  isAdmin?: boolean;
}

export default function BoardNavigation({
  boardData,
  totalPostCountSlot,
  isAdmin
}: BoardNavigationProps) {
  return (
    <ClientBoardNavigation
      initialData={{ rootBoards: boardData, totalPostCountSlot }}
      showAdminLink={isAdmin}
    />
  );
}
