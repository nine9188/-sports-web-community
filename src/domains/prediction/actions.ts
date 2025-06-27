'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi'
import { predictMatch } from './utils/predictMatch'
import { getMajorLeagueIds } from '@/domains/livescore/constants/league-mappings'

// API 라우트용 Supabase 클라이언트 생성
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface UpcomingMatch {
  id: number;
  date: string;
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; };
    away: { id: number; name: string; logo: string; };
  };
  status: string;
}

interface LeagueGroup {
  league: {
    id: number;
    name: string;
    logo: string;
  };
  matches: UpcomingMatch[];
}

interface PredictionResult {
  league_id: number;
  league_name: string;
  status: 'success' | 'error' | 'skipped';
  post_id?: string;
  message: string;
  matches_count: number;
  boardCount?: number;
}

interface PredictionData {
  textAnalysis: string;
  chartData: {
    homeTeam: {
      name: string;
      stats: Record<string, unknown>;
    };
    awayTeam: {
      name: string;
      stats: Record<string, unknown>;
    };
  };
}

// 리그별 게시판 매핑
const LEAGUE_BOARD_MAPPING: Record<number, string> = {
  39: 'premier',      // Premier League
  140: 'laliga',      // La Liga
  61: 'LIGUE1',       // Ligue 1
  78: 'bundesliga',   // Bundesliga
  135: 'serie-a',     // Serie A
  292: 'k-league-1',  // K League 1
  98: 'j1-league',    // J1 League
  // 기타 리그들...
}

// 봇 계정 ID (예측 분석 전용) - 관리자 계정 사용
const PREDICTION_BOT_USER_ID = 'dfd784d6-14c1-440f-b879-bb95f15853ab'

// 해외축구 게시판 ID (fallback용)
const OVERSEAS_FOOTBALL_BOARD_ID = 'b08d3648-a5cc-4ab6-b1f0-c4609c89ac26'

// 리그 ID로 게시판 슬러그 찾기
async function getBoardSlugByLeagueId(leagueId: number): Promise<string | null> {
  // 1. 하드코딩된 매핑 먼저 확인
  if (LEAGUE_BOARD_MAPPING[leagueId]) {
    return LEAGUE_BOARD_MAPPING[leagueId]
  }
  
  // 2. DB에서 league_id로 게시판 찾기
  const supabase = createSupabaseClient()
  const { data } = await supabase
    .from('boards')
    .select('slug')
    .eq('league_id', leagueId)
    .single()
    
  return data?.slug || null
}

// 게시판 슬러그로 ID 찾기
async function getBoardIdBySlug(slug: string): Promise<string | null> {
  const supabase = createSupabaseClient()
  const { data } = await supabase
    .from('boards')
    .select('id')
    .eq('slug', slug)
    .single()
    
  return data?.id || null
}

// 특정 날짜의 다음날 경기 가져오기 (메이저 리그만)
export async function getUpcomingMatches(date: string): Promise<UpcomingMatch[]> {
  try {
    console.log(`🔍 다음날 경기 조회 시작: ${date}`)
    
    const response = await fetchFromFootballApi('fixtures', {
      date: date,
      status: 'NS' // Not Started
    })
    
    if (!response?.response) {
      console.log('❌ API 응답 없음')
      return []
    }
    
    // 메이저 리그 ID 목록 가져오기
    const majorLeagueIds = getMajorLeagueIds()
    console.log(`🎯 필터링 대상 리그: ${majorLeagueIds.length}개`)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allMatches: UpcomingMatch[] = response.response.map((fixture: any) => ({
      id: fixture.fixture.id,
      date: fixture.fixture.date,
      league: {
        id: fixture.league.id,
        name: fixture.league.name,
        logo: fixture.league.logo
      },
      teams: {
        home: {
          id: fixture.teams.home.id,
          name: fixture.teams.home.name,
          logo: fixture.teams.home.logo
        },
        away: {
          id: fixture.teams.away.id,
          name: fixture.teams.away.name,
          logo: fixture.teams.away.logo
        }
      },
      status: fixture.fixture.status.short
    }))
    
    // 메이저 리그만 필터링
    const filteredMatches = allMatches.filter(match => 
      majorLeagueIds.includes(match.league.id)
    )
    
    console.log(`✅ 전체 ${allMatches.length}개 경기 중 메이저 리그 ${filteredMatches.length}개 경기 필터링 완료`)
    return filteredMatches
    
  } catch (error) {
    console.error('다음날 경기 조회 실패:', error)
    return []
  }
}

