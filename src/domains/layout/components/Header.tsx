'use client';

import HeaderClient from './HeaderClient';
import { HeaderProps } from '../types/header';
import { Board } from '../types/board';

// Header props에 boards 추가
interface ExtendedHeaderProps extends HeaderProps {
  boards?: Board[];
}

/**
 * 헤더 컴포넌트 (클라이언트 컴포넌트)
 * 상위에서 전달받은 게시판 데이터를 HeaderClient에 전달합니다.
 */
export default function Header({ 
  onMenuClick, 
  isSidebarOpen,
  userData,
  boards = []
}: ExtendedHeaderProps) {
  return (
    <HeaderClient 
      onMenuClick={onMenuClick} 
      isSidebarOpen={isSidebarOpen} 
      initialUserData={userData || null}
      boards={boards}
    />
  );
} 