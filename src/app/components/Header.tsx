'use client';

import HeaderClient from './HeaderClient';
import { HeaderUserData } from '@/app/lib/types';

export default function Header({ 
  onMenuClick, 
  isSidebarOpen,
  userData
}: { 
  onMenuClick: () => void; 
  isSidebarOpen: boolean;
  userData?: HeaderUserData | null;
}) {
  return (
    <HeaderClient 
      onMenuClick={onMenuClick} 
      isSidebarOpen={isSidebarOpen} 
      initialUserData={userData || null}
    />
  );
}