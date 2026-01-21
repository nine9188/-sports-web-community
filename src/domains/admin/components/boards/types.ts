import type { Board } from '@/domains/admin/actions/boards';

export type { Board };

export interface BoardFormData {
  name: string;
  slug: string;
  description: string;
  access_level: string;
  parent_id: string;
  display_order: number;
  team_id: number | null;
  view_type: 'list' | 'image-table';
}

export interface FlatBoard extends Board {
  level?: number;
}

export const DEFAULT_FORM_DATA: BoardFormData = {
  name: '',
  slug: '',
  description: '',
  access_level: 'public',
  parent_id: '',
  display_order: 0,
  team_id: null,
  view_type: 'list',
};
