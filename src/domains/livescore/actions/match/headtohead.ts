'use server'

import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi'
import { fetchTeamPlayerStats } from '@/domains/livescore/actions/teams/player-stats'
import { fetchTeamSquad } from '@/domains/livescore/actions/teams/squad'
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName'
import { getPlayerPhotoUrls, getTeamLogoUrls } from '@/domains/livescore/actions/images'
import { cache } from 'react'

type TeamId = number


interface BasicTeamInfo {
	id: number
	name?: string
	logo?: string
}

interface BasicLeagueInfo {
	id?: number
	name?: string
	country?: string
	logo?: string
}

interface FixtureSummaryItem {
	fixtureId: number
	utcDate: string
	league: BasicLeagueInfo
	teams: {
		home: BasicTeamInfo
		away: BasicTeamInfo
	}
	score: {
		home: number
		away: number
	}
	winnerTeamId: number | null
}

interface HeadToHeadSummary {
	teamA: TeamId
	teamB: TeamId
	last: number
	items: FixtureSummaryItem[]
	resultSummary: {
		teamA: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number }
		teamB: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number }
	}
}

interface TeamRecentFormItem {
	fixtureId: number
	utcDate: string
	opponent: BasicTeamInfo
	venue: 'home' | 'away'
	score: { for: number; against: number }
	result: 'W' | 'D' | 'L'
}

interface TeamRecentFormSummary {
	teamId: TeamId
	last: number
	items: TeamRecentFormItem[]
	summary: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number }
}

interface TopPlayerItem {
	playerId: number
	name?: string
	goals: number
	assists: number
}

interface ApiFixtureResponse {
	fixture?: { id?: number; date?: string }
	league?: { id?: number; name?: string; country?: string; logo?: string }
	teams?: {
		home?: { id?: number; name?: string; logo?: string }
		away?: { id?: number; name?: string; logo?: string }
	}
	goals?: { home?: number; away?: number }
}

interface SquadResponse {
	success?: boolean
	data?: Array<{ id?: number | string; name?: string }>
}

interface PlayerStats {
	goals?: number
	assists?: number
}

interface TeamTopPlayersSummary {
	teamId: TeamId
	topScorers: TopPlayerItem[]
	topAssist: TopPlayerItem[]
}

export interface HeadToHeadTestData {
	teamA: TeamId
	teamB: TeamId
	h2h: HeadToHeadSummary
	recent: {
		teamA: TeamRecentFormSummary
		teamB: TeamRecentFormSummary
	}
	topPlayers: {
		teamA: TeamTopPlayersSummary
		teamB: TeamTopPlayersSummary
	}
	// 4590 표준: 선수 사진 Storage URL (playerId -> URL)
	playerPhotoUrls?: Record<number, string>
	// 4590 표준: 팀 로고 Storage URL (teamId -> URL)
	teamLogoUrls?: Record<number, string>
}

function buildResultSummary(items: FixtureSummaryItem[], teamA: TeamId, teamB: TeamId) {
	const sumA = { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 }
	const sumB = { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 }

	for (const it of items) {
		const { home, away } = it.teams
		const { home: gh, away: ga } = it.score
		const isDraw = gh === ga

		// teamA
		if (home.id === teamA) {
			sumA.goalsFor += gh
			sumA.goalsAgainst += ga
			if (isDraw) sumA.draw += 1
			else if (gh > ga) sumA.win += 1
			else sumA.loss += 1
		} else if (away.id === teamA) {
			sumA.goalsFor += ga
			sumA.goalsAgainst += gh
			if (isDraw) sumA.draw += 1
			else if (ga > gh) sumA.win += 1
			else sumA.loss += 1
		}

		// teamB
		if (home.id === teamB) {
			sumB.goalsFor += gh
			sumB.goalsAgainst += ga
			if (isDraw) sumB.draw += 1
			else if (gh > ga) sumB.win += 1
			else sumB.loss += 1
		} else if (away.id === teamB) {
			sumB.goalsFor += ga
			sumB.goalsAgainst += gh
			if (isDraw) sumB.draw += 1
			else if (ga > gh) sumB.win += 1
			else sumB.loss += 1
		}
	}

	sumA.goalDiff = sumA.goalsFor - sumA.goalsAgainst
	sumB.goalDiff = sumB.goalsFor - sumB.goalsAgainst

	return { teamA: sumA, teamB: sumB }
}

