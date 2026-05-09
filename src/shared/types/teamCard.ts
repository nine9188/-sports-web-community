/**
 * Shared team card types.
 */

export interface TeamCardData {
  id: number;
  name: string;
  name_en?: string | null;
  name_ko?: string | null;
  slug?: string | null;
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

export interface TeamCardAttrs {
  teamId: string | number;
  teamData: TeamCardData;
}

export interface TeamCardProps {
  teamId: string | number;
  teamData: TeamCardData;
  isEditable?: boolean;
}

export interface TeamCardRenderOptions {
  useInlineStyles?: boolean;
  includeDataAttr?: boolean;
  markAsProcessed?: boolean;
}
