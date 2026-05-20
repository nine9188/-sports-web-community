import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import EntityCardGroupNode from '@/domains/boards/components/cards/EntityCardGroupNode';
import type { EntityCardGroupItem } from '@/shared/types/entityCardGroup';

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

export default EntityCardGroupExtension;