export async function fetchHeadToHead(teamA: TeamId, teamB: TeamId, last: number = 5): Promise<HeadToHeadSummary> {
	if (!teamA || !teamB) {
		throw new Error('두 팀 ID가 모두 필요합니다')
	}

	const data = await fetchFromFootballApi('fixtures/headtohead', {
		h2h: `${teamA}-${teamB}`,
		last,
		status: 'FT'
	})

	const items: FixtureSummaryItem[] = (data?.response || []).slice(0, last).map((m: ApiFixtureResponse) => {
		const gh = typeof m?.goals?.home === 'number' ? m.goals.home : 0
		const ga = typeof m?.goals?.away === 'number' ? m.goals.away : 0
		let winner: number | null = null
		if (gh !== ga) {
			winner = gh > ga ? m?.teams?.home?.id ?? null : m?.teams?.away?.id ?? null
		}
		return {
			fixtureId: m?.fixture?.id ?? 0,
			utcDate: m?.fixture?.date ?? '',
			league: {
				id: m?.league?.id,
				name: m?.league?.name,
				country: m?.league?.country,
				logo: m?.league?.logo
			},
			teams: {
				home: { id: m?.teams?.home?.id ?? 0, name: m?.teams?.home?.name, logo: m?.teams?.home?.logo },
				away: { id: m?.teams?.away?.id ?? 0, name: m?.teams?.away?.name, logo: m?.teams?.away?.logo }
			},
			score: { home: gh, away: ga },
			winnerTeamId: winner
		}
	})

	return {
		teamA,
		teamB,
		last,
		items,
		resultSummary: buildResultSummary(items, teamA, teamB)
	}
}

export async function fetchTeamRecentForm(teamId: TeamId, last: number = 5): Promise<TeamRecentFormSummary> {
	// 모든 리그, 모든 시즌에서 완료된 경기만 조회
	const fixturesData = await fetchFromFootballApi('fixtures', {
		team: teamId,
		last: last * 2,  // 넉넉하게 가져오기
		status: 'FT'
	})

	const fixtures: ApiFixtureResponse[] = Array.isArray(fixturesData?.response) ? fixturesData.response : []

	// 날짜 내림차순 정렬 후 상위 n개 추출
	fixtures.sort((a, b) => {
		const ta = new Date(a?.fixture?.date || 0).getTime()
		const tb = new Date(b?.fixture?.date || 0).getTime()
		return tb - ta
	})

	const selected = fixtures.slice(0, last)

	const items: TeamRecentFormItem[] = selected.map((m: ApiFixtureResponse) => {
		const isHome = m?.teams?.home?.id === teamId
		const gh = typeof m?.goals?.home === 'number' ? m.goals.home : 0
		const ga = typeof m?.goals?.away === 'number' ? m.goals.away : 0
		const forGoals = isHome ? gh : ga
		const againstGoals = isHome ? ga : gh
		let result: 'W' | 'D' | 'L' = 'D'
		if (forGoals > againstGoals) result = 'W'
		else if (forGoals < againstGoals) result = 'L'

		return {
			fixtureId: m?.fixture?.id ?? 0,
			utcDate: m?.fixture?.date ?? '',
			opponent: isHome
				? { id: m?.teams?.away?.id ?? 0, name: m?.teams?.away?.name, logo: m?.teams?.away?.logo }
				: { id: m?.teams?.home?.id ?? 0, name: m?.teams?.home?.name, logo: m?.teams?.home?.logo },
			venue: isHome ? 'home' : 'away',
			score: { for: forGoals, against: againstGoals },
			result
		}
	})

	const summary = items.reduce(
		(acc, it) => {
			if (it.result === 'W') acc.win += 1
			else if (it.result === 'D') acc.draw += 1
			else acc.loss += 1
			acc.goalsFor += it.score.for
			acc.goalsAgainst += it.score.against
			return acc
		},
		{ win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 }
	)
	summary.goalDiff = summary.goalsFor - summary.goalsAgainst

	// 실제 사용한 경기 수로 last 갱신
	return { teamId, last: items.length, items, summary }
}

