'use client';

import React from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Trash2 } from 'lucide-react';
import { TeamCard } from './TeamCard';
import { PlayerCard } from './PlayerCard';
import type { TeamCardData } from '@/shared/types/teamCard';
import type { PlayerCardData } from '@/shared/types/playerCard';

const ENTITY_CARD_DRAG_MIME = 'application/x-4590-entity-card';

type EntityCardNode = {
  sortableId: string;
  index: number;
  type: 'teamCard' | 'playerCard';
  attrs: Record<string, unknown>;
};

function chunkCards<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getChildNodes(node: ProseMirrorNode) {
  const children: ProseMirrorNode[] = [];

  node.content.forEach((child) => {
    children.push(child);
  });

  return children;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function getInsertionIndex(event: React.DragEvent, targetIndex: number) {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const isAfter = event.clientX > rect.left + rect.width / 2;

  return targetIndex + (isAfter ? 1 : 0);
}

function getSameGroupMoveIndex(sourceIndex: number, insertionIndex: number) {
  return insertionIndex > sourceIndex ? insertionIndex - 1 : insertionIndex;
}

function SortableEntityCard({
  card,
  groupPosition,
  onCardDrop,
  onCardDelete,
}: {
  card: EntityCardNode;
  groupPosition: number | null;
  onCardDrop: (event: React.DragEvent, insertionIndex: number) => void;
  onCardDelete: (cardIndex: number) => void;
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dropSide, setDropSide] = React.useState<'before' | 'after' | null>(null);

  function handleDragStart(event: React.DragEvent) {
    if (typeof groupPosition !== 'number') return;

    event.stopPropagation();
    setIsDragging(true);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(ENTITY_CARD_DRAG_MIME, JSON.stringify({
      groupPosition,
      cardIndex: card.index,
    }));
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';

    const insertionIndex = getInsertionIndex(event, card.index);
    setDropSide(insertionIndex > card.index ? 'after' : 'before');
  }

  function handleDragEnd(event: React.DragEvent) {
    event.stopPropagation();
    setIsDragging(false);
    setDropSide(null);
  }

  return (
    <div
      className={[
        'entity-card-group-item',
        card.type === 'playerCard' ? 'player-card-node' : 'team-card-node',
        isDragging ? 'is-dragging' : '',
        dropSide === 'before' ? 'is-drop-before' : '',
        dropSide === 'after' ? 'is-drop-after' : '',
      ].filter(Boolean).join(' ')}
      contentEditable={false}
      draggable
      onMouseDown={(event) => event.stopPropagation()}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragLeave={() => setDropSide(null)}
      onDragOver={handleDragOver}
      onDrop={(event) => {
        setDropSide(null);
        onCardDrop(event, getInsertionIndex(event, card.index));
      }}
    >
      <button
        type="button"
        className="card-node-delete"
        title={card.type === 'playerCard' ? '선수카드 삭제' : '팀카드 삭제'}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onCardDelete(card.index);
        }}
      >
        <Trash2 size={14} />
        <span>삭제</span>
      </button>
      {card.type === 'playerCard' ? (
        <PlayerCard
          playerId={card.attrs.playerId as string | number}
          playerData={card.attrs.playerData as PlayerCardData}
          isEditable
        />
      ) : (
        <TeamCard
          teamId={card.attrs.teamId as string | number}
          teamData={card.attrs.teamData as TeamCardData}
          isEditable
        />
      )}
    </div>
  );
}

