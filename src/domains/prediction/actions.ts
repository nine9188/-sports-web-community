'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { getSupabaseAdmin } from '@/shared/lib/supabase/server'
import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi'
import { getMajorLeagueIds } from '@/domains/livescore/actions/teamLeagueData'
import { getTeamsByIds, getLeagueName } from '@/domains/livescore/actions/teamLeagueData'
import { getTeamLogoUrls } from '@/domains/livescore/actions/images'
import { getLeagueLogoUrl } from '@/domains/livescore/actions/images'
import { extractCardLinks } from '@/domains/boards/utils/post/extractCardLinks'
import { extractFirstImageUrl } from '@/domains/boards/utils/post/extractFirstImageUrl'
import { extractSummary } from '@/domains/boards/utils/post/extractSummary'
import { submitIndexNowUrl } from '@/shared/seo/indexnow'
import { SPORTS_PLACEHOLDERS } from '@/shared/images/urls'

type PredictionPostPollDraft = {
  question: string
  options: string[]
}

type TiptapNode = Record<string, unknown>

function truncatePollText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength)
}

function createPollOptionId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function createMatchPredictionPoll(homeName: string, awayName: string): PredictionPostPollDraft {
  const home = truncatePollText(homeName, 58)
  const away = truncatePollText(awayName, 58)

  return {
    question: truncatePollText(`${home} vs ${away}, 결과를 어떻게 예상하시나요?`, 120),
    options: [
      truncatePollText(`${home} 승`, 80),
      '무승부',
      truncatePollText(`${away} 승`, 80),
    ],
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceTeamNameVariants(text: string, names: Array<string | null | undefined>, displayName: string) {
  let nextText = text
  const variants = [...new Set(
    names
      .map((name) => name?.trim())
      .filter((name): name is string => Boolean(name) && name !== displayName)
      .sort((left, right) => right.length - left.length)
  )]

  for (const name of variants) {
    nextText = nextText.replace(new RegExp(escapeRegExp(name), 'g'), displayName)
  }

  return nextText
}

const KNOWN_TEAM_NAME_VARIANTS: Record<string, string[]> = {
  '크루제이루': ['크루이조로', '크루이제로', '크루제이로', '크루제이루 EC', '크루제이루EC'],
  '플루미넨시': ['플루미네이세', '플루미넨세', '플루미넨시 FC', '플루미넨시FC'],
  '샤페코엔시': ['Chapecoense-sc', 'Chapecoense-SC', '차페코엔세', '샤페코엔세'],
}

function normalizeKnownTeamNameVariants(text: string, displayNames: string[]) {
  let nextText = text

  for (const displayName of displayNames) {
    for (const variant of KNOWN_TEAM_NAME_VARIANTS[displayName] ?? []) {
      nextText = nextText.replace(new RegExp(escapeRegExp(variant), 'g'), displayName)
    }
  }

  return nextText
}

async function insertPredictionPostPoll(params: {
  supabase: ReturnType<typeof getSupabaseAdmin>
  postId: string
  userId: string
  poll: PredictionPostPollDraft
}) {
  const { supabase, postId, userId, poll } = params
  const supabaseAny = supabase as unknown as {
    from: (table: string) => {
      insert: (row: unknown) => {
        select: (columns: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>
        }
      } | Promise<{ error: { message: string } | null }>
    }
  }

  const pollInsert = supabaseAny.from('post_polls').insert({
    post_id: postId,
    question: poll.question,
    created_by: userId,
  }) as {
    select: (columns: string) => {
      single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>
    }
  }

  const { data: pollRow, error: pollError } = await pollInsert.select('id').single()
  if (pollError || !pollRow) {
    throw new Error(pollError?.message || '투표 생성 실패')
  }

  const optionRows = poll.options.map((optionText, index) => ({
    id: createPollOptionId(),
    poll_id: pollRow.id,
    option_text: optionText,
    display_order: index,
  }))

  const { error: optionError } = await supabaseAny.from('post_poll_options').insert(optionRows) as { error: { message: string } | null }
  if (optionError) {
    throw new Error(optionError.message)
  }
}

function getTiptapHeadingText(node: TiptapNode) {
  if (node.type !== 'heading') return ''
  const content = node.content
  if (!Array.isArray(content)) return ''

  return content
    .map((child) => (child && typeof child === 'object' && 'text' in child ? String(child.text || '') : ''))
    .join('')
    .trim()
}

function getTiptapText(node: TiptapNode) {
  const content = node.content
  if (!Array.isArray(content)) return ''

  return content
    .map((child) => (child && typeof child === 'object' && 'text' in child ? String(child.text || '') : ''))
    .join('')
    .trim()
}

function createParagraphNode(text: string): TiptapNode {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  }
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?。]|다\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function getPredictionDistributionSentence(
  predictionData: PredictionApiData | null,
  homeName: string,
  awayName: string
) {
  const home = parsePercentValue(predictionData?.predictions.percent.home)
  const draw = parsePercentValue(predictionData?.predictions.percent.draw)
  const away = parsePercentValue(predictionData?.predictions.percent.away)

  if (home === null || draw === null || away === null) return null

  if (Math.max(home, draw, away) - Math.min(home, draw, away) <= 5) {
    return `이번 경기는 한쪽 우세가 뚜렷하지 않아 ${homeName} 승리, 무승부, ${awayName} 승리 가능성을 함께 열어두고 봐야 합니다.`
  }

  if (Math.abs(home - draw) <= 5 && home > away) {
    return `${homeName}가 조금 더 앞서고 있으며, ${awayName} 승리보다는 무승부가 더 현실적인 변수로 잡히는 경기입니다.`
  }

  if (Math.abs(away - draw) <= 5 && away > home) {
    return `${awayName}가 조금 더 앞서고 있으며, ${homeName} 승리보다는 무승부가 더 현실적인 변수로 잡히는 경기입니다.`
  }

  if (home > draw && home > away) {
    return `${homeName} 쪽으로 흐름이 조금 더 기울어 있지만, 경기 운영이 흔들리면 무승부 가능성도 함께 봐야 합니다.`
  }

  if (away > draw && away > home) {
    return `${awayName} 쪽으로 흐름이 조금 더 기울어 있지만, 원정 경기 변수 때문에 무승부 가능성도 함께 봐야 합니다.`
  }

  return `이번 경기는 승패보다 경기 흐름이 어느 쪽으로 먼저 기우는지가 더 중요한 변수입니다.`
}

async function generateLeadInsightText(
  predictionData: PredictionApiData | null,
  homeName: string,
  awayName: string,
  leagueName: string
) {
  if (!predictionData) return ''

  try {
    const { openai } = await import('./libs/openai')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: `축구 경기 분석글 상단에 들어갈 짧은 핵심 해석만 작성하세요.

규칙:
1. 2~3문장만 작성하세요.
2. 제목, 목록, 마크다운, 소제목은 쓰지 마세요.
3. 퍼센트 숫자와 시즌 승무패 숫자를 직접 쓰지 마세요.
4. 제공된 승률, 팀 비교 지표, 최근 득실 흐름은 판단 근거로만 사용하세요.
5. 홈/원정 상세 성적, 시즌 전체 성적, 맞대결 전적을 나열하지 마세요.
6. 팀 이름은 제공된 이름 그대로 쓰고 임의로 바꾸지 마세요.
7. "균등", "예상됩니다", "보입니다", "작용할 것으로 보입니다" 표현은 쓰지 마세요.
8. "승리"만 단독으로 쓰지 말고 "홈팀 승리", "원정팀 승리", 또는 팀명을 붙인 "크루제이루 승리"처럼 주어를 명확히 쓰세요.
9. 자연스럽게 쓰세요. 예: "크루제이루가 조금 더 앞서고 있으며, 플루미넨시 승리보다는 무승부가 더 현실적인 변수입니다."`,
        },
        {
          role: 'user',
          content: `[경기 정보]
- 대회: ${leagueName}
- 홈팀: ${homeName}
- 원정팀: ${awayName}

[승률 예측]
- 홈 승: ${predictionData.predictions.percent.home}
- 무승부: ${predictionData.predictions.percent.draw}
- 원정 승: ${predictionData.predictions.percent.away}

[팀 비교 지표]
- 폼: 홈 ${predictionData.comparison.form.home} / 원정 ${predictionData.comparison.form.away}
- 공격: 홈 ${predictionData.comparison.att.home} / 원정 ${predictionData.comparison.att.away}
- 수비: 홈 ${predictionData.comparison.def.home} / 원정 ${predictionData.comparison.def.away}
- 득점: 홈 ${predictionData.comparison.goals.home} / 원정 ${predictionData.comparison.goals.away}
- 종합: 홈 ${predictionData.comparison.total.home} / 원정 ${predictionData.comparison.total.away}

[최근 5경기 득실]
- ${homeName}: 평균 ${predictionData.teams.home.last_5.goals.for.average}득점 / ${predictionData.teams.home.last_5.goals.against.average}실점
- ${awayName}: 평균 ${predictionData.teams.away.last_5.goals.for.average}득점 / ${predictionData.teams.away.last_5.goals.against.average}실점`,
        },
      ],
    })

    return completion.choices[0].message.content?.trim() || ''
  } catch (error) {
    console.error(`상단 핵심 해석 생성 실패:`, error)
    return ''
  }
}

