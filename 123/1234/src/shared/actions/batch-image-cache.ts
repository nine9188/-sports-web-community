'use server'

import { revalidatePath } from 'next/cache'
import { batchCacheImages } from './image-storage-actions'
import type { ImageCacheRequest } from '@/shared/types/image'

// 이미지 타입을 직접 정의 (사용하지 않음)
// type ImageTypeString = 'players' | 'teams' | 'leagues' | 'coachs'

/**
 * 선수 이미지들을 배치로 캐시하는 함수
 */
export async function batchCachePlayerImages(playerIds: number[]): Promise<{
  success: boolean
  cached: number
  failed: number
  results: Array<{ id: number; cached: boolean; error?: string }>
}> {
  const images: ImageCacheRequest[] = playerIds.map(id => ({ type: 'players', id }))
  const result = await batchCacheImages(images)
  
  const cached = result.results.filter(r => r.cached).length
  const failed = result.results.filter(r => !r.cached).length
  
  // 캐시가 업데이트되었으므로 관련 페이지 재검증
  revalidatePath('/livescore')
  
  return {
    success: result.success,
    cached,
    failed,
    results: result.results.map(r => ({
      id: Number(r.id),
      cached: r.cached,
      error: r.error
    }))
  }
}

/**
 * 팀 로고들을 배치로 캐시하는 함수
 */
export async function batchCacheTeamLogos(teamIds: number[]): Promise<{
  success: boolean
  cached: number
  failed: number
  results: Array<{ id: number; cached: boolean; error?: string }>
}> {
  const images: ImageCacheRequest[] = teamIds.map(id => ({ type: 'teams', id }))
  const result = await batchCacheImages(images)
  
  const cached = result.results.filter(r => r.cached).length
  const failed = result.results.filter(r => !r.cached).length
  
  // 캐시가 업데이트되었으므로 관련 페이지 재검증
  revalidatePath('/livescore')
  
  return {
    success: result.success,
    cached,
    failed,
    results: result.results.map(r => ({
      id: Number(r.id),
      cached: r.cached,
      error: r.error
    }))
  }
}

/**
 * 리그 로고들을 배치로 캐시하는 함수
 */
export async function batchCacheLeagueLogos(leagueIds: number[]): Promise<{
  success: boolean
  cached: number
  failed: number
  results: Array<{ id: number; cached: boolean; error?: string }>
}> {
  const images: ImageCacheRequest[] = leagueIds.map(id => ({ type: 'leagues', id }))
  const result = await batchCacheImages(images)
  
  const cached = result.results.filter(r => r.cached).length
  const failed = result.results.filter(r => !r.cached).length
  
  // 캐시가 업데이트되었으므로 관련 페이지 재검증
  revalidatePath('/livescore')
  
  return {
    success: result.success,
    cached,
    failed,
    results: result.results.map(r => ({
      id: Number(r.id),
      cached: r.cached,
      error: r.error
    }))
  }
}

/**
 * 감독 이미지들을 배치로 캐시하는 함수
 */
export async function batchCacheCoachImages(coachIds: number[]): Promise<{
  success: boolean
  cached: number
  failed: number
  results: Array<{ id: number; cached: boolean; error?: string }>
}> {
  const images: ImageCacheRequest[] = coachIds.map(id => ({ type: 'coachs', id }))
  const result = await batchCacheImages(images)
  
  const cached = result.results.filter(r => r.cached).length
  const failed = result.results.filter(r => !r.cached).length
  
  // 캐시가 업데이트되었으므로 관련 페이지 재검증
  revalidatePath('/livescore')
  
  return {
    success: result.success,
    cached,
    failed,
    results: result.results.map(r => ({
      id: Number(r.id),
      cached: r.cached,
      error: r.error
    }))
  }
}

/**
 * 경기 관련 이미지들을 배치로 캐시하는 함수
 */
export async function batchCacheMatchImages(matchData: {
  playerIds?: number[]
  teamIds?: number[]
  leagueIds?: number[]
  coachIds?: number[]
}): Promise<{
  success: boolean
  totalCached: number
  totalFailed: number
  details: {
    players?: { cached: number; failed: number }
    teams?: { cached: number; failed: number }
    leagues?: { cached: number; failed: number }
    coachs?: { cached: number; failed: number }
  }
}> {
  const results = {
    success: true,
    totalCached: 0,
    totalFailed: 0,
    details: {} as {
      players?: { cached: number; failed: number }
      teams?: { cached: number; failed: number }
      leagues?: { cached: number; failed: number }
      coachs?: { cached: number; failed: number }
    }
  }
  
  try {
    // 선수 이미지 캐시
    if (matchData.playerIds && matchData.playerIds.length > 0) {
      const playerResult = await batchCachePlayerImages(matchData.playerIds)
      results.totalCached += playerResult.cached
      results.totalFailed += playerResult.failed
      results.details.players = {
        cached: playerResult.cached,
        failed: playerResult.failed
      }
    }
    
    // 팀 로고 캐시
    if (matchData.teamIds && matchData.teamIds.length > 0) {
      const teamResult = await batchCacheTeamLogos(matchData.teamIds)
      results.totalCached += teamResult.cached
      results.totalFailed += teamResult.failed
      results.details.teams = {
        cached: teamResult.cached,
        failed: teamResult.failed
      }
    }
    
    // 리그 로고 캐시
    if (matchData.leagueIds && matchData.leagueIds.length > 0) {
      const leagueResult = await batchCacheLeagueLogos(matchData.leagueIds)
      results.totalCached += leagueResult.cached
      results.totalFailed += leagueResult.failed
      results.details.leagues = {
        cached: leagueResult.cached,
        failed: leagueResult.failed
      }
    }
    
    // 감독 이미지 캐시
    if (matchData.coachIds && matchData.coachIds.length > 0) {
      const coachResult = await batchCacheCoachImages(matchData.coachIds)
      results.totalCached += coachResult.cached
      results.totalFailed += coachResult.failed
      results.details.coachs = {
        cached: coachResult.cached,
        failed: coachResult.failed
      }
    }
    
    return results
    
  } catch (error) {
    console.error('Batch cache match images error:', error)
    return {
      success: false,
      totalCached: results.totalCached,
      totalFailed: results.totalFailed,
      details: results.details
    }
  }
}

/**
 * 프리미어리그 주요 팀들의 이미지를 미리 캐시하는 함수
 */
export async function warmupPremierLeagueImages(): Promise<{
  success: boolean
  cached: number
  failed: number
}> {
  // 프리미어리그 주요 팀 ID들
  const premierLeagueTeamIds = [
    40, // Liverpool
    42, // Arsenal
    49, // Chelsea
    50, // Manchester City
    33, // Manchester United
    47, // Tottenham
    66, // Aston Villa
    34, // Newcastle United
    51, // Brighton
    35, // Bournemouth
    36, // Fulham
    65, // Nottingham Forest
    // 더 많은 팀들 추가 가능
  ]
  
  const leagueIds = [39] // 프리미어리그 ID
  
  const matchResult = await batchCacheMatchImages({
    teamIds: premierLeagueTeamIds,
    leagueIds: leagueIds
  })
  
  return {
    success: matchResult.success,
    cached: matchResult.totalCached,
    failed: matchResult.totalFailed
  }
} 