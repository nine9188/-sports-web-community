import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import EntityCardGroupNode from '@/domains/boards/components/cards/EntityCardGroupNode';
import type { EntityCardGroupItem } from '@/shared/types/entityCardGroup';

const ENTITY_CARD_DRAG_MIME = 'application/x-4590-entity-card';

export interface EntityCardGroupOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    entityCardGroup: {
      setEntityCardGroup: (items: EntityCardGroupItem[]) => ReturnType;
    };
  }
}

export const EntityCardGroupExtension = Node.create<EntityCardGroupOptions>({
  name: 'entityCardGroup',

  group: 'block',

  content: '(teamCard | playerCard)+',

  isolating: true,

  selectable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      layout: {
        default: 'grid',
        parseHTML: () => 'grid',
        renderHTML: attributes => ({
          'data-layout': attributes.layout || 'grid',
        }),
      },
      columns: {
        default: 4,
        parseHTML: () => 4,
        renderHTML: () => ({
          'data-columns': 4,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="entity-card-group"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'entity-card-group' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EntityCardGroupNode);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            drop: (view, event) => {
              const rawDragData = event.dataTransfer?.getData(ENTITY_CARD_DRAG_MIME);
              if (!rawDragData) return false;

              let dragData: { groupPosition: number; cardIndex: number };
              try {
                dragData = JSON.parse(rawDragData) as { groupPosition: number; cardIndex: number };
              } catch {
                return false;
              }

              const dropPosition = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              if (!dropPosition) return false;

              const targetGroup = findEntityCardGroupAtPosition(view.state.doc, dropPosition.pos);
              if (targetGroup) return false;

              const sourceGroup = view.state.doc.nodeAt(dragData.groupPosition);
              if (!sourceGroup || sourceGroup.type.name !== this.name) return false;

              const movingCard = sourceGroup.child(dragData.cardIndex);
              if (!movingCard) return false;

              event.preventDefault();
              event.stopPropagation();

              const sourceCards = getChildNodes(sourceGroup);
              const nextSourceCards = sourceCards.filter((_, index) => index !== dragData.cardIndex);
              const splitGroup = sourceGroup.type.create(sourceGroup.attrs, [movingCard], sourceGroup.marks);
              const insertionPosition = getBlockInsertionPosition(view.state.doc, dropPosition.pos);
              const transaction = view.state.tr;

              if (nextSourceCards.length === 0) {
                transaction.delete(
                  dragData.groupPosition,
                  dragData.groupPosition + sourceGroup.nodeSize
                );
              } else {
                const nextSourceGroup = sourceGroup.type.create(sourceGroup.attrs, nextSourceCards, sourceGroup.marks);
                transaction.replaceWith(
                  dragData.groupPosition,
                  dragData.groupPosition + sourceGroup.nodeSize,
                  nextSourceGroup
                );
              }

              transaction.insert(transaction.mapping.map(insertionPosition), splitGroup);
              view.dispatch(transaction);
              return true;
            },
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setEntityCardGroup: (items) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            layout: 'grid',
            columns: 4,
          },
          content: items.map((item) => item.type === 'player'
            ? {
                type: 'playerCard',
                attrs: { playerId: item.id, playerData: item.data },
              }
            : {
                type: 'teamCard',
                attrs: { teamId: item.id, teamData: item.data },
              }),
        });
      },
    };
  },
});

function getChildNodes(node: ProseMirrorNode) {
  const children: ProseMirrorNode[] = [];

  node.content.forEach((child) => {
    children.push(child);
  });

  return children;
}

function findEntityCardGroupAtPosition(doc: ProseMirrorNode, position: number) {
  const resolvedPosition = doc.resolve(Math.min(position, doc.content.size));

  for (let depth = resolvedPosition.depth; depth > 0; depth -= 1) {
    const node = resolvedPosition.node(depth);
    if (node.type.name === 'entityCardGroup') {
      return {
        node,
        position: resolvedPosition.before(depth),
      };
    }
  }

  return null;
}

function getBlockInsertionPosition(doc: ProseMirrorNode, position: number) {
  const resolvedPosition = doc.resolve(Math.min(position, doc.content.size));

  for (let depth = resolvedPosition.depth; depth > 0; depth -= 1) {
    if (resolvedPosition.node(depth).isTextblock) {
      return resolvedPosition.after(depth);
    }
  }

  return position;
}

export default EntityCardGroupExtension;
