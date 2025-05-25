'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [isClient, setIsClient] = useState(false); // 🔧 클라이언트 렌더링 확인용
  const [isLoading, setIsLoading] = useState(true); // 🔧 로딩 상태 추가
  
  // API 호출 추적을 위한 ref
  const fetchingRef = useRef<boolean>(false);
  
  // 스와이프를 위한 ref
  const touchStartXRef = useRef<number | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // 🔧 클라이언트 렌더링 확인 - Hydration 불일치 방지
  useEffect(() => {
    setIsClient(true);
    setMatches(initialMatches); // 클라이언트에서만 데이터 설정
    setIsLoading(false);
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
              }).filter(Boolean) // null 항목 제거
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
              }).filter(Boolean) // null 항목 제거
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
              }).filter(Boolean) // null 항목 제거
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
          
          if (filteredMatches.length === 0) {
            setError('예정된/진행 중인 주요 리그 경기가 없습니다.');
          } else {
            setError(null);
          }
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
      if (!fetchingRef.current) { // 진행 중인 요청이 없을 때만 새로 요청
        fetchLiveScores();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isClient]);

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

    // 초기 설정
    setDarkModeColors();

    // MutationObserver로 다크모드 변경 감지
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
  }, [matches.length]);

  // 경기 시간 포맷팅 함수
  const formatMatchTime = (match: FootballMatchData) => {
    // match 객체 자체 검증
    if (!match) {
      return '-';
    }
    
    // 필수 속성 검증
    if (!match.id) {
      return '-';
    }
    
    // status나 time이 undefined인 경우 안전하게 처리
    if (!match.status || !match.time) {
      return '-';
    }
    
    try {
      // 상태 코드 기반 처리
      const statusCode = match.status.code || '';
      
      // 경기 예정 (Not Started)
      if (statusCode === 'NS') {
        // 예정된 경기 - 시작 시간 표시
        if (!match.time.date) {
          return '-';
        }
        
        // 🔧 Hydration 불일치 방지 - 클라이언트에서만 시간 계산
        if (!isClient) {
          return '예정';
        }
        
        // 날짜 문자열을 Date 객체로 변환 (타임존 고려)
        const matchTime = new Date(match.time.date);
        
        // 날짜가 유효하지 않은 경우
        if (isNaN(matchTime.getTime())) {
          return '-';
        }
        
        // 시간을 현지 시간 기준으로 표시 (24시간제)
        const hours = matchTime.getHours();
        const minutes = matchTime.getMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } 
      
      // 하프타임
      else if (statusCode === 'HT') {
        return 'HT';
      } 
      
      // 경기 종료
      else if (statusCode === 'FT' || statusCode === 'AET' || statusCode === 'PEN') {
        return statusCode; // FT(Full Time), AET(After Extra Time), PEN(Penalties) 그대로 표시
      } 
      
      // 경기 취소/연기
      else if (statusCode === 'CANC' || statusCode === 'PST' || statusCode === 'SUSP') {
        return statusCode === 'CANC' ? '취소됨' : statusCode === 'PST' ? '연기됨' : '중단됨';
      }
      
      // 경과 시간이 있는 경우 (진행 중인 경기)
      else if (match.status.elapsed !== undefined && match.status.elapsed !== null) {
        return `${match.status.elapsed}'`;
      }
      
      // 그 외 상태 코드 그대로 반환
      return statusCode || '-';
    } catch {
      return '-';
    }
  };

  // 터치 이벤트 핸들러 (스와이프 감지)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = () => {
    // 필요한 경우 여기에 로직 추가
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || !cardContainerRef.current) return;
    
    // 스와이프 로직 제거 - 자연스러운 스크롤만 사용
    
    touchStartXRef.current = null;
  };
  
  // 좌우 스크롤 버튼 핸들러 (PC 전용)
  const scrollLeft = () => {
    if (cardContainerRef.current) {
      cardContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (cardContainerRef.current) {
      cardContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full mb-4 mt-4 md:mt-0">
      {/* 🔧 Hydration 불일치 방지 - 초기 로딩 상태 */}
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
      ) : matches.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-40 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
          <p>예정된/진행 중인 경기가 없습니다</p>
          <p className="text-xs mt-1 text-gray-400">잠시 후 다시 확인해주세요</p>
        </div>
      ) : (
        <div className="relative">
          {/* PC 전용 좌우 버튼 */}
          {matches.length > 1 && (
            <>
              <button 
                onClick={scrollLeft}
                className="hidden md:flex absolute left-[-12px] top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-900/90 rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform hover:shadow-xl"
                aria-label="이전 경기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button 
                onClick={scrollRight}
                className="hidden md:flex absolute right-[-12px] top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-gray-900/90 rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform hover:shadow-xl"
                aria-label="다음 경기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}
          
          {/* 가로 스크롤 슬라이더 */}
          <div 
            ref={cardContainerRef}
            className="overflow-x-auto overflow-y-hidden scrollbar-hide mx-0 mt-0 scroll-smooth h-[140px]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overflowX: 'auto',
              overflowY: 'hidden',
              display: 'flex',
              flexDirection: 'row',
              height: '140px'
            }}
          >
            <div className="flex pl-0 pr-2 h-[140px]">
              {matches.map((match, index) => {
                // 한국어 팀명과 리그명 매핑
                const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
                const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
                const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
                
                // 🔧 안전한 텍스트 처리 - undefined 방지
                const homeTeamNameKo = String(homeTeamInfo?.name_ko || match.teams?.home?.name || '홈팀');
                const awayTeamNameKo = String(awayTeamInfo?.name_ko || match.teams?.away?.name || '원정팀');
                const leagueNameKo = String(leagueInfo?.nameKo || match.league?.name || '리그 정보 없음');
                
                return (
                  <Link 
                    key={`match-${match.id || index}-${index}`} 
                    href={match.id ? `/livescore/football/match/${match.id}` : '#'}
                    className="flex-shrink-0 w-[260px] border rounded-lg p-2 transition-all h-[140px] mr-3 shadow-sm cursor-pointer group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
                    style={{ 
                      backgroundColor: '#ffffff', 
                      WebkitTapHighlightColor: 'transparent',
                      transform: 'translate3d(0,0,0)' // 하드웨어 가속 추가
                    }}
                    ref={el => {
                      if (!cardRefs.current) cardRefs.current = [];
                      if (index !== -1) cardRefs.current[index] = el;
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
                      <span className="text-xs font-medium truncate max-w-[210px]">{leagueNameKo}</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 