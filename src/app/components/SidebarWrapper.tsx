'use client';

import Sidebar from './Sidebar';
import ServerLeagueStandings from './sidebar/ServerLeagueStandings';

export interface SidebarWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  boardNavigation: React.ReactNode;
}

export default function SidebarWrapper({ 
  isOpen, 
  onClose, 
  boardNavigation 
}: SidebarWrapperProps) {
  return (
    <Sidebar 
      isOpen={isOpen} 
      onClose={onClose}
      leagueStandingsComponent={<ServerLeagueStandings />}
    >
      {boardNavigation}
    </Sidebar>
  );
} 