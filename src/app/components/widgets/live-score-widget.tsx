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
  // 상태 초기화 시 오늘/내일 구분 적용 (이미 displayDate가 있다면 그대로 사용)
  const [matches, setMatches] = useState<EnhancedMatchData[]>(
    initialMatches.map(match => {
      // 이미 displayDate가 있다면 그대로 사용
      if (match.displayDate) {
        return match as EnhancedMatchData;
      }
      
      // 아니면 날짜 확인 로직으로 계산
      const currentDate = new Date();
      const matchDate = new Date(match.time.date);
      
      // 날짜만 비교하기 위해 시간 정보 제거
      const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
      
      // 날짜 차이 계산 (밀리초 단위)
      const diffDays = Math.floor((matchDay.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24));
      
      let displayText = '오늘';
      if (diffDays < 0) displayText = '어제';
      else if (diffDays > 0) displayText = '내일';
      
      return { ...match, displayDate: displayText };
    }) as EnhancedMatchData[]
  );
  const [loading, setLoading] = useState(initialMatches.length === 0);
  const [error, setError] = useState<string | null>(null);
  
  // API 호출 추적을 위한 ref - 초기값 설정
  const fetchingRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(initialMatches.length > 0);
  
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
      
      // 날짜 표시 로직 재사용 (이미 displayDate가 있다면 그대로 사용)
      const processedMatches = initialMatches.map(match => {
        // 이미 displayDate가 있다면 그대로 사용
        if (match.displayDate) {
          return match as EnhancedMatchData;
        }
        
        const currentDate = new Date();
        const matchDate = new Date(match.time.date);
        
        // 날짜만 비교하기 위해 시간 정보 제거
        const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
        
        // 날짜 차이 계산 (밀리초 단위)
        const diffDays = Math.floor((matchDay.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24));
        
        let displayText = '오늘';
        if (diffDays < 0) displayText = '어제';
        else if (diffDays > 0) displayText = '내일';
        
        return { ...match, displayDate: displayText };
      }) as EnhancedMatchData[];
      
      setMatches(processedMatches);
      initializedRef.current = true;
      return;
    }

    const fetchLiveScores = async () => {
      // 이미 가져오는 중이면 중복 요청 방지
      if (fetchingRef.current) return;
      
      try {
        fetchingRef.current = true;
        setLoading(true);
        
        // 어제, 오늘, 내일 경기 데이터를 한 번에 가져오는 새 API 호출
        console.log('다중 경기 데이터 요청 시작 - ' + new Date().toISOString());
        const multiResponse = await fetch(`/api/livescore/football/multi-date?t=${Date.now()}&debug=true`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          next: { revalidate: 0 },
          cache: 'no-store'
        });
        
        // 응답 확인
        if (!multiResponse.ok) {
          console.error('다중 경기 데이터 응답 에러:', {
            status: multiResponse.status, 
            statusText: multiResponse.statusText,
            url: multiResponse.url
          });
          throw new Error(`경기 데이터를 가져오는데 실패했습니다. (${multiResponse.status})`);
        }
        
        // 응답 확인
        const responseText = await multiResponse.text();
        console.log('응답 데이터 길이:', responseText.length);
        
        let multiResult;
        try {
          // 텍스트로 받은 응답을 JSON으로 파싱
          multiResult = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON 파싱 오류:', parseError);
          console.log('응답 텍스트 일부:', responseText.substring(0, 500));
          throw new Error('응답 데이터 파싱에 실패했습니다.');
        }
        
        // 데이터 확인용 콘솔 로그
        console.log('다중 경기 데이터 결과:', {
          success: multiResult.success,
          dates: multiResult.dates,
          totalMatches: multiResult.meta?.totalMatches,
          // 각 날짜별 데이터 유무 확인
          hasYesterday: !!multiResult.data?.yesterday,
          hasToday: !!multiResult.data?.today,
          hasTomorrow: !!multiResult.data?.tomorrow
        });
        
        if (multiResult.success && multiResult.data) {
          // 데이터 구조 검증
          if (!multiResult.data.yesterday || !multiResult.data.today || !multiResult.data.tomorrow) {
            console.error('데이터 구조 오류:', multiResult.data);
            throw new Error('API 응답 데이터 구조가 예상과 다릅니다.');
          }
          
          // 어제 경기
          const processYesterdayMatches = Array.isArray(multiResult.data.yesterday.matches) 
            ? multiResult.data.yesterday.matches.map((match: MatchData) => ({
                ...match,
                displayDate: '어제'
              }))
            : [];
          
          // 오늘 경기
          const processTodayMatches = Array.isArray(multiResult.data.today.matches)
            ? multiResult.data.today.matches.map((match: MatchData) => ({
                ...match,
                displayDate: '오늘'
              }))
            : [];
            
          // 내일 경기
          const processTomorrowMatches = Array.isArray(multiResult.data.tomorrow.matches)
            ? multiResult.data.tomorrow.matches.map((match: MatchData) => ({
                ...match, 
                displayDate: '내일'
              }))
            : [];
          
          // 모든 경기 데이터 병합 (어제 → 오늘 → 내일 순서로)
          const combinedMatches = [
            ...processYesterdayMatches,
            ...processTodayMatches,
            ...processTomorrowMatches
          ] as EnhancedMatchData[];
          
          // 최종 결합된 데이터 확인
          console.log('최종 결합된 경기 데이터:', {
            total: combinedMatches.length,
            yesterday: processYesterdayMatches.length,
            today: processTodayMatches.length,
            tomorrow: processTomorrowMatches.length
          });
          
          // 날짜별 샘플 경기 로그
          if (processYesterdayMatches.length > 0) {
            console.log('어제 경기 샘플:', processYesterdayMatches[0].displayDate, processYesterdayMatches[0].time?.date);
          }
          if (processTodayMatches.length > 0) {
            console.log('오늘 경기 샘플:', processTodayMatches[0].displayDate, processTodayMatches[0].time?.date);
          }
          if (processTomorrowMatches.length > 0) {
            console.log('내일 경기 샘플:', processTomorrowMatches[0].displayDate, processTomorrowMatches[0].time?.date);
          }
          
          setMatches(combinedMatches);
          
          if (combinedMatches.length === 0) {
            setError('예정된/진행 중인 주요 리그 경기가 없습니다.');
          } else {
            setError(null);
          }
        } else {
          console.error('API 응답 오류:', multiResult);
          setError('데이터를 가져오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('경기 데이터 처리 중 오류:', err);
        setError(err instanceof Error ? `${err.message}` : '알 수 없는 오류가 발생했습니다.');
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
    <div className="w-full mb-4">
      {loading ? (
        <div className="flex flex-col justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">경기 데이터를 가져오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
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
            className="overflow-x-auto scrollbar-hide mx-0 mt-0 scroll-smooth"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overflowX: 'auto',
              display: 'flex',
              flexDirection: 'row'
            }}
          >
            <div className="flex pl-0 pr-2">
              {matches.map((match) => (
                <Link 
                  key={match.id} 
                  href={`/livescore/football/match/${match.id}`}
                  className="flex-shrink-0 w-[260px] border rounded-lg p-2 transition-all h-[140px] mr-3 shadow-sm cursor-pointer group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 touch-manipulation active:scale-[0.99]"
                  style={{ 
                    backgroundColor: '#ffffff', 
                    WebkitTapHighlightColor: 'transparent',
                    transform: 'translate3d(0,0,0)' // 하드웨어 가속 추가
                  }}
                  ref={el => {
                    if (!cardRefs.current) cardRefs.current = [];
                    const index = matches.findIndex(m => m.id === match.id);
                    if (index !== -1) cardRefs.current[index] = el;
                  }}
                >
                  <div className="flex items-center gap-1.5 pb-0.5 border-b border-gray-200 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-700 transition-colors">
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
                      <span className="text-[10px] text-center truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{match.teams.home.name}</span>
                    </div>
                    
                    {/* 중앙 (vs 및 시간) */}
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="font-bold text-base leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        VS
                      </span>
                      <span className={`text-[10px] font-medium ${
                        match.displayDate === '오늘' 
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 rounded' 
                          : match.displayDate === '내일' 
                            ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 rounded' 
                            : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-1.5 rounded'
                      } leading-tight`}>
                        {match.displayDate}
                      </span>
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 leading-tight mt-0.5">
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
                      <span className="text-[10px] text-center truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{match.teams.away.name}</span>
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