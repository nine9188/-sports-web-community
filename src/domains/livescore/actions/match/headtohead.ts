'use server'

import { fetchFromFootballApi } from '@/domains/livescore/actions/footballApi'
import { getPlayersKoreanNames } from '@/domains/livescore/actions/player/getKoreanName'
import { getPlayerPhotoUrls, getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images'
import { getCurrentSeasonForLeague } from '@/domains/livescore/actions/teamLeagueData'
import { getSupabaseServer } from '@/shared/lib/supabase/server'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// Utilities

const FINISHED_STATUSES = ['FT', 'AET', 'PEN']

async function fetchWithRetry<T>(fn: () => Promise<T>, maxRetries: number = 1): Promise<T> {
	for (let i = 0; i <= maxRetries; i++) {
		try {
			return await fn()
		} catch (error) {
			if (i === maxRetries) throw error
			await new Promise(r => setTimeout(r, 300))
		}
	}
	throw new Error('fetchWithRetry: unreachable')
}

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
	photo?: string
	goals: number
	assists: number
}

interface ApiFixtureResponse {
	fixture?: { id?: number; date?: string; status?: { short?: string } }
	league?: { id?: number; name?: string; country?: string; logo?: string }
	teams?: {
		home?: { id?: number; name?: string; logo?: string }
		away?: { id?: number; name?: string; logo?: string }
	}
	goals?: { home?: number; away?: number }
}

interface ApiTopPlayerResponse {
	player?: {
		id?: number
		name?: string
		photo?: string
	}
	statistics?: Array<{
		goals?: {
			total?: number | null
			assists?: number | null
		}
	}>
}