// 리그별 경기 그룹화
function groupMatchesByLeague(matches: UpcomingMatch[]): LeagueGroup[] {
  const grouped = matches.reduce((acc, match) => {
    const leagueId = match.league.id
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: match.league,
        matches: []
      }
    }
    acc[leagueId].matches.push(match)
    return acc
  }, {} as Record<number, LeagueGroup>)
  
  return Object.values(grouped)
}

// 리그별 예측 분석 게시글 생성
async function generateLeaguePredictionPost(
  leagueGroup: LeagueGroup,
  targetDate: string
): Promise<PredictionResult> {
  try {
    const { league, matches } = leagueGroup
    
    console.log(`🔮 ${league.name} 예측 분석 시작 (${matches.length}경기)`)
    
    // 게시판 찾기 및 여러 게시판 설정
    const targetBoardIds: string[] = []
    
    // 1. 리그 전용 게시판 확인
    const boardSlug = await getBoardSlugByLeagueId(league.id)
    if (boardSlug) {
      const boardId = await getBoardIdBySlug(boardSlug)
      if (boardId) {
        targetBoardIds.push(boardId)
        console.log(`🎯 ${league.name} (ID: ${league.id}) → 리그 게시판: ${boardSlug}`)
      }
    }
    
    // 2. 해외축구 게시판은 항상 추가 (fallback 및 추가 노출용)
    targetBoardIds.push(OVERSEAS_FOOTBALL_BOARD_ID)
    console.log(`🌍 해외축구 게시판도 추가`)
    
    // 3. 중복 제거
    const uniqueBoardIds = [...new Set(targetBoardIds)]
    
    if (uniqueBoardIds.length === 0) {
      console.log(`❌ ${league.name} (ID: ${league.id}) - 등록할 게시판이 없음`)
      return {
        league_id: league.id,
        league_name: league.name,
        status: 'skipped',
        message: `등록할 게시판이 없습니다 (리그 ID: ${league.id})`,
        matches_count: matches.length
      }
    }
    
    // 각 경기에 대한 예측 분석 생성
    const predictions: string[] = []
    const chartDataList: unknown[] = []
    
    for (const match of matches) {
      try {
        console.log(`🎯 경기 예측: ${match.teams.home.name} vs ${match.teams.away.name}`)
        const predictionResult = await predictMatch(match.id, false)
        
        // 반환값이 객체인지 문자열인지 확인
        let prediction: string
        let chartData: unknown = null
        
        if (typeof predictionResult === 'object' && predictionResult !== null) {
          const result = predictionResult as PredictionData;
          prediction = result.textAnalysis || '';
          chartData = result.chartData || null;
        } else {
          prediction = predictionResult as string;
        }
        
        // 예측 텍스트 최종 정리 (predictMatch에서 이미 처리되었으므로 최소한만)
        const formattedPrediction = prediction
          .replace(/\n{3,}/g, '\n\n') // 과도한 줄바꿈 제거
          .replace(/^\s+|\s+$/g, '') // 앞뒤 공백 제거
          .trim()
        
        predictions.push(`${match.teams.home.name} vs ${match.teams.away.name}\n\n${formattedPrediction}`)
        chartDataList.push(chartData)
      } catch (error) {
        console.error(`경기 예측 실패 (${match.id}):`, error)
        predictions.push(`${match.teams.home.name} vs ${match.teams.away.name}\n\n예측 분석을 생성할 수 없습니다. 데이터 부족 또는 시스템 오류로 인해 이 경기의 분석을 생성하지 못했습니다.`)
        chartDataList.push(null)
      }
    }
    
    // 게시글 제목 및 내용 생성
    const formattedDate = new Date(targetDate).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    })
    
    const title = `${formattedDate} ${league.name} 경기 예측 분석`
    
    // 자연스러운 게시글 내용 구성 (Tiptap 형식)
    const introText = `${league.name}에서 ${matches.length}경기가 예정되어 있습니다. 각 경기의 전망을 살펴보겠습니다.`
    
    const tiptapContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: introText }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '' }
          ]
        },
        ...predictions.flatMap((prediction, index) => {
          // 각 예측을 자연스럽게 파싱
          const lines = prediction.trim().split('\n').filter(line => line.trim())
          const matchTitle = lines[0] || '경기 정보' // 첫 번째 라인이 경기 제목
          const content = lines.slice(1).join('\n\n') // 나머지가 내용
          
          // 차트 마커 방식 제거 - 단순 텍스트로 처리
          // 문단별로 나누어서 자연스럽게 표시
          const paragraphs = content.split('\n\n').filter(p => p.trim())
          
          // 해당 경기 정보 가져오기
          const match = matches[index]
          
          return [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [
                { type: 'text', text: matchTitle, marks: [{ type: 'bold' }] }
              ]
            },
            ...paragraphs.map(paragraph => ({
              type: 'paragraph',
              content: [
                { type: 'text', text: paragraph.trim() }
              ]
            })),
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '' }
              ]
            },
            // 각 경기 예측 바로 아래에 해당 매치 카드 추가
            {
              type: 'matchCard',
              attrs: {
                matchId: match.id.toString(),
                matchData: {
                  id: match.id.toString(),
                  teams: {
                    home: {
                      name: match.teams.home.name,
                      logo: match.teams.home.logo,
                      winner: null
                    },
                    away: {
                      name: match.teams.away.name, 
                      logo: match.teams.away.logo,
                      winner: null
                    }
                  },
                  goals: {
                    home: null,
                    away: null
                  },
                  league: {
                    id: league.id.toString(),
                    name: league.name,
                    logo: league.logo
                  },
                  status: {
                    code: 'NS', // 경기 예정
                    name: '경기 예정'
                  }
                }
              }
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '' }
              ]
            },
            // 마지막 경기가 아니면 구분선 추가
            ...(index < predictions.length - 1 ? [{
              type: 'horizontalRule'
            }] : [])
          ]
        }),
        {
          type: 'horizontalRule'
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '※ 이 분석은 AI가 통계 데이터를 바탕으로 생성한 예측입니다. 실제 경기 결과와 다를 수 있으며, 참고용으로만 활용해주세요.', marks: [{ type: 'italic' }] }
          ]
        }
      ]
    }
    
    // 차트 데이터를 meta 필드에 저장할 메타데이터 생성
    const metaData = {
      prediction_type: 'league_analysis',
      league_id: league.id,
      league_name: league.name,
      target_date: targetDate,
      matches_count: matches.length,
      chart_data: chartDataList.filter(data => data !== null) // null 값 제거
    }

    // 게시글 작성 (여러 게시판에 동시 등록)
    const result = await createPostWithMultipleBoards(
      title,
      JSON.stringify(tiptapContent),
      uniqueBoardIds,
      PREDICTION_BOT_USER_ID,
      'prediction',
      ['AI분석', league.name, '경기예측'],
      metaData
    )
    
    if (result.success) {
      console.log(`✅ ${league.name} 예측 분석 게시글 작성 완료 (${result.boardCount || 1}개 게시판)`)
      return {
        league_id: league.id,
        league_name: league.name,
        status: 'success',
        post_id: result.postId,
        message: `${matches.length}경기 예측 분석 완료 (${result.boardCount || 1}개 게시판에 등록)`,
        matches_count: matches.length
      }
    } else {
      throw new Error(result.error || '게시글 작성 실패')
    }
    
  } catch (error) {
    console.error(`${leagueGroup.league.name} 예측 분석 실패:`, error)
    return {
      league_id: leagueGroup.league.id,
      league_name: leagueGroup.league.name,
      status: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      matches_count: leagueGroup.matches.length
    }
  }
}

