/**
 * Shared player card types.
 */

export interface PlayerCardData {
  id: number;
  name: string;
  name_en?: string | null;
  name_ko?: string | null;
  slug?: string | null;
  koreanName?: string;
  photo: string;
  team: {
    id: number;
    name: string;
    name_en?: string | null;
    name_ko?: string | null;
    slug?: string | null;
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

export interface PlayerCardAttrs {
  playerId: string | number;
  playerData: PlayerCardData;
}

export interface PlayerCardProps {
  playerId: string | number;
  playerData: PlayerCardData;
  isEditable?: boolean;
}

export interface PlayerCardRenderOptions {
  useInlineStyles?: boolean;
  includeDataAttr?: boolean;
  markAsProcessed?: boolean;
}
