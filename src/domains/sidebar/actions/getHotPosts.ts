'use server';

import { TopicPost } from '../types';
import { getAllTopicPosts } from './getAllTopicPosts';

/**
 * 슬라이딩 윈도우 방식 HOT 인기글 조회
 *
 * @deprecated getAllTopicPosts()를 직접 사용하세요.
 * 이 함수는 하위 호환성을 위해 유지되며, 내부적으로 getAllTopicPosts를 호출합니다.
 */
export async function getHotPosts(
  options?: {
    limit?: number;
    minScore?: number;
  }
): Promise<{
  posts: TopicPost[];
  windowDays: number;
  stats: {
    totalPosts: number;
    avgScore: number;
  };
}> {
  const limit = options?.limit || 20;
  const data = await getAllTopicPosts(limit);

  return {
    posts: data.hot,
    windowDays: data.windowDays,
    stats: data.stats
  };
}
