'use server';

import { TopicPost } from '../types';
import { getAllTopicPosts } from './getAllTopicPosts';

/**
 * 인기글 목록을 유형별로 조회하는 서버 액션
 *
 * @deprecated getAllTopicPosts()를 직접 사용하세요.
 * 이 함수는 하위 호환성을 위해 유지되며, 내부적으로 getAllTopicPosts를 호출합니다.
 */
export async function getCachedTopicPosts(type: 'views' | 'likes' | 'comments' | 'hot'): Promise<TopicPost[]> {
  const data = await getAllTopicPosts(20);

  switch (type) {
    case 'views':
      return data.views;
    case 'likes':
      return data.likes;
    case 'comments':
      return data.comments;
    case 'hot':
      return data.hot;
    default:
      return [];
  }
}
