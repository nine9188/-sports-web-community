import type { Board } from '../types/board';

export const STATIC_NAV_BOARDS = [
  { id: 'notice', name: '공지사항', slug: 'notice', parent_id: null, display_order: 0, children: [] },
  {
    id: 'nav-sports',
    name: '스포츠',
    slug: 'nav-sports',
    parent_id: null,
    display_order: 1,
    children: [
      { id: 'soccer', name: '해외축구', slug: 'soccer', parent_id: 'nav-sports', display_order: 0, children: [] },
      { id: 'k-league', name: '국내축구', slug: 'k-league', parent_id: 'nav-sports', display_order: 1, children: [] },
      { id: 'news', name: '축구소식', slug: 'news', parent_id: 'nav-sports', display_order: 2, children: [] },
      { id: 'data-analysis', name: '데이터분석', slug: 'data-analysis', parent_id: 'nav-sports', display_order: 3, children: [] },
    ],
  },
  {
    id: 'nav-community',
    name: '커뮤니티',
    slug: 'nav-community',
    parent_id: null,
    display_order: 2,
    children: [
      { id: 'free', name: '자유게시판', slug: 'free', parent_id: 'nav-community', display_order: 0, children: [] },
      { id: 'hotdeal', name: '핫딜', slug: 'hotdeal', parent_id: 'nav-community', display_order: 1, children: [] },
      { id: 'market', name: '자유마켓', slug: 'market', parent_id: 'nav-community', display_order: 2, children: [] },
      { id: 'review', name: '인증/후기', slug: 'review', parent_id: 'nav-community', display_order: 3, children: [] },
      { id: 'creative', name: '창작', slug: 'creative', parent_id: 'nav-community', display_order: 4, children: [] },
    ],
  },
] as Board[];
