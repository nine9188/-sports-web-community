import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PlayerCardNode from '@/domains/boards/components/cards/PlayerCardNode';
import type { PlayerCardData } from '@/shared/types/playerCard';

export interface PlayerCardOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    playerCard: {
      /**
       * 선수 카드 삽입
       */
      setPlayerCard: (playerId: string | number, playerData: PlayerCardData) => ReturnType;
    };
  }
}

export const PlayerCardExtension = Node.create<PlayerCardOptions>({
  name: 'playerCard',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      playerId: {
        default: null,
      },
      playerData: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-player');
          if (data) {
            try {
              return JSON.parse(decodeURIComponent(data));
            } catch (e) {
              console.error('선수 데이터 파싱 오류:', e);
              return null;
            }
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.playerData) return {};

          try {
            return {
              'data-player': encodeURIComponent(JSON.stringify(attributes.playerData))
            };
          } catch (e) {
            console.error('선수 데이터 직렬화 오류:', e);
            return {};
          }
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="player-card"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'player-card' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlayerCardNode);
  },

  addCommands() {
    return {
      setPlayerCard: (playerId, playerData) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            playerId,
            playerData
          }
        });
      },
    };
  },
});

export default PlayerCardExtension;
