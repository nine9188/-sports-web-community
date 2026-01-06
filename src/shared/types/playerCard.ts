/**
 * 선수 카드 관련 타입 정의
 */

// 선수 카드에 표시될 데이터
export interface PlayerCardData {
  id: number;
  name: string;
  koreanName?: string;
  photo: string;
  team: {
    id: number;
    name: string;
    koreanName?: string;
    logo: string;
  };
  position?: string | null;
  number?: number | null;
  nationality?: string;
  age?: number | null;
  stats?: {
    goals?: number;
    assists?: number;
    appearances?: number;
  };
}

// Tiptap 노드 속성
export interface PlayerCardAttrs {
  playerId: string | number;
  playerData: PlayerCardData;
}

// 컴포넌트 Props
export interface PlayerCardProps {
  playerId: string | number;
  playerData: PlayerCardData;
  isEditable?: boolean;
}

// 렌더링 옵션
export interface PlayerCardRenderOptions {
  useInlineStyles?: boolean;
  includeDataAttr?: boolean;
  markAsProcessed?: boolean;
}
