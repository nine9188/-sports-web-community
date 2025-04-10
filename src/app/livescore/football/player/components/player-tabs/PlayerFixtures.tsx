'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FixtureData } from '../../types/player';

// Props 타입 정의
interface PlayerFixturesProps {
  playerId: number;
  seasons: number[];
  fixturesData?: { data: FixtureData[] };
  initialSeason: number;
  baseUrl?: string;
}

// 팀 로고 컴포넌트 - 메모이제이션 적용
const TeamLogo = ({ logo, name }: { logo: string; name: string }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <Image
      src={imgError ? '/placeholder-team.png' : logo || '/placeholder-team.png'}
      alt={name}
      width={20}
      height={20}
      className="object-contain flex-shrink-0"
      onError={() => setImgError(true)}
      unoptimized
    />
  );
};

// 경기 결과에 따른 스타일 및 텍스트 설정
const getMatchResultStyle = (result: '승' | '무' | '패') => {
  switch (result) {
    case '승':
      return 'bg-green-100 text-green-800';
    case '무':
      return 'bg-gray-100 text-gray-800';
    case '패':
      return 'bg-red-100 text-red-800';
    default:
      return '';
  }
};

export default function PlayerFixtures({ 
  playerId, 
  seasons = [], 
  fixturesData: initialFixturesData = { data: [] }, 
  initialSeason,
  baseUrl = '' 
}: PlayerFixturesProps) {
  const router = useRouter();
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [fixturesData, setFixturesData] = useState<{ data: FixtureData[] }>(initialFixturesData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 시즌별 데이터를 캐싱하기 위한 ref
  const cachedDataRef = useRef<Record<number, { data: FixtureData[] }>>({
    [initialSeason]: initialFixturesData
  });

  // 사용 가능한 시즌 목록 - 내림차순 정렬
  const availableSeasons = useMemo(() => {
    return [...(seasons || [])].sort((a: number, b: number) => b - a);
  }, [seasons]);

  // 데이터 가져오기 함수를 useCallback으로 메모이제이션
  const fetchFixturesData = useCallback(async (season: number) => {
    // 이미 캐시된 데이터가 있으면 사용
    if (cachedDataRef.current[season] && cachedDataRef.current[season].data.length > 0) {
      setFixturesData(cachedDataRef.current[season]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSelectedLeague(''); // 시즌이 변경되면 리그 선택 초기화

      // API 요청 URL 설정 (baseUrl이 있으면 사용, 없으면 상대 경로)
      const apiUrl = baseUrl 
        ? `${baseUrl}/api/livescore/football/players/${playerId}/fixtures?season=${season}&per_page=30`
        : `/api/livescore/football/players/${playerId}/fixtures?season=${season}&per_page=30`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error('경기 데이터를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      
      // 데이터를 캐시에 저장
      cachedDataRef.current[season] = data;
      setFixturesData(data);
    } catch (err) {
      console.error('경기 데이터 로딩 오류:', err);
      setError('경기 데이터를 가져오는데 실패했습니다.');
      setFixturesData({ data: [] });
    } finally {
      setLoading(false);
    }
  }, [playerId, baseUrl]);

  // 컴포넌트 마운트 시 데이터 가져오기 (초기 데이터가 비어있는 경우)
  useEffect(() => {
    if (initialFixturesData.data.length === 0) {
      fetchFixturesData(selectedSeason);
    }
  }, [initialFixturesData.data.length, fetchFixturesData, selectedSeason]);

  // 시즌이 변경될 때 새 데이터 가져오기
  useEffect(() => {
    fetchFixturesData(selectedSeason);
  }, [selectedSeason, fetchFixturesData]);

  // 사용 가능한 리그 목록 (전체 리그 데이터에서 추출) - 메모이제이션
  const availableLeagues = useMemo(() => {
    if (!fixturesData?.data || fixturesData.data.length === 0) return [];
    
    return [...new Map(fixturesData.data.map((fixture: FixtureData) => [
      fixture.league.id,
      {
        id: fixture.league.id,
        name: fixture.league.name,
        logo: fixture.league.logo
      }
    ])).values()];
  }, [fixturesData]);

  // 현재 보여줄 데이터 필터링 - 메모이제이션
  const currentData = useMemo(() => {
    if (!fixturesData?.data) return { data: [] };
    
    // 리그 필터링이 없으면 모든 데이터 반환
    if (!selectedLeague) return fixturesData;
    
    // 선택된 리그에 맞는 데이터만 필터링
    const filteredData = fixturesData.data.filter(
      (fixture: FixtureData) => fixture.league.id.toString() === selectedLeague
    );
    
    return { data: filteredData };
  }, [fixturesData, selectedLeague]);

  // 선택된 리그 정보
  const selectedLeagueInfo = availableLeagues.find(league => league.id.toString() === selectedLeague);

  // 소속팀의 승/무/패 상태를 계산하는 함수
  const getMatchResult = (fixture: FixtureData): '승' | '무' | '패' => {
    const playerTeamId = fixture.teams.playerTeamId;
    const homeGoals = Number(fixture.goals.home);
    const awayGoals = Number(fixture.goals.away);
    
    // 무승부인 경우
    if (homeGoals === awayGoals) {
      return '무';
    }
    
    // 소속팀이 홈팀인 경우
    if (playerTeamId === fixture.teams.home.id) {
      return homeGoals > awayGoals ? '승' : '패';
    } 
    // 소속팀이 원정팀인 경우
    else {
      return awayGoals > homeGoals ? '승' : '패';
    }
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-red-500 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">네트워크 연결을 확인하고 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 컨트롤 - 드롭다운으로 변경 */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* 시즌 선택 드롭다운 */}
        <div className="relative flex-1 min-w-[180px]">
          <label htmlFor="fixture-season-select" className="block text-sm font-medium text-gray-700 mb-1">
            시즌
          </label>
          <select
            id="fixture-season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {availableSeasons.map((season: number) => (
              <option key={season} value={season}>
                {season}/{season + 1}
              </option>
            ))}
          </select>
        </div>

        {/* 리그 선택 드롭다운 */}
        <div className="relative flex-1 min-w-[180px]">
          <label htmlFor="fixture-league-select" className="block text-sm font-medium text-gray-700 mb-1">
            리그
          </label>
          <select
            id="fixture-league-select"
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            disabled={availableLeagues.length === 0}
          >
            <option value="">전체 리그</option>
            {availableLeagues.map((league) => (
              <option key={league.id} value={league.id.toString()}>
                {league.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 선택된 리그 표시 */}
      {selectedLeague && selectedLeagueInfo && (
        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
          <Image
            src={selectedLeagueInfo.logo}
            alt={selectedLeagueInfo.name}
            width={24}
            height={24}
            className="object-contain"
            unoptimized
          />
          <span className="font-medium">{selectedLeagueInfo.name}</span>
        </div>
      )}

      {/* 경기 목록 */}
      {!loading && !error && currentData?.data?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-2 py-3 text-left border-b border-gray-200 whitespace-nowrap">날짜</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">리그</th>
                <th className="px-2 py-3 text-right border-b border-gray-200 whitespace-nowrap">홈팀</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">스코어</th>
                <th className="px-2 py-3 text-left border-b border-gray-200 whitespace-nowrap">원정팀</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">결과</th>
                <th className="px-4 py-3 text-center border-b border-gray-200 whitespace-nowrap">출전</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">평점</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">골</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">도움</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">슈팅</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">유효</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">패스</th>
                <th className="px-2 py-3 text-center border-b border-gray-200 whitespace-nowrap">키패스</th>
              </tr>
            </thead>
            <tbody>
              {currentData.data.map((fixture: FixtureData) => {
                const playerTeamId = fixture.teams.playerTeamId;
                const matchResult = getMatchResult(fixture);
                const resultStyle = getMatchResultStyle(matchResult);

                return (
                <tr 
                  key={fixture.fixture.id}
                  className="hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => router.push(`/livescore/football/match/${fixture.fixture.id}`)}
                >
                  <td className="px-2 py-3 text-left whitespace-nowrap">
                    {format(new Date(fixture.fixture.date), 'yyyy-MM-dd', { locale: ko })}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <Image
                        src={fixture.league.logo}
                        alt={fixture.league.name}
                        width={20}
                        height={20}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-1 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <span className={`max-w-[150px] truncate ${playerTeamId === fixture.teams.home.id ? 'font-bold' : ''}`}>
                        {fixture.teams.home.name}
                      </span>
                      <TeamLogo
                        logo={fixture.teams.home.logo}
                        name={fixture.teams.home.name}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-1 text-center font-medium">
                    {fixture.goals.home} - {fixture.goals.away}
                  </td>
                  <td className="py-3 pl-1 text-left">
                    <div className="flex items-center space-x-1">
                      <TeamLogo
                        logo={fixture.teams.away.logo}
                        name={fixture.teams.away.name}
                      />
                      <span className={`max-w-[150px] truncate ${playerTeamId === fixture.teams.away.id ? 'font-bold' : ''}`}>
                        {fixture.teams.away.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-1 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${resultStyle}`}>
                      {matchResult}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {fixture.statistics?.games?.minutes || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.games?.rating ? 
                      Number(fixture.statistics.games.rating).toFixed(1) : '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.goals?.total || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.goals?.assists || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.shots?.total || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.shots?.on || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.passes?.total || '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.statistics?.passes?.key || '-'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : !loading && (
        <div className="text-center py-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">경기 기록이 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">
            선택한 시즌에 대한 경기 기록이 없습니다.<br />
            다른 시즌을 선택해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}