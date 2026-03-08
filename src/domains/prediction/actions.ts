'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi'
import { getMajorLeagueIds, LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings'
import { getTeamById } from '@teams'
import { getTeamLogoUrls } from '@/domains/livescore/actions/images'
import { getLeagueLogoUrl } from '@/domains/livescore/actions/images'
import { predictMatch } from './utils/predictMatch'

// Predictions API 타입
interface MinuteStats {
  [key: string]: { total: number | null; percentage: string | null };
}

interface UnderOverStats {
  [key: string]: { over: number; under: number };
}

interface TeamLeagueStats {
  form?: string;
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals?: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
  };
  biggest?: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string | null; away: string | null };
    loses: { home: string | null; away: string | null };
    goals: {
      for: { home: number; away: number };
      against: { home: number; away: number };
    };
  };
  clean_sheet?: { home: number; away: number; total: number };
  failed_to_score?: { home: number; away: number; total: number };
  penalty?: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
    total: number;
  };
  lineups?: Array<{ formation: string; played: number }>;
  cards?: {
    yellow: MinuteStats;
    red: MinuteStats;
  };
}

interface PredictionApiData {
  predictions: {
    winner: {
      id: number | null;
      name: string | null;
      comment: string | null;
    };
    win_or_draw: boolean;
    under_over: string | null;
    goals: {
      home: string;
      away: string;
    };
    advice: string | null;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      last_5: {
        form: string;
        att: string;
        def: string;
        goals: {
          for: { total: number; average: number };
          against: { total: number; average: number };
        };
      };
      league?: TeamLeagueStats;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      last_5: {
        form: string;
        att: string;
        def: string;
        goals: {
          for: { total: number; average: number };
          against: { total: number; average: number };
        };
      };
      league?: TeamLeagueStats;
    };
  };
  h2h: Array<{
    fixture: { id: number; date: string };
    teams: {
      home: { id: number; name: string; winner: boolean | null };
      away: { id: number; name: string; winner: boolean | null };
    };
    goals: { home: number; away: number };
  }>;
}

// 팀 이름 한국어 가져오기 (매핑 없으면 원본 이름 사용)
function getTeamNameKo(teamId: number, fallbackName: string): string {
  const team = getTeamById(teamId)
  return team?.name_ko || fallbackName
}

// 리그 이름 한국어 가져오기 (매핑 없으면 원본 이름 사용)
function getLeagueNameKo(leagueId: number, fallbackName: string): string {
  return LEAGUE_NAMES_MAP[leagueId] || fallbackName
}

// API 라우트용 Supabase 클라이언트 생성
function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Predictions API 호출 함수
async function fetchPredictions(fixtureId: number): Promise<PredictionApiData | null> {
  try {
    const response = await fetchFromFootballApi('predictions', {
      fixture: fixtureId
    })

    if (!response?.response || response.response.length === 0) {
      return null
    }

    return response.response[0] as PredictionApiData
  } catch (error) {
    console.error(`Predictions API 호출 실패 (fixture: ${fixtureId}):`, error)
    return null
  }
}

