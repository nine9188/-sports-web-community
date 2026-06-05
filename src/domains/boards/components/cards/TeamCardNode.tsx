'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import { TeamCard } from './TeamCard';
import type { TeamCardData } from '@/shared/types/teamCard';

const TeamCardNode: React.FC<NodeViewProps> = ({ node, deleteNode }) => {
  const { teamId, teamData } = node.attrs as { teamId: string | number; teamData: TeamCardData };

  if (!teamData) {
    return <NodeViewWrapper className="team-card-node team-card-empty" contentEditable={false} />;
  }

  return (
    <NodeViewWrapper className="team-card-node" contentEditable={false}>
      <button
        type="button"
        className="card-node-delete"
        title="팀카드 삭제"
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
      <TeamCard teamId={teamId} teamData={teamData} isEditable={true} />
    </NodeViewWrapper>
  );
};

export default TeamCardNode;
