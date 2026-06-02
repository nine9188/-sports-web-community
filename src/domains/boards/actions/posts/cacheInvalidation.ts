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

export function revalidatePostListCaches(boardSlug?: string | null) {
  revalidateTag('posts', 'default');
  revalidateTag('home-widgets', 'default');
  revalidateTag('popular-posts', 'default');
  revalidateTag('all-topic-posts', 'default');

  if (boardSlug && NEWS_BOARD_SLUGS.has(boardSlug)) {
    revalidateTag('news-posts', 'default');
    revalidateTag(`news-posts-${boardSlug}`, 'default');
  }
}
