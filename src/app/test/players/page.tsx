import { getLeagueCompetitions } from './actions'
import { LeagueSquadViewer } from './LeagueSquadViewer'

export default async function PlayersTestPage() {
  const leagues = await getLeagueCompetitions()

  const totalTeams = leagues.reduce((sum, l) => sum + l.teams.length, 0)

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold mb-4">🏆 리그별 선수 명단 (API 조회 → DB 저장)</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">전체 리그</div>
            <div className="text-2xl font-bold">{leagues.length}</div>
          </div>
          <div className="p-3 bg-blue-50 rounded">
            <div className="text-sm text-blue-600">전체 팀</div>
            <div className="text-2xl font-bold text-blue-600">{totalTeams}</div>
          </div>
          <div className="p-3 bg-purple-50 rounded">
            <div className="text-sm text-purple-600">사용 방법</div>
            <div className="text-xs text-gray-600 mt-1">
              리그별로 한 번에 조회<br/>
              (팀별 개별 조회 X)
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <strong>개선사항:</strong> 리그 단위로 한 번에 모든 팀의 선수를 조회합니다. 
              API 호출 횟수가 획기적으로 줄어듭니다! (팀별 20회 → 리그별 1회)
            </div>
          </div>
        </div>
      </div>

      {/* 리그별 선수 조회 */}
      {leagues.map((league) => (
        <LeagueSquadViewer 
          key={league.league_id}
          league={league}
        />
      ))}
    </div>
  )
}

