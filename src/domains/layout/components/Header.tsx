'use client';

import { useEffect, useState } from 'react';
import HeaderClient from './HeaderClient';
import { getBoardsForNavigation, getHeaderUserData } from '../actions';
import { HeaderUserData } from '../types/header';
import { Board } from '../types/board';

interface HeaderProps {
  onProfileClick?: () => void;
}

/**
 * 헤더 컴포넌트 (사이드바와 동일한 안정적인 패턴)
 * 클라이언트에서 서버 액션을 호출하여 데이터를 가져오는 방식
 */
export default function Header({ 
  onProfileClick = () => {}
}: HeaderProps) {
  const [userData, setUserData] = useState<HeaderUserData | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 서버 액션으로 데이터 가져오기 (사이드바와 동일한 패턴)
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // 병렬로 데이터 가져오기
        const [userDataResult, boardsResult] = await Promise.all([
          getHeaderUserData(),
          getBoardsForNavigation()
        ]);
        
        setUserData(userDataResult);
        setBoards(boardsResult.boardData || []);
        setIsAdmin(boardsResult.isAdmin || false);
      } catch (error) {
        console.error('헤더 데이터 가져오기 실패:', error);
        // 오류 발생 시 기본값 설정
        setUserData(null);
        setBoards([]);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // 로딩 중일 때 스켈레톤 표시
  if (isLoading) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 영역 */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="ml-2 w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* 네비게이션 영역 */}
            <div className="hidden md:flex space-x-4">
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* 사용자 영역 */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <HeaderClient 
      onProfileClick={onProfileClick}
      isSidebarOpen={false} // 사이드바 상태는 상위에서 관리되므로 기본값
      initialUserData={userData}
      boards={boards}
      isAdmin={isAdmin}
    />
  );
} 