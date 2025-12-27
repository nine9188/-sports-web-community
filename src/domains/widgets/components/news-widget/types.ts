// 뉴스 위젯 타입 정의

/** 뉴스 아이템 */
export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  url: string;
  postNumber?: number;
}

/** 뉴스 위젯 Props */
export interface NewsWidgetProps {
  boardSlug?: string | string[];
}
