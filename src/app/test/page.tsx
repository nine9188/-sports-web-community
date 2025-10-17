import { createClient } from '@/shared/api/supabaseServer'
import { ALL_TEAMS } from '@/domains/livescore/constants/teams'
import { UpdateButton } from './UpdateButton'

export default async function TestPage() {
  const supabase = await createClient()

  // football_teams 테이블의 모든 팀 조회
  const { data: dbTeams, error: fetchError } = await supabase
    .from('football_teams')
    .select('id, team_id, name, name_ko, country, country_ko, league_id, league_name, league_name_ko, display_name')
    .order('league_id', { ascending: true })
    .order('team_id', { ascending: true })

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">팀 매핑 업데이트</h1>
        <div className="text-red-600">
          오류 발생: {fetchError.message}
        </div>
      </div>
    )
  }

  // 매핑 데이터 생성
  const mappingData = dbTeams?.map(dbTeam => {
    const mapping = ALL_TEAMS.find(t => t.id === dbTeam.team_id)
    return {
      ...dbTeam,
      mapping_name_ko: mapping?.name_ko || null,
      mapping_country_ko: mapping?.country_ko || null,
      has_mapping: !!mapping,
    }
  })

  // 통계
  const stats = {
    total: mappingData?.length || 0,
    withMapping: mappingData?.filter(t => t.has_mapping).length || 0,
    withoutMapping: mappingData?.filter(t => !t.has_mapping).length || 0,
    needsUpdate: mappingData?.filter(t => 
      t.has_mapping && (
        t.name_ko !== t.mapping_name_ko || 
        t.country_ko !== t.mapping_country_ko
      )
    ).length || 0,
  }

  // 리그별로 그룹화
  const byLeague = mappingData?.reduce((acc, team) => {
    const leagueKey = `${team.league_id}_${team.league_name}`
    if (!acc[leagueKey]) {
      acc[leagueKey] = {
        league_id: team.league_id,
        league_name: team.league_name,
        league_name_ko: team.league_name_ko,
        teams: []
      }
    }
    acc[leagueKey].teams.push(team)
    return acc
  }, {} as Record<string, { league_id: number, league_name: string, league_name_ko: string | null, teams: typeof mappingData }>)

  const leagueGroups = Object.values(byLeague || {}).sort((a, b) => a.league_id - b.league_id)

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold mb-4">팀 한글명 매핑 업데이트</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">전체 팀</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <div className="text-sm text-green-600">매핑 있음</div>
            <div className="text-2xl font-bold text-green-600">{stats.withMapping}</div>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <div className="text-sm text-red-600">매핑 없음</div>
            <div className="text-2xl font-bold text-red-600">{stats.withoutMapping}</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded">
            <div className="text-sm text-yellow-600">업데이트 필요</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.needsUpdate}</div>
          </div>
        </div>
      </div>

      {/* 업데이트 버튼 섹션 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">일괄 업데이트</h2>
        <UpdateButton count={stats.needsUpdate} />
      </div>

      {/* 리그별 업데이트 필요한 팀 목록 */}
      {leagueGroups
        .filter(league => league.teams.some(t => 
          t.has_mapping && (
            t.name_ko !== t.mapping_name_ko || 
            t.country_ko !== t.mapping_country_ko
          )
        ))
        .map(league => {
          const needUpdateTeams = league.teams.filter(t => 
            t.has_mapping && (
              t.name_ko !== t.mapping_name_ko || 
              t.country_ko !== t.mapping_country_ko
            )
          )
          
          return (
        <div key={league.league_id} className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 border-b px-6 py-3">
            <h3 className="text-lg font-semibold">
                  {league.league_name_ko || league.league_name} (ID: {league.league_id})
            </h3>
            <div className="text-sm text-gray-600">
                  업데이트 필요: {needUpdateTeams.length}개 팀
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Team ID</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">영문명</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">현재 한글명</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">→</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">매핑 한글명</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">현재 국가</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">→</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">매핑 국가</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {needUpdateTeams.map((team) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">{team.team_id}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{team.name}</td>
                        <td className={`px-4 py-2 ${team.name_ko !== team.mapping_name_ko ? 'text-red-600' : 'text-gray-600'}`}>
                          {team.name_ko || '(없음)'}
                        </td>
                        <td className="px-4 py-2 text-center text-blue-600">→</td>
                        <td className="px-4 py-2 text-green-600 font-medium">{team.mapping_name_ko}</td>
                        <td className={`px-4 py-2 ${team.country_ko !== team.mapping_country_ko ? 'text-red-600' : 'text-gray-600'}`}>
                          {team.country_ko || '(없음)'}
                        </td>
                        <td className="px-4 py-2 text-center text-blue-600">→</td>
                        <td className="px-4 py-2 text-green-600 font-medium">{team.mapping_country_ko || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

      {/* 리그별 매핑 없는 팀 목록 */}
      {stats.withoutMapping > 0 && leagueGroups
        .filter(league => league.teams.some(t => !t.has_mapping))
        .map(league => {
          const noMappingTeams = league.teams.filter(t => !t.has_mapping)
          
          return (
            <div key={`no-mapping-${league.league_id}`} className="bg-white rounded-lg border overflow-hidden">
              <div className="bg-red-50 border-b px-6 py-3">
                <h3 className="text-lg font-semibold text-red-900">
                  {league.league_name_ko || league.league_name} (ID: {league.league_id})
                </h3>
                <div className="text-sm text-red-600">
                  매핑 없음: {noMappingTeams.length}개 팀
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Team ID</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">영문명</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">국가</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">현재 한글명</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">현재 국가(한글)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                    {noMappingTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-900">{team.team_id}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{team.name}</td>
                    <td className="px-4 py-2 text-gray-600">{team.country}</td>
                        <td className="px-4 py-2 text-gray-600">{team.name_ko || '(없음)'}</td>
                        <td className="px-4 py-2 text-gray-600">{team.country_ko || '(없음)'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )
        })}
    </div>
  )
}
