'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { PlayerCard } from './PlayerCard';
import type { PlayerCardData } from '@/shared/types/playerCard';

const PlayerCardNode: React.FC<NodeViewProps> = ({ node }) => {
  const { playerId, playerData } = node.attrs as { playerId: string | number; playerData: PlayerCardData };

  if (!playerData) {
    return <NodeViewWrapper className="player-card-node player-card-empty" contentEditable={false} />;
  }

  return (
    <NodeViewWrapper className="player-card-node" contentEditable={false}>
      <PlayerCard playerId={playerId} playerData={playerData} isEditable={true} />
    </NodeViewWrapper>
  );
};

export default PlayerCardNode;
