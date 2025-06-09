'use server'

import { createClient } from '@/shared/api/supabaseServer'
import type { PostSearchResult, CommentSearchResult, SearchParams, SearchResponse } from '../types'

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
    const supabase = await createClient()
    
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패')
    }

    let posts: PostSearchResult[] = []
    let comments: CommentSearchResult[] = []
    
    // 게시글 검색
    if (type === 'all' || type === 'posts') {
      const postsResult = await searchPostsInternal(supabase, query, sortBy, limit, offset)
      posts = postsResult.posts
    }

    // 댓글 검색
    if (type === 'all' || type === 'comments') {
      const commentsResult = await searchCommentsInternal(supabase, query, sortBy, limit, offset)
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
 * 게시글 검색 (내부 함수)
 */
async function searchPostsInternal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  query: string,
  sortBy: string,
  limit: number,
  offset: number
): Promise<{ posts: PostSearchResult[], totalCount: number }> {
  let searchQuery = supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      created_at,
      views,
      likes,
      post_number,
      board_id,
      profiles!posts_user_id_fkey(
        nickname,
        icon_id
      ),
      boards!posts_board_id_fkey(
        name,
        slug
      )
    `)
    .eq('is_published', true)
    .not('is_hidden', 'eq', true)
    .not('is_deleted', 'eq', true)
    .or(`title.ilike.%${query}%`)

  // 정렬 적용
  switch (sortBy) {
    case 'latest':
      searchQuery = searchQuery.order('created_at', { ascending: false })
      break
    case 'views':
      searchQuery = searchQuery.order('views', { ascending: false, nullsFirst: false })
      break
    case 'likes':
      searchQuery = searchQuery.order('likes', { ascending: false, nullsFirst: false })
      break
    default:
      searchQuery = searchQuery.order('created_at', { ascending: false })
  }

  searchQuery = searchQuery.range(offset, offset + limit - 1)

  const { data, error } = await searchQuery

  if (error) {
    console.error('게시글 검색 오류:', error)
    return { posts: [], totalCount: 0 }
  }

  if (!data) {
    return { posts: [], totalCount: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = data.map((post: any) => ({
    ...post,
    author_name: post.profiles?.nickname || '익명',
    board_name: post.boards?.name || '게시판',
    snippet: extractContentSnippet(post.content, query)
  }))

  return { posts, totalCount: posts.length }
}

/**
 * 댓글 검색 (내부 함수)
 */
async function searchCommentsInternal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  query: string,
  sortBy: string,
  limit: number,
  offset: number
): Promise<{ comments: CommentSearchResult[], totalCount: number }> {
  let searchQuery = supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      likes,
      post_id,
      profiles!comments_user_id_fkey(
        nickname,
        icon_id
      ),
      posts!comments_post_id_fkey(
        title,
        post_number,
        board_id,
        boards!posts_board_id_fkey(
          name,
          slug
        )
      )
    `)
    .not('is_deleted', 'eq', true)
    .not('is_hidden', 'eq', true)
    .ilike('content', `%${query}%`)

  // 정렬 적용 (댓글은 views 정렬 없음)
  switch (sortBy) {
    case 'latest':
      searchQuery = searchQuery.order('created_at', { ascending: false })
      break
    case 'likes':
      searchQuery = searchQuery.order('likes', { ascending: false, nullsFirst: false })
      break
    default:
      searchQuery = searchQuery.order('created_at', { ascending: false })
  }

  searchQuery = searchQuery.range(offset, offset + limit - 1)

  const { data, error } = await searchQuery

  if (error) {
    console.error('댓글 검색 오류:', error)
    return { comments: [], totalCount: 0 }
  }

  if (!data) {
    return { comments: [], totalCount: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comments = data.map((comment: any) => ({
    ...comment,
    author_name: comment.profiles?.nickname || '익명',
    post_title: comment.posts?.title || '제목 없음',
    board_name: comment.posts?.boards?.name || '게시판',
    snippet: extractContentSnippet(comment.content, query)
  }))

  return { comments, totalCount: comments.length }
}

/**
 * 검색어가 포함된 본문 스니펫 추출
 */
function extractContentSnippet(content: unknown, query: string, maxLength = 150): string {
  try {
    let textContent = ''
    
    if (typeof content === 'string') {
      textContent = content
    } else if (content && typeof content === 'object') {
      textContent = JSON.stringify(content)
        .replace(/[{}"\[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    if (!textContent) {
      return ''
    }

    // HTML 태그 및 특수 문자 제거
    textContent = textContent
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/[<>{}"\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // 검색어 주변 텍스트 추출
    const queryIndex = textContent.toLowerCase().indexOf(query.toLowerCase())
    
    if (queryIndex === -1) {
      return textContent.length > maxLength 
        ? textContent.substring(0, maxLength) + '...'
        : textContent
    }

    const start = Math.max(0, queryIndex - 50)
    const end = Math.min(textContent.length, queryIndex + query.length + 50)
    
    let snippet = textContent.substring(start, end)
    
    if (start > 0) snippet = '...' + snippet
    if (end < textContent.length) snippet = snippet + '...'
    
    return snippet.length > maxLength 
      ? snippet.substring(0, maxLength) + '...'
      : snippet

  } catch (error) {
    console.error('스니펫 추출 오류:', error)
    return ''
  }
}

// 하위 호환성을 위한 기존 함수들 (deprecated)
export async function searchPosts(params: {
  query: string
  sortBy?: 'latest' | 'views' | 'likes'
  limit?: number
  offset?: number
}): Promise<{ posts: PostSearchResult[], totalCount: number }> {
  const result = await searchContent({
    query: params.query,
    type: 'posts',
    sortBy: params.sortBy,
    limit: params.limit,
    offset: params.offset
  })
  return { posts: result.posts, totalCount: result.posts.length }
}

export async function searchComments(params: {
  query: string
  sortBy?: 'latest' | 'likes'
  limit?: number
  offset?: number
}): Promise<{ comments: CommentSearchResult[], totalCount: number }> {
  const result = await searchContent({
    query: params.query,
    type: 'comments',
    sortBy: params.sortBy,
    limit: params.limit,
    offset: params.offset
  })
  return { comments: result.comments, totalCount: result.comments.length }
}

/**
 * 검색 제안어 생성 (추후 구현)
 */
export async function getSearchSuggestions(): Promise<string[]> {
  // TODO: 인기 검색어, 팀명 등을 기반으로 자동완성 구현
  return []
} 