interface TeamTopPlayersSummary {
	teamId: TeamId
	topScorers: TopPlayerItem[]
	topAssist: TopPlayerItem[]
	playerPhotoUrls?: Record<number, string>
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
	// 4590 storage player photo URLs keyed by player ID.
	playerPhotoUrls?: Record<number, string>
	// 4590 storage team logo URLs keyed by team ID.
	teamLogoUrls?: Record<number, string>
	// 4590 storage league logo URLs keyed by league ID.
	leagueLogoUrls?: Record<number, string>
	// False when part of the Promise.allSettled data failed.
	isComplete?: boolean
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
		throw new Error('Team IDs are required')
	}

	// Do not pass a status filter so AET/PEN finished matches can be included.
	// Fetch all results first, then filter finished statuses in code.
	const data = await fetchFromFootballApi('fixtures/headtohead', {
		h2h: `${teamA}-${teamB}`,
		last: last * 2,
	})

	const finishedMatches = (data?.response || []).filter(
		(m: ApiFixtureResponse) => FINISHED_STATUSES.includes(m?.fixture?.status?.short ?? '')
	)

	const items: FixtureSummaryItem[] = finishedMatches.slice(0, last).map((m: ApiFixtureResponse) => {
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
	// Do not pass a status filter so AET/PEN matches can be included, then filter in code.
	const fixturesData = await fetchFromFootballApi('fixtures', {
		team: teamId,
		last: last * 3,
	})

	const allFixtures: ApiFixtureResponse[] = Array.isArray(fixturesData?.response) ? fixturesData.response : []
	const fixtures = allFixtures.filter(
		m => FINISHED_STATUSES.includes(m?.fixture?.status?.short ?? '')
	)

	// Sort newest first and keep the requested number of matches.
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

	// Keep the latest actually usable matches.
	return { teamId, last: items.length, items, summary }
}

async function resolveTeamLeagueAndSeason(teamId: TeamId) {
	let leagueId: number | undefined

	try {
		const supabase = await getSupabaseServer()
		const { data: teamRow } = await supabase
			.from('football_teams')
			.select('league_id')
			.eq('team_id', teamId)
			.single()

		if (teamRow?.league_id) leagueId = Number(teamRow.league_id)
	} catch {}

	const season = await getCurrentSeasonForLeague(leagueId || 39)
	return { leagueId: leagueId || 39, season }
}

function mapTopPlayerResponse(response: ApiTopPlayerResponse[]): TopPlayerItem[] {
	const players = new Map<number, TopPlayerItem>()

	for (const row of response) {
		const id = row.player?.id
		if (!id) continue

		const stats = row.statistics?.[0]
		const goals = typeof stats?.goals?.total === 'number' ? stats.goals.total : 0
		const assists = typeof stats?.goals?.assists === 'number' ? stats.goals.assists : 0

		if (!players.has(id)) {
			players.set(id, {
				playerId: id,
				name: row.player?.name,
				photo: row.player?.photo,
				goals,
				assists
			})
		}
	}

	return [...players.values()]
}

async function fetchTeamTopPlayersRaw(teamId: TeamId, season: number, league: number): Promise<TopPlayerItem[]> {
	const firstPage = await fetchFromFootballApi('players', { team: teamId, season, league, page: 1 })
	const firstResponse = Array.isArray(firstPage?.response) ? firstPage.response as ApiTopPlayerResponse[] : []
	const totalPages = Math.min(Number(firstPage?.paging?.total || 1), 3)

	const restPages = totalPages > 1
		? await Promise.all(
			Array.from({ length: totalPages - 1 }, (_, index) => index + 2).map(page =>
				fetchFromFootballApi('players', { team: teamId, season, league, page })
					.catch(() => ({ response: [] }))
			)
		)
		: []

	const restResponse = restPages.flatMap(page =>
		Array.isArray(page?.response) ? page.response as ApiTopPlayerResponse[] : []
	)

	return mapTopPlayerResponse([...firstResponse, ...restResponse])
}

export async function fetchTeamTopPlayers(teamId: TeamId): Promise<TeamTopPlayersSummary> {
	const { leagueId, season } = await resolveTeamLeagueAndSeason(teamId)
	let players = await fetchTeamTopPlayersRaw(teamId, season, leagueId)

	if (players.length < 5) {
		const previousPlayers = await fetchTeamTopPlayersRaw(teamId, season - 1, leagueId).catch(() => [])
		players = [...players, ...previousPlayers.filter(player => !players.some(current => current.playerId === player.playerId))]
	}

	const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 5)
	const topAssist = [...players].sort((a, b) => b.assists - a.assists).slice(0, 5)
	const topPlayerIds = [...new Set([...topScorers, ...topAssist].map(player => player.playerId))]
	const koreanNames = topPlayerIds.length > 0 ? await getPlayersKoreanNames(topPlayerIds) : {}

	const applyKoreanNames = (player: TopPlayerItem): TopPlayerItem => ({
		...player,
		name: koreanNames[player.playerId] || player.name
	})

	const playerPhotoUrls: Record<number, string> = {}
	for (const player of [...topScorers, ...topAssist]) {
		if (player.photo) playerPhotoUrls[player.playerId] = player.photo
	}

	return {
		teamId,
		topScorers: topScorers.map(applyKoreanNames),
		topAssist: topAssist.map(applyKoreanNames),
		playerPhotoUrls
	}
}

