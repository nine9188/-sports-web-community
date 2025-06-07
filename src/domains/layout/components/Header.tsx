'use client';

import HeaderClient from './HeaderClient';
import { HeaderUserData } from '../types/header';
import { Board } from '../types/board';

interface HeaderProps {
  onProfileClick?: () => void;
  initialUserData?: HeaderUserData | null;
  boards?: Board[];
  isAdmin?: boolean;
}

/**
 * 헤더 컴포넌트 - props로 데이터를 받아서 바로 렌더링
 */
export default function Header({ 
  onProfileClick = () => {},
  initialUserData = null,
  boards = [],
  isAdmin = false
}: HeaderProps) {
  return (
    <HeaderClient 
      onProfileClick={onProfileClick}
      isSidebarOpen={false}
      initialUserData={initialUserData}
      boards={boards}
      isAdmin={isAdmin}
    />
  );
} 