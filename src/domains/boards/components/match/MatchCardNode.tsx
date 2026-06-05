import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import MatchCard from './MatchCard';

// TipTap 노드 뷰 컴포넌트
const MatchCardNode: React.FC<NodeViewProps> = ({ node, deleteNode }) => {
  const { matchId, matchData } = node.attrs;
  
  if (!matchData) {
    return (
      <NodeViewWrapper className="match-card-error" contentEditable={false}>
        <div className="p-3 border rounded-lg bg-red-50 text-red-500">
          경기 결과 데이터를 불러올 수 없습니다.
        </div>
      </NodeViewWrapper>
    );
  }
  
  return (
    <NodeViewWrapper className="match-card-node" contentEditable={false}>
      <button
        type="button"
        className="card-node-delete"
        title="매치카드 삭제"
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
      <MatchCard matchId={matchId} matchData={matchData} isEditable={true} />
    </NodeViewWrapper>
  );
};

export default MatchCardNode;
