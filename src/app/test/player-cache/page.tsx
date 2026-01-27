import { fetchPlayerFullData } from '@/domains/livescore/actions/player/data';

export default async function TestPlayerCache() {
  const playerId = '162511';

  const data = await fetchPlayerFullData(playerId, {
    fetchSeasons: true,
    fetchStats: true,
    fetchFixtures: true,
    fetchTrophies: true,
    fetchTransfers: true,
    fetchInjuries: true,
    fetchRankings: false, // 랭킹 제외
  });

  const playerInfo = data.playerData?.info;
  const stats = data.playerData?.statistics;
  const seasons = data.seasons;
  const fixtures = data.fixtures;
  const trophies = data.trophies;
  const transfers = data.transfers;
  const injuries = data.injuries;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">
        캐시 데이터 확인 - {playerInfo?.name} (ID: {playerId})
      </h1>

      {/* 1. 선수 기본 정보 */}
      <section className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2 text-blue-600">
          1. 선수 기본 정보 (playerData.info)
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          저장 대상: id, name, firstname, lastname, age, birth, nationality, height, weight, photo
        </p>
        <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-60">
          {JSON.stringify(playerInfo, null, 2)}
        </pre>
      </section>

      {/* 2. 시즌별 통계 (현재 시즌) */}
      <section className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2 text-blue-600">
          2. 시즌별 통계 (playerData.statistics) - {stats?.length ?? 0}개 리그
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          저장 대상: team, league, games, goals, passes, tackles, duels, dribbles, fouls, cards, penalty 등
        </p>
        <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-96">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </section>

      {/* 3. 시즌 목록 */}
      <section className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2 text-blue-600">
          3. 시즌 목록 (seasons) - {seasons?.length ?? 0}개
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          저장 대상: 연도 배열
        </p>
        <pre className="text-xs overflow-auto whitespace-pre-wrap">
          {JSON.stringify(seasons, null, 2)}
        </pre>
      </section>

      {/* 4. 경기별 통계 */}
      <section className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2 text-blue-600">
          4. 경기별 통계 (fixtures) - {fixtures?.data?.length ?? 0}경기
          {fixtures?.status && ` [${fixtures.status}]`}
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          저장 대상: fixture(id,date), league, teams, goals, statistics(games,goals,shots,passes...)
        </p>
        {/* 첫 2경기만 표시 */}
        <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-96">
          {JSON.stringify(fixtures?.data?.slice(0, 2), null, 2)}
        </pre>
        {(fixtures?.data?.length ?? 0) > 2 && (
          <p className="text-xs text-gray-400 mt-1">
            ... 외 {(fixtures?.data?.length ?? 0) - 2}경기 (전체 데이터 크기: ~{Math.round(JSON.stringify(fixtures?.data).length / 1024)}KB)
          </p>
        )}
      </section>

      {/* 5. 트로피 */}
      <section className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2 text-blue-600">
          5. 트로피 (trophies) - {trophies?.length ?? 0}개
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          저장 대상: league, country, place, season, leagueLogo
        </p>
        <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-60">
          {JSON.stringify(trophies, null, 2)}
        </pre>
      </section>

      {/* 6. 이적 */}
      <section className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2 text-blue-600">
          6. 이적 (transfers) - {transfers?.length ?? 0}건
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          저장 대상: date, type, teams.from, teams.to
        </p>
        <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-60">
          {JSON.stringify(transfers, null, 2)}
        </pre>
      </section>

      {/* 7. 부상 */}
      <section className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2 text-blue-600">
          7. 부상 (injuries) - {injuries?.length ?? 0}건
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          저장 대상: fixture.date, league(name,season), team, type, reason
        </p>
        <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-60">
          {JSON.stringify(injuries, null, 2)}
        </pre>
      </section>

      {/* 전체 데이터 크기 요약 */}
      <section className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
        <h2 className="font-bold mb-2 text-yellow-700 dark:text-yellow-400">
          데이터 크기 요약
        </h2>
        <table className="text-xs w-full">
          <thead>
            <tr className="border-b">
              <th className="p-1 text-left">데이터</th>
              <th className="p-1 text-right">크기 (KB)</th>
              <th className="p-1 text-right">항목 수</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="p-1">선수 기본 정보</td><td className="p-1 text-right">{(JSON.stringify(playerInfo).length / 1024).toFixed(1)}</td><td className="p-1 text-right">1</td></tr>
            <tr><td className="p-1">시즌별 통계</td><td className="p-1 text-right">{(JSON.stringify(stats).length / 1024).toFixed(1)}</td><td className="p-1 text-right">{stats?.length ?? 0}개 리그</td></tr>
            <tr><td className="p-1">시즌 목록</td><td className="p-1 text-right">{(JSON.stringify(seasons).length / 1024).toFixed(1)}</td><td className="p-1 text-right">{seasons?.length ?? 0}개</td></tr>
            <tr><td className="p-1">경기별 통계</td><td className="p-1 text-right">{(JSON.stringify(fixtures?.data).length / 1024).toFixed(1)}</td><td className="p-1 text-right">{fixtures?.data?.length ?? 0}경기</td></tr>
            <tr><td className="p-1">트로피</td><td className="p-1 text-right">{(JSON.stringify(trophies).length / 1024).toFixed(1)}</td><td className="p-1 text-right">{trophies?.length ?? 0}개</td></tr>
            <tr><td className="p-1">이적</td><td className="p-1 text-right">{(JSON.stringify(transfers).length / 1024).toFixed(1)}</td><td className="p-1 text-right">{transfers?.length ?? 0}건</td></tr>
            <tr><td className="p-1">부상</td><td className="p-1 text-right">{(JSON.stringify(injuries).length / 1024).toFixed(1)}</td><td className="p-1 text-right">{injuries?.length ?? 0}건</td></tr>
            <tr className="border-t font-bold">
              <td className="p-1">합계</td>
              <td className="p-1 text-right">
                {((JSON.stringify(playerInfo).length + JSON.stringify(stats).length + JSON.stringify(seasons).length + JSON.stringify(fixtures?.data).length + JSON.stringify(trophies).length + JSON.stringify(transfers).length + JSON.stringify(injuries).length) / 1024).toFixed(1)}
              </td>
              <td className="p-1 text-right">-</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
