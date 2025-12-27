import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MatchCardNode from '@/domains/boards/components/match/MatchCardNode';
import type { MatchCardData } from '@/shared/types/matchCard';

export interface MatchCardOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

// 하위 호환성을 위해 MatchData를 MatchCardData의 별칭으로 export
export type MatchData = MatchCardData;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    matchCard: {
      /**
       * 경기 카드 삽입
       */
      setMatchCard: (matchId: string, matchData: MatchData) => ReturnType;
    };
  }
}

export const MatchCardExtension = Node.create<MatchCardOptions>({
  name: 'matchCard',
  
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
      matchId: {
        default: null,
      },
      matchData: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-match');
          if (data) {
            try {
              return JSON.parse(decodeURIComponent(data));
            } catch (e) {
              console.error('경기 데이터 파싱 오류:', e);
              return null;
            }
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.matchData) return {};
          
          try {
            return {
              'data-match': encodeURIComponent(JSON.stringify(attributes.matchData))
            };
          } catch (e) {
            console.error('경기 데이터 직렬화 오류:', e);
            return {};
          }
        }
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="match-card"]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'match-card' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(MatchCardNode);
  },
  
  addCommands() {
    return {
      setMatchCard: (matchId, matchData) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            matchId,
            matchData
          }
        });
      },
    };
  },
});

export default MatchCardExtension; 