export async function getHeadToHeadTestData(teamA: TeamId, teamB: TeamId, last: number = 5): Promise<HeadToHeadTestData> {
	// Promise.allSettled + fetchWithRetry lets partial data render when one source fails.
	const emptyH2H: HeadToHeadSummary = { teamA, teamB, last, items: [], resultSummary: { teamA: { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 }, teamB: { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 } } }
	const emptyRecent = (id: TeamId): TeamRecentFormSummary => ({ teamId: id, last: 0, items: [], summary: { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 } })
	const emptyTop = (id: TeamId): TeamTopPlayersSummary => ({ teamId: id, topScorers: [], topAssist: [] })
	const timed = async <T,>(fn: () => Promise<T>): Promise<T> => {
		try {
			return await fn()
		} catch (error) {
			throw error
		}
	}

	const results = await Promise.allSettled([
		timed(() => fetchWithRetry(() => fetchHeadToHead(teamA, teamB, last))),
		timed(() => fetchWithRetry(() => fetchTeamRecentForm(teamA, last))),
		timed(() => fetchWithRetry(() => fetchTeamRecentForm(teamB, last))),
		timed(() => fetchWithRetry(() => fetchTeamTopPlayers(teamA))),
		timed(() => fetchWithRetry(() => fetchTeamTopPlayers(teamB)))
	])

	const h2h = results[0].status === 'fulfilled' ? results[0].value : emptyH2H
	const recentA = results[1].status === 'fulfilled' ? results[1].value : emptyRecent(teamA)
	const recentB = results[2].status === 'fulfilled' ? results[2].value : emptyRecent(teamB)
	const topA = results[3].status === 'fulfilled' ? results[3].value : emptyTop(teamA)
	const topB = results[4].status === 'fulfilled' ? results[4].value : emptyTop(teamB)

	const isComplete = results.every(r => r.status === 'fulfilled')

	// Collect player, team, and league IDs for 4590 image lookups.
	const allPlayerIds = new Set<number>()
	for (const p of topA.topScorers) allPlayerIds.add(p.playerId)
	for (const p of topA.topAssist) allPlayerIds.add(p.playerId)
	for (const p of topB.topScorers) allPlayerIds.add(p.playerId)
	for (const p of topB.topAssist) allPlayerIds.add(p.playerId)

	const allTeamIds = new Set<number>([teamA, teamB])
	for (const item of recentA.items) {
		if (item.opponent.id) allTeamIds.add(item.opponent.id)
	}
	for (const item of recentB.items) {
		if (item.opponent.id) allTeamIds.add(item.opponent.id)
	}

	const allLeagueIds = new Set<number>()
	for (const item of h2h.items) {
		if (item.league.id) allLeagueIds.add(item.league.id)
	}

	const [playerPhotoUrls, teamLogoUrls, leagueLogoUrls] = await Promise.all([
		allPlayerIds.size > 0 ? getPlayerPhotoUrls([...allPlayerIds]) : Promise.resolve({}),
		getTeamLogoUrls([...allTeamIds]),
		allLeagueIds.size > 0 ? getLeagueLogoUrls([...allLeagueIds]) : Promise.resolve({})
	])
	return {
		teamA,
		teamB,
		h2h,
		recent: { teamA: recentA, teamB: recentB },
		topPlayers: { teamA: topA, teamB: topB },
		playerPhotoUrls,
		teamLogoUrls,
		leagueLogoUrls,
		isComplete
	}
}

// Fetch power tab data with a 6-hour server cache.
function createEmptyH2H(teamA: TeamId, teamB: TeamId, last: number): HeadToHeadSummary {
	return {
		teamA,
		teamB,
		last,
		items: [],
		resultSummary: {
			teamA: { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 },
			teamB: { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 }
		}
	}
}

function createEmptyRecent(teamId: TeamId): TeamRecentFormSummary {
	return {
		teamId,
		last: 0,
		items: [],
		summary: { win: 0, draw: 0, loss: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0 }
	}
}

function createEmptyTopPlayers(teamId: TeamId): TeamTopPlayersSummary {
	return { teamId, topScorers: [], topAssist: [] }
}

export async function getPowerSummaryData(teamA: TeamId, teamB: TeamId, last: number = 5): Promise<HeadToHeadTestData> {
	const results = await Promise.allSettled([
		fetchWithRetry(() => fetchHeadToHead(teamA, teamB, last)),
		fetchWithRetry(() => fetchTeamRecentForm(teamA, last)),
		fetchWithRetry(() => fetchTeamRecentForm(teamB, last))
	])

	const h2h = results[0].status === 'fulfilled' ? results[0].value : createEmptyH2H(teamA, teamB, last)
	const recentA = results[1].status === 'fulfilled' ? results[1].value : createEmptyRecent(teamA)
	const recentB = results[2].status === 'fulfilled' ? results[2].value : createEmptyRecent(teamB)

	const allTeamIds = new Set<number>([teamA, teamB])
	for (const item of recentA.items) {
		if (item.opponent.id) allTeamIds.add(item.opponent.id)
	}
	for (const item of recentB.items) {
		if (item.opponent.id) allTeamIds.add(item.opponent.id)
	}

	const allLeagueIds = new Set<number>()
	for (const item of h2h.items) {
		if (item.league.id) allLeagueIds.add(item.league.id)
	}

	const [teamLogoUrls, leagueLogoUrls] = await Promise.all([
		getTeamLogoUrls([...allTeamIds]),
		allLeagueIds.size > 0 ? getLeagueLogoUrls([...allLeagueIds]) : Promise.resolve({})
	])

	return {
		teamA,
		teamB,
		h2h,
		recent: { teamA: recentA, teamB: recentB },
		topPlayers: {
			teamA: createEmptyTopPlayers(teamA),
			teamB: createEmptyTopPlayers(teamB)
		},
		teamLogoUrls,
		leagueLogoUrls,
		isComplete: results.every(r => r.status === 'fulfilled')
	}
}

