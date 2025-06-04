'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchMultiDayMatches, MatchData as FootballMatchData } from '@/domains/livescore/actions/footballApi';
import { getTeamById } from '@/domains/livescore/constants/teams';
import { getLeagueById } from '@/domains/livescore/constants/league-mappings';

// 타입 확장 (displayDate 포함)
interface EnhancedMatchData extends FootballMatchData {
  displayDate: string;
}

// API 응답 타입 정의
interface MultiDayMatchesResponse {
  success: boolean;
  dates?: {
    yesterday: string;
    today: string;
    tomorrow: string;
  };
  meta?: {
    totalMatches: number;
  };
  data?: {
    yesterday: { matches: FootballMatchData[] };
    today: { matches: FootballMatchData[] };
    tomorrow: { matches: FootballMatchData[] };
  };
  error?: string;
}

interface LiveScoreWidgetClientProps {
  initialMatches: EnhancedMatchData[];
}

export default function LiveScoreWidgetClient({ initialMatches }: LiveScoreWidgetClientProps) {
  const [matches, setMatches] = useState<EnhancedMatchData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔧 슬라이딩 인덱스 상태 추가 (시작 인덱스)
  const [startIndex, setStartIndex] = useState(0);
  
  // API 호출 추적을 위한 ref
  const fetchingRef = useRef<boolean>(false);
  
  // 카드 참조를 위한 ref
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // 🔧 슬라이딩 계산
  const cardsToShow = 4; // 항상 4개 카드 표시
  
  // 현재 표시할 경기들 (startIndex부터 4개)
  const displayMatches = useMemo(() => {
    if (matches.length === 0) return [];
    
    // 🔧 순환 구조 제거 - 단순히 slice 사용
    return matches.slice(startIndex, startIndex + cardsToShow);
  }, [matches, startIndex, cardsToShow]);

  // 🔧 슬라이딩 함수 - 순환 구조 제거
  const slideLeft = () => {
    // 왼쪽으로 슬라이드 (이전 카드 보기)
    setStartIndex(prev => Math.max(0, prev - 1));
  };

  const slideRight = () => {
    // 오른쪽으로 슬라이드 (다음 카드 보기)
    const maxStartIndex = Math.max(0, matches.length - cardsToShow);
    setStartIndex(prev => Math.min(maxStartIndex, prev + 1));
  };

  // 🔧 버튼 활성화 상태 계산
  const canSlideLeft = startIndex > 0;
  const canSlideRight = startIndex < matches.length - cardsToShow;
  const showSlideButtons = matches.length > cardsToShow;

  // 🔧 클라이언트 렌더링 확인 - Hydration 불일치 방지
  useEffect(() => {
    setIsClient(true);
    setMatches(initialMatches);
    setIsLoading(false);
    setStartIndex(0); // 초기 인덱스 설정
  }, [initialMatches]);

  useEffect(() => {
    // 클라이언트에서만 데이터 갱신 실행
    if (!isClient) return;
    
    // 5분마다 데이터 갱신
    const fetchLiveScores = async () => {
      // 이미 가져오는 중이면 중복 요청 방지
      if (fetchingRef.current) return;
      
      try {
        fetchingRef.current = true;
        
        // 서버 액션을 사용하여 경기 데이터 가져오기
        const result = await fetchMultiDayMatches() as MultiDayMatchesResponse;
        
        if (result.success && result.data) {
          // 어제 경기
          const processYesterdayMatches = Array.isArray(result.data.yesterday?.matches) 
            ? result.data.yesterday.matches.map((match: FootballMatchData) => {
                if (!match || !match.id) {
                  return null;
                }
                return {
                  ...match,
                  displayDate: '어제'
                };
              }).filter(Boolean)
            : [];
          
          // 오늘 경기
          const processTodayMatches = Array.isArray(result.data.today?.matches)
            ? result.data.today.matches.map((match: FootballMatchData) => {
                if (!match || !match.id) {
                  return null;
                }
                return {
                  ...match,
                  displayDate: '오늘'
                };
              }).filter(Boolean)
            : [];
            
          // 내일 경기
          const processTomorrowMatches = Array.isArray(result.data.tomorrow?.matches)
            ? result.data.tomorrow.matches.map((match: FootballMatchData) => {
                if (!match || !match.id) {
                  return null;
                }
                return {
                  ...match, 
                  displayDate: '내일'
                };
              }).filter(Boolean)
            : [];
          
          // 모든 경기 데이터 병합 (어제 → 오늘 → 내일 순서로)
          const combinedMatches = [
            ...processYesterdayMatches,
            ...processTodayMatches,
            ...processTomorrowMatches
          ] as EnhancedMatchData[];
          
          // 종료된 경기 필터링 (FT, AET, PEN 상태 제외)
          const filteredMatches = combinedMatches.filter(match => 
            !['FT', 'AET', 'PEN'].includes(match.status.code)
          );
          
          setMatches(filteredMatches);
          
          // 🔧 데이터 업데이트 시 인덱스 범위 확인
          if (filteredMatches.length > 0 && startIndex >= filteredMatches.length) {
            setStartIndex(0);
          }
          
          setError(null);
        } else {
          setError('데이터를 가져오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('경기 데이터 처리 중 오류:', err);
        setError(err instanceof Error ? `${err.message}` : '알 수 없는 오류가 발생했습니다.');
      } finally {
        fetchingRef.current = false;
      }
    };
    
    // 5분마다 데이터 갱신
    const interval = setInterval(() => {
      if (!fetchingRef.current) {
        fetchLiveScores();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isClient, startIndex]);

  useEffect(() => {
    // 다크모드 감지 및 배경색 설정
    const setDarkModeColors = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      cardRefs.current.forEach(card => {
        if (card) {
          card.style.backgroundColor = isDarkMode ? '#1f2937' : '#ffffff';
        }
      });
    };

    setDarkModeColors();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setDarkModeColors();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, [displayMatches.length]);

  // 경기 시간 포맷팅 함수
  const formatMatchTime = (match: FootballMatchData) => {
    if (!match || !match.id || !match.status || !match.time) {
      return '-';
    }
    
    try {
      const statusCode = match.status.code || '';
      
      if (statusCode === 'NS') {
        if (!match.time.date) {
          return '-';
        }
        
        if (!isClient) {
          return '예정';
        }
        
        const matchTime = new Date(match.time.date);
        
        if (isNaN(matchTime.getTime())) {
          return '-';
        }
        
        const hours = matchTime.getHours();
        const minutes = matchTime.getMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } 
      else if (statusCode === 'HT') {
        return 'HT';
      } 
      else if (statusCode === 'FT' || statusCode === 'AET' || statusCode === 'PEN') {
        return statusCode;
      } 
      else if (statusCode === 'CANC' || statusCode === 'PST' || statusCode === 'SUSP') {
        return statusCode === 'CANC' ? '취소됨' : statusCode === 'PST' ? '연기됨' : '중단됨';
      }
      else if (match.status.elapsed !== undefined && match.status.elapsed !== null) {
        return `${match.status.elapsed}'`;
      }
      
      return statusCode || '-';
    } catch {
      return '-';
    }
  };

  return (
    <div className="w-full mb-4 mt-4 md:mt-0">
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-40 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-500">{error}</p>
          <p className="text-xs mt-1 text-gray-500">새로고침하거나 잠시 후 다시 시도해주세요</p>
        </div>
      ) : (
        <div className="w-full">
          {/* 🔧 슬라이딩 컨트롤과 함께 상대적 위치 설정 */}
          <div className="relative">
            {/* 🔧 좌우 슬라이딩 버튼 - 경기가 4개 초과일 때만 표시 */}
            {showSlideButtons && (
              <>
                {/* 왼쪽 버튼 - 이전 카드로 슬라이드 */}
                <button 
                  onClick={slideLeft}
                  className={`absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-lg border transition-all duration-200 ${
                    canSlideLeft 
                      ? 'bg-white/90 dark:bg-gray-900/90 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-500 border-gray-200 dark:border-gray-700 hover:scale-110 hover:shadow-xl cursor-pointer group' 
                      : 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 cursor-not-allowed opacity-50'
                  }`}
                  aria-label="이전 경기"
                  disabled={!canSlideLeft}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-colors ${
                    canSlideLeft 
                      ? 'text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400' 
                      : 'text-gray-300 dark:text-gray-600'
                  }`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                
                {/* 오른쪽 버튼 - 다음 카드로 슬라이드 */}
                <button 
                  onClick={slideRight}
                  className={`absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-lg border transition-all duration-200 ${
                    canSlideRight 
                      ? 'bg-white/90 dark:bg-gray-900/90 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-500 border-gray-200 dark:border-gray-700 hover:scale-110 hover:shadow-xl cursor-pointer group' 
                      : 'bg-gray-100/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 cursor-not-allowed opacity-50'
                  }`}
                  aria-label="다음 경기"
                  disabled={!canSlideRight}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-colors ${
                    canSlideRight 
                      ? 'text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400' 
                      : 'text-gray-300 dark:text-gray-600'
                  }`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
            
            {/* 🔧 4개 카드 고정 그리드 레이아웃 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full transition-all duration-300 ease-in-out">
              {/* 실제 경기 카드들 */}
              {displayMatches.map((match, index) => {
                const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
                const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
                const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
                
                const homeTeamNameKo = String(homeTeamInfo?.name_ko || match.teams?.home?.name || '홈팀');
                const awayTeamNameKo = String(awayTeamInfo?.name_ko || match.teams?.away?.name || '원정팀');
                const leagueNameKo = String(leagueInfo?.nameKo || match.league?.name || '리그 정보 없음');
                
                return (
                  <Link 
                    key={`match-${match.id || index}-${startIndex}-${index}`} 
                    href={match.id ? `/livescore/football/match/${match.id}` : '#'}
                    className="border rounded-lg p-2 transition-all h-[140px] shadow-sm cursor-pointer group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transform-gpu"
                    ref={el => {
                      if (!cardRefs.current) cardRefs.current = [];
                      cardRefs.current[index] = el;
                    }}
                  >
                    <div className="flex items-center gap-0.5 mb-1 text-gray-700 dark:text-gray-300">
                      {match.league?.logo && (
                        <Image 
                          src={match.league.logo} 
                          alt={String(leagueNameKo)} 
                          width={16} 
                          height={16}
                          style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                          className="rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-league.png';
                          }}
                          unoptimized
                        />
                      )}
                      <span className="text-xs font-medium truncate">{leagueNameKo}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1 h-[110px]">
                      {/* 홈팀 */}
                      <div className="flex flex-col items-center justify-center gap-0">
                        {match.teams?.home?.logo && (
                          <Image 
                            src={match.teams.home.logo} 
                            alt={String(homeTeamNameKo)} 
                            width={40} 
                            height={40}
                            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                            className="mb-0.5 group-hover:scale-110 transition-transform"
                            unoptimized
                          />
                        )}
                        <span className="text-[10px] text-center truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{homeTeamNameKo}</span>
                      </div>
                      
                      {/* 중앙 (vs 및 시간) */}
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold text-base text-center">{match.status?.code !== 'NS' ? `${match.goals?.home ?? 0} - ${match.goals?.away ?? 0}` : 'vs'}</span>
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{formatMatchTime(match)}</span>
                          {match.status?.code === 'NS' && match.displayDate && (
                            <span className="text-[9px] text-gray-500 mt-0.5">{String(match.displayDate)}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* 원정팀 */}
                      <div className="flex flex-col items-center justify-center gap-0">
                        {match.teams?.away?.logo && (
                          <Image 
                            src={match.teams.away.logo} 
                            alt={String(awayTeamNameKo)} 
                            width={40} 
                            height={40}
                            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                            className="mb-0.5 group-hover:scale-110 transition-transform"
                            unoptimized
                          />
                        )}
                        <span className="text-[10px] text-center truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{awayTeamNameKo}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              {/* 빈 슬롯 카드들 - 경기가 4개 미만일 때 채우기 */}
              {matches.length < cardsToShow && Array.from({ length: cardsToShow - matches.length }).map((_, index) => (
                <div 
                  key={`empty-slot-${index}`}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-2 h-[140px] bg-gray-50/50 dark:bg-gray-800/50"
                >
                  <div className="flex flex-col justify-center items-center h-full text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 mb-2 text-gray-300 dark:text-gray-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">다음 경기를</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">기다리는 중...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 