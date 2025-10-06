import { createClient } from '@/shared/api/supabaseServer'

export default async function TestPage() {
  const supabase = await createClient()

  // football_teams 테이블의 모든 데이터 조회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allTeams, error } = await (supabase as any)
    .from('football_teams')
    .select('*')
    .order('league_id')
    .order('name')
    .limit(1000)

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">football_teams 테이블 데이터</h1>
        <div className="text-red-600">
          오류 발생: {error.message}
        </div>
      </div>
    )
  }

  // 리그별로 그룹화
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leagueGroups = (allTeams || []).reduce((acc: any, team: any) => {
    const leagueId = team.league_id
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league_id: leagueId,
        league_name: team.league_name,
        teams: []
      }
    }
    acc[leagueId].teams.push(team)
    return acc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<number, { league_id: number; league_name: string; teams: any[] }>)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leagues = Object.values(leagueGroups).sort((a: any, b: any) => a.league_id - b.league_id)

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold mb-2">football_teams 테이블 데이터</h1>
        <div className="text-sm text-gray-600">
          총 {allTeams?.length || 0}개 팀 / {leagues.length}개 리그
        </div>
      </div>

      {/* 리그별 요약 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">리그별 팀 수</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {leagues.map((league) => (
            <div key={league.league_id} className="border rounded p-3">
              <div className="text-sm font-medium text-gray-700">
                {league.league_name || `리그 ${league.league_id}`}
              </div>
              <div className="text-xs text-gray-500">
                ID: {league.league_id} | {league.teams.length}개 팀
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 리그별 상세 팀 목록 */}
      {leagues.map((league) => (
        <div key={league.league_id} className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 border-b px-6 py-3">
            <h3 className="text-lg font-semibold">
              {league.league_name || `리그 ${league.league_id}`}
            </h3>
            <div className="text-sm text-gray-600">
              리그 ID: {league.league_id} | {league.teams.length}개 팀
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">팀 ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">팀명 (display_name)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">원본명 (name)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">국가</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">홈구장</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">순위</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">활성</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {league.teams.map((team: any) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900">{team.team_id}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">{team.display_name}</td>
                    <td className="px-4 py-2 text-gray-600">{team.name}</td>
                    <td className="px-4 py-2 text-gray-600">{team.country}</td>
                    <td className="px-4 py-2 text-gray-600">{team.venue_name || '-'}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{team.current_position || '-'}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${team.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {team.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