export async function getPowerRecentData(teamA: TeamId, teamB: TeamId, last: number = 5): Promise<HeadToHeadTestData> {
	const results = await Promise.allSettled([
		fetchWithRetry(() => fetchTeamRecentForm(teamA, last)),
		fetchWithRetry(() => fetchTeamRecentForm(teamB, last))
	])

	const recentA = results[0].status === 'fulfilled' ? results[0].value : createEmptyRecent(teamA)
	const recentB = results[1].status === 'fulfilled' ? results[1].value : createEmptyRecent(teamB)

	const allTeamIds = new Set<number>([teamA, teamB])
	for (const item of recentA.items) {
		if (item.opponent.id) allTeamIds.add(item.opponent.id)
	}
	for (const item of recentB.items) {
		if (item.opponent.id) allTeamIds.add(item.opponent.id)
	}

	const teamLogoUrls = await getTeamLogoUrls([...allTeamIds])

	return {
		teamA,
		teamB,
		h2h: createEmptyH2H(teamA, teamB, last),
		recent: { teamA: recentA, teamB: recentB },
		topPlayers: {
			teamA: createEmptyTopPlayers(teamA),
			teamB: createEmptyTopPlayers(teamB)
		},
		teamLogoUrls,
		isComplete: results.every(r => r.status === 'fulfilled')
	}
}

export async function getPowerH2HData(teamA: TeamId, teamB: TeamId, last: number = 5): Promise<HeadToHeadTestData> {
	const result = await fetchWithRetry(() => fetchHeadToHead(teamA, teamB, last))
		.then(data => ({ success: true as const, data }))
		.catch(() => ({ success: false as const, data: createEmptyH2H(teamA, teamB, last) }))

	const allTeamIds = new Set<number>([teamA, teamB])
	for (const item of result.data.items) {
		if (item.teams.home.id) allTeamIds.add(item.teams.home.id)
		if (item.teams.away.id) allTeamIds.add(item.teams.away.id)
	}

	const allLeagueIds = new Set<number>()
	for (const item of result.data.items) {
		if (item.league.id) allLeagueIds.add(item.league.id)
	}

	const [teamLogoUrls, leagueLogoUrls] = await Promise.all([
		getTeamLogoUrls([...allTeamIds]),
		allLeagueIds.size > 0 ? getLeagueLogoUrls([...allLeagueIds]) : Promise.resolve({})
	])

	return {
		teamA,
		teamB,
		h2h: result.data,
		recent: {
			teamA: createEmptyRecent(teamA),
			teamB: createEmptyRecent(teamB)
		},
		topPlayers: {
			teamA: createEmptyTopPlayers(teamA),
			teamB: createEmptyTopPlayers(teamB)
		},
		teamLogoUrls,
		leagueLogoUrls,
		isComplete: result.success
	}
}

export async function getPowerTopPlayersData(teamA: TeamId, teamB: TeamId, last: number = 5): Promise<HeadToHeadTestData> {
	const results = await Promise.allSettled([
		fetchWithRetry(() => fetchTeamTopPlayers(teamA)),
		fetchWithRetry(() => fetchTeamTopPlayers(teamB))
	])

	const topA = results[0].status === 'fulfilled' ? results[0].value : createEmptyTopPlayers(teamA)
	const topB = results[1].status === 'fulfilled' ? results[1].value : createEmptyTopPlayers(teamB)

	const teamLogoUrls = await getTeamLogoUrls([teamA, teamB])
	const playerPhotoUrls: Record<number, string> = {
		...(topA.playerPhotoUrls || {}),
		...(topB.playerPhotoUrls || {})
	}

	return {
		teamA,
		teamB,
		h2h: createEmptyH2H(teamA, teamB, last),
		recent: {
			teamA: createEmptyRecent(teamA),
			teamB: createEmptyRecent(teamB)
		},
		topPlayers: { teamA: topA, teamB: topB },
		playerPhotoUrls,
		teamLogoUrls,
		isComplete: results.every(r => r.status === 'fulfilled')
	}
}

