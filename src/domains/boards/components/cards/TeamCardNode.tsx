'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { TeamCard } from './TeamCard';
import type { TeamCardData } from '@/shared/types/teamCard';

const TeamCardNode: React.FC<NodeViewProps> = ({ node }) => {
  const { teamId, teamData } = node.attrs as { teamId: string | number; teamData: TeamCardData };

  if (!teamData) {
    return <NodeViewWrapper className="team-card-node team-card-empty" contentEditable={false} />;
  }

  return (
    <NodeViewWrapper className="team-card-node" contentEditable={false}>
      <TeamCard teamId={teamId} teamData={teamData} isEditable={true} />
    </NodeViewWrapper>
  );
};

export default TeamCardNode;
