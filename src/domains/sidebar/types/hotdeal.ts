/**
 * 핫딜 사이드바 타입 정의
 */

export type HotdealTabType = 'hot' | 'discount' | 'likes' | 'comments';

/**
 * 핫딜 사이드바 게시글
 */
export interface HotdealSidebarPost {
  id: string;
  post_number: number;
  title: string;
  board_slug: string;
  board_name: string;
  views: number;
  likes: number;
  comment_count: number;
  deal_info: {
    store: string;
    product_name: string;
    price: number;
    original_price?: number;
    is_ended: boolean;
  };
}

/**
 * 핫딜 탭별 데이터
 */
export interface HotdealPostsData {
  hot: HotdealSidebarPost[];
  discount: HotdealSidebarPost[];
  likes: HotdealSidebarPost[];
  comments: HotdealSidebarPost[];
  windowDays?: number;
}
