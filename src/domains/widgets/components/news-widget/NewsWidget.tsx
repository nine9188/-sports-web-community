import { getAllNewsPosts } from './actions';
import NewsWidgetClient from './NewsWidgetClient';
import { NewsWidgetProps } from './types';

/** 기본 뉴스 게시판 */
const DEFAULT_BOARD_SLUGS = ['foreign-news', 'domestic-news'];

/**
 * 뉴스 위젯 (서버 컴포넌트)
 *
 * 지정된 게시판들에서 최신 뉴스를 가져와 표시합니다.
 */
export default async function NewsWidget({ boardSlug }: NewsWidgetProps) {
  // 게시판 slug 배열로 변환
  const slugs = boardSlug
    ? (Array.isArray(boardSlug) ? boardSlug : [boardSlug])
    : DEFAULT_BOARD_SLUGS;

  // 뉴스 데이터 가져오기
  const news = await getAllNewsPosts(slugs);

  return <NewsWidgetClient initialNews={news} />;
}
