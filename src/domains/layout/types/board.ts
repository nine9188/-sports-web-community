// 게시판 공통 타입 정의
export interface Board {
  id: string;
  name: string;
  slug: string | null;
  display_order: number;
  parent_id: string | null;
  children?: Board[];
} 