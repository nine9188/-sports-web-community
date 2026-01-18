import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TeamCardNode from '@/domains/boards/components/cards/TeamCardNode';
import type { TeamCardData } from '@/shared/types/teamCard';

export interface TeamCardOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    teamCard: {
      /**
       * 팀 카드 삽입
       */
      setTeamCard: (teamId: string | number, teamData: TeamCardData) => ReturnType;
    };
  }
}

export const TeamCardExtension = Node.create<TeamCardOptions>({
  name: 'teamCard',

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
      teamId: {
        default: null,
      },
      teamData: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-team');
          if (data) {
            try {
              return JSON.parse(decodeURIComponent(data));
            } catch (e) {
              console.error('팀 데이터 파싱 오류:', e);
              return null;
            }
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.teamData) return {};

          try {
            return {
              'data-team': encodeURIComponent(JSON.stringify(attributes.teamData))
            };
          } catch (e) {
            console.error('팀 데이터 직렬화 오류:', e);
            return {};
          }
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="team-card"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'team-card' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TeamCardNode);
  },

  addCommands() {
    return {
      setTeamCard: (teamId, teamData) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            teamId,
            teamData
          }
        });
      },
    };
  },
});

export default TeamCardExtension;
