'use server'

import type { SearchParams, SearchResponse, PostSearchResult, CommentSearchResult } from '../types'
import { searchPosts } from './searchPosts'
import { searchComments } from './searchComments'
import { searchTeams, getPopularTeams, getTeamCountByLeague } from './searchTeams'

/**
 * 통합 검색 서버 액션
 * 게시글과 댓글을 함께 검색하는 단일 함수
 */
export async function searchContent({
  query,
  type = 'all',
  sortBy = 'latest',
  limit = 20,
  offset = 0
}: SearchParams): Promise<SearchResponse> {
  if (!query.trim()) {
    return { posts: [], comments: [], totalCount: 0 }
  }

  try {
    let posts: PostSearchResult[] = []
    let comments: CommentSearchResult[] = []
    
    // 게시글 검색
    if (type === 'all' || type === 'posts') {
      const postsResult = await searchPosts({ query, sortBy, limit, offset })
      posts = postsResult.posts
    }

    // 댓글 검색
    if (type === 'all' || type === 'comments') {
      const commentsResult = await searchComments({ 
        query, 
        sortBy: sortBy === 'views' ? 'latest' : sortBy, // 댓글은 views 정렬 없음
        limit, 
        offset 
      })
      comments = commentsResult.comments
    }

    return {
      posts,
      comments,
      totalCount: posts.length + comments.length
    }

  } catch (error) {
    console.error('searchContent 오류:', error)
    return { posts: [], comments: [], totalCount: 0 }
  }
}

/**
 * 검색 제안어 생성 (추후 구현)
 */
export async function getSearchSuggestions(): Promise<string[]> {
  // TODO: 인기 검색어, 팀명 등을 기반으로 자동완성 구현
  return []
}

// 팀 검색 관련 함수들 re-export
export { searchTeams, getPopularTeams, getTeamCountByLeague } 