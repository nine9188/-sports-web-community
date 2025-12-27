// TipTap 문서 타입 정의
export interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: {
    type: string;
    attrs?: {
      href?: string;
      target?: string;
      rel?: string;
    }
  }[];
  attrs?: {
    src?: string;
    alt?: string;
    level?: number;
    [key: string]: unknown;
  };
}

export interface TipTapDoc {
  type: string;
  content: TipTapNode[];
}

// RSS 게시글 인터페이스
export interface RssPost {
  source_url?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  image_url?: string;
  [key: string]: unknown;
}

// DOM 요소에 호버 핸들러를 저장하기 위한 타입
export interface MatchCardLinkElement extends HTMLAnchorElement {
  _hoverSetup?: boolean;
  _hoverEnter?: () => void;
  _hoverLeave?: () => void;
}

// 배당률 관련 타입
export interface BettingOddsItem {
  value: 'Home' | 'Draw' | 'Away';
  odd: number;
}

export interface BettingOddsObject {
  home: number;
  draw: number;
  away: number;
}

// PostContent 컴포넌트 Props
export interface PostContentProps {
  content: string | TipTapDoc | RssPost | Record<string, unknown>;
  meta?: Record<string, unknown> | null;
}

// 글로벌 타입 확장 (소셜 미디어는 중앙에서 관리)
declare global {
  interface Window {
    handleMatchCardHover?: (element: HTMLElement, isEnter: boolean) => void;
    twttr?: {
      widgets: {
        load: () => void;
      };
    };
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}
