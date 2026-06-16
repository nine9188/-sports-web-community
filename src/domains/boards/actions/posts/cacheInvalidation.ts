import { revalidateTag } from 'next/cache';

const NEWS_BOARD_SLUGS = new Set([
  'foreign-news',
  'domestic-news',
  'official',
  'premier',
  'laliga',
  'bundesliga',
  'serie-a',
  'LIGUE1',
]);

const ANALYSIS_BOARD_SLUGS = new Set([
  'data-analysis',
  'foreign-analysis',
  'foreign-analysis-premier',
  'foreign-analysis-laliga',
  'foreign-analysis-ligue1',
  'foreign-analysis-bundesliga',
  'foreign-analysis-serie-a',
  'domestic-analysis',
  'domestic-analysis-k-league-1',
  'domestic-analysis-k-league-2',
]);

export function revalidatePostListCaches(boardSlug?: string | null) {
  revalidateTag('posts', 'default');
  revalidateTag('home-widgets', 'default');
  revalidateTag('popular-posts', 'default');
  revalidateTag('all-topic-posts', 'default');

  if (boardSlug && NEWS_BOARD_SLUGS.has(boardSlug)) {
    revalidateTag('news-posts', 'default');
    revalidateTag(`news-posts-${boardSlug}`, 'default');
  }

  if (boardSlug && ANALYSIS_BOARD_SLUGS.has(boardSlug)) {
    revalidateTag('analysis-posts', 'default');
    revalidateTag('board-collection', 'default');
  }
}