// 로그 저장 함수
async function savePredictionLog(
  triggerType: 'manual' | 'github_actions' | 'cron',
  status: 'success' | 'error' | 'partial',
  matchesProcessed: number,
  postsCreated: number,
  errorMessage?: string,
  executionTimeMs?: number,
  details?: Record<string, unknown>
) {
  try {
    const supabase = createSupabaseClient()
    
    const { error } = await supabase
      .from('prediction_automation_logs')
      .insert({
        trigger_type: triggerType,
        status,
        matches_processed: matchesProcessed,
        posts_created: postsCreated,
        error_message: errorMessage,
        execution_time_ms: executionTimeMs,
        details: details ? JSON.stringify(details) : null
      })
    
    if (error) {
      console.error('❌ 예측 로그 저장 실패:', error)
    } else {
      console.log('📝 예측 자동화 로그 저장 완료')
    }
  } catch (error) {
    console.error('❌ 예측 로그 저장 중 오류:', error)
  }
}

// 모든 리그 예측 분석 생성
export async function generateAllPredictions(
  targetDate: string,
  triggerType: 'manual' | 'github_actions' | 'cron' = 'manual'
): Promise<PredictionResult[]> {
  const startTime = Date.now()
  console.log(`🔮 모든 리그 예측 분석 시작 (날짜: ${targetDate}, 트리거: ${triggerType})`)
  
  try {
    // 다음날 경기 가져오기
    const matches = await getUpcomingMatches(targetDate)
    
    if (matches.length === 0) {
      console.log('📅 해당 날짜에 예정된 경기가 없습니다')
      
      await savePredictionLog(
        triggerType,
        'success',
        0,
        0,
        '예정된 경기 없음',
        Date.now() - startTime
      )
      
      return []
    }
    
    // 리그별로 그룹화
    const leagueGroups = groupMatchesByLeague(matches)
    console.log(`📊 ${leagueGroups.length}개 리그, 총 ${matches.length}경기 발견`)
    
    // 각 리그별로 예측 분석 생성
    const results: PredictionResult[] = []
    let totalPostsCreated = 0
    
    for (const leagueGroup of leagueGroups) {
      const result = await generateLeaguePredictionPost(leagueGroup, targetDate)
      results.push(result)
      
      if (result.status === 'success') {
        totalPostsCreated++
      }
      
      // 각 리그 처리 후 잠시 대기 (API 레이트 리밋 방지)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // 관련 페이지 캐시 갱신
    revalidatePath('/admin/prediction')
    
    // 실행 시간 계산 및 로그 저장
    const executionTime = Date.now() - startTime
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const status = errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'error')
    
    await savePredictionLog(
      triggerType,
      status,
      matches.length,
      totalPostsCreated,
      errorCount > 0 ? `${errorCount}개 리그 처리 실패` : undefined,
      executionTime,
      { results, leagueCount: leagueGroups.length }
    )
    
    return results
    
  } catch (error) {
    console.error('예측 분석 일괄 생성 오류:', error)
    
    // 오류 로그 저장
    const executionTime = Date.now() - startTime
    await savePredictionLog(
      triggerType,
      'error',
      0,
      0,
      error instanceof Error ? error.message : '알 수 없는 오류',
      executionTime,
      { error: error instanceof Error ? error.message : String(error) }
    )
    
    throw error
  }
}

