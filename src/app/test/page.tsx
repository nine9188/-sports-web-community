import { fetchMultiDayMatches, fetchFromFootballApi } from '@/domains/livescore/actions/footballApi';

const WORLD_CUP_QUALIFIERS_EUROPE = 32; // 월드컵 유럽 예선
const INTERNATIONAL_FRIENDLY_LEAGUE_ID = 10; // 국가대표 친선경기
const GHANA_TEAM_ID = 1504; // 가나

export default async function TestPage() {
  // 실제 데이터 가져오기 (친선경기 팀 목록용)
  const realData = await fetchMultiDayMatches();

  if (!realData.success || !realData.data) {
    return <div className="container mx-auto px-4 py-6">데이터를 불러올 수 없습니다.</div>;
  }

  const allMatches = [
    ...(realData.data.yesterday?.matches || []),
    ...(realData.data.today?.matches || []),
    ...(realData.data.tomorrow?.matches || [])
  ];

  // 월드컵 유럽 예선 필터링
  const wcQualifierMatches = allMatches.filter(match =>
    match.league.id === WORLD_CUP_QUALIFIERS_EUROPE
  );

  // 국가대표 친선경기 리그(ID: 10) 필터링
  const friendlyMatches = allMatches.filter(match =>
    match.league.id === INTERNATIONAL_FRIENDLY_LEAGUE_ID
  );

  // 모든 팀 추출 (중복 제거) - 월드컵 예선 + 친선경기
  const allTeams = new Map();
  [...wcQualifierMatches, ...friendlyMatches].forEach(match => {
    allTeams.set(match.teams.home.id, {
      id: match.teams.home.id,
      name: match.teams.home.name,
      logo: match.teams.home.logo
    });
    allTeams.set(match.teams.away.id, {
      id: match.teams.away.id,
      name: match.teams.away.name,
      logo: match.teams.away.logo
    });
  });

  const teamsArray = Array.from(allTeams.values()).sort((a, b) => a.name.localeCompare(b.name));

  // 월드컵 유럽 예선 순위표 가져오기
  let wcStandings: any = null;
  try {
    const standingsResponse = await fetchFromFootballApi('standings', {
      league: WORLD_CUP_QUALIFIERS_EUROPE.toString(),
      season: '2024'
    });
    wcStandings = standingsResponse?.response?.[0];
  } catch (error) {
    console.error('월드컵 예선 순위표 로드 실패:', error);
  }

  // 가나 팀의 2024-2025 시즌 경기 가져오기
  let ghanaMatches2024 = [];
  let ghanaMatches2025 = [];

  try {
    const response2024 = await fetchFromFootballApi('fixtures', {
      team: GHANA_TEAM_ID.toString(),
      season: '2024'
    });

    const response2025 = await fetchFromFootballApi('fixtures', {
      team: GHANA_TEAM_ID.toString(),
      season: '2025'
    });

    if (response2024?.response) {
      ghanaMatches2024 = response2024.response;
    }

    if (response2025?.response) {
      ghanaMatches2025 = response2025.response;
    }
  } catch (error) {
    console.error('가나 경기 데이터 로드 실패:', error);
  }

  const allGhanaMatches = [...ghanaMatches2024, ...ghanaMatches2025];

  // 날짜 기준 내림차순 정렬 (최신 경기가 위로)
  allGhanaMatches.sort((a: any, b: any) => {
    const dateA = new Date(a.fixture?.date || 0).getTime();
    const dateB = new Date(b.fixture?.date || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">국가대표 경기 데이터 테스트</h1>

      {/* 월드컵 유럽 예선 순위표 */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
          월드컵 유럽 예선 순위표 (리그 ID: {WORLD_CUP_QUALIFIERS_EUROPE})
        </h2>
        {!wcStandings ? (
          <div className="text-center text-gray-500 py-8">
            순위표 데이터를 불러올 수 없습니다
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              리그: {wcStandings.league?.name} | 시즌: {wcStandings.league?.season}
            </div>
            {wcStandings.league?.standings?.map((group: any, groupIdx: number) => (
              <div key={groupIdx} className="border rounded bg-white dark:bg-gray-800 overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 font-semibold">
                  Group {String.fromCharCode(65 + groupIdx)} ({group.length}팀)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left">순위</th>
                        <th className="px-4 py-2 text-left">팀</th>
                        <th className="px-4 py-2 text-center">경기</th>
                        <th className="px-4 py-2 text-center">승</th>
                        <th className="px-4 py-2 text-center">무</th>
                        <th className="px-4 py-2 text-center">패</th>
                        <th className="px-4 py-2 text-center">득점</th>
                        <th className="px-4 py-2 text-center">실점</th>
                        <th className="px-4 py-2 text-center">득실차</th>
                        <th className="px-4 py-2 text-center">승점</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((standing: any) => (
                        <tr key={standing.team?.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2">{standing.rank}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <img src={standing.team?.logo} alt="" className="w-6 h-6" />
                              <span>{standing.team?.name}</span>
                              <span className="text-xs text-gray-400">(ID: {standing.team?.id})</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">{standing.all?.played || 0}</td>
                          <td className="px-4 py-2 text-center">{standing.all?.win || 0}</td>
                          <td className="px-4 py-2 text-center">{standing.all?.draw || 0}</td>
                          <td className="px-4 py-2 text-center">{standing.all?.lose || 0}</td>
                          <td className="px-4 py-2 text-center">{standing.all?.goals?.for || 0}</td>
                          <td className="px-4 py-2 text-center">{standing.all?.goals?.against || 0}</td>
                          <td className="px-4 py-2 text-center">{standing.goalsDiff || 0}</td>
                          <td className="px-4 py-2 text-center font-bold">{standing.points || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 월드컵 유럽 예선 경기 */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
          월드컵 유럽 예선 경기 - {wcQualifierMatches.length}경기
        </h2>
        {wcQualifierMatches.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            월드컵 유럽 예선 경기가 어제/오늘/내일 없습니다
          </div>
        ) : (
          <div className="space-y-2">
            {wcQualifierMatches.map(match => (
              <div key={match.id} className="p-3 border rounded bg-white dark:bg-gray-800 text-sm">
                <div className="text-xs text-gray-500 mb-1">
                  {match.league.name} (리그 ID: {match.league.id})
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={match.teams.home.logo} alt="" className="w-6 h-6" />
                    <span>{match.teams.home.name}</span>
                    <span className="text-xs text-gray-400">({match.teams.home.id})</span>
                  </div>
                  <div className="font-bold">{match.goals.home} - {match.goals.away}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">({match.teams.away.id})</span>
                    <span>{match.teams.away.name}</span>
                    <img src={match.teams.away.logo} alt="" className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 모든 팀 이미지 */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
          월드컵 예선 + 친선경기 모든 팀 ({teamsArray.length}팀)
        </h2>
        {teamsArray.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            경기 데이터가 없습니다
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-4">
            {teamsArray.map(team => (
              <div key={team.id} className="text-center p-2 border rounded bg-white dark:bg-gray-800">
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-16 h-16 mx-auto mb-2"
                />
                <div className="text-xs font-semibold truncate">{team.name}</div>
                <div className="text-xs text-gray-400">ID: {team.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 가나 경기 목록 */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
          가나 팀 2024-2025 경기 ({allGhanaMatches.length}경기)
        </h2>
        {allGhanaMatches.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            가나 팀의 2024-2025 경기 데이터가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {allGhanaMatches.map((match: any) => (
              <div key={match.fixture?.id} className="p-3 border rounded bg-white dark:bg-gray-800 text-sm">
                <div className="text-xs text-gray-500 mb-2">
                  {match.league?.name} | {match.fixture?.date ? new Date(match.fixture.date).toLocaleDateString('ko-KR') : ''}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={match.teams?.home?.logo} alt="" className="w-8 h-8" />
                    <div>
                      <div className="font-semibold">{match.teams?.home?.name}</div>
                      <div className="text-xs text-gray-400">ID: {match.teams?.home?.id}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold px-3">
                    {match.goals?.home ?? 0} - {match.goals?.away ?? 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-semibold">{match.teams?.away?.name}</div>
                      <div className="text-xs text-gray-400">ID: {match.teams?.away?.id}</div>
                    </div>
                    <img src={match.teams?.away?.logo} alt="" className="w-8 h-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
