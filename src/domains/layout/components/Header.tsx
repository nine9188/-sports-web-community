'use client';

import HeaderClient from './HeaderClient';
import { HeaderProps } from '../types/header';

/**
 * 헤더 컴포넌트 (클라이언트 컴포넌트)
 * 이 컴포넌트는 RootLayoutClient에서 직접 사용되기 때문에 클라이언트 컴포넌트로 변경합니다.
 */
export default function Header({ 
  onMenuClick, 
  isSidebarOpen,
  userData
}: HeaderProps) {
  return (
    <HeaderClient 
      onMenuClick={onMenuClick} 
      isSidebarOpen={isSidebarOpen} 
      initialUserData={userData || null}
    />
  );
} 