'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import type { PlayerCardData } from '@/shared/types/playerCard';

const PlayerCardNode: React.FC<NodeViewProps> = ({ node, deleteNode }) => {
  const { playerId, playerData } = node.attrs as { playerId: string | number; playerData: PlayerCardData };

  if (!playerData) {
    return <NodeViewWrapper className="player-card-node player-card-empty" contentEditable={false} />;
  }

  return (
    <NodeViewWrapper className="player-card-node" contentEditable={false}>
      <button
        type="button"
        className="card-node-delete"
        title="선수카드 삭제"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          deleteNode();
        }}
      >
        <Trash2 size={14} />
        <span>삭제</span>
      </button>
      <PlayerCard playerId={playerId} playerData={playerData} isEditable={true} />
    </NodeViewWrapper>
  );
};

export default PlayerCardNode;
