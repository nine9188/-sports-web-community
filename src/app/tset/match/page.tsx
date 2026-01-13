'use client';

import { useState } from 'react';
import { fetchAllFixtureData } from '../actions';

export default function MatchDataTestPage() {
  const [fixtureId, setFixtureId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    fixture: any;
    events: any;
    lineups: any;
    statistics: any;
    predictions: any;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'fixture' | 'events' | 'lineups' | 'statistics' | 'predictions'>('fixture');

  const handleFetch = async () => {
    if (!fixtureId.trim()) return;
    setLoading(true);
    setData(null);

    try {
      const result = await fetchAllFixtureData(fixtureId);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 각 데이터의 결과 수 계산
  const getResultCount = (apiData: any) => {
    return apiData?.response?.length || 0;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#121212] p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          경기 전체 데이터 테스트 (Events, Lineups, Statistics)
        </h1>

        {/* 입력 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-4 mb-6 shadow">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fixture ID (종료된 경기 ID 입력)
              </label>
              <input
                type="text"
                value={fixtureId}
                onChange={(e) => setFixtureId(e.target.value)}
                placeholder="예: 1035057 (종료된 경기)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              />
            </div>
            <button
              onClick={handleFetch}
              disabled={loading || !fixtureId.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                       disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '로딩...' : '전체 데이터 조회'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * 5개 API를 동시에 호출합니다: fixtures, fixtures/events, fixtures/lineups, fixtures/statistics, predictions
          </p>
        </div>

        {/* 결과 */}
        {data && (
          <div className="space-y-4">
            {/* 탭 */}
            <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-2 shadow flex gap-2 flex-wrap">
              {[
                { key: 'fixture', label: 'Fixture 기본정보', data: data.fixture },
                { key: 'events', label: 'Events 이벤트', data: data.events },
                { key: 'lineups', label: 'Lineups 라인업', data: data.lineups },
                { key: 'statistics', label: 'Statistics 통계', data: data.statistics },
                { key: 'predictions', label: 'Predictions 예측', data: data.predictions },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                    getResultCount(tab.data) > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {getResultCount(tab.data)}
                  </span>
                </button>
              ))}
            </div>

            {/* 데이터 요약 */}
            <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-4 shadow">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                API 응답 요약
              </h2>
              <div className="grid grid-cols-5 gap-4 text-center">
                {[
                  { label: 'Fixture', count: getResultCount(data.fixture), color: 'blue' },
                  { label: 'Events', count: getResultCount(data.events), color: 'green' },
                  { label: 'Lineups', count: getResultCount(data.lineups), color: 'purple' },
                  { label: 'Statistics', count: getResultCount(data.statistics), color: 'orange' },
                  { label: 'Predictions', count: getResultCount(data.predictions), color: 'red' },
                ].map((item) => (
                  <div key={item.label} className={`p-4 rounded-lg bg-${item.color}-50 dark:bg-${item.color}-900/20`}>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.count}</p>
                    <p className="text-sm text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 선택된 탭 데이터 */}
            <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-4 shadow">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                {activeTab.toUpperCase()} Raw Response
              </h2>

              {/* 파싱된 데이터 보기 */}
              {activeTab === 'fixture' && data.fixture?.response?.[0] && (
                <FixtureView data={data.fixture.response[0]} />
              )}
              {activeTab === 'events' && (
                <EventsView data={data.events?.response || []} />
              )}
              {activeTab === 'lineups' && (
                <LineupsView data={data.lineups?.response || []} />
              )}
              {activeTab === 'statistics' && (
                <StatisticsView data={data.statistics?.response || []} />
              )}

              {/* Raw JSON */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                  Raw JSON 보기
                </summary>
                <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[500px] text-xs">
                  {JSON.stringify(
                    activeTab === 'fixture' ? data.fixture :
                    activeTab === 'events' ? data.events :
                    activeTab === 'lineups' ? data.lineups :
                    activeTab === 'statistics' ? data.statistics :
                    data.predictions,
                    null, 2
                  )}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fixture 기본정보 뷰
function FixtureView({ data }: { data: any }) {
  const { fixture, league, teams, goals, score } = data;

  return (
    <div className="space-y-4">
      {/* 경기 정보 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-bold mb-3 text-gray-900 dark:text-white">경기 기본 정보</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>ID: <span className="font-mono">{fixture?.id}</span></div>
          <div>상태: <span className="font-bold">{fixture?.status?.long} ({fixture?.status?.short})</span></div>
          <div>날짜: {new Date(fixture?.date).toLocaleString('ko-KR')}</div>
          <div>경기장: {fixture?.venue?.name}</div>
          <div>심판: {fixture?.referee || 'N/A'}</div>
          <div>경과시간: {fixture?.status?.elapsed}분</div>
        </div>
      </div>

      {/* 리그 정보 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-bold mb-3 text-gray-900 dark:text-white">리그 정보</h3>
        <div className="flex items-center gap-3">
          <img src={league?.logo} alt={league?.name} className="w-10 h-10" />
          <div>
            <p className="font-bold">{league?.name}</p>
            <p className="text-sm text-gray-500">{league?.country} | {league?.season} | {league?.round}</p>
          </div>
        </div>
      </div>

      {/* 스코어 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-bold mb-3 text-gray-900 dark:text-white">스코어</h3>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <img src={teams?.home?.logo} alt={teams?.home?.name} className="w-16 h-16 mx-auto" />
            <p className="font-bold mt-2">{teams?.home?.name}</p>
            <p className="text-xs text-gray-500">{teams?.home?.winner ? '승리' : teams?.home?.winner === false ? '패배' : '무승부'}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">{goals?.home} - {goals?.away}</p>
            <div className="text-xs text-gray-500 mt-2">
              <p>HT: {score?.halftime?.home} - {score?.halftime?.away}</p>
              <p>FT: {score?.fulltime?.home} - {score?.fulltime?.away}</p>
              {score?.extratime?.home !== null && <p>ET: {score?.extratime?.home} - {score?.extratime?.away}</p>}
              {score?.penalty?.home !== null && <p>PK: {score?.penalty?.home} - {score?.penalty?.away}</p>}
            </div>
          </div>
          <div className="text-center">
            <img src={teams?.away?.logo} alt={teams?.away?.name} className="w-16 h-16 mx-auto" />
            <p className="font-bold mt-2">{teams?.away?.name}</p>
            <p className="text-xs text-gray-500">{teams?.away?.winner ? '승리' : teams?.away?.winner === false ? '패배' : '무승부'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Events 뷰
function EventsView({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <p className="text-red-500 p-4">이벤트 데이터가 없습니다.</p>;
  }

  const getEventIcon = (type: string, detail: string) => {
    if (type === 'Goal') return detail === 'Own Goal' ? '⚽🔴' : '⚽';
    if (type === 'Card') return detail === 'Yellow Card' ? '🟨' : '🟥';
    if (type === 'subst') return '🔄';
    if (type === 'Var') return '📺';
    return '📋';
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 mb-4">총 {data.length}개 이벤트</p>
      {data.map((event, idx) => (
        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <span className="w-12 text-center font-mono text-sm">{event.time?.elapsed}'</span>
          <span className="text-xl">{getEventIcon(event.type, event.detail)}</span>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              {event.player?.name || 'Unknown'}
              {event.assist?.name && <span className="text-gray-500 text-sm"> (어시스트: {event.assist.name})</span>}
            </p>
            <p className="text-xs text-gray-500">{event.team?.name} | {event.type} - {event.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Lineups 뷰
function LineupsView({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <p className="text-red-500 p-4">라인업 데이터가 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {data.map((team, idx) => (
        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 flex items-center gap-3">
            <img src={team.team?.logo} alt={team.team?.name} className="w-8 h-8" />
            <div>
              <p className="font-bold">{team.team?.name}</p>
              <p className="text-sm text-gray-500">포메이션: {team.formation}</p>
            </div>
          </div>

          {/* 감독 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500">감독</p>
            <p className="font-medium">{team.coach?.name || 'N/A'}</p>
          </div>

          {/* 선발 */}
          <div className="p-3">
            <p className="text-xs text-gray-500 mb-2">선발 XI</p>
            <div className="space-y-1">
              {team.startXI?.map((player: any, pIdx: number) => (
                <div key={pIdx} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-center font-mono text-xs bg-gray-100 dark:bg-gray-700 rounded">
                    {player.player?.number}
                  </span>
                  <span className="w-8 text-xs text-gray-500">{player.player?.pos}</span>
                  <span>{player.player?.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 교체 */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 mb-2">교체 명단</p>
            <div className="flex flex-wrap gap-2">
              {team.substitutes?.map((player: any, pIdx: number) => (
                <span key={pIdx} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {player.player?.number}. {player.player?.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Statistics 뷰
function StatisticsView({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <p className="text-red-500 p-4">통계 데이터가 없습니다.</p>;
  }

  // 두 팀의 통계를 비교 형태로 표시
  const homeTeam = data[0];
  const awayTeam = data[1];

  if (!homeTeam || !awayTeam) {
    return <p className="text-yellow-500 p-4">팀 데이터가 불완전합니다.</p>;
  }

  const getStatValue = (stats: any[], type: string) => {
    const stat = stats?.find((s: any) => s.type === type);
    return stat?.value ?? 'N/A';
  };

  const statTypes = [
    'Shots on Goal', 'Shots off Goal', 'Total Shots', 'Blocked Shots',
    'Shots insidebox', 'Shots outsidebox', 'Fouls', 'Corner Kicks',
    'Offsides', 'Ball Possession', 'Yellow Cards', 'Red Cards',
    'Goalkeeper Saves', 'Total passes', 'Passes accurate', 'Passes %',
    'expected_goals'
  ];

  return (
    <div className="space-y-4">
      {/* 팀 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <img src={homeTeam.team?.logo} alt={homeTeam.team?.name} className="w-10 h-10" />
          <span className="font-bold">{homeTeam.team?.name}</span>
        </div>
        <span className="text-gray-500">vs</span>
        <div className="flex items-center gap-3">
          <span className="font-bold">{awayTeam.team?.name}</span>
          <img src={awayTeam.team?.logo} alt={awayTeam.team?.name} className="w-10 h-10" />
        </div>
      </div>

      {/* 통계 비교 */}
      <div className="space-y-2">
        {statTypes.map((type) => {
          const homeVal = getStatValue(homeTeam.statistics, type);
          const awayVal = getStatValue(awayTeam.statistics, type);

          // 수치형 비교 (percentage 제외)
          const homeNum = typeof homeVal === 'string' ? parseFloat(homeVal) || 0 : homeVal || 0;
          const awayNum = typeof awayVal === 'string' ? parseFloat(awayVal) || 0 : awayVal || 0;
          const total = homeNum + awayNum || 1;
          const homePct = (homeNum / total) * 100;
          const awayPct = (awayNum / total) * 100;

          return (
            <div key={type} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-bold text-blue-600">{homeVal}</span>
                <span className="text-gray-500 text-xs">{type}</span>
                <span className="font-bold text-green-600">{awayVal}</span>
              </div>
              <div className="flex h-2 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div className="bg-blue-500" style={{ width: `${homePct}%` }} />
                <div className="bg-green-500" style={{ width: `${awayPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
