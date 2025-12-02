'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js'

// 서비스 역할 클라이언트 (RLS 우회 가능)
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PredictionSummary {
  home_win_percentage: number
  draw_percentage: number
  away_win_percentage: number
  predicted_score: string
  confidence_level: 'high' | 'medium' | 'low'
}

export interface MatchContext {
  h2h_summary: string
  injury_impact: string
  form_analysis: string
  betting_odds: unknown
}

export interface DataSources {
  home_stats_league: string
  away_stats_league: string
  stats_season: number
  api_calls_made: string[]
}

interface MatchData {
  fixture: { date: string }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  league: { id: number; name: string }
}

interface TeamStats {
  league?: { name: string }
  fixtures?: {
    played?: { total?: number; home?: number; away?: number }
    wins?: { total?: number; home?: number; away?: number }
    draws?: { total?: number; home?: number; away?: number }
    loses?: { total?: number; home?: number; away?: number }
  }
  goals?: {
    for?: { total?: { home?: number; away?: number } }
    against?: { total?: { home?: number; away?: number } }
  }
}

// 예측 결과 저장
export async function savePredictionToCache(
  fixtureId: number,
  matchData: MatchData,
  aiAnalysis: string,
  homeStats: TeamStats | null,
  awayStats: TeamStats | null,
  context: MatchContext,
  sources: DataSources,
  summary: PredictionSummary,
  apiCallsCount: number = 8,
  estimatedCost: number = 0.02
) {
  try {
    // 기존 예측이 있는지 확인 (타입 체크 우회)
    const { data: existing } = await (supabaseService as any)
      .from('match_ai_predictions')
      .select('id, created_at')
      .eq('fixture_id', fixtureId)
      .single()

    const matchDate = new Date(matchData.fixture.date)
    const expiresAt = new Date(matchDate.getTime() + (7 * 24 * 60 * 60 * 1000)) // 경기 후 7일

    const predictionData = {
      fixture_id: fixtureId,
      home_team_id: matchData.teams.home.id,
      home_team_name: matchData.teams.home.name,
      away_team_id: matchData.teams.away.id,
      away_team_name: matchData.teams.away.name,
      match_date: matchDate.toISOString(),
      league_id: matchData.league.id,
      league_name: matchData.league.name,
      prediction_summary: summary,
      ai_analysis: aiAnalysis,
      home_team_stats: homeStats,
      away_team_stats: awayStats,
      match_context: context,
      data_sources: sources,
      api_calls_count: apiCallsCount,
      generation_cost_usd: estimatedCost,
      is_active: true,
      expires_at: expiresAt.toISOString(),
      last_updated: new Date().toISOString()
    }

    if (existing) {
      // 기존 예측 업데이트 (타입 체크 우회)
      const { error } = await (supabaseService as any)
        .from('match_ai_predictions')
        .update({
          ...predictionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error
      console.log(`[예측 캐시 업데이트] fixture_id: ${fixtureId}`)
    } else {
      // 새 예측 생성 (타입 체크 우회)
      const { error } = await (supabaseService as any)
        .from('match_ai_predictions')
        .insert(predictionData)

      if (error) throw error
      console.log(`[예측 캐시 생성] fixture_id: ${fixtureId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('예측 캐시 저장 실패:', error)
    return { success: false, error }
  }
}

// 캐시된 예측 조회
export async function getCachedPrediction(fixtureId: number) {
  try {
    const { data, error } = await (supabaseService as any)
      .from('match_ai_predictions')
      .select('*')
      .eq('fixture_id', fixtureId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  } catch (error) {
    console.error('캐시된 예측 조회 실패:', error)
    return null
  }
}

// 조회수 증가 (일반 사용자도 가능)
export async function incrementViewCount(fixtureId: number) {
  try {
    // 먼저 현재 값을 가져온 후 업데이트
    const { data: current } = await (supabaseService as any)
      .from('match_ai_predictions')
      .select('view_count, popularity_score')
      .eq('fixture_id', fixtureId)
      .single()

    if (current) {
      const newViewCount = (current.view_count || 0) + 1
      const newPopularityScore = (current.popularity_score || 0) + 1

      const { error } = await (supabaseService as any)
        .from('match_ai_predictions')
        .update({ 
          view_count: newViewCount,
          popularity_score: newPopularityScore
        })
        .eq('fixture_id', fixtureId)

      if (error) throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('조회수 업데이트 실패:', error)
    return { success: false, error }
  }
}

// 인기 예측 목록 조회
export async function getPopularPredictions(limit: number = 10) {
  try {
    const { data, error } = await (supabaseService as any)
      .from('match_ai_predictions')
      .select(`
        fixture_id,
        home_team_name,
        away_team_name,
        match_date,
        league_name,
        prediction_summary,
        view_count,
        popularity_score,
        created_at
      `)
      .eq('is_active', true)
      .gte('match_date', new Date().toISOString())
      .order('popularity_score', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('인기 예측 조회 실패:', error)
    return []
  }
}

// 최근 예측 목록 조회
export async function getRecentPredictions(limit: number = 10) {
  try {
    const { data, error } = await (supabaseService as any)
      .from('match_ai_predictions')
      .select(`
        fixture_id,
        home_team_name,
        away_team_name,
        match_date,
        league_name,
        prediction_summary,
        view_count,
        created_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('최근 예측 조회 실패:', error)
    return []
  }
} 