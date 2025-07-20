'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  
  // 🔧 슬라이딩 인덱스 상태 추가 (시작 인덱스)
  const [startIndex, setStartIndex] = useState(0);
  
  // API 호출 추적을 위한 ref
  const fetchingRef = useRef<boolean>(false);
  
  // 카드 참조를 위한 ref
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  
  // 🔧 터치 슬라이드를 위한 ref와 상태
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // 🔧 스와이프 힌트 상태 (처음에만 보여주기)
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  
  // 🔧 오버레이 힌트 상태 (모바일 전용)
  const [showOverlayHint, setShowOverlayHint] = useState(false);
  
  // 🔧 터치 이벤트 핸들러 (모바일 전용)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = null;
    // 기본 동작 방지 (텍스트 선택, 드래그 등)
    e.preventDefault();
    // 🔧 터치 시작하면 힌트 숨기기
    setShowSwipeHint(false);
    setShowOverlayHint(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
    // 스크롤 방지 (수평 스와이프 중)
    if (touchStartXRef.current !== null) {
      const touchDiff = Math.abs(touchStartXRef.current - e.touches[0].clientX);
      if (touchDiff > 10) { // 10px 이상 움직이면 스와이프로 간주
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    
    const touchDiff = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50; // 최소 스와이프 거리
    
    if (Math.abs(touchDiff) > minSwipeDistance) {
      e.preventDefault(); // 기본 동작 방지
      if (touchDiff > 0) {
        // 왼쪽으로 스와이프 = 다음 카드
        slideRight();
      } else {
        // 오른쪽으로 스와이프 = 이전 카드
        slideLeft();
      }
    }
    
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // 🔧 슬라이딩 함수 - CSS 기반으로 단순화
  const slideLeft = () => {
    setStartIndex(prev => Math.max(0, prev - 1));
  };

  const slideRight = () => {
    // 🔧 CSS 미디어 쿼리 기반으로 카드 수 계산
    const cardsToShow = window.innerWidth < 768 ? 2 : 4;
    const maxStartIndex = Math.max(0, matches.length - cardsToShow);
    setStartIndex(prev => Math.min(maxStartIndex, prev + 1));
  };

  // 🔧 초기 오버레이 힌트 설정
  useEffect(() => {
    // 모바일에서만 오버레이 힌트 표시
    if (window.innerWidth < 768 && matches.length > 2) {
      setShowOverlayHint(true);
    }
  }, [matches.length]);

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
          
          // 🔧 이미지 캐시 워밍업 제거 - 개별 컴포넌트에서 필요시에만 로드
          
          setMatches(sortedMatches);
          
          // 🔧 데이터 업데이트 시 인덱스 범위 확인
          if (filteredMatches.length > 0 && startIndex >= filteredMatches.length) {
            setStartIndex(0);
          }
          
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
  }, [startIndex]);

  // 🔧 모바일 오버레이 힌트 자동 제거 (5초 후)
  useEffect(() => {
    if (showOverlayHint) {
      const timeout = setTimeout(() => {
        setShowOverlayHint(false);
      }, 5000); // 5초 후 자동 사라짐

      return () => clearTimeout(timeout);
    }
  }, [showOverlayHint]);

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

  return (
    <div className="w-full mb-4 mt-4 md:mt-0">
      {error ? (
        <div className="flex flex-col justify-center items-center h-40 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-500">{error}</p>
          <p className="text-xs mt-1 text-gray-500">새로고침하거나 잠시 후 다시 시도해주세요</p>
        </div>
      ) : (
        <div className="w-full">
          {/* 🔧 반응형 레이아웃 컨테이너 */}
          <div className="relative">
            {/* 🔧 데스크탑 슬라이딩 버튼 - CSS 미디어 쿼리로 제어 */}
            <div className="hidden md:block">
              {matches.length > 4 && (
                <>
                  {/* 왼쪽 버튼 */}
                  <button 
                    onClick={slideLeft}
                    className={`absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 rounded-full p-2 shadow-lg border transition-all duration-200 ${
                      startIndex > 0
                        ? 'bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200 hover:scale-110 hover:shadow-xl cursor-pointer group' 
                        : 'bg-gray-100 border-gray-100 cursor-not-allowed opacity-50'
                    }`}
                    aria-label="이전 경기"
                    disabled={startIndex === 0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-colors ${
                      startIndex > 0
                        ? 'text-gray-600 group-hover:text-blue-600' 
                        : 'text-gray-300'
                    }`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  
                  {/* 오른쪽 버튼 */}
                  <button 
                    onClick={slideRight}
                    className={`absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 rounded-full p-2 shadow-lg border transition-all duration-200 ${
                      startIndex < matches.length - 4
                        ? 'bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200 hover:scale-110 hover:shadow-xl cursor-pointer group' 
                        : 'bg-gray-100 border-gray-100 cursor-not-allowed opacity-50'
                    }`}
                    aria-label="다음 경기"
                    disabled={startIndex >= matches.length - 4}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transition-colors ${
                      startIndex < matches.length - 4
                        ? 'text-gray-600 group-hover:text-blue-600' 
                        : 'text-gray-300'
                    }`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            {/* 🔧 CSS 미디어 쿼리 기반 반응형 카드 컨테이너 */}
            <div 
              className="flex gap-3 w-full transition-all duration-300 ease-in-out select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'pan-y pinch-zoom'
              }}
            >
              {/* 🔧 모바일 오버레이 힌트 */}
              {showOverlayHint && matches.length > 2 && (
                <div className="absolute inset-0 z-20 bg-gray-100/70 pointer-events-none select-none flex items-center justify-center animate-pulse rounded-lg md:hidden">
                  <div className="text-sm text-gray-700 flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full shadow-lg">
                    <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">← 슬라이드해서 확인하세요</span>
                    <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* 🔧 CSS 기반 반응형 경기 카드들 */}
              {matches.slice(startIndex, startIndex + 4).map((match, index) => {
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
                    className={`flex-1 min-w-0 border rounded-lg p-2 transition-all h-[140px] shadow-sm cursor-pointer group hover:translate-y-[-2px] hover:shadow-md hover:border-blue-300 touch-manipulation active:scale-[0.99] bg-white border-gray-200 transform-gpu select-none
                      ${index >= 2 ? 'hidden md:flex' : 'flex'} flex-col`}
                    ref={el => {
                      if (!cardRefs.current) cardRefs.current = [];
                      cardRefs.current[index] = el;
                    }}
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                    onDragStart={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-0.5 mb-1 text-gray-700">
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
                  </Link>
                );
              })}
              
              {/* 🔧 빈 슬롯 카드들 - CSS로 반응형 제어 */}
              {matches.length < 4 && Array.from({ length: 4 - matches.length }).map((_, index) => (
                <div 
                  key={`empty-slot-${index}`}
                  className={`flex-1 min-w-0 border-2 border-dashed border-gray-200 rounded-lg p-2 h-[140px] bg-gray-50/50
                    ${(matches.length + index) >= 2 ? 'hidden md:flex' : 'flex'} flex-col justify-center items-center`}
                >
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 mb-2 text-gray-300 mx-auto">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <p className="text-sm text-gray-400 mb-1">다음 경기를</p>
                    <p className="text-sm text-gray-400">기다리는 중...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 🔧 모바일 스와이프 힌트 - CSS 미디어 쿼리로 제어 */}
          <div className="mt-3 flex flex-col items-center gap-2 md:hidden">
            {matches.length > 2 && (
              <>
                {/* 진행 표시 */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{startIndex + 1}-{Math.min(startIndex + 2, matches.length)}</span>
                  <span>/</span>
                  <span>{matches.length}</span>
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                      style={{ 
                        width: `${((startIndex + 2) / matches.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                {/* 스와이프 힌트 */}
                {showSwipeHint && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 animate-bounce">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                    <span>← 좌우로 넘겨보세요</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 