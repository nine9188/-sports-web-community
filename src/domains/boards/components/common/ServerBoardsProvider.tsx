// 서버 컴포넌트 - 게시판 데이터를 서버에서 가져와서 클라이언트에 전달
import { getBoards } from '@/domains/boards/actions';
import { BoardsResponse } from '@/domains/boards/types';
import { ReactNode } from 'react';

interface ServerBoardsProviderProps {
  children: (boardsData: BoardsResponse) => ReactNode;
}

export default async function ServerBoardsProvider({ 
  children 
}: ServerBoardsProviderProps) {
  try {
    // 서버에서 게시판 데이터 가져오기
    const boardsData = await getBoards();
    
    // 클라이언트 컴포넌트에 데이터 전달
    return <>{children(boardsData)}</>;
  } catch (error) {
    console.error('서버에서 게시판 데이터 조회 실패:', error);
    
    // 에러 시 빈 데이터 전달
    const emptyData: BoardsResponse = {
      boards: [],
      hierarchical: []
    };
    
    return <>{children(emptyData)}</>;
  }
} 