const EntityCardGroupNode: React.FC<NodeViewProps> = ({ editor, getPos, node }) => {
  const cards = React.useMemo<EntityCardNode[]>(() => {
    const items: EntityCardNode[] = [];

    node.content.forEach((child, _offset, index) => {
      if (child.type.name !== 'teamCard' && child.type.name !== 'playerCard') return;

      items.push({
        sortableId: `${child.type.name}:${child.attrs.teamId ?? child.attrs.playerId ?? 'unknown'}:${index}`,
        index,
        type: child.type.name as 'teamCard' | 'playerCard',
        attrs: child.attrs,
      });
    });

    return items;
  }, [node]);

  const groupPosition = typeof getPos === 'function' ? getPos() : null;

  function handleCardDrop(event: React.DragEvent, insertionIndex: number) {
    event.preventDefault();
    event.stopPropagation();

    if (typeof groupPosition !== 'number') return;

    const rawDragData = event.dataTransfer.getData(ENTITY_CARD_DRAG_MIME);
    if (!rawDragData) return;

    let dragData: { groupPosition: number; cardIndex: number };
    try {
      dragData = JSON.parse(rawDragData) as { groupPosition: number; cardIndex: number };
    } catch {
      return;
    }

    const sourceGroup = editor.state.doc.nodeAt(dragData.groupPosition);
    const targetGroup = editor.state.doc.nodeAt(groupPosition);
    if (!sourceGroup || !targetGroup) return;
    if (sourceGroup.type.name !== 'entityCardGroup' || targetGroup.type.name !== 'entityCardGroup') return;

    const sourceCards = getChildNodes(sourceGroup);
    const targetCards = getChildNodes(targetGroup);
    const movingCard = sourceCards[dragData.cardIndex];
    if (!movingCard) return;

    const transaction = editor.state.tr;

    if (dragData.groupPosition === groupPosition) {
      const targetIndex = getSameGroupMoveIndex(dragData.cardIndex, insertionIndex);
      if (dragData.cardIndex === targetIndex) return;

      const reorderedCards = moveItem(sourceCards, dragData.cardIndex, targetIndex);
      const nextGroup = sourceGroup.type.create(sourceGroup.attrs, reorderedCards, sourceGroup.marks);
      transaction.replaceWith(groupPosition, groupPosition + sourceGroup.nodeSize, nextGroup);
      editor.view.dispatch(transaction);
      return;
    }

    const nextSourceCards = sourceCards.filter((_, index) => index !== dragData.cardIndex);
    const nextTargetCards = [...targetCards];
    nextTargetCards.splice(insertionIndex, 0, movingCard);

    const nextTargetGroup = targetGroup.type.create(targetGroup.attrs, nextTargetCards, targetGroup.marks);
    const replaceSourceGroup = () => {
      if (nextSourceCards.length === 0) {
        transaction.delete(dragData.groupPosition, dragData.groupPosition + sourceGroup.nodeSize);
        return;
      }

      const nextSourceGroup = sourceGroup.type.create(sourceGroup.attrs, nextSourceCards, sourceGroup.marks);
      transaction.replaceWith(dragData.groupPosition, dragData.groupPosition + sourceGroup.nodeSize, nextSourceGroup);
    };
    const replaceTargetGroup = () => {
      transaction.replaceWith(groupPosition, groupPosition + targetGroup.nodeSize, nextTargetGroup);
    };

    if (dragData.groupPosition > groupPosition) {
      replaceSourceGroup();
      replaceTargetGroup();
    } else {
      replaceTargetGroup();
      replaceSourceGroup();
    }

    editor.view.dispatch(transaction);
  }

  function handleCardDelete(cardIndex: number) {
    if (typeof groupPosition !== 'number') return;

    const targetGroup = editor.state.doc.nodeAt(groupPosition);
    if (!targetGroup || targetGroup.type.name !== 'entityCardGroup') return;

    const targetCards = getChildNodes(targetGroup);
    if (!targetCards[cardIndex]) return;

    const nextCards = targetCards.filter((_, index) => index !== cardIndex);
    const transaction = editor.state.tr;

    if (nextCards.length === 0) {
      transaction.delete(groupPosition, groupPosition + targetGroup.nodeSize);
    } else {
      const nextGroup = targetGroup.type.create(targetGroup.attrs, nextCards, targetGroup.marks);
      transaction.replaceWith(groupPosition, groupPosition + targetGroup.nodeSize, nextGroup);
    }

    editor.view.dispatch(transaction);
  }

  if (cards.length === 0) {
    return <NodeViewWrapper className="entity-card-group-node entity-card-group-cols-4" contentEditable={false} />;
  }

  const rows = chunkCards(cards, 4);

  return (
    <NodeViewWrapper className="entity-card-group-node entity-card-group-cols-4" contentEditable={false}>
      <div className="entity-card-group-track">
        {rows.map((row) => (
          <div className="entity-card-group-row" key={row.map((card) => card.sortableId).join('-')}>
            {row.map((card) => (
              <SortableEntityCard
                key={card.sortableId}
                card={card}
                groupPosition={groupPosition}
                onCardDrop={handleCardDrop}
                onCardDelete={handleCardDelete}
              />
            ))}
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  );
};

export default EntityCardGroupNode;
