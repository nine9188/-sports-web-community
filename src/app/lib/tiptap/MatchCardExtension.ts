import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MatchCardNode from '@/domains/boards/components/match/MatchCardNode';

export interface MatchCardOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

export interface MatchData {
  id: string;
  teams: {
    home: {
      name: string;
      logo: string;
      winner?: boolean;
    };
    away: {
      name: string;
      logo: string;
      winner?: boolean;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  league: {
    name: string;
    logo: string;
    id?: string;
  };
  status: {
    code: string;
    elapsed?: number;
    name?: string;
  };
}

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