// 미리보기용 Predictions API 호출 (export)
export async function fetchPredictionPreview(fixtureId: number): Promise<{
  success: boolean
  data: PredictionApiData | null
  error: string | null
}> {
  try {
    const data = await fetchPredictions(fixtureId)
    if (!data) {
      return { success: false, data: null, error: '예측 데이터를 불러올 수 없습니다.' }
    }
    return { success: true, data, error: null }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

// Predictions 데이터를 게시글 형식으로 변환 (상세 버전)
function formatPredictionContent(
  prediction: PredictionApiData
): string {
  const { predictions, comparison, teams, h2h } = prediction
  const homeTeam = teams.home
  const awayTeam = teams.away
  const homeNameKo = getTeamNameKo(homeTeam.id, homeTeam.name)
  const awayNameKo = getTeamNameKo(awayTeam.id, awayTeam.name)

  // 승률 예측
  const percentSection = `📊 승률 예측
• ${homeNameKo} 승리: ${predictions.percent.home}
• 무승부: ${predictions.percent.draw}
• ${awayNameKo} 승리: ${predictions.percent.away}`

  // 예상 골 & 언더/오버
  let goalsSection = ''
  if (predictions.goals.home && predictions.goals.away) {
    goalsSection = `\n\n⚽ 예상 골
• ${homeNameKo}: ${predictions.goals.home}골
• ${awayNameKo}: ${predictions.goals.away}골`
    if (predictions.under_over) {
      goalsSection += `\n• 언더/오버: ${predictions.under_over}`
    }
  }

  // 분석 조언
  const adviceSection = predictions.advice
    ? `\n\n💡 분석 조언\n${predictions.advice}`
    : ''

  // 예상 승자
  let winnerSection = ''
  if (predictions.winner?.name) {
    const winnerNameKo = predictions.winner.id ? getTeamNameKo(predictions.winner.id, predictions.winner.name) : predictions.winner.name
    winnerSection = `\n\n🏆 예상 승자: ${winnerNameKo}`
    if (predictions.winner.comment) {
      winnerSection += ` (${predictions.winner.comment})`
    }
  }

  // 팀 비교 분석 (7개 지표)
  const comparisonSection = `\n\n📈 팀 비교 분석 (7개 지표)
┌─────────────────────────────────────┐
│ 지표           │ ${homeNameKo.substring(0, 8).padEnd(8)} │ ${awayNameKo.substring(0, 8).padEnd(8)} │
├─────────────────────────────────────┤
│ 최근 폼        │ ${comparison.form.home.padStart(8)} │ ${comparison.form.away.padStart(8)} │
│ 공격력         │ ${comparison.att.home.padStart(8)} │ ${comparison.att.away.padStart(8)} │
│ 수비력         │ ${comparison.def.home.padStart(8)} │ ${comparison.def.away.padStart(8)} │
│ 포아송 분포    │ ${comparison.poisson_distribution.home.padStart(8)} │ ${comparison.poisson_distribution.away.padStart(8)} │
│ 상대전적       │ ${comparison.h2h.home.padStart(8)} │ ${comparison.h2h.away.padStart(8)} │
│ 득점력         │ ${comparison.goals.home.padStart(8)} │ ${comparison.goals.away.padStart(8)} │
│ 종합           │ ${comparison.total.home.padStart(8)} │ ${comparison.total.away.padStart(8)} │
└─────────────────────────────────────┘`

  // 최근 5경기 폼 (상세)
  const formSection = `\n\n🔥 최근 5경기 분석

[${homeNameKo}]
• 폼: ${homeTeam.last_5?.form || 'N/A'}
• 공격력: ${homeTeam.last_5?.att || 'N/A'} | 수비력: ${homeTeam.last_5?.def || 'N/A'}
• 득점: ${homeTeam.last_5?.goals?.for?.total || 0}골 (평균 ${homeTeam.last_5?.goals?.for?.average || 0})
• 실점: ${homeTeam.last_5?.goals?.against?.total || 0}골 (평균 ${homeTeam.last_5?.goals?.against?.average || 0})

[${awayNameKo}]
• 폼: ${awayTeam.last_5?.form || 'N/A'}
• 공격력: ${awayTeam.last_5?.att || 'N/A'} | 수비력: ${awayTeam.last_5?.def || 'N/A'}
• 득점: ${awayTeam.last_5?.goals?.for?.total || 0}골 (평균 ${awayTeam.last_5?.goals?.for?.average || 0})
• 실점: ${awayTeam.last_5?.goals?.against?.total || 0}골 (평균 ${awayTeam.last_5?.goals?.against?.average || 0})`

  // 시즌 통계 (있으면)
  let seasonSection = ''
  if (homeTeam.league?.fixtures || awayTeam.league?.fixtures) {
    seasonSection = '\n\n📊 시즌 전체 통계'

    if (homeTeam.league?.fixtures) {
      const hf = homeTeam.league.fixtures
      const hg = homeTeam.league.goals
      seasonSection += `\n\n[${homeNameKo}]
• 경기: ${hf.played?.total || 0} (홈 ${hf.played?.home || 0}, 원정 ${hf.played?.away || 0})
• 승/무/패: ${hf.wins?.total || 0}/${hf.draws?.total || 0}/${hf.loses?.total || 0}
• 득점: ${hg?.for?.total?.total || 0} (평균 ${hg?.for?.average?.total || '-'})
• 실점: ${hg?.against?.total?.total || 0} (평균 ${hg?.against?.average?.total || '-'})`
      if (homeTeam.league.clean_sheet) {
        seasonSection += `\n• 무실점: ${homeTeam.league.clean_sheet.total || 0}경기`
      }
      if (homeTeam.league.biggest?.streak) {
        seasonSection += `\n• 최다 연승: ${homeTeam.league.biggest.streak.wins || 0}`
      }
    }

    if (awayTeam.league?.fixtures) {
      const af = awayTeam.league.fixtures
      const ag = awayTeam.league.goals
      seasonSection += `\n\n[${awayNameKo}]
• 경기: ${af.played?.total || 0} (홈 ${af.played?.home || 0}, 원정 ${af.played?.away || 0})
• 승/무/패: ${af.wins?.total || 0}/${af.draws?.total || 0}/${af.loses?.total || 0}
• 득점: ${ag?.for?.total?.total || 0} (평균 ${ag?.for?.average?.total || '-'})
• 실점: ${ag?.against?.total?.total || 0} (평균 ${ag?.against?.average?.total || '-'})`
      if (awayTeam.league.clean_sheet) {
        seasonSection += `\n• 무실점: ${awayTeam.league.clean_sheet.total || 0}경기`
      }
      if (awayTeam.league.biggest?.streak) {
        seasonSection += `\n• 최다 연승: ${awayTeam.league.biggest.streak.wins || 0}`
      }
    }
  }

  // 상대전적 (최근 5경기)
  let h2hSection = ''
  if (h2h && h2h.length > 0) {
    // 전적 집계
    let homeWins = 0, awayWins = 0, draws = 0
    h2h.forEach(m => {
      if (m.teams.home.winner) homeWins++
      else if (m.teams.away.winner) awayWins++
      else draws++
    })

    const recentH2h = h2h.slice(0, 5).map(m => {
      const date = new Date(m.fixture.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      const winner = m.teams.home.winner ? '🔵' : m.teams.away.winner ? '🟢' : '⚪'
      return `${winner} ${date}: ${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name}`
    }).join('\n')

    h2hSection = `\n\n🏆 상대전적 (최근 ${h2h.length}경기)
• 전적: ${homeNameKo} ${homeWins}승 / 무승부 ${draws} / ${awayNameKo} ${awayWins}승

${recentH2h}`
  }

  return `${percentSection}${goalsSection}${adviceSection}${winnerSection}${comparisonSection}${formSection}${seasonSection}${h2hSection}`
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

// 리그별 게시판 매핑 (일반 게시판)
const LEAGUE_BOARD_MAPPING: Record<number, string> = {
  39: 'premier',      // Premier League
  140: 'laliga',      // La Liga
  61: 'LIGUE1',       // Ligue 1
  78: 'bundesliga',   // Bundesliga
  135: 'serie-a',     // Serie A
  292: 'k-league-1',  // K League 1
  293: 'k-league-2',  // K League 2
  98: 'j1-league',    // J1 League
}

// 리그별 분석 게시판 매핑 (예측 분석 전용)
const LEAGUE_ANALYSIS_BOARD_MAPPING: Record<number, string> = {
  39: 'foreign-analysis-premier',
  140: 'foreign-analysis-laliga',
  61: 'foreign-analysis-ligue1',
  78: 'foreign-analysis-bundesliga',
  135: 'foreign-analysis-serie-a',
}

// 국내 축구 리그 ID (한국)
const DOMESTIC_LEAGUE_IDS = [292, 293] // K리그 1, K리그 2

// 리그가 국내 축구인지 확인
function isDomesticLeague(leagueId: number): boolean {
  return DOMESTIC_LEAGUE_IDS.includes(leagueId)
}

// 봇 계정 ID fallback (GitHub Actions/cron 등 비로그인 환경용)
const PREDICTION_BOT_USER_ID_FALLBACK = 'd4b925d8-cb05-4a89-8d05-f1ad168acd72'

// 현재 로그인한 관리자 ID 가져오기 (없으면 fallback)
async function getCurrentUserId(): Promise<string> {
  try {
    const supabase = await getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || PREDICTION_BOT_USER_ID_FALLBACK
  } catch {
    return PREDICTION_BOT_USER_ID_FALLBACK
  }
}

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
    const response = await fetchFromFootballApi('fixtures', {
      date: date,
      status: 'NS' // Not Started
    })
    
    if (!response?.response) {
      return []
    }
    
    // 메이저 리그 ID 목록 가져오기
    const majorLeagueIds = getMajorLeagueIds()
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

// 단일 경기 예측 분석 게시글 생성
async function generateMatchPredictionPost(
  match: UpcomingMatch,
  league: LeagueGroup['league'],
  targetDate: string,
  userId: string,
  teamLogoMap: Record<number, string>,
  leagueLogoUrl: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const homeNameKo = getTeamNameKo(match.teams.home.id, match.teams.home.name)
  const awayNameKo = getTeamNameKo(match.teams.away.id, match.teams.away.name)
  const leagueNameKo = getLeagueNameKo(league.id, league.name)

  // 1. Predictions API 데이터 먼저 가져오기 (차트 + AI 텍스트 동일 데이터 소스)
  let predictionData: PredictionApiData | null = null
  try {
    predictionData = await fetchPredictions(match.id)
    if (predictionData) {
      predictionData.teams.home.logo = teamLogoMap[predictionData.teams.home.id] || '/images/placeholder-team.svg'
      predictionData.teams.away.logo = teamLogoMap[predictionData.teams.away.id] || '/images/placeholder-team.svg'
    }
  } catch {
    // predictionChart용 데이터 실패 시 무시
  }

  // 2. AI 분석글 생성 (predictionData를 전달하여 차트와 동일한 데이터로 분석)
  let aiAnalysis = ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chartData: any = null

  try {
    const result = await predictMatch(match.id, true, predictionData) // predictionData 전달
    if (typeof result === 'object' && 'textAnalysis' in result) {
      aiAnalysis = result.textAnalysis
      chartData = result.chartData
    } else if (typeof result === 'string') {
      aiAnalysis = result
    }
  } catch (error) {
    console.error(`AI 분석 생성 실패 (${match.id}):`, error)
    aiAnalysis = `${homeNameKo} vs ${awayNameKo} 경기의 예측 분석을 생성할 수 없습니다.`
  }

  // 매치 데이터의 로고 URL을 Storage URL로 교체
  match.teams.home.logo = teamLogoMap[match.teams.home.id] || '/images/placeholder-team.svg'
  match.teams.away.logo = teamLogoMap[match.teams.away.id] || '/images/placeholder-team.svg'
  match.league.logo = leagueLogoUrl

  // 게시판 찾기: 분석 전용 게시판 우선, 없으면 리그 게시판, 최후에 해외축구 게시판
  let targetBoardId: string | null = null

  // 1. 분석 전용 게시판 확인
  const analysisSlug = LEAGUE_ANALYSIS_BOARD_MAPPING[league.id]
  if (analysisSlug) {
    const boardId = await getBoardIdBySlug(analysisSlug)
    if (boardId) targetBoardId = boardId
  }

  // 2. 리그 게시판 확인
  if (!targetBoardId) {
    const boardSlug = await getBoardSlugByLeagueId(league.id)
    if (boardSlug) {
      const boardId = await getBoardIdBySlug(boardSlug)
      if (boardId) targetBoardId = boardId
    }
  }

  // 3. fallback
  if (!targetBoardId) {
    targetBoardId = OVERSEAS_FOOTBALL_BOARD_ID
  }

  // 게시글 제목: "3월 9일 팀A vs 팀B 경기 예측 분석"
  const formattedDate = new Date(targetDate).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric'
  })
  const title = `${formattedDate} ${homeNameKo} vs ${awayNameKo} 경기 예측 분석`

  // 예측 차트 노드 (데이터가 있을 때만)
  const chartNode = predictionData ? [{
    type: 'predictionChart',
    attrs: {
      fixtureId: match.id.toString(),
      chartData: {
        predictions: predictionData.predictions,
        comparison: predictionData.comparison,
        teams: predictionData.teams,
        h2h: predictionData.h2h
      }
    }
  }] : []

  // AI 분석글을 Tiptap 문단으로 변환
  const aiParagraphs: any[] = []

  // 줄 단위로 처리 (빈 줄과 단일 줄바꿈 모두 처리)
  const lines = aiAnalysis.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  for (const line of lines) {
    // **제목** 형식 (줄 전체가 **로 감싸진 경우)
    if (/^\*\*[^*]+\*\*$/.test(line)) {
      aiParagraphs.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: line.replace(/\*\*/g, '') }]
      })
      continue
    }

    // **제목** 내용 형식 (소제목 뒤에 내용이 바로 붙은 경우)
    const headingWithContent = line.match(/^\*\*([^*]+)\*\*\s*(.+)/)
    if (headingWithContent) {
      aiParagraphs.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: headingWithContent[1] }]
      })
      aiParagraphs.push({
        type: 'paragraph',
        content: [{ type: 'text', text: headingWithContent[2] }]
      })
      continue
    }

    // 일반 문단
    aiParagraphs.push({
      type: 'paragraph',
      content: [{ type: 'text', text: line }]
    })
  }

  // Tiptap 게시글 내용 구성
  // 순서: 예측 차트 → AI 분석글 → 매치 카드 → 면책 문구
  const matchCardNode = {
    type: 'matchCard',
    attrs: {
      matchId: match.id.toString(),
      matchData: {
        id: match.id.toString(),
        teams: {
          home: {
            id: match.teams.home.id,
            name: match.teams.home.name,
            logo: match.teams.home.logo,
            winner: null
          },
          away: {
            id: match.teams.away.id,
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
          logo: leagueLogoUrl
        },
        status: {
          code: 'NS',
          name: '경기 예정'
        }
      }
    }
  }

  const tiptapContent = {
    type: 'doc',
    content: [
      // 예측 차트 (데이터가 있을 때만)
      ...chartNode,
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      // AI 분석글 본문
      ...aiParagraphs,
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      // 매치 카드 (분석글 아래)
      matchCardNode,
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      { type: 'horizontalRule' },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '※ 이 분석은 AI가 API-Football 통계 데이터를 바탕으로 생성한 예측입니다. 실제 경기 결과와 다를 수 있으며, 참고용으로만 활용해주세요.', marks: [{ type: 'italic' }] }
        ]
      }
    ]
  }

  // 메타데이터
  const analysisRegion = isDomesticLeague(league.id) ? 'domestic' : 'foreign'
  const metaData = {
    prediction_type: 'league_analysis',
    analysis_region: analysisRegion,
    league_id: league.id,
    league_name: league.name,
    target_date: targetDate,
    fixture_id: match.id,
    matches_count: 1,
    prediction_data: predictionData ? [predictionData] : []
  }

  return createPredictionPost(
    title,
    JSON.stringify(tiptapContent),
    targetBoardId,
    userId,
    ['AI분석', leagueNameKo, '경기예측', `${homeNameKo} vs ${awayNameKo}`],
    metaData
  )
}

