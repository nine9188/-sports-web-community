'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { PlayerCard } from './PlayerCard';
import type { PlayerCardData } from '@/shared/types/playerCard';

const PlayerCardNode: React.FC<NodeViewProps> = ({ node }) => {
  const { playerId, playerData } = node.attrs as { playerId: string | number; playerData: PlayerCardData };

  if (!playerData) {
    return (
      <NodeViewWrapper className="player-card-error my-2">
        <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800">
          선수 데이터를 불러올 수 없습니다.
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="player-card-node">
      <PlayerCard playerId={playerId} playerData={playerData} isEditable={true} />
    </NodeViewWrapper>
  );
};

export default PlayerCardNode;
