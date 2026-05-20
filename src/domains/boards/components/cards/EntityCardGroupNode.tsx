'use client';

import React from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';

const EntityCardGroupNode = () => {
  return (
    <NodeViewWrapper className="entity-card-group-node entity-card-group-cols-4">
      <NodeViewContent className="entity-card-group-track" />
    </NodeViewWrapper>
  );
};

export default EntityCardGroupNode;