export async function fetchTeamTopPlayers(teamId: TeamId): Promise<TeamTopPlayersSummary> {
	// 선수 통계와 스쿼드를 병렬로 조회하여 이름 매핑
	const [statsRes, squadRes] = await Promise.all([
		fetchTeamPlayerStats(String(teamId)),
		fetchTeamSquad(String(teamId))
	])

	const idToName = new Map<number, string>()
	try {
		if ((squadRes as SquadResponse)?.success && Array.isArray((squadRes as SquadResponse).data)) {
			for (const p of (squadRes as SquadResponse).data!) {
				if (p?.id && p?.name) idToName.set(Number(p.id), String(p.name))
			}
		}
	} catch {}

	// 선수 ID 목록 수집
	const playerIds: number[] = []
	if (statsRes.success && statsRes.data) {
		for (const idStr of Object.keys(statsRes.data)) {
			playerIds.push(Number(idStr))
		}
	}

	// 한글명 일괄 조회 (DB)
	const koreanNames = await getPlayersKoreanNames(playerIds)

	const players: TopPlayerItem[] = []
	if (statsRes.success && statsRes.data) {
		for (const [idStr, s] of Object.entries(statsRes.data)) {
			const id = Number(idStr)
			// 1순위: 한글명, 2순위: 스쿼드에서 가져온 이름
			const koreanName = koreanNames[id]
			const squadName = idToName.get(id)
			const displayName = koreanName || squadName || undefined
			players.push({ playerId: id, name: displayName, goals: (s as PlayerStats).goals || 0, assists: (s as PlayerStats).assists || 0 })
		}
	}

	const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 5)
	const topAssist = [...players].sort((a, b) => b.assists - a.assists).slice(0, 5)

	return { teamId, topScorers, topAssist }
}

export async function getHeadToHeadTestData(teamA: TeamId, teamB: TeamId, last: number = 5): Promise<HeadToHeadTestData> {
	const [h2h, recentA, recentB, topA, topB] = await Promise.all([
		fetchHeadToHead(teamA, teamB, last),
		fetchTeamRecentForm(teamA, last),
		fetchTeamRecentForm(teamB, last),
		fetchTeamTopPlayers(teamA),
		fetchTeamTopPlayers(teamB)
	])

	// 4590 표준: 모든 선수 ID 수집하여 Storage URL 배치 조회
	const allPlayerIds = new Set<number>()
	for (const p of topA.topScorers) allPlayerIds.add(p.playerId)
	for (const p of topA.topAssist) allPlayerIds.add(p.playerId)
	for (const p of topB.topScorers) allPlayerIds.add(p.playerId)
	for (const p of topB.topAssist) allPlayerIds.add(p.playerId)

	// 4590 표준: 모든 팀 ID 수집 (메인 팀 + 최근 경기 상대팀)
	const allTeamIds = new Set<number>([teamA, teamB])
	for (const item of recentA.items) {
		if (item.opponent.id) allTeamIds.add(item.opponent.id)
	}
	for (const item of recentB.items) {
		if (item.opponent.id) allTeamIds.add(item.opponent.id)
	}

	const [playerPhotoUrls, teamLogoUrls] = await Promise.all([
		getPlayerPhotoUrls([...allPlayerIds]),
		getTeamLogoUrls([...allTeamIds])
	])

	return {
		teamA,
		teamB,
		h2h,
		recent: { teamA: recentA, teamB: recentB },
		topPlayers: { teamA: topA, teamB: topB },
		playerPhotoUrls,
		teamLogoUrls
	}
}

// Power 데이터 가져오기
export async function fetchCachedPowerData(
	teamA: TeamId,
	teamB: TeamId,
	last: number = 5
): Promise<{ success: boolean; data?: HeadToHeadTestData; error?: string }> {
	try {
		if (!teamA || !teamB) {
			return { success: false, error: '팀 ID가 필요합니다' }
		}

		const data = await getHeadToHeadTestData(teamA, teamB, last)
		return { success: true, data }
	} catch (error) {
		console.error('[fetchCachedPowerData] 오류:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : '전력 데이터를 불러오는데 실패했습니다'
		}
	}
}

// React cache로 래핑된 버전 (동일 렌더링 사이클 내 중복 호출 방지)
export const getCachedPowerData = cache(fetchCachedPowerData)


