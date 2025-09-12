'use client'

import { useEffect, useState } from 'react';
import { fetchLeagueTeams, LeagueTeam } from '@/domains/livescore/actions/footballApi';

// 리그 정보
const LEAGUES = [
  { id: '292', name: 'K리그 1', categoryId: 9 },
  { id: '39', name: '프리미어리그', categoryId: 10 },
  { id: '140', name: '라리가', categoryId: 11 },
  { id: '61', name: '리그 1', categoryId: 12 },
  { id: '78', name: '분데스리가', categoryId: 13 },
  { id: '135', name: '세리에 A', categoryId: 14 }
];

export default function TeamsTestPage() {
  const [allTeams, setAllTeams] = useState<{ league: string; categoryId: number; teams: LeagueTeam[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('');

  useEffect(() => {
    async function loadAllTeams() {
      try {
        const results = [];
        
        for (const league of LEAGUES) {
          setLoadingProgress(`${league.name} 데이터 로딩 중...`);
          const teams = await fetchLeagueTeams(league.id);
          results.push({
            league: league.name,
            categoryId: league.categoryId,
            teams
          });
        }
        
        setAllTeams(results);
      } catch (error) {
        console.error('팀 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
        setLoadingProgress('');
      }
    }

    loadAllTeams();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">유럽 주요 리그 팀 데이터 테스트</h1>
        <p>{loadingProgress || '데이터 로딩 중...'}</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">유럽 주요 리그 팀 데이터 테스트</h1>
      
      {allTeams.map(({ league, categoryId, teams }) => (
        <div key={league} className="mb-12">
          <div className="mb-6 p-6 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{league} (총 {teams.length}개 팀)</h2>
              <button 
                onClick={() => {
                  const sqlQuery = `INSERT INTO shop_items (category_id, name, description, image_url, price, is_default, is_active) VALUES
${teams.map(team => 
  `(${categoryId}, '기본 ${team.name}', '기본 ${team.name}', '${team.logo}', 150, false, true)`
).join(',\n')};`;
                  navigator.clipboard.writeText(sqlQuery);
                  alert(`${league} SQL 쿼리가 복사되었습니다!`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                📋 {league} SQL 복사
              </button>
            </div>
            <textarea 
              readOnly
              value={`INSERT INTO shop_items (category_id, name, description, image_url, price, is_default, is_active) VALUES
${teams.map(team => 
  `(${categoryId}, '기본 ${team.name}', '기본 ${team.name}', '${team.logo}', 150, false, true)`
).join(',\n')};`}
              className="w-full h-48 text-xs bg-white p-4 rounded border font-mono resize-none"
            />
          </div>

          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {teams.map((team) => (
              <div key={team.id} className="border rounded p-3 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <img 
                    src={team.logo} 
                    alt={team.name}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{team.name}</h3>
                    <p className="text-xs text-gray-600">ID: {team.id}</p>
                  </div>
                  {team.isWinner && (
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      우승
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="mt-8 p-6 bg-green-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">전체 리그 통합 SQL:</h3>
          <button 
            onClick={() => {
              const allSqlQueries = allTeams.map(({ league, categoryId, teams }) => 
                `-- ${league} (카테고리 ${categoryId})\nINSERT INTO shop_items (category_id, name, description, image_url, price, is_default, is_active) VALUES\n${teams.map(team => 
                  `(${categoryId}, '기본 ${team.name}', '기본 ${team.name}', '${team.logo}', 150, false, true)`
                ).join(',\n')};`
              ).join('\n\n');
              
              navigator.clipboard.writeText(allSqlQueries);
              alert('전체 SQL 쿼리가 복사되었습니다!');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            📋 전체 SQL 복사
          </button>
        </div>
        <textarea 
          readOnly
          value={allTeams.map(({ league, categoryId, teams }) => 
            `-- ${league} (카테고리 ${categoryId})\nINSERT INTO shop_items (category_id, name, description, image_url, price, is_default, is_active) VALUES\n${teams.map(team => 
              `(${categoryId}, '기본 ${team.name}', '기본 ${team.name}', '${team.logo}', 150, false, true)`
            ).join(',\n')};`
          ).join('\n\n')}
          className="w-full h-64 text-xs bg-white p-4 rounded border font-mono resize-none"
        />
      </div>
    </div>
  );
}