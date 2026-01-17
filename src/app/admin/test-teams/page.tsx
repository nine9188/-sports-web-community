'use client';

import { useState } from 'react';

// 리그 정보
const LEAGUES = [
  { id: 39, name: '프리미어리그', country: '잉글랜드' },
  { id: 140, name: '라리가', country: '스페인' },
  { id: 78, name: '분데스리가', country: '독일' },
  { id: 135, name: '세리에A', country: '이탈리아' },
  { id: 61, name: '리그앙', country: '프랑스' },
  { id: 292, name: 'K리그1', country: '대한민국' },
];

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface LeagueTeams {
  leagueId: number;
  leagueName: string;
  season: number;
  teams: Team[];
}

// 영어 이름을 kebab-case slug로 변환
function toKebabCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 중복 하이픈 제거
    .trim();
}

export default function TestTeamsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LeagueTeams[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(2025);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const allResults: LeagueTeams[] = [];

      for (const league of LEAGUES) {
        const response = await fetch(
          `/api/test-teams?leagueId=${league.id}&season=${selectedSeason}`
        );

        if (!response.ok) {
          throw new Error(`${league.name} 데이터 조회 실패`);
        }

        const data = await response.json();

        allResults.push({
          leagueId: league.id,
          leagueName: league.name,
          season: selectedSeason,
          teams: data.teams || [],
        });
      }

      setResults(allResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  // SQL INSERT 문 생성
  const generateSQL = () => {
    if (results.length === 0) return '';

    // 리그 게시판 ID (parent_id로 사용)
    const leagueParentIds: Record<number, string> = {
      39: 'fd9a7d04-3301-4fc7-8e90-b19589d5b846',  // 프리미어리그
      140: 'b1203d9a-1169-4360-a953-58ae69226389', // 라리가
      78: '462464d2-5484-4545-aa0d-3707de1f24cc',  // 분데스리가
      135: '7591e46c-206c-4f33-86ce-f6c0bb0cd598', // 세리에A
      61: '822c361f-d4c7-4f47-bfcf-a751efa6e68d',  // 리그앙
      292: '6f3cb9e6-740a-463b-b2e5-002b3e1dfc7c', // K리그1
    };

    let sql = `-- 25/26 시즌 팀 게시판 생성 SQL\n`;
    sql += `-- 생성일: ${new Date().toISOString().split('T')[0]}\n\n`;

    for (const result of results) {
      sql += `-- ${result.leagueName} (league_id: ${result.leagueId})\n`;

      const parentId = leagueParentIds[result.leagueId];

      result.teams.forEach((team, index) => {
        const slug = toKebabCase(team.name);
        const displayOrder = (index + 1) * 10;

        sql += `INSERT INTO boards (name, slug, parent_id, display_order, team_id, logo)\n`;
        sql += `VALUES ('${team.name.replace(/'/g, "''")}', '${slug}', '${parentId}', ${displayOrder}, ${team.id}, '${team.logo}')\n`;
        sql += `ON CONFLICT (slug) DO UPDATE SET team_id = ${team.id}, logo = '${team.logo}';\n\n`;
      });

      sql += '\n';
    }

    return sql;
  };

  // 복사 기능
  const copySQL = () => {
    const sql = generateSQL();
    navigator.clipboard.writeText(sql);
    alert('SQL이 클립보드에 복사되었습니다!');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">25/26 시즌 팀 데이터 조회</h1>

      {/* 시즌 선택 */}
      <div className="mb-4 flex items-center gap-4">
        <label className="font-medium">시즌:</label>
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          <option value={2025}>2025/26</option>
          <option value={2024}>2024/25</option>
        </select>

        <button
          onClick={fetchTeams}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? '조회 중...' : '팀 데이터 조회'}
        </button>

        {results.length > 0 && (
          <button
            onClick={copySQL}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            SQL 복사
          </button>
        )}
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 결과 표시 */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* 요약 */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            <h2 className="font-bold mb-2">요약</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {results.map((r) => (
                <div key={r.leagueId}>
                  {r.leagueName}: <strong>{r.teams.length}팀</strong>
                </div>
              ))}
              <div className="col-span-2 md:col-span-4 font-bold border-t pt-2 mt-2">
                총: {results.reduce((sum, r) => sum + r.teams.length, 0)}팀
              </div>
            </div>
          </div>

          {/* 리그별 팀 목록 */}
          {results.map((result) => (
            <div key={result.leagueId} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold">
                {result.leagueName} ({result.teams.length}팀)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">로고</th>
                      <th className="px-3 py-2 text-left">팀명</th>
                      <th className="px-3 py-2 text-left">team_id</th>
                      <th className="px-3 py-2 text-left">slug (권장)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.teams.map((team, index) => (
                      <tr key={team.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">
                          <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" />
                        </td>
                        <td className="px-3 py-2">{team.name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{team.id}</td>
                        <td className="px-3 py-2 font-mono text-xs text-blue-600">
                          {toKebabCase(team.name)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* SQL 미리보기 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 font-bold flex justify-between items-center">
              <span>생성될 SQL</span>
              <button
                onClick={copySQL}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                복사
              </button>
            </div>
            <pre className="p-4 text-xs overflow-x-auto max-h-96 bg-gray-900 text-green-400">
              {generateSQL()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
