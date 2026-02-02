import { getAllNewsPosts } from './actions';
import NewsWidgetClient from './NewsWidgetClient';
import { NewsWidgetProps, NewsItem } from './types';

/** 기본 뉴스 게시판 */
const DEFAULT_BOARD_SLUGS = ['foreign-news', 'domestic-news'];

/**
 * 뉴스 데이터를 가져오는 함수 (병렬 fetch용)
 * page.tsx에서 Promise.all로 호출 가능
 */
export async function fetchNewsData(boardSlugs: string[] = DEFAULT_BOARD_SLUGS): Promise<NewsItem[]> {
  return getAllNewsPosts(boardSlugs);
}

interface NewsWidgetServerProps extends NewsWidgetProps {
  /** 미리 fetch된 데이터 (병렬 fetch 시 사용) */
  initialData?: NewsItem[];
}

/**
 * 뉴스 위젯 (서버 컴포넌트)
 *
 * 지정된 게시판들에서 최신 뉴스를 가져와 표시합니다.
 * LCP 최적화: 뉴스가 없으면 렌더링하지 않음
 */
export default async function NewsWidget({ boardSlug, initialData }: NewsWidgetServerProps = {}) {
  // initialData가 제공되면 바로 사용, 없으면 자체 fetch
  let news: NewsItem[];

  if (initialData) {
    news = initialData;
  } else {
    const slugs = boardSlug
      ? (Array.isArray(boardSlug) ? boardSlug : [boardSlug])
      : DEFAULT_BOARD_SLUGS;
    news = await getAllNewsPosts(slugs);
  }

  // LCP 최적화: 뉴스가 없으면 렌더링하지 않음
  if (!news || news.length === 0) {
    return null;
  }

  return <NewsWidgetClient initialNews={news} />;
}
