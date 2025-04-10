'use client';

import Sidebar from './Sidebar';
import BoardNavigation from './sidebar/BoardNavigation';
import ServerLeagueStandings from './sidebar/ServerLeagueStandings';

export interface SidebarWrapperProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarWrapper({ isOpen, onClose }: SidebarWrapperProps) {
  return (
    <Sidebar 
      isOpen={isOpen} 
      onClose={onClose}
      leagueStandingsComponent={<ServerLeagueStandings />}
    >
      <BoardNavigation key="board-navigation" />
    </Sidebar>
  );
} 