'use client';

import Sidebar from './Sidebar';
// 서버 컴포넌트는 클라이언트 컴포넌트에서 import 가능
import LeagueStandings from './sidebar/LeagueStandings';
import { ReactNode } from 'react';

interface SidebarWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  boardNavigation: ReactNode;
  authSection: ReactNode;
}

export default function SidebarWrapper({
  isOpen,
  onClose,
  boardNavigation,
  authSection
}: SidebarWrapperProps) {
  return (
    <Sidebar
      isOpen={isOpen}
      onClose={onClose}
      leagueStandingsComponent={<LeagueStandings initialLeague="premier" />}
      authSection={authSection}
    >
      {boardNavigation}
    </Sidebar>
  );
} 