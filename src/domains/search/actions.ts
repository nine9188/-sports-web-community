'use server'

import { createClient } from '@/shared/api/supabaseServer'
import type { PostSearchResult, CommentSearchResult } from './types'

/**
 * 게시글 검색 서버 액션 (MVP)
 * Supabase Full-Text Search 활용
 */
export async function searchPosts({
  query,
  sortBy = 'latest',
  limit = 20,
  offset = 0
}: {
  query: string
  sortBy?: 'latest' | 'views' | 'likes'
  limit?: number
  offset?: number
}): Promise<{ posts: PostSearchResult[], totalCount: number }> {
  if (!query.trim()) {
    return { posts: [], totalCount: 0 }
  }

  try {
    const supabase = await createClient()
    
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패')
    }

    // Full-Text Search 쿼리 구성
    // 한국어 지원을 위해 'korean' 설정 사용
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

    // 제목과 내용에서 검색
    searchQuery = searchQuery.or(
      `title.ilike.%${query}%`
    )

    // 정렬 옵션 적용
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

    // 결과 제한 및 오프셋 적용
    searchQuery = searchQuery.range(offset, offset + limit - 1)

    const { data, error } = await searchQuery

    if (error) {
      console.error('검색 오류:', error)
      throw new Error(`검색 실패: ${error.message}`)
    }

    if (!data) {
      return { posts: [], totalCount: 0 }
    }

    // 검색 결과를 PostSearchResult 형태로 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts = data.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      views: post.views,
      likes: post.likes,
      post_number: post.post_number,
      board_id: post.board_id,
      profiles: post.profiles,
      boards: post.boards,
      author_name: post.profiles?.nickname || '익명',
      board_name: post.boards?.name || '게시판',
      snippet: extractContentSnippet(post.content, query)
    }))

    return { posts, totalCount: posts.length }

  } catch (error) {
    console.error('searchPosts 오류:', error)
    return { posts: [], totalCount: 0 }
  }
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
      // JSON 형태의 content에서 텍스트 추출
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
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/&[^;]+;/g, ' ') // HTML 엔티티 제거
      .replace(/[<>{}"\[\]]/g, ' ') // 특수 문자 제거
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .trim()

    // 검색어 주변 텍스트 추출
    const queryIndex = textContent.toLowerCase().indexOf(query.toLowerCase())
    
    if (queryIndex === -1) {
      // 검색어가 없으면 앞부분 반환
      return textContent.length > maxLength 
        ? textContent.substring(0, maxLength) + '...'
        : textContent
    }

    // 검색어 주변 텍스트 추출
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

/**
 * 댓글 검색 서버 액션
 */
export async function searchComments({
  query,
  sortBy = 'latest',
  limit = 20,
  offset = 0
}: {
  query: string
  sortBy?: 'latest' | 'likes'
  limit?: number
  offset?: number
}): Promise<{ comments: CommentSearchResult[], totalCount: number }> {
  if (!query.trim()) {
    return { comments: [], totalCount: 0 }
  }

  try {
    const supabase = await createClient()
    
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패')
    }

    // 댓글 검색 쿼리 구성
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

    // 댓글 내용에서 검색
    searchQuery = searchQuery.ilike('content', `%${query}%`)

    // 정렬 옵션 적용
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

    // 결과 제한 및 오프셋 적용
    searchQuery = searchQuery.range(offset, offset + limit - 1)

    const { data, error } = await searchQuery

    if (error) {
      console.error('댓글 검색 오류:', error)
      return { comments: [], totalCount: 0 }
    }

    if (!data) {
      return { comments: [], totalCount: 0 }
    }

    // 검색 결과를 CommentSearchResult 형태로 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comments = data.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      likes: comment.likes,
      post_id: comment.post_id,
      profiles: comment.profiles,
      posts: comment.posts,
      author_name: comment.profiles?.nickname || '익명',
      post_title: comment.posts?.title || '제목 없음',
      board_name: comment.posts?.boards?.name || '게시판',
      snippet: extractContentSnippet(comment.content, query)
    }))

    return { comments, totalCount: comments.length }

  } catch (error) {
    console.error('searchComments 오류:', error)
    return { comments: [], totalCount: 0 }
  }
}

/**
 * 통합 검색 (게시글 + 댓글)
 */
export async function searchAll({
  query,
  type = 'all',
  sortBy = 'latest',
  limit = 20,
  offset = 0
}: {
  query: string
  type?: 'all' | 'posts' | 'comments'
  sortBy?: 'latest' | 'views' | 'likes'
  limit?: number
  offset?: number
}): Promise<{
  posts: PostSearchResult[]
  comments: CommentSearchResult[]
  totalCount: number
}> {
  if (!query.trim()) {
    return { posts: [], comments: [], totalCount: 0 }
  }

  try {
    let posts: PostSearchResult[] = []
    let comments: CommentSearchResult[] = []

    if (type === 'all' || type === 'posts') {
      const postResults = await searchPosts({ query, sortBy, limit: Math.floor(limit / 2), offset })
      posts = postResults.posts
    }

    if (type === 'all' || type === 'comments') {
      const commentResults = await searchComments({ 
        query, 
        sortBy: sortBy === 'views' ? 'latest' : sortBy, // 댓글은 views 정렬 없음
        limit: Math.floor(limit / 2), 
        offset 
      })
      comments = commentResults.comments
    }

    return {
      posts,
      comments,
      totalCount: posts.length + comments.length
    }

  } catch (error) {
    console.error('searchAll 오류:', error)
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