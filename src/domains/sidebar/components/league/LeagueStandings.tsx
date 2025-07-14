'use client';

import React, { useState, useEffect } from 'react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/utils/image-proxy';
import { useRouter } from 'next/navigation';
import { StandingsData, League } from '../../types';
import { fetchStandingsData } from '../../actions/football';
import { MAJOR_LEAGUE_IDS } from '@/domains/livescore/constants/league-mappings';
import { getTeamById } from '@/domains/livescore/constants/teams';

// API ID와 화면 표시용 리그 정보 매핑
const LEAGUES: League[] = [
  { id: 'premier', name: 'EPL', fullName: '프리미어 리그', apiId: MAJOR_LEAGUE_IDS.PREMIER_LEAGUE },
  { id: 'laliga', name: '라리가', fullName: '라리가', apiId: MAJOR_LEAGUE_IDS.LA_LIGA },
  { id: 'bundesliga', name: '분데스', fullName: '분데스리가', apiId: MAJOR_LEAGUE_IDS.BUNDESLIGA },
  { id: 'serieA', name: '세리에A', fullName: '세리에 A', apiId: MAJOR_LEAGUE_IDS.SERIE_A },
  { id: 'ligue1', name: '리그앙', fullName: '리그 1', apiId: MAJOR_LEAGUE_IDS.LIGUE_1 },
];

// 팀 이름 짧게 표시 (최대 8자)
const shortenTeamName = (name: string) => {
  if (name.length <= 8) return name;
  return name.substring(0, 8);
};

// 팀 ID로 한글 이름 가져오기
const getKoreanTeamName = (teamId: number, name: string) => {
  const teamInfo = getTeamById(teamId);
  return teamInfo?.name_ko || shortenTeamName(name);
};

interface LeagueStandingsProps {
  initialLeague?: string;
  initialStandings?: StandingsData | null;
}

export default function LeagueStandings({
  initialLeague = 'premier',
  initialStandings = null,
}: LeagueStandingsProps) {
  // 상태 관리
  const [activeLeague, setActiveLeague] = useState(initialLeague);
  const [standings, setStandings] = useState<StandingsData | null>(initialStandings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 환경 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 리그 선택 시 데이터 가져오기
  useEffect(() => {
    if (isMobile) return;

    // 만약 activeLeague가 initialLeague와 같고 초기 데이터가 있으면 요청하지 않음
    if (activeLeague === initialLeague && initialStandings) {
      setStandings(initialStandings);
      return;
    }

    async function loadStandings() {
      try {
        setLoading(true);
        setError(null);
        
        // 서버 액션 직접 호출
        const data = await fetchStandingsData(activeLeague);
        
        if (data) {
          setStandings(data);
        } else {
          setError('데이터를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('리그 순위 데이터 로드 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    
    loadStandings();
  }, [activeLeague, initialLeague, initialStandings, isMobile]);

  // 모바일에서는 렌더링하지 않음
  if (isMobile) {
    return null;
  }

  const handleTeamClick = (teamId: number) => {
    router.push(`/livescore/football/team/${teamId}?tab=overview`);
  };

  return (
    <div className="league-standings border rounded-md overflow-hidden">
      <div className="standings-header py-2 px-3 text-sm font-medium bg-slate-800 text-white">
        축구 팀순위
      </div>
      
      {/* 리그 선택 탭 */}
      <div className="league-tabs flex border-b">
        {LEAGUES.map(league => (
          <button 
            key={league.id}
            onClick={() => setActiveLeague(league.id)}
            className={`flex-1 text-xs py-2 px-1 ${
              activeLeague === league.id 
                ? 'bg-white border-b-2 border-slate-800 font-medium' 
                : 'bg-gray-100'
            }`}
          >
            {league.name}
          </button>
        ))}
      </div>
      
      {/* 선택된 리그 정보 */}
      <div className="league-info px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          {standings?.league?.logo && (
            <div className="w-5 h-5 relative">
              <ApiSportsImage
                src={standings.league.logo}
                alt={standings.league.name}
                width={20}
                height={20}
                fallbackType={ImageType.Leagues}
                className="object-contain w-5 h-5"
                style={{ width: '20px', height: '20px' }}
              />
            </div>
          )}
          <span className="text-sm font-medium">
            {LEAGUES.find(l => l.id === activeLeague)?.fullName || ''}
          </span>
        </div>
      </div>
      
      {/* 순위표 */}
      <div className="py-1.5 pb-0 min-h-[200px]">
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-5 w-full bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">
            {error}
          </div>
        ) : standings && standings.standings && standings.standings.length > 0 ? (
          <div className="border-b">
            <table className="w-full text-xs border-collapse table-fixed">
              <colgroup>
                {/* 순위 */}
                <col className="w-[30px]" />
                {/* 팀 (남은 공간 모두 차지) */}
                <col />
                {/* 경기 */}
                <col className="w-[28px]" />
                {/* 승 */}
                <col className="w-[20px]" />
                {/* 무 */}
                <col className="w-[20px]" />
                {/* 패 */}
                <col className="w-[20px]" />
                {/* 승점 */}
                <col className="w-[30px]" />
              </colgroup>
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-center py-1 px-0 text-xs font-medium">순위</th>
                  <th className="text-left py-1 px-1 text-xs font-medium">팀</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">경기</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">승</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">무</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">패</th>
                  <th className="text-center py-1 px-0 text-xs font-medium">승점</th>
                </tr>
              </thead>
              <tbody>
                {standings.standings[0].map((team, index) => (
                  <tr 
                    key={team.team.team_id}
                    className={`${index < standings.standings[0].length - 1 ? 'border-b' : ''} hover:bg-gray-50 cursor-pointer ${index < 4 ? 'text-blue-600' : ''}`}
                    onClick={() => handleTeamClick(team.team.team_id)}
                  >
                    <td className="text-center py-1.5 px-0">{team.rank}</td>
                    <td className="text-left py-1.5 px-1">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 relative flex-shrink-0">
                          <ApiSportsImage
                            src={team.team.logo}
                            alt={team.team.name}
                            width={20}
                            height={20}
                            fallbackType={ImageType.Teams}
                            className="object-contain w-5 h-5"
                            style={{ width: '20px', height: '20px' }}
                          />
                        </div>
                        <span className="truncate max-w-[100px] font-medium text-sm hover:text-blue-600 transition-colors">
                          {getKoreanTeamName(team.team.team_id, team.team.name)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-1 px-0">{team.all.played}</td>
                    <td className="text-center py-1 px-0">{team.all.win}</td>
                    <td className="text-center py-1 px-0">{team.all.draw}</td>
                    <td className="text-center py-1 px-0">{team.all.lose}</td>
                    <td className="text-center py-1 px-0 font-medium">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3">
            <p className="text-xs text-gray-500">데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
} 