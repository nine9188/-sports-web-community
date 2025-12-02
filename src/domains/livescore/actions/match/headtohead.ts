'use server'

import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi'
import { fetchTeamPlayerStats } from '@/domains/livescore/actions/teams/player-stats'
import { fetchTeamSquad } from '@/domains/livescore/actions/teams/squad'

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

	const players: TopPlayerItem[] = []
	if (statsRes.success && statsRes.data) {
		for (const [idStr, s] of Object.entries(statsRes.data)) {
			const id = Number(idStr)
			players.push({ playerId: id, name: idToName.get(id), goals: (s as PlayerStats).goals || 0, assists: (s as PlayerStats).assists || 0 })
		}
	}

	const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 5)
	const topAssist = [...players].sort((a, b) => b.assists - a.assists).slice(0, 5)

	// 이름이 비어있는 경우 players API로 보강 (테스트 페이지용 보강)
	const now = new Date()
	const year = now.getFullYear()
	const month = now.getMonth() + 1
	const season = month >= 7 ? year : year - 1

	async function fillNames(items: TopPlayerItem[]): Promise<TopPlayerItem[]> {
		const missingIds = items.filter(p => !p.name).map(p => p.playerId)
		if (missingIds.length === 0) return items
		const results = await Promise.all(missingIds.map(async (id) => {
			try {
				const res = await fetchFromFootballApi('players', { id, season })
				const name = res?.response?.[0]?.player?.name as string | undefined
				return { id, name }
			} catch {
				return { id, name: undefined }
			}
		}))
		const idToName2 = new Map<number, string>()
		results.forEach(r => { if (r.name) idToName2.set(r.id, r.name) })
		return items.map(it => it.name ? it : { ...it, name: idToName2.get(it.playerId) })
	}

	const [scorersFilled, assistFilled] = await Promise.all([
		fillNames(topScorers),
		fillNames(topAssist)
	])

	return { teamId, topScorers: scorersFilled, topAssist: assistFilled }
}

export async function getHeadToHeadTestData(teamA: TeamId, teamB: TeamId, last: number = 5): Promise<HeadToHeadTestData> {
	const [h2h, recentA, recentB, topA, topB] = await Promise.all([
		fetchHeadToHead(teamA, teamB, last),
		fetchTeamRecentForm(teamA, last),
		fetchTeamRecentForm(teamB, last),
		fetchTeamTopPlayers(teamA),
		fetchTeamTopPlayers(teamB)
	])

	return {
		teamA,
		teamB,
		h2h,
		recent: { teamA: recentA, teamB: recentB },
		topPlayers: { teamA: topA, teamB: topB }
	}
}


