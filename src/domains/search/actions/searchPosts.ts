'use server'

import { createClient } from '@/shared/api/supabaseServer'
import type { PostSearchResult } from '../types'
import { logUserAction } from '@/shared/actions/log-actions'

interface SearchPostsParams {
  query: string
  sortBy?: 'latest' | 'views' | 'likes'
  limit?: number
  offset?: number
}

export async function searchPosts({
  query,
  sortBy = 'latest',
  limit = 20,
  offset = 0,
  skipCount = false
}: SearchPostsParams & { skipCount?: boolean }): Promise<{ posts: PostSearchResult[], totalCount: number }> {
  if (!query.trim()) {
    return { posts: [], totalCount: 0 }
  }

  try {
    const supabase = await createClient()
    
        if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패')
    }

    // 검색 로그 기록 (사용자가 로그인되어 있는 경우에만)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await logUserAction(
        'SEARCH_POSTS',
        `게시글 검색: "${query}"`,
        user.id,
        {
          query,
          sortBy,
          limit,
          offset
        }
      );
    }

    // COUNT 쿼리는 필요할 때만 실행 (성능 최적화)
    let totalCount = 0
    if (!skipCount) {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .not('is_hidden', 'eq', true)
        .not('is_deleted', 'eq', true)
        .or(`title.ilike.%${query}%`)
      
      totalCount = count || 0
    }

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
      return { posts: [], totalCount }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const posts = data.map((post: any) => ({
      ...post,
      author_name: post.profiles?.nickname || '익명',
      board_name: post.boards?.name || '게시판',
      snippet: extractContentSnippet(post.content, query)
    }))

    return { posts, totalCount }

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