// 리그별 예측 분석 게시글 생성 (경기별 개별 게시글)
async function generateLeaguePredictionPost(
  leagueGroup: LeagueGroup,
  targetDate: string
): Promise<PredictionResult> {
  try {
    const { league, matches } = leagueGroup

    // 4590 표준: 팀/리그 로고를 Supabase Storage URL로 변환
    const allTeamIds = Array.from(new Set(matches.flatMap(m => [m.teams.home.id, m.teams.away.id])))
    const teamLogoMap = await getTeamLogoUrls(allTeamIds)
    const leagueLogoUrl = await getLeagueLogoUrl(league.id)

    // 현재 로그인한 관리자 ID 사용 (없으면 fallback)
    const userId = await getCurrentUserId()

    // 각 경기별로 개별 게시글 생성
    let successCount = 0
    let errorCount = 0

    for (const match of matches) {
      const result = await generateMatchPredictionPost(
        match, league, targetDate, userId, teamLogoMap, leagueLogoUrl
      )

      if (result.success) {
        successCount++
      } else {
        errorCount++
        console.error(`경기 게시글 생성 실패 (${match.id}):`, result.error)
      }

      // API 레이트 리밋 방지
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (successCount === 0 && errorCount > 0) {
      throw new Error(`${errorCount}경기 게시글 생성 모두 실패`)
    }

    return {
      league_id: league.id,
      league_name: league.name,
      status: errorCount > 0 ? 'error' : 'success',
      message: `${successCount}경기 게시글 생성 완료${errorCount > 0 ? `, ${errorCount}경기 실패` : ''}`,
      matches_count: matches.length,
      boardCount: successCount
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
  try {
    // 다음날 경기 가져오기
    const matches = await getUpcomingMatches(targetDate)
    
    if (matches.length === 0) {
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
    // 각 리그별로 예측 분석 생성
    const results: PredictionResult[] = []
    let totalPostsCreated = 0
    
    for (const leagueGroup of leagueGroups) {
      const result = await generateLeaguePredictionPost(leagueGroup, targetDate)
      results.push(result)
      
      if (result.status === 'success') {
        totalPostsCreated += result.boardCount || 1
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

// 단일 리그 예측 분석 생성 (선택적 경기 ID 목록 지원)
export async function generateSingleLeaguePrediction(
  targetDate: string,
  leagueId: number,
  triggerType: 'manual' | 'github_actions' | 'cron' = 'manual',
  matchIds?: number[]  // 선택적 경기 ID 목록
): Promise<PredictionResult> {
  const startTime = Date.now()

  try {
    // 해당 날짜의 경기 조회
    const allMatches = await getUpcomingMatches(targetDate)

    // 특정 리그의 경기만 필터링
    let leagueMatches = allMatches.filter(match => match.league.id === leagueId)

    // matchIds가 제공되면 해당 경기만 추가 필터링
    if (matchIds && matchIds.length > 0) {
      leagueMatches = leagueMatches.filter(match => matchIds.includes(match.id))
    }

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
      { single_league: true, league_id: leagueId, selected_match_ids: matchIds }
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
      { single_league: true, league_id: leagueId, selected_match_ids: matchIds }
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

// 예측 분석 게시글 생성 (단일 게시판)
async function createPredictionPost(
  title: string,
  content: string,
  boardId: string,
  userId: string,
  tags: string[] = [],
  meta: Record<string, unknown> | null = null
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const supabase = createSupabaseClient()

  try {
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        board_id: boardId,
        user_id: userId,
        category: 'prediction',
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

    return {
      success: true,
      postId: post.id
    }

  } catch (error) {
    console.error('❌ 게시글 생성 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
} 