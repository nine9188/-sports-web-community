'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// 경기 데이터 인터페이스
interface MatchData {
  id: number;
  status: {
    code: string;
    name: string;
    elapsed: number | null;
  };
  time: {
    timestamp: number;
    date: string;
    timezone: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  displayDate?: string; // 표시용 날짜 (오늘/내일)
}

// 타입 확장 (displayDate 포함)
interface EnhancedMatchData extends MatchData {
  displayDate: string;
}

interface LiveScoreWidgetProps {
  initialMatches?: MatchData[];
}

export default function LiveScoreWidget({ initialMatches = [] }: LiveScoreWidgetProps) {
  const [matches, setMatches] = useState<EnhancedMatchData[]>(
    initialMatches.map(match => ({ ...match, displayDate: '오늘' })) as EnhancedMatchData[]
  );
  const [loading, setLoading] = useState(initialMatches.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [touchMoved, setTouchMoved] = useState(false);
  
  // API 호출 추적을 위한 ref
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);
  
  // 스와이프를 위한 ref
  const touchStartXRef = useRef<number | null>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    // 이미 초기화 되었으면 중복 실행 방지
    if (initializedRef.current) return;
    
    // 초기 데이터가 있으면 초기 로딩 상태와 초기화 완료 처리
    if (initialMatches.length > 0) {
      setLoading(false);
      setMatches(initialMatches.map(match => ({ ...match, displayDate: '오늘' })) as EnhancedMatchData[]);
      initializedRef.current = true;
      return;
    }

    const fetchLiveScores = async () => {
      // 이미 가져오는 중이면 중복 요청 방지
      if (fetchingRef.current) return;
      
      try {
        fetchingRef.current = true;
        setLoading(true);
        
        // 오늘 날짜와 내일 날짜 계산
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const formattedToday = today.toISOString().split('T')[0];
        const formattedTomorrow = tomorrow.toISOString().split('T')[0];
        
        // 오늘과 내일 경기 데이터를 병렬로 가져오기
        const [todayResponse, tomorrowResponse] = await Promise.all([
          fetch(`/api/livescore/football?date=${formattedToday}`),
          fetch(`/api/livescore/football?date=${formattedTomorrow}`)
        ]);
        
        // 응답 확인
        if (!todayResponse.ok || !tomorrowResponse.ok) {
          throw new Error('경기 데이터를 가져오는데 실패했습니다.');
        }
        
        // 데이터 파싱
        const [todayResult, tomorrowResult] = await Promise.all([
          todayResponse.json(),
          tomorrowResponse.json()
        ]);
        
        if (todayResult.success && tomorrowResult.success) {
          // 종료된 경기는 필터링하고 날짜 정보 추가
          const processTodayMatches = todayResult.data
            .filter((match: MatchData) => !['FT', 'AET', 'PEN', 'CANC', 'ABD', 'AWD', 'WO'].includes(match.status.code))
            .map((match: MatchData) => ({
              ...match,
              displayDate: '오늘'
            })) as EnhancedMatchData[];
            
          const processTomorrowMatches = tomorrowResult.data
            .map((match: MatchData) => ({
              ...match,
              displayDate: '내일'
            })) as EnhancedMatchData[];
          
          // 모든 경기 데이터 병합 (오늘 경기가 먼저 오도록)
          const combinedMatches = [...processTodayMatches, ...processTomorrowMatches];
          
          setMatches(combinedMatches);
          
          if (combinedMatches.length === 0) {
            setError('오늘/내일 예정된 주요 리그 경기가 없습니다.');
          } else {
            setError(null);
          }
        } else {
          setError('데이터를 가져오는데 실패했습니다.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
        fetchingRef.current = false;
        initializedRef.current = true;
      }
    };

    // 초기 데이터가 없고 아직 초기화되지 않은 경우에만 API 호출
    if (initialMatches.length === 0 && !initializedRef.current) {
      fetchLiveScores();
    } else {
      initializedRef.current = true;
    }
    
    // 5분마다 데이터 갱신
    const interval = setInterval(() => {
      if (!fetchingRef.current) { // 진행 중인 요청이 없을 때만 새로 요청
        fetchLiveScores();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [initialMatches]);

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
  const formatMatchTime = (match: MatchData) => {
    if (match.status.code === 'NS') {
      // 예정된 경기 - 시작 시간만 표시
      const matchDate = new Date(match.time.date);
      return `${matchDate.getHours().toString().padStart(2, '0')}:${matchDate.getMinutes().toString().padStart(2, '0')}`;
    } else if (match.status.code === 'HT') {
      // 하프타임
      return 'HT';
    } else if (match.status.elapsed) {
      // 진행 중인 경기 - 경과 시간 표시
      return `${match.status.elapsed}'`;
    }
    return match.status.code;
  };

  // 터치 이벤트 핸들러 (스와이프 감지)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setTouchMoved(false);
  };

  const handleTouchMove = () => {
    if (touchStartXRef.current !== null) {
      setTouchMoved(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || !cardContainerRef.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartXRef.current;
    
    // 좌우 스와이프 감지 (50px 이상 이동했을 때)
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // 오른쪽으로 스와이프 (이전으로)
        cardContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
      } else {
        // 왼쪽으로 스와이프 (다음으로)
        cardContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
      }
    }
    
    touchStartXRef.current = null;
  };
  
  // 좌우 스크롤 버튼 핸들러 (PC 전용)
  const scrollLeft = () => {
    if (cardContainerRef.current) {
      cardContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (cardContainerRef.current) {
      cardContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full mb-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : matches.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>오늘/내일 예정된 경기가 없습니다.</p>
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
            className="overflow-x-auto scrollbar-hide mx-0 mt-0 scroll-smooth"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex pl-0 pr-2">
              {matches.map((match) => (
                <Link 
                  key={match.id} 
                  href={`/livescore/football/match/${match.id}`}
                  className="flex-shrink-0 w-[260px] border rounded-lg p-2 transition-all h-[140px] mr-3 shadow-sm cursor-pointer group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  ref={el => {
                    if (!cardRefs.current) cardRefs.current = [];
                    const index = matches.findIndex(m => m.id === match.id);
                    if (index !== -1) cardRefs.current[index] = el;
                  }}
                  onClick={(e) => {
                    if (touchMoved) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5 pb-0.5 border-b group-hover:border-blue-200 dark:group-hover:border-blue-700 transition-colors">
                    {match.league.logo && (
                      <Image 
                        src={match.league.logo} 
                        alt={match.league.name} 
                        width={16} 
                        height={16}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-xs font-medium truncate max-w-[210px]">{match.league.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 h-[110px]">
                    {/* 홈팀 */}
                    <div className="flex flex-col items-center justify-center gap-0">
                      {match.teams.home.logo && (
                        <Image 
                          src={match.teams.home.logo} 
                          alt={match.teams.home.name} 
                          width={40} 
                          height={40}
                          className="mb-0.5 group-hover:scale-110 transition-transform"
                        />
                      )}
                      <span className="text-[10px] text-center truncate w-full">{match.teams.home.name}</span>
                    </div>
                    
                    {/* 중앙 (vs 및 시간) */}
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="font-bold text-base leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        VS
                      </span>
                      <span className={`text-[10px] ${match.displayDate === '오늘' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'} leading-none`}>
                        {match.displayDate}
                      </span>
                      <span className="text-[10px] text-gray-500 leading-none">
                        {formatMatchTime(match)}
                      </span>
                    </div>
                    
                    {/* 원정팀 */}
                    <div className="flex flex-col items-center justify-center gap-0">
                      {match.teams.away.logo && (
                        <Image 
                          src={match.teams.away.logo} 
                          alt={match.teams.away.name} 
                          width={40} 
                          height={40}
                          className="mb-0.5 group-hover:scale-110 transition-transform"
                        />
                      )}
                      <span className="text-[10px] text-center truncate w-full">{match.teams.away.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 