import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import MatchCard from '../../../boards/components/match/MatchCard';
import React from 'react';

// MatchCard를 감싸는 래퍼 컴포넌트
const MatchResultWrapper: React.FC<NodeViewProps> = (props) => {
  const { node } = props;
  return (
    <div className="match-result-wrapper">
      <MatchCard
        matchId={node.attrs.matchId || '0'}
        matchData={node.attrs.matchData || {}}
        isEditable={true}
      />
    </div>
  );
};

export const MatchResultExtension = Node.create({
  name: 'matchResult',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      matchId: {
        default: null,
      },
      matchData: {
        default: null,
        parseHTML: (element) => {
          const data = element.getAttribute('data-match');
          if (data) {
            try {
              return JSON.parse(data);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_e) {
              return null;
            }
          }
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.matchData) return {};
          
          try {
            const data = typeof attributes.matchData === 'string' 
              ? attributes.matchData 
              : JSON.stringify(attributes.matchData);
            
            return {
              'data-match': data,
            };
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_e) {
            return {};
          }
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="match-result"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'match-result' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MatchResultWrapper);
  },
}); 