async function _fetchPowerDataImpl(
	teamA: TeamId,
	teamB: TeamId,
	last: number
): Promise<{ success: boolean; data?: HeadToHeadTestData; error?: string }> {
	try {
		if (!teamA || !teamB) {
			return { success: false, error: 'Team IDs are required' }
		}
		const data = await getHeadToHeadTestData(teamA, teamB, last)
		return { success: true, data }
	} catch (error) {
		console.error('[fetchCachedPowerData] error:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to load power data.'
		}
	}
}

export async function fetchCachedPowerData(
	teamA: TeamId,
	teamB: TeamId,
	last: number = 5
): Promise<{ success: boolean; data?: HeadToHeadTestData; error?: string }> {
	return unstable_cache(
		() => _fetchPowerDataImpl(teamA, teamB, last),
		['power-data', String(teamA), String(teamB), String(last)],
		{ revalidate: 21600, tags: [`power-${teamA}-${teamB}`] }
	)()
}

// React cache prevents duplicate calls during the same render pass.
export async function fetchCachedPowerSummaryData(
	teamA: TeamId,
	teamB: TeamId,
	last: number = 5
): Promise<{ success: boolean; data?: HeadToHeadTestData; error?: string }> {
	return unstable_cache(
		async () => {
			try {
				if (!teamA || !teamB) return { success: false, error: 'Team IDs are required' }
				const data = await getPowerSummaryData(teamA, teamB, last)
				return { success: true, data }
			} catch (error) {
				console.error('[fetchCachedPowerSummaryData] error:', error)
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Failed to load power summary data.'
				}
			}
		},
		['power-summary-data', String(teamA), String(teamB), String(last)],
		{ revalidate: 21600, tags: [`power-summary-${teamA}-${teamB}`] }
	)()
}

export async function fetchCachedPowerRecentData(
	teamA: TeamId,
	teamB: TeamId,
	last: number = 5
): Promise<{ success: boolean; data?: HeadToHeadTestData; error?: string }> {
	return unstable_cache(
		async () => {
			try {
				if (!teamA || !teamB) return { success: false, error: 'Team IDs are required' }
				const data = await getPowerRecentData(teamA, teamB, last)
				return { success: true, data }
			} catch (error) {
				console.error('[fetchCachedPowerRecentData] error:', error)
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Failed to load power recent data'
				}
			}
		},
		['power-recent-data', String(teamA), String(teamB), String(last)],
		{ revalidate: 21600, tags: [`power-recent-${teamA}-${teamB}`] }
	)()
}

export async function fetchCachedPowerH2HData(
	teamA: TeamId,
	teamB: TeamId,
	last: number = 5
): Promise<{ success: boolean; data?: HeadToHeadTestData; error?: string }> {
	return unstable_cache(
		async () => {
			try {
				if (!teamA || !teamB) return { success: false, error: 'Team IDs are required' }
				const data = await getPowerH2HData(teamA, teamB, last)
				return { success: true, data }
			} catch (error) {
				console.error('[fetchCachedPowerH2HData] error:', error)
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Failed to load power h2h data'
				}
			}
		},
		['power-h2h-data', String(teamA), String(teamB), String(last)],
		{ revalidate: 21600, tags: [`power-h2h-${teamA}-${teamB}`] }
	)()
}

export async function fetchCachedPowerTopPlayersData(
	teamA: TeamId,
	teamB: TeamId,
	last: number = 5
): Promise<{ success: boolean; data?: HeadToHeadTestData; error?: string }> {
	return unstable_cache(
		async () => {
			try {
				if (!teamA || !teamB) return { success: false, error: 'Team IDs are required' }
				const data = await getPowerTopPlayersData(teamA, teamB, last)
				return { success: true, data }
			} catch (error) {
				console.error('[fetchCachedPowerTopPlayersData] error:', error)
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Failed to load top player data.'
				}
			}
		},
		['power-top-players-data', String(teamA), String(teamB), String(last)],
		{ revalidate: 21600, tags: [`power-top-players-${teamA}-${teamB}`] }
	)()
}

export const getCachedPowerData = cache(fetchCachedPowerData)
export const getCachedPowerSummaryData = cache(fetchCachedPowerSummaryData)
export const getCachedPowerRecentData = cache(fetchCachedPowerRecentData)
export const getCachedPowerH2HData = cache(fetchCachedPowerH2HData)
export const getCachedPowerTopPlayersData = cache(fetchCachedPowerTopPlayersData)
