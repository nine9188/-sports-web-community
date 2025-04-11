'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

// 게시글 상세 정보 타입
export interface PostDetail {
  post: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at?: string;
    views: number;
    likes: number;
    dislikes: number;
    user_id: string;
    board_id: string;
    post_number: number;
    files?: Array<{
      url: string;
      filename: string;
    }>;
    profiles: {
      id: string;
      nickname: string;
      icon_id?: number | null;
    } | null;
    board: {
      id: string;
      name: string;
      slug: string;
      parent_id?: string | null;
      team_id?: number | null;
      league_id?: number | null;
      resolved_logo?: string | null;
    };
    team?: {
      id: number;
      name: string;
      logo?: string | null;
    } | null;
    league?: {
      id: number;
      name: string;
      logo?: string | null;
    } | null;
  };
}

// 댓글 타입
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  parent_id?: string | null;
  depth: number;
  profiles?: {
    nickname: string;
    icon_id?: number | null;
    icon_url?: string | null;
  } | null;
  children?: Comment[];
  likes?: number;
  dislikes?: number;
}

// 인접 게시글 타입
interface AdjacentPost {
  id: string;
  title: string;
  post_number: number;
}

interface AdjacentPosts {
  prevPost: AdjacentPost | null;
  nextPost: AdjacentPost | null;
}

// 게시글 상세 정보 가져오기 함수
const fetchPostDetail = async (slug: string, postNumber: string): Promise<PostDetail> => {
  const response = await fetch(`/api/posts/${slug}/${postNumber}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '게시글을 가져오는데 실패했습니다.');
  }

  return await response.json();
};

// 댓글 가져오기 함수
const fetchComments = async (postId: string): Promise<Comment[]> => {
  const response = await fetch(`/api/comments/${postId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '댓글을 가져오는데 실패했습니다.');
  }

  return await response.json();
};

// 인접 게시글(이전글, 다음글) 가져오기 함수
const fetchAdjacentPosts = async (boardId: string, postNumber: number): Promise<AdjacentPosts> => {
  const response = await fetch(`/api/posts/adjacent?boardId=${boardId}&postNumber=${postNumber}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '인접 게시글을 가져오는데 실패했습니다.');
  }

  return await response.json();
};

// 게시글 상세 정보 훅 (Suspense 지원)
export function usePostDetail(slug: string, postNumber: string) {
  return useSuspenseQuery<PostDetail, Error>({
    queryKey: ['postDetail', slug, postNumber],
    queryFn: () => fetchPostDetail(slug, postNumber),
    staleTime: 1000 * 60 * 1, // 1분 동안 최신 상태 유지
  });
}

// 댓글 목록 훅 (Suspense 지원)
export function useComments(postId: string) {
  return useSuspenseQuery<Comment[], Error>({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    staleTime: 1000 * 60 * 1, // 1분 동안 최신 상태 유지
  });
}

// 인접 게시글 훅 (Suspense 지원)
export function useAdjacentPosts(boardId: string, postNumber: number) {
  return useSuspenseQuery<AdjacentPosts, Error>({
    queryKey: ['adjacentPosts', boardId, postNumber],
    queryFn: () => fetchAdjacentPosts(boardId, postNumber),
    staleTime: 1000 * 60 * 1, // 1분 동안 최신 상태 유지
  });
} 