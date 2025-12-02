'use client';

import { useBoards } from '@/domains/boards/hooks/useBoards';
import { BoardsResponse } from '@/domains/boards/types';

interface ClientBoardsListProps {
  initialBoardsData: BoardsResponse;
}

export default function ClientBoardsList({ initialBoardsData }: ClientBoardsListProps) {
  // 서버에서 전달받은 초기 데이터를 사용
  const { data: boardsData } = useBoards({ 
    initialData: initialBoardsData 
  });

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">게시판 목록</h3>
      {boardsData.boards.length === 0 ? (
        <p className="text-gray-500">게시판이 없습니다.</p>
      ) : (
        <ul className="space-y-1">
          {boardsData.boards.map((board) => (
            <li key={board.id} className="p-2 border rounded">
              <span className="font-medium">{board.name}</span>
              {board.description && (
                <p className="text-sm text-gray-600">{board.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 