function shouldDropLeadInsightSentence(sentence: string) {
  return [
    /%/u,
    /승률/u,
    /균등/u,
    /약간의\s*우위/u,
    /조금\s*더\s*유리/u,
    /조금\s*더\s*앞/u,
    /조금\s*더\s*높/u,
    /조금\s*더\s*안정/u,
    /다소\s*낮게\s*평가/u,
    /홈.*무승부.*비슷/u,
    /원정\s*승.*낮/u,
    /전체\s*\d+\s*경기/u,
    /홈\s*경기/u,
    /원정\s*경기/u,
    /최근\s*맞대결/u,
    /상대전적/u,
    /최근\s*\d+\s*경기/u,
    /\d+\s*승\s*\d+\s*무/u,
    /\d+\s*승\s*\d+\s*패/u,
    /시즌\s*성적/u,
  ].some((pattern) => pattern.test(sentence))
}

function polishLeadInsightSentence(sentence: string) {
  return sentence
    .replace(/^그러나\s+/u, '')
    .replace(/^하지만\s+/u, '')
    .replace(/^반면,\s*/u, '')
    .replace(/최근\s*폼/u, '최근 흐름')
    .replace(/공격과\s*수비\s*모두에서\s*안정성을\s*보여줍니다/u, '공수 균형에서 안정적인 모습을 보입니다')
    .replace(/수비\s*안정성도\s*무시할\s*수\s*없는\s*변수입니다/u, '수비 안정성을 바탕으로 버틸 수 있다는 점도 변수입니다')
    .replace(/작용할 것으로 보입니다\.?$/u, '핵심 변수입니다.')
    .replace(/좌우할 것으로 보입니다\.?$/u, '좌우할 수 있습니다.')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeLeadInsightSentences(sentences: string[]) {
  const result: string[] = []
  const seenKeys = new Set<string>()

  for (const sentence of sentences) {
    const key = sentence
      .replace(/크루제이루|플루미넨시|홈팀|원정팀/g, '')
      .replace(/조금|약간|다소|더|모두|전체적인/g, '')
      .replace(/[^\p{L}\p{N}]/gu, '')
      .slice(0, 24)

    if (key && seenKeys.has(key)) continue
    if (key) seenKeys.add(key)
    result.push(sentence)
  }

  return result
}

function sanitizeLeadInsightNodes(
  nodes: TiptapNode[],
  predictionData: PredictionApiData | null,
  homeName: string,
  awayName: string
) {
  if (nodes.length === 0) return []

  const distributionSentence = getPredictionDistributionSentence(predictionData, homeName, awayName)
  const sanitizedNodes: TiptapNode[] = []
  let sentenceCount = 0
  let hasParagraph = false

  for (const node of nodes) {
    if (node.type === 'heading') {
      sanitizedNodes.push(node)
      continue
    }

    if (node.type !== 'paragraph') {
      continue
    }

    const sentences = dedupeLeadInsightSentences(splitSentences(getTiptapText(node))
      .map(polishLeadInsightSentence)
      .filter((sentence) => !shouldDropLeadInsightSentence(sentence))
    )
      .filter(() => {
        if (sentenceCount >= 5) return false
        sentenceCount += 1
        return true
      })

    if (sentences.length > 0) {
      sanitizedNodes.push(createParagraphNode(sentences.join(' ')))
      hasParagraph = true
    }
  }

  if (!hasParagraph && distributionSentence) {
    sanitizedNodes.push(createParagraphNode(distributionSentence))
  }

  return sanitizedNodes
}

function findFirstHeadingIndex(nodes: TiptapNode[], matcher: (heading: string) => boolean) {
  return nodes.findIndex((node) => {
    const heading = getTiptapHeadingText(node)
    return heading.length > 0 && matcher(heading)
  })
}

function createEmptyParagraphNode(): TiptapNode {
  return { type: 'paragraph', content: [{ type: 'text', text: '' }] }
}

function createMatchCardIntroNode(): TiptapNode {
  return {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: '경기내용, 라인업, 통계를 아래 경기 카드에서 확인할 수 있습니다.',
        marks: [{ type: 'bold' }],
      },
    ],
  }
}
// predictMatch는 OpenAI SDK를 사용하므로 동적 import로 처리
// (모듈 레벨 import 시 OPENAI_API_KEY 누락 등으로 전체 모듈 로드 실패 방지)
async function loadPredictMatch() {
  const { predictMatch } = await import('./utils/predictMatch')
  return predictMatch
}

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

