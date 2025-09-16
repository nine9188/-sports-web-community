'use client'

import { useEffect, useState } from 'react';
import { MLS_TEAMS, MLSConference } from '@/domains/livescore/constants/teams/mls';
import { fetchLeagueTeams, LeagueTeam } from '@/domains/livescore/actions/footballApi';

// 리그 정보 (유럽 주요/기타, 아시아, 아메리카 포함)
const LEAGUES = [
  // 유럽 주요 리그 (DB 카테고리: 프리미어=3, 라리가=4, 리그1=5, 분데스=6, 세리에A=7)
  { id: '39', name: '프리미어리그', categoryId: 3 },
  { id: '140', name: '라리가', categoryId: 4 },
  { id: '61', name: '리그 1', categoryId: 5 },
  { id: '78', name: '분데스리가', categoryId: 6 },
  { id: '135', name: '세리에 A', categoryId: 7 },

  // 유럽 기타 리그 (DB 카테고리: 기타 팀=8)
  { id: '40', name: '챔피언십', categoryId: 8 },
  { id: '179', name: '스코틀랜드 프리미어십', categoryId: 8 },
  { id: '88', name: '에레디비지에', categoryId: 8 },
  { id: '94', name: '프리메이라 리가', categoryId: 8 },
  { id: '119', name: '덴마크 수페르리가', categoryId: 8 },

  // 아시아 (K리그1 포함: 전용=9, 나머지는 임시로 기타=8)
  { id: '292', name: 'K리그 1', categoryId: 9 },
  { id: '98', name: 'J1 리그', categoryId: 8 },
  { id: '169', name: '중국 슈퍼리그', categoryId: 8 },
  { id: '17', name: 'AFC 챔피언스 리그', categoryId: 8 },
  { id: '307', name: '사우디 프로리그', categoryId: 8 },

  // 아메리카 (임시로 기타=8)
  { id: '253', name: 'MLS', categoryId: 8 },
  { id: '71', name: '브라질레이로', categoryId: 8 },
  { id: '262', name: '리가 MX', categoryId: 8 },
];

// MLS 팀 ID → 컨퍼런스 매핑 (상수에서 가져옴)
const MLS_CONFERENCE_BY_ID = new Map<number, MLSConference>(MLS_TEAMS.map(t => [t.id, t.conference]));

export default function TeamsTestPage() {
  const [allTeams, setAllTeams] = useState<{ league: string; leagueId: string; categoryId: number; teams: LeagueTeam[] }[]>([]);
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
            leagueId: league.id,
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
      
      {allTeams.map(({ league, leagueId, categoryId, teams }) => (
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
            <div className="mt-6 flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">{league} 매핑 템플릿</h3>
              <button
                onClick={() => {
                  const mapping = `[\n${teams.map(t => {
                    const conf = leagueId === '253' ? (MLS_CONFERENCE_BY_ID.get(t.id) || '') : '';
                    return `  { id: ${t.id}, name_ko: '', name_en: '${t.name.replace(/'/g, "\\'")}', country_ko: '', country_en: '', code: ''${conf ? `, conference: '${conf}'` : ''} }`;
                  }).join(',\n')}\n]`;
                  navigator.clipboard.writeText(mapping);
                  alert(`${league} 매핑 템플릿이 복사되었습니다!`);
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs"
              >
                📋 {league} 매핑 복사
              </button>
            </div>
            <textarea
              readOnly
              value={`[\n${teams.map(t => {
                const conf = leagueId === '253' ? (MLS_CONFERENCE_BY_ID.get(t.id) || '') : '';
                return `  { id: ${t.id}, name_ko: '', name_en: '${t.name.replace(/'/g, "\\'")}', country_ko: '', country_en: '', code: ''${conf ? `, conference: '${conf}'` : ''} }`;
              }).join(',\n')}\n]`}
              className="w-full h-48 text-xs bg-white p-4 rounded border font-mono resize-none"
            />
          </div>

          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {teams.map((team) => (
              <div key={team.id} className="border rounded p-3 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded bg-gray-50 border">
                    <img 
                      src={team.logo} 
                      alt={team.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </span>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{team.name}</h3>
                    <p className="text-xs text-gray-600">ID: {team.id}</p>
                  </div>
                  {leagueId === '253' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {MLS_CONFERENCE_BY_ID.get(team.id) || 'N/A'}
                    </span>
                  )}
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

        <div className="mt-6 flex justify-between items-center mb-2">
          <h3 className="font-semibold">전체 리그 통합 매핑 템플릿</h3>
          <button
            onClick={() => {
              const mapping = allTeams.map(({ league, teams }) => (
                `// ${league}\n[\n${teams.map(t => `  { id: ${t.id}, name_ko: '', name_en: '${t.name.replace(/'/g, "\\'")}', country_ko: '', country_en: '', code: '' }`).join(',\n')}\n]`
              )).join('\n\n');
              navigator.clipboard.writeText(mapping);
              alert('전체 매핑 템플릿이 복사되었습니다!');
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
          >
            📋 전체 매핑 복사
          </button>
        </div>
        <textarea
          readOnly
          value={allTeams.map(({ league, leagueId, teams }) => (
            `// ${league}\n[\n${teams.map(t => {
              const conf = leagueId === '253' ? (MLS_CONFERENCE_BY_ID.get(t.id) || '') : '';
              return `  { id: ${t.id}, name_ko: '', name_en: '${t.name.replace(/'/g, "\\'")}', country_ko: '', country_en: '', code: ''${conf ? `, conference: '${conf}'` : ''} }`;
            }).join(',\n')}\n]`
          )).join('\n\n')}
          className="w-full h-64 text-xs bg-white p-4 rounded border font-mono resize-none"
        />
      </div>
    </div>
  );
}