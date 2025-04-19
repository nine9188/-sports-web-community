'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 타입 정의
interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
}

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

interface StandingsData {
  league: League;
  standings: Standing[];
}

interface ClientLeagueStandingsProps {
  initialLeague: string;
  initialStandings: StandingsData | null;
}

// 외부에서 필요한 상수 정의
const LEAGUES = [
  { id: 'premier', name: 'EPL', fullName: '프리미어리그' },
  { id: 'laliga', name: '라리가', fullName: '라리가' },
  { id: 'bundesliga', name: '분데스', fullName: '분데스리가' },
  { id: 'serieA', name: '세리에A', fullName: '세리에 A' },
  { id: 'ligue1', name: '리그앙', fullName: '리그 1' },
];

// 캐시 TTL (24시간)
const CACHE_TTL = 24 * 60 * 60 * 1000;

// 로컬 스토리지 캐시 항목 타입
interface CacheItem {
  data: StandingsData;
  timestamp: number;
}

// 로컬 스토리지에서 캐시된 데이터 가져오기
const getLocalStorageCache = (leagueId: string): CacheItem | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cachedItem = localStorage.getItem(`league_standings_${leagueId}`);
    if (!cachedItem) return null;
    
    const parsedItem: CacheItem = JSON.parse(cachedItem);
    return parsedItem;
  } catch (error) {
    console.error('로컬 스토리지 읽기 오류:', error);
    return null;
  }
};

// 로컬 스토리지에 데이터 캐싱
const setLocalStorageCache = (leagueId: string, data: StandingsData) => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheItem: CacheItem = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(`league_standings_${leagueId}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('로컬 스토리지 쓰기 오류:', error);
  }
};

// 팀 이름 짧게 표시 (최대 8자)
import { getTeamById } from '@/app/constants/teams';

const shortenTeamName = (name: string, teamId: number) => {
  // 팀 데이터 매핑이 있는지 확인
  const teamInfo = getTeamById(teamId);
  
  // 매핑된 데이터가 있으면 한글 이름 사용
  if (teamInfo) {
    return teamInfo.name_ko;
  }
  
  // 매핑 데이터가 없으면 기존 로직 적용
  if (name.length <= 8) return name;
  return name.substring(0, 8);
};

export function ClientLeagueStandings({
  initialLeague,
  initialStandings,
}: ClientLeagueStandingsProps) {
  // 상태 관리
  const [activeLeague, setActiveLeague] = useState(initialLeague);
  const [standings, setStandings] = useState<StandingsData | null>(initialStandings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  
  // 이미 초기 데이터가 로드됐는지 확인하는 ref (첫 렌더링에서만 사용)
  const initialLoadRef = useRef(true);
  
  // 데이터 캐싱을 위한 ref
  const cachedData = useRef<{[key: string]: StandingsData | null}>({
    [initialLeague]: initialStandings
  });

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

  // 초기 로컬 스토리지 캐시 불러오기
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 초기 로컬 스토리지 캐시 로드
    LEAGUES.forEach(league => {
      const cachedItem = getLocalStorageCache(league.id);
      if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_TTL) {
        cachedData.current[league.id] = cachedItem.data;
      }
    });
    
    // 초기 리그에 대해 로컬 스토리지 캐시 확인
    if (!initialStandings) {
      const cachedInitialLeague = getLocalStorageCache(initialLeague);
      if (cachedInitialLeague && Date.now() - cachedInitialLeague.timestamp < CACHE_TTL) {
        setStandings(cachedInitialLeague.data);
      }
    } else {
      // 초기 데이터를 로컬 스토리지에 저장
      setLocalStorageCache(initialLeague, initialStandings);
    }
  }, [initialLeague, initialStandings]);

  // 리그 변경 시 다른 리그 데이터 가져오기
  useEffect(() => {
    // 첫 렌더링이면 API 호출 안함 (SSR 데이터 사용)
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    // 모바일에서는 렌더링하지 않음
    if (isMobile) return;
    
    // 메모리 캐시 확인
    if (cachedData.current[activeLeague]) {
      setStandings(cachedData.current[activeLeague]);
      return;
    }
    
    // 로컬 스토리지 캐시 확인
    const localCache = getLocalStorageCache(activeLeague);
    if (localCache && Date.now() - localCache.timestamp < CACHE_TTL) {
      setStandings(localCache.data);
      cachedData.current[activeLeague] = localCache.data;
      return;
    }
    
    // 리그 변경 시 로딩 상태로 변경하고 페이지 새로고침
    setLoading(true);
    setError(null); // 오류 상태 초기화
    
    // 리그 변경 시 해당 리그 데이터를 가져오기 위해 페이지 새로고침
    router.refresh();
    
    // 1초 후 로딩 상태 해제 (새로고침으로 컴포넌트가 재렌더링됨)
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    
  }, [activeLeague, isMobile, router]);

  // 모바일에서는 렌더링하지 않음
  if (isMobile) {
    return null;
  }

  return (
    <div className="border rounded-md overflow-hidden hidden md:block">
      <div className="bg-slate-800 text-white py-2 px-3 text-sm font-medium">
        축구 팀순위
      </div>
      
      {/* 리그 선택 탭 */}
      <div className="flex border-b">
        {LEAGUES.map(league => (
          <button 
            key={league.id}
            onClick={() => setActiveLeague(league.id)}
            className={`flex-1 text-xs py-2 px-1 ${
              activeLeague === league.id 
                ? 'bg-white border-b-2 border-slate-800 font-medium' 
                : 'bg-gray-100'
            }`}
            disabled={loading}
          >
            {league.name}
          </button>
        ))}
      </div>
      
      {/* 선택된 리그 정보 */}
      <div className="px-3 py-2 border-b">
        {loading ? (
          <div className="h-5 w-40 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <div className="flex items-center gap-2">
            {standings?.league?.logo && (
              <div className="w-5 h-5 relative">
                <Image
                  src={standings.league.logo}
                  alt={standings.league.name}
                  fill
                  sizes="20px"
                  className="object-contain"
                />
              </div>
            )}
            <span className="text-xs font-medium">
              {LEAGUES.find(l => l.id === activeLeague)?.fullName || ''}
            </span>
          </div>
        )}
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
                {standings.standings.map((item, index) => (
                  <tr 
                    key={item.team.id}
                    className={`${index < standings.standings.length - 1 ? 'border-b' : ''} hover:bg-gray-50 cursor-pointer ${index < 4 ? 'text-blue-600' : ''}`}
                    onClick={() => router.push(`/livescore/football/team/${item.team.id}`)}
                  >
                    <td className="text-center py-1.5 px-0">{item.rank}</td>
                    <td className="text-left py-1.5 px-1">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 relative flex-shrink-0">
                          <Image
                            src={item.team.logo}
                            alt={item.team.name}
                            fill
                            sizes="16px"
                            className="object-contain"
                          />
                        </div>
                        <span className="truncate max-w-[100px] font-medium">
                          {shortenTeamName(item.team.name, item.team.id)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-1 px-0">{item.all.played}</td>
                    <td className="text-center py-1 px-0">{item.all.win}</td>
                    <td className="text-center py-1 px-0">{item.all.draw}</td>
                    <td className="text-center py-1 px-0">{item.all.lose}</td>
                    <td className="text-center py-1 px-0 font-medium">{item.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
           <div className="p-4 text-center text-gray-500 text-sm">
             순위 정보가 없습니다.
           </div>
        )}
      </div>
    </div>
  );
} 