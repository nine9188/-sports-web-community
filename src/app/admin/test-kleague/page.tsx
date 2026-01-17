'use client';

import { useState } from 'react';

interface TeamData {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  venue?: {
    name: string;
    city: string;
  };
}

interface StandingTeam {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export default function TestKLeaguePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('teams');
  const [selectedSeason, setSelectedSeason] = useState('2026');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(
        `/api/test-kleague?type=${selectedType}&season=${selectedSeason}`
      );

      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">K리그 API 데이터 확인</h1>

      {/* 옵션 선택 */}
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <div>
          <label className="font-medium mr-2">시즌:</label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div>
          <label className="font-medium mr-2">데이터 타입:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="teams">팀 목록</option>
            <option value="standings">순위표</option>
            <option value="fixtures">경기 일정</option>
            <option value="leagues">리그 정보</option>
          </select>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 결과 표시 */}
      {data && (
        <div className="space-y-4">
          {/* 메타 정보 */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <p><strong>시즌:</strong> {data.season}</p>
            <p><strong>리그 ID:</strong> {data.leagueId}</p>
            <p><strong>결과 수:</strong> {data.results}</p>
          </div>

          {/* 팀 목록 */}
          {selectedType === 'teams' && data.data && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold">
                K리그1 {selectedSeason} 팀 목록 ({data.data.length}팀)
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">로고</th>
                    <th className="px-3 py-2 text-left">팀명</th>
                    <th className="px-3 py-2 text-left">team_id</th>
                    <th className="px-3 py-2 text-left">경기장</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item: TeamData, index: number) => (
                    <tr key={item.team.id} className="border-t">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">
                        <img src={item.team.logo} alt={item.team.name} className="w-6 h-6" />
                      </td>
                      <td className="px-3 py-2">{item.team.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{item.team.id}</td>
                      <td className="px-3 py-2 text-xs">{item.venue?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 순위표 */}
          {selectedType === 'standings' && data.data && data.data[0] && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold">
                K리그1 {selectedSeason} 순위표
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left">순위</th>
                    <th className="px-3 py-2 text-left">팀</th>
                    <th className="px-3 py-2 text-center">경기</th>
                    <th className="px-3 py-2 text-center">승</th>
                    <th className="px-3 py-2 text-center">무</th>
                    <th className="px-3 py-2 text-center">패</th>
                    <th className="px-3 py-2 text-center">득실</th>
                    <th className="px-3 py-2 text-center">승점</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data[0].league.standings[0].map((team: StandingTeam) => (
                    <tr key={team.team.id} className="border-t">
                      <td className="px-3 py-2">{team.rank}</td>
                      <td className="px-3 py-2 flex items-center gap-2">
                        <img src={team.team.logo} alt={team.team.name} className="w-5 h-5" />
                        {team.team.name}
                      </td>
                      <td className="px-3 py-2 text-center">{team.all.played}</td>
                      <td className="px-3 py-2 text-center">{team.all.win}</td>
                      <td className="px-3 py-2 text-center">{team.all.draw}</td>
                      <td className="px-3 py-2 text-center">{team.all.lose}</td>
                      <td className="px-3 py-2 text-center">{team.goalsDiff}</td>
                      <td className="px-3 py-2 text-center font-bold">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 경기 일정 */}
          {selectedType === 'fixtures' && data.data && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold">
                K리그1 {selectedSeason} 경기 일정 ({data.data.length}경기)
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">날짜</th>
                      <th className="px-3 py-2 text-left">홈</th>
                      <th className="px-3 py-2 text-center">스코어</th>
                      <th className="px-3 py-2 text-left">원정</th>
                      <th className="px-3 py-2 text-left">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.slice(0, 50).map((item: Fixture) => (
                      <tr key={item.fixture.id} className="border-t">
                        <td className="px-3 py-2 text-xs">
                          {new Date(item.fixture.date).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-3 py-2">{item.teams.home.name}</td>
                        <td className="px-3 py-2 text-center">
                          {item.goals.home ?? '-'} : {item.goals.away ?? '-'}
                        </td>
                        <td className="px-3 py-2">{item.teams.away.name}</td>
                        <td className="px-3 py-2 text-xs">{item.fixture.status.short}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 리그 정보 */}
          {selectedType === 'leagues' && data.data && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold">
                리그 정보
              </div>
              <pre className="p-4 text-xs overflow-x-auto bg-gray-900 text-green-400 max-h-96">
                {JSON.stringify(data.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Raw JSON */}
          <details className="border rounded-lg">
            <summary className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold cursor-pointer">
              Raw JSON 데이터
            </summary>
            <pre className="p-4 text-xs overflow-x-auto bg-gray-900 text-green-400 max-h-96">
              {JSON.stringify(data.data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
