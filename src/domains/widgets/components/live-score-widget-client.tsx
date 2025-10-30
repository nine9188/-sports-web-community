'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';

import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
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
  // 🔧 성능 최적화: 초기 데이터로 즉시 렌더링 (연기된 경기는 뒤로 정렬)
  const [matches, setMatches] = useState<EnhancedMatchData[]>(() => {
    return initialMatches.sort((a, b) => {
      const aCode = a.status?.code || '';
      const bCode = b.status?.code || '';
      const isFinished = (code: string) => ['FT', 'AET', 'PEN'].includes(code);
      const aFinished = isFinished(aCode);
      const bFinished = isFinished(bCode);
      if (aFinished !== bFinished) return aFinished ? 1 : -1; // 종료 경기는 뒤로

      const aIsPostponed = aCode === 'PST';
      const bIsPostponed = bCode === 'PST';
      if (aIsPostponed !== bIsPostponed) return aIsPostponed ? 1 : -1; // 연기도 뒤로

      return 0; // 그 외 기존 순서 유지
    });
  });
  const [error, setError] = useState<string | null>(null);
  
  // API 호출 추적을 위한 ref
  const fetchingRef = useRef<boolean>(false);
  
  // Embla 설정: 루프 + 트림 스냅으로 가장자리/이음매 간격 보장
  const [viewportRef, emblaApi] = useEmblaCarousel({ loop: matches.length > 4, align: 'start', containScroll: 'trimSnaps' });
  const [isHovered, setIsHovered] = useState(false);

  // 자동 스크롤 (약 8초마다 한 칸)
  useEffect(() => {
    if (!emblaApi || matches.length <= 1) return;
    const intervalId = window.setInterval(() => {
      if (!isHovered) emblaApi.scrollNext();
    }, 8000);
    return () => window.clearInterval(intervalId);
  }, [emblaApi, isHovered, matches.length]);

  useEffect(() => {
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
          
          // 종료 경기/연기 경기를 뒤로 보내는 정렬
          const sortedMatches = combinedMatches.sort((a, b) => {
            const aCode = a.status?.code || '';
            const bCode = b.status?.code || '';
            const isFinished = (code: string) => ['FT', 'AET', 'PEN'].includes(code);
            const aFinished = isFinished(aCode);
            const bFinished = isFinished(bCode);
            if (aFinished !== bFinished) return aFinished ? 1 : -1; // 종료 경기는 뒤로

            const aIsPostponed = aCode === 'PST';
            const bIsPostponed = bCode === 'PST';
            if (aIsPostponed !== bIsPostponed) return aIsPostponed ? 1 : -1; // 연기도 뒤로

            return 0; // 그 외 기존 순서 유지
          });
          
          setMatches(sortedMatches);
          setError(null);
        } else {
          // 🔧 성능 최적화: 에러 발생 시에도 기존 데이터 유지
          console.warn('데이터를 가져오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('경기 데이터 처리 중 오류:', err);
        // 🔧 성능 최적화: 에러 발생 시에도 기존 데이터 유지
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
  }, []);

  // 🔧 경기 시간 포맷팅 함수
  const formatMatchTime = (match: FootballMatchData) => {
    if (!match || !match.id || !match.status || !match.time) {
      return '-';
    }

    try {
      const statusCode = match.status.code || '';

      if (statusCode === 'NS') {
        if (!match.time.date) return '-';
        const matchTime = new Date(match.time.date);
        if (isNaN(matchTime.getTime())) return '-';
        return matchTime.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Seoul',
        });
      }
      else if (statusCode === 'HT') {
        return '하프타임';
      }
      else if (statusCode === 'FT') {
        return '종료';
      }
      else if (statusCode === 'AET') {
        return '연장 종료';
      }
      else if (statusCode === 'PEN') {
        return '승부차기';
      }
      else if (statusCode === 'CANC') {
        return '취소됨';
      }
      else if (statusCode === 'PST') {
        return '연기됨';
      }
      else if (statusCode === 'SUSP') {
        return '중단됨';
      }
      else if (match.status.elapsed !== undefined && match.status.elapsed !== null) {
        return `${match.status.elapsed}'`;
      }

      return statusCode || '-';
    } catch {
      return '-';
    }
  };

  // Swiper 렌더링 로직 제거됨 (Embla 기반 렌더링으로 대체)

  // 정적 그리드 없이 바로 캐러셀 렌더링

  return (
    <div className="relative z-10 w-full">
      {error ? (
        <div className="flex flex-col justify-center items-center h-40 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-500">{error}</p>
          <p className="text-xs mt-1 text-gray-500">새로고침하거나 잠시 후 다시 시도해주세요</p>
        </div>
      ) : (
        <div className="w-full relative group/embla" style={{ overflow: 'visible' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
          <div className="relative" style={{ overflow: 'hidden' }}>
            <div className="embla" ref={viewportRef}>
              <div className="flex -mx-1">
                {matches.map((match, index) => {
                  const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
                  const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
                  const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
                  const homeTeamNameKo = String(homeTeamInfo?.name_ko || match.teams?.home?.name || '홈팀');
                  const awayTeamNameKo = String(awayTeamInfo?.name_ko || match.teams?.away?.name || '원정팀');
                  const leagueNameKo = String(leagueInfo?.nameKo || match.league?.name || '리그 정보 없음');
                  return (
                    <div key={`match-${match.id || index}`} className="shrink-0 basis-1/2 md:basis-1/2 lg:basis-1/4 px-1">
                      <Link 
                        href={match.id ? `/livescore/football/match/${match.id}` : '#'}
                        className="block w-full h-[140px] border rounded-lg p-2 bg-white border-gray-200 transition-all shadow-sm cursor-pointer group hover:shadow-md hover:border-blue-300 touch-manipulation"
                        style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-1 text-gray-700">
                            <div className="flex items-center gap-0.5 flex-1 min-w-0">
                              {match.league?.logo && match.league?.id && (
                                <ApiSportsImage
                                  imageId={match.league.id}
                                  imageType={ImageType.Leagues}
                                  alt={String(leagueNameKo)}
                                  width={16}
                                  height={16}
                                  style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                                  className="rounded-full flex-shrink-0"
                                  loading="eager"
                                  priority={index < 4}
                                  fetchPriority="high"
                                />
                              )}
                              <span className="text-xs font-medium truncate">{leagueNameKo}</span>
                              {match.status?.code && !['NS', 'FT', 'AET', 'PEN', 'CANC', 'PST', 'SUSP'].includes(match.status.code) && (
                                <span className="relative flex h-2 w-2 ml-1 flex-shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium ml-2 flex-shrink-0">{index + 1}/{matches.length}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 flex-1">
                            <div className="flex flex-col items-center justify-center gap-0">
                              {match.teams?.home?.logo && match.teams?.home?.id && (
                                <ApiSportsImage 
                                  imageId={match.teams.home.id} 
                                  imageType={ImageType.Teams} 
                                  alt={String(homeTeamNameKo)} 
                                  width={40} 
                                  height={40} 
                                  style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
                                  className="mb-0.5 group-hover:scale-110 transition-transform"
                                  loading="eager"
                                  priority={index < 4}
                                  fetchPriority="high"
                                />
                              )}
                              <span className="text-[10px] text-center truncate w-full group-hover:text-blue-600 transition-colors">{homeTeamNameKo}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className="font-bold text-base text-center">{match.status?.code !== 'NS' ? `${match.goals?.home ?? 0} - ${match.goals?.away ?? 0}` : 'vs'}</span>
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-medium group-hover:text-blue-600 transition-colors">{formatMatchTime(match)}</span>
                                {(['NS','FT','AET','PEN'].includes(match.status?.code || '') && match.displayDate) && (
                                  <span className="text-[9px] text-gray-500 mt-0.5">{String(match.displayDate)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-0">
                              {match.teams?.away?.logo && match.teams?.away?.id && (
                                <ApiSportsImage 
                                  imageId={match.teams.away.id} 
                                  imageType={ImageType.Teams} 
                                  alt={String(awayTeamNameKo)} 
                                  width={40} 
                                  height={40} 
                                  style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
                                  className="mb-0.5 group-hover:scale-110 transition-transform"
                                  loading="eager"
                                  priority={index < 4}
                                  fetchPriority="high"
                                />
                              )}
                              <span className="text-[10px] text-center truncate w-full group-hover:text-blue-600 transition-colors">{awayTeamNameKo}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 데스크탑 네비게이션 버튼 */}
          {matches.length > 4 && (
            <>
              <button onClick={() => emblaApi?.scrollPrev()} className="hidden md:flex absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 items-center justify-center transition-all duration-200 opacity-30 pointer-events-none group-hover/embla:opacity-100 group-hover/embla:pointer-events-auto hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-xl" aria-label="이전 경기">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button onClick={() => emblaApi?.scrollNext()} className="hidden md:flex absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 items-center justify-center transition-all duration-200 opacity-30 pointer-events-none group-hover/embla:opacity-100 group-hover/embla:pointer-events-auto hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-xl" aria-label="다음 경기">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
} 