// 예측 자동화 로그 조회
export async function getPredictionAutomationLogs(limit: number = 20) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('prediction_automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  
  return data || []
}

// 예측 자동화 토글 (GitHub Actions 설정)
export async function togglePredictionAutomation(enabled: boolean, time: string) {
  try {
    // 실제로는 GitHub Actions workflow 파일을 수정하거나
    // 데이터베이스에 설정을 저장해야 합니다
    console.log(`🔧 예측 자동화 ${enabled ? '활성화' : '비활성화'}: ${time}`)
    
    // 임시 구현 - 실제로는 더 복잡한 로직 필요
    return {
      success: true,
      message: `예측 자동화가 ${enabled ? '활성화' : '비활성화'}되었습니다.`
    }
  } catch (error) {
    console.error('예측 자동화 토글 오류:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '설정 변경 실패'
    }
  }
}

// 예측 생성 테스트
export async function testPredictionGeneration(targetDate: string) {
  try {
    console.log(`🧪 예측 생성 테스트 시작: ${targetDate}`)
    
    const results = await generateAllPredictions(targetDate, 'manual')
    
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const skippedCount = results.filter(r => r.status === 'skipped').length
    
    return {
      success: true,
      message: `${successCount}개 성공, ${errorCount}개 실패, ${skippedCount}개 스킵`,
      results
    }
  } catch (error) {
    console.error('예측 생성 테스트 실패:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '테스트 실패'
    }
  }
}

