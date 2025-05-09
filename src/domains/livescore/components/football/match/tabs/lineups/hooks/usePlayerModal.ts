'use client';

import { useState } from 'react';

export interface PlayerInfo {
  id: number;
  name: string;
  number: string;
  pos: string;
  team: {
    id: number;
    name: string;
  };
}

// 선수 타입 정의
export interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid?: string | null;
  captain?: boolean;
  photo?: string;
}

export function usePlayerModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);

  // 선수 클릭 핸들러
  const handlePlayerClick = (player: Player, teamId: number, teamName: string) => {
    setSelectedPlayer({
      id: player.id,
      name: player.name,
      number: player.number.toString(),
      pos: player.pos || '',
      team: {
        id: teamId,
        name: teamName
      }
    });
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    selectedPlayer,
    handlePlayerClick,
    handleCloseModal
  };
} 