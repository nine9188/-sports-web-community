export const CATEGORIES = [
  { id: 'soccer', name: '축구' },
  { id: 'baseball', name: '야구' },
  { id: 'basketball', name: '농구' },
  { id: 'volleyball', name: '배구' },
  { id: 'golf', name: '골프' },
  { id: 'esports', name: 'e스포츠' },
  // 필요에 따라 더 추가
];

// 카테고리 목록 배열
export const CATEGORY_LIST = Object.values(CATEGORIES);

// TypeScript 타입 정의
export type CategoryId = 'soccer' | 'baseball' | 'basketball' | 'volleyball' | 'golf' | 'esports';

// 카테고리 아이템 타입
export interface CategoryItem {
  id: CategoryId;
  name: string;
  subcategories?: Record<string, SubCategoryItem>;
}

// 서브 카테고리 아이템 타입
export interface SubCategoryItem {
  id: string;
  name: string;
  teams?: TeamItem[];
}

// 팀 아이템 타입
export interface TeamItem {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}
