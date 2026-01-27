import { fetchPlayerFullData } from '@/domains/livescore/actions/player/data';

export default async function TestPlayerFixtures() {
  const playerId = '162511';

  const data = await fetchPlayerFullData(playerId, {
    fetchSeasons: false,
    fetchStats: true,
    fetchFixtures: true,
    fetchTrophies: false,
    fetchTransfers: false,
    fetchInjuries: false,
    fetchRankings: false,
  });

  const playerInfo = data.playerData?.info;
  const stats = data.playerData?.statistics;
  const fixtures = data.fixtures?.data;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        선수 경기별 통계 테스트 - {playerInfo?.name} (ID: {playerId})
      </h1>

      {/* 기본 정보 */}
      <section className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2">기본 정보</h2>
        <pre className="text-xs overflow-auto whitespace-pre-wrap">
          {JSON.stringify(playerInfo, null, 2)}
        </pre>
      </section>

      {/* 시즌 통계 */}
      <section className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2">시즌 통계 ({stats?.length ?? 0}개)</h2>
        <pre className="text-xs overflow-auto whitespace-pre-wrap">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </section>

      {/* 경기별 통계 */}
      <section className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2">
          경기별 통계 ({fixtures?.length ?? 0}경기)
          {data.fixtures?.status && ` - status: ${data.fixtures.status}`}
          {data.fixtures?.cached && ' (cached)'}
        </h2>

        {data.fixtures?.completeness && (
          <p className="text-sm mb-2 text-gray-600 dark:text-gray-400">
            completeness: {data.fixtures.completeness.success}/{data.fixtures.completeness.total}
            {data.fixtures.completeness.failed > 0 && ` (failed: ${data.fixtures.completeness.failed})`}
          </p>
        )}

        {fixtures && fixtures.length > 0 ? (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b dark:border-gray-600">
                <th className="p-2 text-left">날짜</th>
                <th className="p-2 text-left">리그</th>
                <th className="p-2 text-left">경기</th>
                <th className="p-2 text-left">스코어</th>
                <th className="p-2 text-right">분</th>
                <th className="p-2 text-right">평점</th>
                <th className="p-2 text-right">골</th>
                <th className="p-2 text-right">도움</th>
                <th className="p-2 text-right">슈팅</th>
                <th className="p-2 text-right">유효슈팅</th>
                <th className="p-2 text-right">패스</th>
                <th className="p-2 text-right">키패스</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.map((f, i) => (
                <tr key={i} className="border-b dark:border-gray-700">
                  <td className="p-2">{new Date(f.fixture.date).toLocaleDateString('ko-KR')}</td>
                  <td className="p-2">{f.league?.name}</td>
                  <td className="p-2">{f.teams?.home?.name} vs {f.teams?.away?.name}</td>
                  <td className="p-2">{f.goals?.home} - {f.goals?.away}</td>
                  <td className="p-2 text-right">{f.statistics?.games?.minutes ?? '-'}</td>
                  <td className="p-2 text-right">{f.statistics?.games?.rating ?? '-'}</td>
                  <td className="p-2 text-right">{f.statistics?.goals?.total ?? 0}</td>
                  <td className="p-2 text-right">{f.statistics?.goals?.assists ?? 0}</td>
                  <td className="p-2 text-right">{f.statistics?.shots?.total ?? 0}</td>
                  <td className="p-2 text-right">{f.statistics?.shots?.on ?? 0}</td>
                  <td className="p-2 text-right">{f.statistics?.passes?.total ?? 0}</td>
                  <td className="p-2 text-right">{f.statistics?.passes?.key ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">경기 데이터 없음</p>
        )}
      </section>

      {/* raw 데이터 (첫 3경기) */}
      <section className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h2 className="font-bold mb-2">Raw 데이터 (첫 3경기)</h2>
        <pre className="text-xs overflow-auto whitespace-pre-wrap">
          {JSON.stringify(fixtures?.slice(0, 3), null, 2)}
        </pre>
      </section>
    </div>
  );
}
