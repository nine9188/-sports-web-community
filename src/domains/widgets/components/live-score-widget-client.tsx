'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Swiper 스타일
import 'swiper/css';
import 'swiper/css/navigation';

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
      const aIsPostponed = a.status.code === 'PST';
      const bIsPostponed = b.status.code === 'PST';
      
      // 연기된 경기는 뒤로
      if (aIsPostponed && !bIsPostponed) return 1;
      if (!aIsPostponed && bIsPostponed) return -1;
      
      // 둘 다 연기되지 않았거나 둘 다 연기된 경우 기존 순서 유지
      return 0;
    });
  });
  const [error, setError] = useState<string | null>(null);
  
  // API 호출 추적을 위한 ref
  const fetchingRef = useRef<boolean>(false);
  
  // Swiper 참조
  const swiperRef = useRef<SwiperType>();

  // 🔧 Swiper 설정
  const swiperConfig = {
    modules: [Navigation],
    spaceBetween: 12,
    slidesPerView: 2 as const,
    loop: matches.length > 2, // 3개 이상일 때 무한 루프
    
    // 네비게이션 설정 (데스크탑만)
    navigation: matches.length > 2 ? {
      nextEl: '.livescore-swiper-button-next',
      prevEl: '.livescore-swiper-button-prev',
    } : false,

    // 터치 설정
    touchRatio: 1,
    threshold: 10,
    
    // 속도 설정
    speed: 300,

    // 반응형 설정
    breakpoints: {
      768: {
        slidesPerView: matches.length >= 4 ? 4 : matches.length,
        spaceBetween: 12,
      },
    },

    onBeforeInit: (swiper: SwiperType) => {
      swiperRef.current = swiper;
    },
  };

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
          
          // 종료된 경기 필터링 (FT, AET, PEN 상태 제외)
          const filteredMatches = combinedMatches.filter(match => 
            !['FT', 'AET', 'PEN'].includes(match.status.code)
          );
          
          // 연기된 경기를 제일 뒤로 정렬
          const sortedMatches = filteredMatches.sort((a, b) => {
            const aIsPostponed = a.status.code === 'PST';
            const bIsPostponed = b.status.code === 'PST';
            
            // 연기된 경기는 뒤로
            if (aIsPostponed && !bIsPostponed) return 1;
            if (!aIsPostponed && bIsPostponed) return -1;
            
            // 둘 다 연기되지 않았거나 둘 다 연기된 경우 기존 순서 유지
            return 0;
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
        if (!match.time.date) {
          return '-';
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

  // 렌더링할 슬라이드 생성 (빈 슬롯 포함)
  const renderSlides = () => {
    const slides = [];
    
    // 실제 경기 데이터 슬라이드
    matches.forEach((match, index) => {
                const leagueInfo = match.league?.id ? getLeagueById(match.league.id) : null;
                const homeTeamInfo = match.teams?.home?.id ? getTeamById(match.teams.home.id) : null;
                const awayTeamInfo = match.teams?.away?.id ? getTeamById(match.teams.away.id) : null;
                
                const homeTeamNameKo = String(homeTeamInfo?.name_ko || match.teams?.home?.name || '홈팀');
                const awayTeamNameKo = String(awayTeamInfo?.name_ko || match.teams?.away?.name || '원정팀');
                const leagueNameKo = String(leagueInfo?.nameKo || match.league?.name || '리그 정보 없음');
                
      slides.push(
        <SwiperSlide key={`match-${match.id || index}`}>
                  <Link 
                    href={match.id ? `/livescore/football/match/${match.id}` : '#'}
            className="block w-full h-[140px] border rounded-lg p-2 transition-all shadow-sm cursor-pointer group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 touch-manipulation bg-white border-gray-200"
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
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
                           />
                         )}
                         <span className="text-xs font-medium truncate">{leagueNameKo}</span>
                       </div>
                       <span className="text-[10px] text-gray-400 font-medium ml-2 flex-shrink-0">
                         {index + 1}/{matches.length}
                       </span>
                     </div>
                    
                    <div className="grid grid-cols-3 gap-1 flex-1">
                      {/* 홈팀 */}
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
                          />
                        )}
                        <span className="text-[10px] text-center truncate w-full group-hover:text-blue-600 transition-colors">{homeTeamNameKo}</span>
                      </div>
                      
                      {/* 중앙 (vs 및 시간) */}
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold text-base text-center">{match.status?.code !== 'NS' ? `${match.goals?.home ?? 0} - ${match.goals?.away ?? 0}` : 'vs'}</span>
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium group-hover:text-blue-600 transition-colors">{formatMatchTime(match)}</span>
                          {match.status?.code === 'NS' && match.displayDate && (
                            <span className="text-[9px] text-gray-500 mt-0.5">{String(match.displayDate)}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* 원정팀 */}
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
                          />
                        )}
                        <span className="text-[10px] text-center truncate w-full group-hover:text-blue-600 transition-colors">{awayTeamNameKo}</span>
                </div>
                      </div>
                    </div>
                  </Link>
        </SwiperSlide>
      );
    });
    
    // 빈 슬롯 추가 (최소 4개 유지)
    const minSlides = 4;
    const emptySlots = Math.max(0, minSlides - matches.length);
    
    for (let i = 0; i < emptySlots; i++) {
      slides.push(
        <SwiperSlide key={`empty-slot-${i}`}>
          <div className="w-full h-[140px] border-2 border-dashed border-gray-200 rounded-lg p-2 bg-gray-50/50 flex flex-col justify-center items-center">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 mb-2 text-gray-300 mx-auto">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <p className="text-sm text-gray-400 mb-1">다음 경기를</p>
                    <p className="text-sm text-gray-400">기다리는 중...</p>
                  </div>
                </div>
        </SwiperSlide>
      );
    }
    
    return slides;
  };

  return (
    <div className="w-full mb-4">
      {error ? (
        <div className="flex flex-col justify-center items-center h-40 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-500">{error}</p>
          <p className="text-xs mt-1 text-gray-500">새로고침하거나 잠시 후 다시 시도해주세요</p>
            </div>
      ) : (
        <div className="w-full relative" style={{ paddingTop: '4px' }}>
          {/* Swiper 컨테이너 */}
          <Swiper
            {...swiperConfig}
            className="livescore-carousel"
            style={{ overflow: 'visible' }}
          >
            {renderSlides()}
          </Swiper>

          {/* 커스텀 네비게이션 버튼 (데스크탑만) */}
          {matches.length > 4 && (
            <>
              <button 
                className="livescore-swiper-button-prev hidden md:flex absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-xl group"
                aria-label="이전 경기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              <button 
                className="livescore-swiper-button-next hidden md:flex absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-xl group"
                aria-label="다음 경기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
              </button>
              </>
            )}

          {/* 스타일 */}
          <style jsx>{`
            .livescore-carousel {
              padding: 0 4px;
              overflow: visible !important;
            }
            .livescore-carousel .swiper-wrapper {
              overflow: visible !important;
            }
            .livescore-carousel .swiper-slide {
              overflow: visible !important;
            }
          `}</style>
        </div>
      )}
    </div>
  );
} 