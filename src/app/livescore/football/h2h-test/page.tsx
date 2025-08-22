import { Suspense } from 'react'
import { getHeadToHeadTestData } from '@/domains/livescore/actions/match/headtohead'

type SearchParams = Promise<{
	teamA?: string
	teamB?: string
	last?: string
}>

export const dynamic = 'force-dynamic'

async function Content({ searchParams }: { searchParams: SearchParams }) {
	const params = await searchParams
	const teamA = Number(params.teamA || 33) // 예: 맨유 33
	const teamB = Number(params.teamB || 50) // 예: 맨시티 50
	const last = Number(params.last || 5)

	const data = await getHeadToHeadTestData(teamA, teamB, last)

	// 팀 메타 (이름/로고) 추출 - H2H 항목에서 우선 추출, 없으면 미디어 CDN 폴백
	const findTeamMeta = (id: number) => {
		const item = data.h2h.items.find((m) => m.teams.home.id === id || m.teams.away.id === id)
		if (item) {
			const t = item.teams.home.id === id ? item.teams.home : item.teams.away
			return {
				name: t.name || `#${id}`,
				logo: t.logo || `https://media.api-sports.io/football/teams/${id}.png`
			}
		}
		return {
			name: `#${id}`,
			logo: `https://media.api-sports.io/football/teams/${id}.png`
		}
	}

	const teamAMeta = findTeamMeta(data.teamA)
	const teamBMeta = findTeamMeta(data.teamB)

	return (
		<div className="mx-auto max-w-5xl p-4 space-y-12">
			<section>
				{/* 상단 헤더: 좌/우 분할 */}
				<div className="grid grid-cols-3 items-center mb-4">
					<div className="flex items-center gap-3 justify-start">
						<img src={teamAMeta.logo} alt="teamA" className="h-10 w-10 rounded-full" />
						<div>
							<div className="text-lg font-bold leading-tight">{teamAMeta.name}</div>
							<div className="text-xs text-gray-500">팀 A</div>
						</div>
					</div>
					<div className="text-center">
						<div className="text-xs text-gray-500">헤드 투 헤드 테스트</div>
						<div className="text-2xl font-extrabold">VS</div>
					</div>
					<div className="flex items-center gap-3 justify-end">
						<div className="text-right">
							<div className="text-lg font-bold leading-tight">{teamBMeta.name}</div>
							<div className="text-xs text-gray-500">팀 B</div>
						</div>
						<img src={teamBMeta.logo} alt="teamB" className="h-10 w-10 rounded-full" />
					</div>
				</div>

				<h2 className="text-xl font-bold mb-2">H2H 최근 {data.h2h.last}경기</h2>
				<div className="grid gap-2">
					{data.h2h.items.map((m) => (
						(() => {
							const isTeamAHome = m.teams.home.id === data.teamA
							const aScore = isTeamAHome ? m.score.home : m.score.away
							const bScore = isTeamAHome ? m.score.away : m.score.home
							return (
								<div key={m.fixtureId} className="grid grid-cols-3 items-center rounded border p-2 text-sm">
									<div className="flex items-center justify-end gap-2">
										<img src={teamAMeta.logo} alt="A" className="h-4 w-4" />
										<span className="font-semibold">{aScore}</span>
									</div>
									<div className="text-center text-gray-600">
										<div>{new Date(m.utcDate).toLocaleDateString()}</div>
										<div className="text-xs">{m.league.name}</div>
									</div>
									<div className="flex items-center justify-start gap-2">
										<span className="font-semibold">{bScore}</span>
										<img src={teamBMeta.logo} alt="B" className="h-4 w-4" />
									</div>
								</div>
							)
						})()
					))}
				</div>
				<div className="mt-2 text-sm">
					<p>팀A: W {data.h2h.resultSummary.teamA.win} / D {data.h2h.resultSummary.teamA.draw} / L {data.h2h.resultSummary.teamA.loss} | GF {data.h2h.resultSummary.teamA.goalsFor} GA {data.h2h.resultSummary.teamA.goalsAgainst} GD {data.h2h.resultSummary.teamA.goalDiff}</p>
					<p>팀B: W {data.h2h.resultSummary.teamB.win} / D {data.h2h.resultSummary.teamB.draw} / L {data.h2h.resultSummary.teamB.loss} | GF {data.h2h.resultSummary.teamB.goalsFor} GA {data.h2h.resultSummary.teamB.goalsAgainst} GD {data.h2h.resultSummary.teamB.goalDiff}</p>
				</div>
			</section>

			<section>
				<h2 className="text-xl font-bold mb-2">최근 폼 (팀A)</h2>
				<div className="flex gap-2 flex-wrap text-sm">
					{data.recent.teamA.items.map((it) => (
						<div key={it.fixtureId} className="rounded border px-2 py-1 flex items-center gap-2">
							<span className="font-medium mr-1">{it.result}</span>
							{it.opponent?.logo ? <img src={it.opponent.logo} alt="opponent" className="h-4 w-4" /> : null}
							<span>{it.venue === 'home' ? 'vs' : '@'} {it.opponent.name}</span>
							<span className="ml-1">{it.score.for}-{it.score.against}</span>
						</div>
					))}
				</div>
				<p className="mt-2 text-sm">W {data.recent.teamA.summary.win} / D {data.recent.teamA.summary.draw} / L {data.recent.teamA.summary.loss} | GF {data.recent.teamA.summary.goalsFor} GA {data.recent.teamA.summary.goalsAgainst} GD {data.recent.teamA.summary.goalDiff}</p>
			</section>

			<section>
				<h2 className="text-xl font-bold mb-2">최근 폼 (팀B)</h2>
				<div className="flex gap-2 flex-wrap text-sm">
					{data.recent.teamB.items.map((it) => (
						<div key={it.fixtureId} className="rounded border px-2 py-1 flex items-center gap-2">
							<span className="font-medium mr-1">{it.result}</span>
							{it.opponent?.logo ? <img src={it.opponent.logo} alt="opponent" className="h-4 w-4" /> : null}
							<span>{it.venue === 'home' ? 'vs' : '@'} {it.opponent.name}</span>
							<span className="ml-1">{it.score.for}-{it.score.against}</span>
						</div>
					))}
				</div>
				<p className="mt-2 text-sm">W {data.recent.teamB.summary.win} / D {data.recent.teamB.summary.draw} / L {data.recent.teamB.summary.loss} | GF {data.recent.teamB.summary.goalsFor} GA {data.recent.teamB.summary.goalsAgainst} GD {data.recent.teamB.summary.goalDiff}</p>
			</section>

			<section>
				<h2 className="text-xl font-bold mb-2">팀 탑 플레이어</h2>
				{/* 좌/우 분할 - 중앙 기준 */}
				<div className="grid grid-cols-3 gap-4">
					{/* 좌측: 팀A */}
					<div className="space-y-3">
						<div className="flex items-center justify-start gap-2">
							<img src={teamAMeta.logo} className="h-5 w-5" />
							<span className="font-semibold">{teamAMeta.name}</span>
						</div>
						<div>
							<div className="text-sm font-medium mb-1">탑 스코어러</div>
							<ul className="text-sm space-y-1">
								{data.topPlayers.teamA.topScorers.map((p) => (
									<li key={p.playerId} className="flex items-center gap-2 justify-start">
										<img src={`https://media.api-sports.io/football/players/${p.playerId}.png`} className="h-6 w-6 rounded-full" />
										<span className="truncate">{p.name || `#${p.playerId}`}</span>
										<span className="text-gray-600">{p.goals}골</span>
									</li>
								))}
							</ul>
						</div>
						<div>
							<div className="text-sm font-medium mb-1">탑 어시스터</div>
							<ul className="text-sm space-y-1">
								{data.topPlayers.teamA.topAssist.map((p) => (
									<li key={p.playerId} className="flex items-center gap-2 justify-start">
										<img src={`https://media.api-sports.io/football/players/${p.playerId}.png`} className="h-6 w-6 rounded-full" />
										<span className="truncate">{p.name || `#${p.playerId}`}</span>
										<span className="text-gray-600">{p.assists}도움</span>
									</li>
								))}
							</ul>
						</div>
					</div>

					{/* 중앙 구분선 */}
					<div className="flex items-stretch justify-center">
						<div className="w-px bg-gray-200" />
					</div>

					{/* 우측: 팀B - 우측 정렬 */}
					<div className="space-y-3">
						<div className="flex items-center justify-end gap-2">
							<span className="font-semibold">{teamBMeta.name}</span>
							<img src={teamBMeta.logo} className="h-5 w-5" />
						</div>
						<div>
							<div className="text-sm font-medium mb-1 text-right">탑 스코어러</div>
							<ul className="text-sm space-y-1">
								{data.topPlayers.teamB.topScorers.map((p) => (
									<li key={p.playerId} className="flex items-center gap-2 justify-end">
										<span className="text-gray-600">{p.goals}골</span>
										<span className="truncate">{p.name || `#${p.playerId}`}</span>
										<img src={`https://media.api-sports.io/football/players/${p.playerId}.png`} className="h-6 w-6 rounded-full" />
									</li>
								))}
							</ul>
						</div>
						<div>
							<div className="text-sm font-medium mb-1 text-right">탑 어시스터</div>
							<ul className="text-sm space-y-1">
								{data.topPlayers.teamB.topAssist.map((p) => (
									<li key={p.playerId} className="flex items-center gap-2 justify-end">
										<span className="text-gray-600">{p.assists}도움</span>
										<span className="truncate">{p.name || `#${p.playerId}`}</span>
										<img src={`https://media.api-sports.io/football/players/${p.playerId}.png`} className="h-6 w-6 rounded-full" />
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-xl font-bold mb-2">Raw JSON</h2>
				<details className="rounded border p-2 bg-gray-50">
					<summary className="cursor-pointer select-none">데이터 펼치기/접기</summary>
					<pre className="overflow-auto text-xs mt-2">
						{JSON.stringify(data, null, 2)}
					</pre>
				</details>
			</section>
		</div>
	)
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
	return (
		<Suspense>
			<Content searchParams={searchParams} />
		</Suspense>
	)
}


