'use server'

import type { SearchParams, SearchResponse, PostSearchResult, CommentSearchResult, TeamSearchResult } from '../types'
import { searchPosts } from './searchPosts'
import { searchComments } from './searchComments'
import { searchTeams, getPopularTeams, getTeamCountByLeague } from './searchTeams'
import { createSearchLog } from './searchLogs'
import { createClient } from '@/shared/api/supabaseServer'
import { searchTeamsByName } from '@/domains/livescore/constants/teams'

/**
 * 통합 검색 서버 액션 (성능 최적화)
 * 게시글, 댓글, 팀을 함께 검색하되 성능을 고려한 구현
 */
export async function searchContent({
  query,
  type = 'all',
  sortBy = 'latest',
  limit = 20,
  offset = 0
}: SearchParams): Promise<SearchResponse> {
  const startTime = Date.now()
  
  if (!query.trim()) {
    return { 
      posts: [], 
      comments: [], 
      teams: [], 
      totalCount: 0,
      pagination: {
        posts: { total: 0, hasMore: false },
        comments: { total: 0, hasMore: false },
        teams: { total: 0, hasMore: false }
      }
    }
  }

  try {
    let posts: PostSearchResult[] = []
    let comments: CommentSearchResult[] = []
    let teams: TeamSearchResult[] = []
    let postsTotalCount = 0
    let commentsTotalCount = 0
    let teamsTotalCount = 0
    
    // 성능 최적화: 병렬 처리로 변경
    const searchPromises = []
    const countPromises = []
    
    // 게시글 검색 (데이터)
    if (type === 'all' || type === 'posts') {
      searchPromises.push(
        searchPosts({
          query,
          sortBy,
          limit: type === 'posts' ? limit : 8, // 전체 탭에서는 8개만
          offset: type === 'posts' ? offset : 0,
          skipCount: false
        }).then(result => ({ type: 'posts', result })).catch(error => {
          console.error('게시글 검색 오류:', error)
          return { type: 'posts', result: { posts: [], totalCount: 0 } }
        })
      )
    }

    // 댓글 검색 (데이터)
    if (type === 'all' || type === 'comments') {
      searchPromises.push(
        searchComments({
          query,
          sortBy: sortBy === 'views' ? 'latest' : sortBy,
          limit: type === 'comments' ? limit : 5, // 전체 탭에서는 5개만
          offset: type === 'comments' ? offset : 0,
          skipCount: false
        }).then(result => ({ type: 'comments', result })).catch(error => {
          console.error('댓글 검색 오류:', error)
          return { type: 'comments', result: { comments: [], totalCount: 0 } }
        })
      )
    }

    // 팀 검색 (데이터)
    if (type === 'all' || type === 'teams') {
      searchPromises.push(
        searchTeams({
          query,
          limit: type === 'teams' ? limit : 5,
          offset: type === 'teams' ? offset : 0
        }).then(result => ({ type: 'teams', result })).catch(error => {
          console.error('팀 검색 오류:', error)
          return { type: 'teams', result: { teams: [], totalCount: 0, hasMore: false } }
        })
      )
    }

    // 개수만 가져오기 (모든 탭에서 실행) - 데이터 검색과 별도로 실행
    if (type !== 'posts') {
      countPromises.push(
        getPostsCount(query).then(count => ({ type: 'posts-count', count })).catch(() => {
          return { type: 'posts-count', count: 0 }
        })
      )
    }

    if (type !== 'comments') {
      countPromises.push(
        getCommentsCount(query).then(count => ({ type: 'comments-count', count })).catch(() => {
          return { type: 'comments-count', count: 0 }
        })
      )
    }

    if (type !== 'teams') {
      countPromises.push(
        getTeamsCount(query).then(count => ({ type: 'teams-count', count })).catch(() => {
          return { type: 'teams-count', count: 0 }
        })
      )
    }

    // 모든 검색을 병렬로 실행
    const [searchResults, countResults] = await Promise.all([
      Promise.all(searchPromises),
      Promise.all(countPromises)
    ])
    
    // 결과 매핑
    searchResults.forEach(({ type: resultType, result }) => {
      if (resultType === 'posts' && 'posts' in result) {
        posts = result.posts
        postsTotalCount = result.totalCount
      } else if (resultType === 'comments' && 'comments' in result) {
        comments = result.comments
        commentsTotalCount = result.totalCount
      } else if (resultType === 'teams' && 'teams' in result) {
        teams = result.teams
        teamsTotalCount = result.totalCount || result.teams.length
      }
    })

    // 개수만 가져온 결과 매핑
    countResults.forEach(({ type: resultType, count }) => {
      if (resultType === 'posts-count') {
        postsTotalCount = count
      } else if (resultType === 'comments-count') {
        commentsTotalCount = count
      } else if (resultType === 'teams-count') {
        teamsTotalCount = count || 0
      }
    })

    // 실제 전체 검색 결과 개수 계산
    const totalCount = postsTotalCount + commentsTotalCount + teamsTotalCount
    const searchDuration = Date.now() - startTime

    // 검색 로그 저장 (완전 비동기, Fire-and-forget)
    // 검색 응답 속도에 영향을 주지 않도록 즉시 반환
    setImmediate(() => {
      createSearchLog({
        search_query: query.trim(),
        search_type: type,
        results_count: totalCount,
        search_duration_ms: searchDuration
      }).catch(() => {
        // 로그 저장 실패는 무시 (성능 우선)
      })
    })

    return {
      posts,
      comments,
      teams,
      totalCount,
      pagination: {
        posts: { 
          total: postsTotalCount, 
          hasMore: type === 'posts' ? (offset + limit < postsTotalCount) : (postsTotalCount > 8)
        },
        comments: { 
          total: commentsTotalCount, 
          hasMore: type === 'comments' ? (offset + limit < commentsTotalCount) : (commentsTotalCount > 5)
        },
        teams: { 
          total: teamsTotalCount, 
          hasMore: type === 'teams' ? (offset + limit < teamsTotalCount) : (teamsTotalCount > 5)
        }
      }
    }

  } catch (error) {
    console.error('통합 검색 오류:', error)
    throw new Error('검색 중 오류가 발생했습니다')
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
export { getPopularTeams, getTeamCountByLeague }

/**
 * 개수만 가져오는 효율적인 함수들
 */
async function getPostsCount(query: string): Promise<number> {
  try {
    const supabase = await createClient()
    if (!supabase) return 0
    
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .not('is_hidden', 'eq', true)
      .not('is_deleted', 'eq', true)
      .or(`title.ilike.%${query}%`)
    
    return count || 0
  } catch {
    return 0
  }
}

async function getCommentsCount(query: string): Promise<number> {
  try {
    const supabase = await createClient()
    if (!supabase) return 0
    
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .not('is_hidden', 'eq', true)
      .not('is_deleted', 'eq', true)
      .ilike('content', `%${query}%`)
    
    return count || 0
  } catch {
    return 0
  }
}

async function getTeamsCount(query: string): Promise<number> {
  try {
    const supabase = await createClient()
    if (!supabase) return 0
    
    const searchTerm = query.trim().toLowerCase()
    
    // 한국어 매핑에서 검색하여 해당하는 팀 ID들 찾기 (searchTeams와 동일한 로직)
    const mappedTeams = searchTeamsByName(query)
    const mappedTeamIds = mappedTeams.map(team => team.id)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countQuery = (supabase as any)
      .from('football_teams')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      
    // 검색 조건: searchTeams와 동일한 로직
    if (mappedTeamIds.length > 0) {
      countQuery = countQuery.or(`team_id.in.(${mappedTeamIds.join(',')}),name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%`)
    } else {
      countQuery = countQuery.or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%,short_name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,venue_city.ilike.%${searchTerm}%`)
    }
    
    const { count } = await countQuery
    
    return count || 0
  } catch {
    return 0
  }
} 