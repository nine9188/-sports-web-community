'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { TeamCard } from './TeamCard';
import type { TeamCardData } from '@/shared/types/teamCard';

const TeamCardNode: React.FC<NodeViewProps> = ({ node }) => {
  const { teamId, teamData } = node.attrs as { teamId: string | number; teamData: TeamCardData };

  if (!teamData) {
    return (
      <NodeViewWrapper className="team-card-error my-2">
        <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800">
          팀 데이터를 불러올 수 없습니다.
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="team-card-node">
      <TeamCard teamId={teamId} teamData={teamData} isEditable={true} />
    </NodeViewWrapper>
  );
};

export default TeamCardNode;
