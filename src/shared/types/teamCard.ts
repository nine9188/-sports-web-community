/**
 * 팀 카드 관련 타입 정의
 */

// 팀 카드에 표시될 데이터
export interface TeamCardData {
  id: number;
  name: string;
  koreanName?: string;
  logo: string;
  league: {
    id: number;
    name: string;
    koreanName?: string;
    logo?: string;
  };
  country?: string;
  venue?: string;
  currentPosition?: number | null;
}

// Tiptap 노드 속성
export interface TeamCardAttrs {
  teamId: string | number;
  teamData: TeamCardData;
}

// 컴포넌트 Props
export interface TeamCardProps {
  teamId: string | number;
  teamData: TeamCardData;
  isEditable?: boolean;
}

// 렌더링 옵션
export interface TeamCardRenderOptions {
  useInlineStyles?: boolean;
  includeDataAttr?: boolean;
  markAsProcessed?: boolean;
}