function formatMatchDateTimeKo(date?: string): string | null {
  if (!date) return null

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return null

  const dateText = parsedDate.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
  const timeText = parsedDate.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  return `${dateText} ${timeText} KST`
}

function parsePercentValue(value?: string | null): number | null {
  if (!value) return null
  const parsed = Number(value.replace('%', '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

function buildPredictionTitleAngle(
  predictionData: PredictionApiData | null,
  homeName: string,
  awayName: string
) {
  const homePercent = parsePercentValue(predictionData?.predictions.percent.home)
  const drawPercent = parsePercentValue(predictionData?.predictions.percent.draw)
  const awayPercent = parsePercentValue(predictionData?.predictions.percent.away)
  const underOver = predictionData?.predictions.under_over?.trim()
  const advice = predictionData?.predictions.advice?.trim()

  if (underOver?.startsWith('-')) {
    return '저득점 흐름과 승부 변수'
  }
  if (underOver?.startsWith('+')) {
    return '득점 흐름과 공격 지표'
  }
  if (homePercent !== null && drawPercent !== null && Math.abs(homePercent - drawPercent) <= 5 && homePercent > (awayPercent ?? 0)) {
    return `${homeName} 우세와 무승부 변수`
  }
  if (awayPercent !== null && drawPercent !== null && Math.abs(awayPercent - drawPercent) <= 5 && awayPercent > (homePercent ?? 0)) {
    return `${awayName} 우세와 무승부 변수`
  }
  if (homePercent !== null && awayPercent !== null && Math.abs(homePercent - awayPercent) <= 8) {
    return '승부 균형과 접전 흐름'
  }
  if (advice?.includes('Double chance')) {
    return '더블찬스 관점의 안정적인 접근'
  }
  if (homePercent !== null && awayPercent !== null && homePercent > awayPercent) {
    return `${homeName} 홈 우세 포인트`
  }
  if (homePercent !== null && awayPercent !== null && awayPercent > homePercent) {
    return `${awayName} 원정 우세 포인트`
  }

  return '최근 흐름과 승부 변수'
}

function buildPredictionPostTitle({
  targetDate,
  leagueName,
  homeName,
  awayName,
  predictionData,
}: {
  targetDate: string
  leagueName: string
  homeName: string
  awayName: string
  predictionData: PredictionApiData | null
}) {
  const formattedDate = new Date(targetDate).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
  const angle = buildPredictionTitleAngle(predictionData, homeName, awayName)

  return `${homeName} vs ${awayName}, ${angle} | ${leagueName} ${formattedDate} 분석`
}

// 팀 이름 한국어 가져오기 (매핑 없으면 원본 이름 사용)
async function getTeamNameKo(teamId: number, fallbackName: string): Promise<string> {
  const teamMap = await getTeamsByIds([teamId])
  return teamMap[teamId]?.name_ko || fallbackName
}

// 리그 이름 한국어 가져오기 (매핑 없으면 원본 이름 사용)
async function getLeagueNameKo(leagueId: number, fallbackName: string): Promise<string> {
  const name = await getLeagueName(leagueId)
  return name === '알 수 없는 리그' ? fallbackName : name
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function formatPredictionContent(
  prediction: PredictionApiData
): Promise<string> {
  const { predictions, comparison, teams, h2h } = prediction
  const homeTeam = teams.home
  const awayTeam = teams.away
  const homeNameKo = await getTeamNameKo(homeTeam.id, homeTeam.name)
  const awayNameKo = await getTeamNameKo(awayTeam.id, awayTeam.name)

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
    const winnerNameKo = predictions.winner.id ? await getTeamNameKo(predictions.winner.id, predictions.winner.name) : predictions.winner.name
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
  292: 'domestic-analysis-k-league-1',  // K리그 1
  293: 'domestic-analysis-k-league-2',  // K리그 2
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

// 해외축구 분석 게시판 ID (fallback용 - 매핑 없는 리그의 분석글 저장)
const OVERSEAS_FOOTBALL_ANALYSIS_BOARD_ID = '66aaa603-38cc-44bd-ba4c-47c3884eb7ac'

// 리그 ID로 게시판 슬러그 찾기
async function getBoardSlugByLeagueId(leagueId: number): Promise<string | null> {
  // 1. 하드코딩된 매핑 먼저 확인
  if (LEAGUE_BOARD_MAPPING[leagueId]) {
    return LEAGUE_BOARD_MAPPING[leagueId]
  }
  
  // 2. DB에서 league_id로 게시판 찾기
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('boards')
    .select('slug')
    .eq('league_id', leagueId)
    .single()
    
  return data?.slug || null
}

// 게시판 슬러그로 ID 찾기
async function getBoardIdBySlug(slug: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('boards')
    .select('id')
    .eq('slug', slug)
    .single()
    
  return data?.id || null
}

// 특정 날짜의 다음날 경기 가져오기 (메이저 리그만)
export async function getUpcomingMatches(date: string): Promise<{
  matches: UpcomingMatch[]
  error?: string
}> {
  try {
    // API 키 존재 여부 확인
    if (!process.env.FOOTBALL_API_KEY) {
      console.error('FOOTBALL_API_KEY 환경변수가 설정되지 않았습니다.')
      return { matches: [], error: 'FOOTBALL_API_KEY 환경변수가 설정되지 않았습니다.' }
    }

    const response = await fetchFromFootballApi('fixtures', {
      date: date,
      status: 'NS' // Not Started
    })

    // API 에러 응답 확인
    if (response?.errors && Object.keys(response.errors).length > 0) {
      const errorMsg = typeof response.errors === 'object'
        ? JSON.stringify(response.errors)
        : String(response.errors)
      console.error('Football API 에러 응답:', errorMsg)
      return { matches: [], error: `Football API 에러: ${errorMsg}` }
    }

    if (!response?.response) {
      return { matches: [], error: 'API 응답에 response 필드가 없습니다.' }
    }

    // 메이저 리그 ID 목록 가져오기
    const majorLeagueIds = await getMajorLeagueIds()
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

    return { matches: filteredMatches }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
    console.error('다음날 경기 조회 실패:', error)
    return { matches: [], error: `경기 조회 실패: ${errorMsg}` }
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
  const teamMap = await getTeamsByIds([match.teams.home.id, match.teams.away.id])
  const homeTeamMapping = teamMap[match.teams.home.id]
  const awayTeamMapping = teamMap[match.teams.away.id]
  const homeNameKo = await getTeamNameKo(match.teams.home.id, match.teams.home.name)
  const awayNameKo = await getTeamNameKo(match.teams.away.id, match.teams.away.name)
  const leagueNameKo = await getLeagueNameKo(league.id, league.name)

  // 1. Predictions API 데이터 먼저 가져오기 (차트 + AI 텍스트 동일 데이터 소스)
  let predictionData: PredictionApiData | null = null
  try {
    predictionData = await fetchPredictions(match.id)
    if (predictionData) {
      predictionData.teams.home.logo = teamLogoMap[predictionData.teams.home.id] || SPORTS_PLACEHOLDERS.teams
      predictionData.teams.away.logo = teamLogoMap[predictionData.teams.away.id] || SPORTS_PLACEHOLDERS.teams
    }
  } catch {
    // predictionChart용 데이터 실패 시 무시
  }

  // 2. AI 분석글 생성 (predictionData를 전달하여 차트와 동일한 데이터로 분석)
  let aiAnalysis = ''
  try {
    const predictMatch = await loadPredictMatch()
    const result = await predictMatch(match.id, true, predictionData) // predictionData 전달
    if (typeof result === 'object' && 'textAnalysis' in result) {
      aiAnalysis = result.textAnalysis
    } else if (typeof result === 'string') {
      aiAnalysis = result
    }
  } catch (error) {
    console.error(`AI 분석 생성 실패 (${match.id}):`, error)
    aiAnalysis = `${homeNameKo} vs ${awayNameKo} 경기의 예측 분석을 생성할 수 없습니다.`
  }

  aiAnalysis = replaceTeamNameVariants(
    replaceTeamNameVariants(
      aiAnalysis,
      [
        match.teams.home.name,
        homeTeamMapping?.name_en,
        predictionData?.teams.home.name,
      ],
      homeNameKo
    ),
    [
      match.teams.away.name,
      awayTeamMapping?.name_en,
      predictionData?.teams.away.name,
    ],
    awayNameKo
  )
  aiAnalysis = normalizeKnownTeamNameVariants(aiAnalysis, [homeNameKo, awayNameKo])
  const leadInsightText = normalizeKnownTeamNameVariants(
    await generateLeadInsightText(predictionData, homeNameKo, awayNameKo, leagueNameKo),
    [homeNameKo, awayNameKo]
  )

  // 매치 데이터의 로고 URL을 Storage URL로 교체
  match.teams.home.logo = teamLogoMap[match.teams.home.id] || SPORTS_PLACEHOLDERS.teams
  match.teams.away.logo = teamLogoMap[match.teams.away.id] || SPORTS_PLACEHOLDERS.teams
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
    targetBoardId = OVERSEAS_FOOTBALL_ANALYSIS_BOARD_ID
  }

  const title = buildPredictionPostTitle({
    targetDate,
    leagueName: leagueNameKo,
    homeName: homeNameKo,
    awayName: awayNameKo,
    predictionData,
  })

  // 예측 차트 노드 (데이터가 있을 때만)
  const chartNode = predictionData ? [{
    type: 'predictionChart',
    attrs: {
      fixtureId: match.id.toString(),
      chartData: {
        match: {
          id: match.id,
          date: match.date,
          league: {
            id: league.id,
            name: leagueNameKo
          }
        },
        predictions: {
          ...predictionData.predictions,
          winner: predictionData.predictions.winner
            ? {
                ...predictionData.predictions.winner,
                name: predictionData.predictions.winner.id === predictionData.teams.home.id
                  ? homeNameKo
                  : predictionData.predictions.winner.id === predictionData.teams.away.id
                    ? awayNameKo
                    : predictionData.predictions.winner.name
              }
            : predictionData.predictions.winner
        },
        comparison: predictionData.comparison,
        teams: {
          home: { ...predictionData.teams.home, name: homeNameKo },
          away: { ...predictionData.teams.away, name: awayNameKo }
        },
        h2h: predictionData.h2h?.map((m: { teams: { home: { id: number; name: string; winner: boolean | null }; away: { id: number; name: string; winner: boolean | null } }; fixture: { id: number; date: string }; goals: { home: number; away: number } }) => ({
          ...m,
          teams: {
            home: {
              ...m.teams.home,
              name: m.teams.home.id === predictionData.teams.home.id ? homeNameKo
                   : m.teams.home.id === predictionData.teams.away.id ? awayNameKo
                   : m.teams.home.name
            },
            away: {
              ...m.teams.away,
              name: m.teams.away.id === predictionData.teams.home.id ? homeNameKo
                   : m.teams.away.id === predictionData.teams.away.id ? awayNameKo
                   : m.teams.away.name
            }
          }
        })) ?? predictionData.h2h
      }
    }
  }] : []

  // AI 분석글을 Tiptap 문단으로 변환
  const aiParagraphs: TiptapNode[] = []

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
            name: homeNameKo,
            name_en: homeTeamMapping?.name_en || match.teams.home.name,
            name_ko: homeTeamMapping?.name_ko || homeNameKo,
            slug: homeTeamMapping?.slug || null,
            logo: match.teams.home.logo,
            winner: null
          },
          away: {
            id: match.teams.away.id,
            name: awayNameKo,
            name_en: awayTeamMapping?.name_en || match.teams.away.name,
            name_ko: awayTeamMapping?.name_ko || awayNameKo,
            slug: awayTeamMapping?.slug || null,
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
          name: leagueNameKo,
          logo: leagueLogoUrl
        },
        status: {
          code: 'NS',
          name: '경기 예정'
        }
      }
    }
  }

  const predictionPoll = createMatchPredictionPoll(homeNameKo, awayNameKo)
  const pollBlockNode = {
    type: 'pollBlock',
    attrs: {
      question: predictionPoll.question,
      options: predictionPoll.options,
    },
  }

  const rawLeadInsightNodes = leadInsightText
    ? [
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: '핵심 해석' }],
        },
        ...leadInsightText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => createParagraphNode(line)),
      ]
    : []
  const leadInsightNodes = sanitizeLeadInsightNodes(rawLeadInsightNodes, predictionData, homeNameKo, awayNameKo)
  const mainAnalysisNodes = aiParagraphs

  const insightStartIndex = findFirstHeadingIndex(mainAnalysisNodes, (heading) => (
    heading.includes('관전') || heading.includes('맞대결') || heading.toLowerCase().includes('h2h')
  ))
  const teamAnalysisStartIndex = findFirstHeadingIndex(mainAnalysisNodes, (heading) => (
    heading.includes('홈팀') || heading.includes('어웨이') || heading.includes('원정') || heading.includes('Home') || heading.includes('Away')
  ))
  const pollInsertIndex = teamAnalysisStartIndex >= 0
    ? teamAnalysisStartIndex
    : insightStartIndex >= 0
      ? insightStartIndex
      : mainAnalysisNodes.length

  const overviewNodes = mainAnalysisNodes.slice(0, pollInsertIndex)
  const analysisEndIndex = insightStartIndex >= 0 ? insightStartIndex : mainAnalysisNodes.length
  const teamAnalysisNodes = mainAnalysisNodes.slice(pollInsertIndex, analysisEndIndex)
  const insightNodes = insightStartIndex >= 0 ? mainAnalysisNodes.slice(insightStartIndex) : []

  const tiptapContent = {
    type: 'doc',
    content: [
      // 차트 전에 확률과 지표를 해석하는 고유 문단을 먼저 노출
      ...leadInsightNodes,
      ...(leadInsightNodes.length > 0 ? [createEmptyParagraphNode()] : []),
      // 예측 차트 (데이터가 있을 때만)
      ...chartNode,
      createEmptyParagraphNode(),
      ...(match.date ? [{
        type: 'paragraph',
        content: [{
          type: 'text',
          text: `경기 일시: ${formatMatchDateTimeKo(match.date) || match.date}`,
          marks: [{ type: 'bold' }]
        }]
      }, createEmptyParagraphNode()] : []),
      // 경기 개요
      ...overviewNodes,
      createEmptyParagraphNode(),
      // 투표
      pollBlockNode,
      createEmptyParagraphNode(),
      // 홈/어웨이 분석
      ...teamAnalysisNodes,
      createEmptyParagraphNode(),
      // 매치 카드 (관전 포인트 전)
      createMatchCardIntroNode(),
      matchCardNode,
      createEmptyParagraphNode(),
      // 맞대결/관전 포인트
      ...insightNodes,
      createEmptyParagraphNode(),
      { type: 'horizontalRule' },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '※ 이 분석은 AI가 실제 통계 데이터를 바탕으로 생성한 예측입니다. 실제 경기 결과와 다를 수 있으며, 참고용으로만 활용해주세요.', marks: [{ type: 'italic' }] }
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
    metaData,
    predictionPoll
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
    const [teamLogoMap, leagueLogoUrl] = await Promise.all([
      getTeamLogoUrls(allTeamIds),
      getLeagueLogoUrl(league.id),
    ])

    // 현재 로그인한 관리자 ID 사용 (없으면 fallback)
    const userId = await getCurrentUserId()

    // 각 경기별로 개별 게시글 생성
    let successCount = 0
    let errorCount = 0
    const errorDetails: string[] = []

    for (const match of matches) {
      try {
        const result = await generateMatchPredictionPost(
          match, league, targetDate, userId, teamLogoMap, leagueLogoUrl
        )

        if (result.success) {
          successCount++
        } else {
          errorCount++
          const detail = `${match.teams.home.name} vs ${match.teams.away.name}: ${result.error}`
          errorDetails.push(detail)
          console.error(`경기 게시글 생성 실패 (${match.id}):`, result.error)
        }
      } catch (err) {
        errorCount++
        const detail = `${match.teams.home.name} vs ${match.teams.away.name}: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
        errorDetails.push(detail)
        console.error(`경기 게시글 생성 예외 (${match.id}):`, err)
      }

      if (matches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    if (successCount === 0 && errorCount > 0) {
      throw new Error(`${errorCount}경기 게시글 생성 모두 실패 - ${errorDetails.join('; ')}`)
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
    const supabase = getSupabaseAdmin()
    
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
    const { matches } = await getUpcomingMatches(targetDate)

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
  const supabase = getSupabaseAdmin()
  
  const { data, error } = await supabase
    .from('prediction_automation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  
  return data || []
}

// 예측 자동화 토글 (GitHub Actions 설정)
export async function togglePredictionAutomation(enabled: boolean, _time: string) {
  try {
    void _time
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
    const { matches: allMatches } = await getUpcomingMatches(targetDate)

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

// 예측 분석 게시글 생성 (posts + posts_content 분리 저장)
async function createPredictionPost(
  title: string,
  content: string,
  boardId: string,
  userId: string,
  tags: string[] = [],
  meta: Record<string, unknown> | null = null,
  poll?: PredictionPostPollDraft
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const supabase = getSupabaseAdmin()

  try {
    const parsedContent = typeof content === 'string' && content.startsWith('{')
      ? JSON.parse(content)
      : content

    // 1. posts 테이블에 insert (content 없이, summary/thumbnail만)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title,
        board_id: boardId,
        user_id: userId,
        category: 'prediction',
        tags,
        meta,
        status: 'published',
        thumbnail_url: extractFirstImageUrl(content),
        summary: extractSummary(content),
      })
      .select('id, post_number, boards(slug)')
      .single()

    if (postError || !post) {
      console.error('❌ 게시글 생성 실패:', postError)
      return { success: false, error: postError?.message || '게시글 생성 실패' }
    }

    // 2. posts_content 테이블에 본문 분리 저장
    if (poll) {
      try {
        await insertPredictionPostPoll({ supabase, postId: post.id, userId, poll })
      } catch (pollError) {
        console.error('[prediction post_poll INSERT failed]', pollError)
        await supabase.from('posts').delete().eq('id', post.id)
        return {
          success: false,
          error: pollError instanceof Error ? `투표 생성 실패: ${pollError.message}` : '투표 생성 실패',
        }
      }
    }

    const contentText = extractSummary(content, 10000)
    const { error: contentError } = await supabase
      .from('posts_content')
      .insert({ post_id: post.id, content: parsedContent, content_text: contentText })

    if (contentError) {
      console.error('❌ posts_content 저장 실패:', contentError)
    }

    // 3. 카드 링크 저장
    try {
      const cardLinks = extractCardLinks(parsedContent)
      if (cardLinks.length > 0) {
        const cardLinksData = cardLinks.map(link => ({ ...link, post_id: post.id }))
        await supabase.from('post_card_links').insert(cardLinksData)
      }
    } catch (cardErr) {
      console.error('예측 게시글 카드 링크 저장 실패:', cardErr)
    }

    // 캐시 무효화: BoardCollectionWidget (unstable_cache) 즉시 갱신
    revalidateTag('board-collection', 'default')
    revalidateTag('analysis-posts', 'default')

    const boardSlug = (post.boards as any)?.slug
    if (boardSlug && post.post_number) {
      submitIndexNowUrl(`/boards/${boardSlug}/${post.post_number}`).then((result) => {
        if (!result.ok) console.error('[IndexNow] prediction post submit failed:', result)
      })
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