// 단일 리그 예측 분석 생성
export async function generateSingleLeaguePrediction(
  targetDate: string,
  leagueId: number,
  triggerType: 'manual' | 'github_actions' | 'cron' = 'manual'
): Promise<PredictionResult> {
  const startTime = Date.now()
  
  try {
    console.log(`🎯 단일 리그 예측 분석 시작 (리그 ID: ${leagueId}, 날짜: ${targetDate})`)
    
    // 해당 날짜의 경기 조회
    const allMatches = await getUpcomingMatches(targetDate)
    
    // 특정 리그의 경기만 필터링
    const leagueMatches = allMatches.filter(match => match.league.id === leagueId)
    
    if (leagueMatches.length === 0) {
      return {
        league_id: leagueId,
        league_name: `리그 ID ${leagueId}`,
        status: 'skipped',
        message: '해당 리그에 예정된 경기가 없습니다',
        matches_count: 0
      }
    }
    
    // 리그별 그룹화
    const leagueGroup = {
      league: leagueMatches[0].league,
      matches: leagueMatches
    }
    
    // 예측 분석 생성
    const result = await generateLeaguePredictionPost(leagueGroup, targetDate)
    
    // 로그 저장
    const executionTime = Date.now() - startTime
    await savePredictionLog(
      triggerType,
      result.status === 'success' ? 'success' : 'error',
      result.matches_count,
      result.status === 'success' ? 1 : 0,
      result.status === 'error' ? result.message : undefined,
      executionTime,
      { single_league: true, league_id: leagueId }
    )
    
    return result
    
  } catch (error) {
    console.error(`단일 리그 예측 분석 실패 (리그 ID: ${leagueId}):`, error)
    
    const executionTime = Date.now() - startTime
    await savePredictionLog(
      triggerType,
      'error',
      0,
      0,
      error instanceof Error ? error.message : '알 수 없는 오류',
      executionTime,
      { single_league: true, league_id: leagueId }
    )
    
    return {
      league_id: leagueId,
      league_name: `리그 ID ${leagueId}`,
      status: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      matches_count: 0
    }
  }
}

// 게시글을 여러 게시판에 등록하는 함수
async function createPostWithMultipleBoards(
  title: string,
  content: string,
  boardIds: string[],
  userId: string,
  category: string = 'prediction',
  tags: string[] = [],
  meta: Record<string, unknown> | null = null
): Promise<{ success: boolean; postId?: string; error?: string; boardCount?: number }> {
  const supabase = createSupabaseClient()
  
  try {
    console.log(`📝 게시글 생성: ${title}`)
    console.log(`📋 대상 게시판: ${boardIds.length}개 - ${boardIds.join(', ')}`)
    
    // 1. 먼저 메인 게시판(첫 번째)에 게시글 생성
    const mainBoardId = boardIds[0]
    
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        board_id: mainBoardId, // 메인 게시판 ID
        user_id: userId,
        category,
        tags,
        meta,
        status: 'published'
      })
      .select()
      .single()
    
    if (postError || !post) {
      console.error('❌ 게시글 생성 실패:', postError)
      return { success: false, error: postError?.message || '게시글 생성 실패' }
    }
    
    console.log(`✅ 게시글 생성 완료: ${post.id}`)
    
    // 2. 모든 게시판에 관계 생성 (post_boards 테이블)
    const postBoardRelations = boardIds.map(boardId => ({
      post_id: post.id,
      board_id: boardId
    }))
    
    const { error: relationError } = await supabase
      .from('post_boards')
      .insert(postBoardRelations)
    
    if (relationError) {
      console.error('❌ 게시판 관계 생성 실패:', relationError)
      // 게시글은 이미 생성되었으므로 성공으로 처리하되 경고 로그
      console.warn('⚠️ 일부 게시판에만 등록됨')
    } else {
      console.log(`✅ ${boardIds.length}개 게시판에 관계 생성 완료`)
    }
    
    return { 
      success: true, 
      postId: post.id,
      boardCount: boardIds.length
    }
    
  } catch (error) {
    console.error('❌ 게시글 생성 중 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }
  }
} 