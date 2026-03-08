'use server'

import { getSupabaseServer } from '@/shared/lib/supabase/server'
import type { PostSearchResult, CardPreview } from '../types'
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
    const supabase = await getSupabaseServer()
    
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
      snippet: extractContentSnippet(post.content, query),
      cards: extractCardPreviews(post.content)
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
      // JSON 문자열인 경우 파싱 시도
      if (content.startsWith('{') || content.startsWith('[')) {
        try {
          const parsed = JSON.parse(content)
          textContent = extractTextFromTiptap(parsed)
        } catch {
          textContent = content
        }
      } else {
        textContent = content
      }
    } else if (content && typeof content === 'object') {
      textContent = extractTextFromTiptap(content)
    }

    if (!textContent) {
      return ''
    }

    // HTML 태그 및 특수 문자 제거
    textContent = textContent
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
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

/**
 * TipTap JSON에서 텍스트만 재귀 추출
 */
function extractTextFromTiptap(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as Record<string, unknown>

  // text 노드
  if (n.type === 'text' && typeof n.text === 'string') {
    return n.text
  }

  // 카드 노드 (matchCard, teamCard, playerCard 등)는 스킵
  if (typeof n.type === 'string' && (n.type.includes('Card') || n.type === 'image')) {
    return ''
  }

  // content 배열 재귀 탐색
  if (Array.isArray(n.content)) {
    return n.content
      .map((child: unknown) => extractTextFromTiptap(child))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

/**
 * TipTap JSON에서 카드 프리뷰 데이터 추출 (최대 2개)
 */
function extractCardPreviews(content: unknown): CardPreview[] {
  const cards: CardPreview[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>
    const attrs = n.attrs as Record<string, unknown> | undefined

    if (n.type === 'matchCard' && attrs) {
      const matchData = attrs.matchData as Record<string, unknown> | undefined
      const teams = matchData?.teams as Record<string, Record<string, unknown>> | undefined
      const goals = matchData?.goals as Record<string, unknown> | undefined
      const league = matchData?.league as Record<string, unknown> | undefined
      if (teams) {
        cards.push({
          type: 'match',
          homeTeam: (teams.home?.name as string) || '',
          awayTeam: (teams.away?.name as string) || '',
          homeScore: goals?.home as number | string ?? '-',
          awayScore: goals?.away as number | string ?? '-',
          leagueName: (league?.name as string) || '',
        })
      }
    } else if (n.type === 'teamCard' && attrs) {
      const teamData = attrs.teamData as Record<string, unknown> | undefined
      if (teamData) {
        cards.push({
          type: 'team',
          teamName: (teamData.koreanName as string) || (teamData.name as string) || '',
          teamLogo: (teamData.logo as string) || '',
        })
      }
    } else if (n.type === 'playerCard' && attrs) {
      const playerData = attrs.playerData as Record<string, unknown> | undefined
      if (playerData) {
        cards.push({
          type: 'player',
          playerName: (playerData.koreanName as string) || (playerData.name as string) || '',
          playerPhoto: (playerData.photo as string) || '',
        })
      }
    }

    if (Array.isArray(n.content)) {
      for (const child of n.content) walk(child)
    }
  }

  if (content && typeof content === 'object') {
    walk(content)
  } else if (typeof content === 'string' && content.startsWith('{')) {
    try { walk(JSON.parse(content)) } catch { /* ignore */ }
  }

  return cards
}