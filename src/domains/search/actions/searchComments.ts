'use server'

import { createClient } from '@/shared/api/supabaseServer'
import type { CommentSearchResult } from '../types'

interface SearchCommentsParams {
  query: string
  sortBy?: 'latest' | 'likes'
  limit?: number
  offset?: number
}

export async function searchComments({
  query,
  sortBy = 'latest',
  limit = 20,
  offset = 0,
  skipCount = false
}: SearchCommentsParams & { skipCount?: boolean }): Promise<{ comments: CommentSearchResult[], totalCount: number }> {
  if (!query.trim()) {
    return { comments: [], totalCount: 0 }
  }

  try {
    const supabase = await createClient()
    
    if (!supabase) {
      throw new Error('Supabase 클라이언트 초기화 실패')
    }

    // COUNT 쿼리는 필요할 때만 실행
    let totalCount = 0
    if (!skipCount) {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .not('is_deleted', 'eq', true)
        .not('is_hidden', 'eq', true)
        .ilike('content', `%${query}%`)
      
      totalCount = count || 0
    }

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
      return { comments: [], totalCount: totalCount || 0 }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comments = data.map((comment: any) => ({
      ...comment,
      author_name: comment.profiles?.nickname || '익명',
      post_title: comment.posts?.title || '제목 없음',
      board_name: comment.posts?.boards?.name || '게시판',
      snippet: extractContentSnippet(comment.content, query)
    }))

    return { comments, totalCount: totalCount || 0 }

  } catch (error) {
    console.error('searchComments 오류:', error)
    return { comments: [], totalCount: 0 }
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