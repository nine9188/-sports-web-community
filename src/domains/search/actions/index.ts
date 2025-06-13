'use server'

import type { SearchParams, SearchResponse, PostSearchResult, CommentSearchResult, TeamSearchResult } from '../types'
import { searchPosts } from './searchPosts'
import { searchComments } from './searchComments'
import { searchTeams, getPopularTeams, getTeamCountByLeague } from './searchTeams'
import { createSearchLog } from './searchLogs'

/**
 * 통합 검색 서버 액션 (로그 저장 포함)
 * 게시글, 댓글, 팀을 함께 검색하고 검색 로그를 저장하는 단일 함수
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
    
    // 게시글 검색
    if (type === 'all' || type === 'posts') {
      try {
        const postResults = await searchPosts({
          query,
          sortBy,
          limit: type === 'posts' ? limit : 5, // 전체 탭에서는 5개만
          offset: type === 'posts' ? offset : 0
        })
        posts = postResults.posts
        postsTotalCount = postResults.totalCount
      } catch (error) {
        console.error('게시글 검색 오류:', error)
      }
    }

    // 댓글 검색
    if (type === 'all' || type === 'comments') {
      try {
        const commentResults = await searchComments({
          query,
          sortBy: sortBy === 'views' ? 'latest' : sortBy,
          limit: type === 'comments' ? limit : 5, // 전체 탭에서는 5개만
          offset: type === 'comments' ? offset : 0
        })
        comments = commentResults.comments
        commentsTotalCount = commentResults.totalCount
      } catch (error) {
        console.error('댓글 검색 오류:', error)
      }
    }

    // 팀 검색
    if (type === 'all' || type === 'teams') {
      try {
        const teamResults = await searchTeams({
          query,
          limit: type === 'teams' ? limit : 5,
          offset: type === 'teams' ? offset : 0
        })
        teams = teamResults.teams
        teamsTotalCount = teamResults.totalCount || teams.length
      } catch (error) {
        console.error('팀 검색 오류:', error)
      }
    }

    const totalCount = posts.length + comments.length + teams.length
    const searchDuration = Date.now() - startTime

    // 검색 로그 저장 (비동기, 실패해도 검색 결과에 영향 없음)
    createSearchLog({
      search_query: query.trim(),
      search_type: type,
      results_count: totalCount,
      search_duration_ms: searchDuration
    }).catch(logError => {
      console.error('검색 로그 저장 실패:', logError)
      // 로그 저장 실패는 검색 결과에 영향을 주지 않음
    })

    return {
      posts,
      comments,
      teams,
      totalCount,
      pagination: {
        posts: { 
          total: postsTotalCount, 
          hasMore: type === 'posts' ? (offset + limit < postsTotalCount) : (postsTotalCount > 5)
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