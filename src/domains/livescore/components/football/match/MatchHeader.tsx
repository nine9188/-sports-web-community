'use client';

import React, { memo, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

import { formatDateToKorean } from '@/shared/utils/dateUtils';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
import { ErrorState } from '@/domains/livescore/components/common/CommonComponents';
import { MatchEvent } from '@/domains/livescore/types/match';
import { getLeagueName } from '@/domains/livescore/constants/league-mappings';
import { Container } from '@/shared/components/ui';
import { MatchFullDataResponse } from '@/domains/livescore/actions/match/matchData';
import { PlayerKoreanNames } from './MatchPageClient';

// MatchData 타입 정의
interface MatchDataType {
  fixture?: {
    date?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
    venue?: {
      id?: number;
      name?: string;
      city?: string;
    };
  };
  league?: {
    id?: number;
    name?: string;
    name_ko?: string;
    logo?: string;
    round?: string;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
      formation?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
      formation?: string;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    penalty?: {
      home?: number | null;
      away?: number | null;
    };
    extratime?: {
      home?: number | null;
      away?: number | null;
    };
  };
}

interface MatchHeaderProps {
  initialData: MatchFullDataResponse;
  playerKoreanNames?: PlayerKoreanNames;
  // 4590 표준: 서버에서 전달받은 이미지 URL
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrl?: string;
  leagueLogoDarkUrl?: string;  // 다크모드 리그 로고
}

/**
 * 매치 헤더 컴포넌트
 *
 * 서버에서 미리 로드된 데이터(initialData)를 받아 헤더를 렌더링합니다.
 * Context 의존성 제거로 더 단순하고 예측 가능한 동작.
 */
const MatchHeader = memo(({ initialData, playerKoreanNames = {}, teamLogoUrls = {}, leagueLogoUrl, leagueLogoDarkUrl }: MatchHeaderProps) => {
  // initialData에서 데이터 추출
  const matchData = initialData.matchData;
  const eventsData = initialData.events;

  // 다크모드 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 초기 다크모드 상태 확인
    setIsDark(document.documentElement.classList.contains('dark'));

    // 다크모드 변경 감지
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // 4590 표준: URL 헬퍼 함수
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  // 다크모드에 따른 리그 로고 URL 선택
  const getLeagueLogo = () => {
    const effectiveUrl = isDark && leagueLogoDarkUrl ? leagueLogoDarkUrl : leagueLogoUrl;
    return effectiveUrl || LEAGUE_PLACEHOLDER;
  };

  // 타입 캐스팅을 가장 먼저 처리
  const typedMatchData = matchData as MatchDataType;

  // 경기 기본 정보 메모이제이션 - 탭 변경과 무관하게 안정적으로 유지
  const matchInfo = useMemo(() => {
    if (!typedMatchData) {
      return null;
    }

    const fixture = typedMatchData?.fixture || {};
    const league = typedMatchData?.league || {};
    const homeTeam = typedMatchData?.teams?.home;
    const awayTeam = typedMatchData?.teams?.away;
    const homeGoals = typedMatchData?.goals?.home;
    const awayGoals = typedMatchData?.goals?.away;
    const score = typedMatchData?.score || {};

    return {
      fixture,
      league,
      homeTeam,
      awayTeam,
      homeGoals,
      awayGoals,
      score
    };
  }, [typedMatchData]);

  // 라운드 포맷팅 함수
  const formatRound = (round?: string) => {
    if (!round) return null;
    // "Regular Season - 15" -> "15라운드"
    if (round.includes('Regular Season')) {
      const roundNumber = round.split(' - ')[1];
      return roundNumber ? `${roundNumber}라운드` : round;
    }
    return round;
  };

  // 점수 및 상태 정보 메모이제이션
  const displayInfo = useMemo(() => {
    if (!matchInfo) {
      return { scoreDisplay: '0 - 0', statusText: '경기 정보 없음' };
    }

    const { homeGoals, awayGoals, score, fixture } = matchInfo;
    const currentScore = `${homeGoals ?? 0} - ${awayGoals ?? 0}`;
    
    let scoreDisplay = currentScore;
    // 승부차기 정보가 있는 경우
    if (score?.penalty && score.penalty.home !== null && score.penalty.away !== null) {
      scoreDisplay = `${currentScore} (승부차기 ${score.penalty.home}-${score.penalty.away})`;
    }
    // 연장전 정보가 있는 경우
    else if (score?.extratime && score.extratime.home !== null && score.extratime.away !== null) {
      scoreDisplay = `${currentScore} (연장 ${score.extratime.home}-${score.extratime.away})`;
    }

    // 경기 상태 텍스트
    const status = fixture?.status?.short;
    const elapsed = fixture?.status?.elapsed;
    
    let statusText = '경기 정보 없음';
    switch (status) {
      case 'TBD': statusText = '경기 일정 미정'; break;
      case 'NS': statusText = '경기 시작 전'; break;
      case '1H': statusText = `전반 ${elapsed || 0}분`; break;
      case 'HT': statusText = '하프타임'; break;
      case '2H': statusText = `후반 ${elapsed || 45}분`; break;
      case 'ET': statusText = `연장전 ${elapsed || 90}분`; break;
      case 'P': statusText = '승부차기'; break;
      case 'FT': statusText = '경기 종료'; break;
      case 'AET': statusText = '연장전 종료'; break;
      case 'PEN': statusText = '승부차기 종료'; break;
      case 'SUSP': statusText = '경기 중단'; break;
      case 'INT': statusText = '경기 중단'; break;
      case 'CANC': statusText = '경기 취소'; break;
      case 'ABD': statusText = '경기 중단'; break;
      case 'PST': statusText = '경기 연기'; break;
      case 'AWD': statusText = '몰수 승'; break;
      case 'WO': statusText = '부전승'; break;
      case 'LIVE': statusText = `진행 중 ${elapsed || 0}분`; break;
      default: statusText = status || '알 수 없음'; break;
    }

    return {
      scoreDisplay,
      statusText
    };
  }, [matchInfo]);

  // 헤더는 기본 경기 정보만 필요
  const hasBasicMatchData = matchInfo &&
    matchInfo.fixture &&
    matchInfo.homeTeam &&
    matchInfo.awayTeam;

  // 매치 데이터가 없는 경우 에러 표시
  if (!hasBasicMatchData) {
    return <ErrorState message="경기 데이터를 찾을 수 없습니다." />;
  }

    const { fixture, league, homeTeam, awayTeam } = matchInfo;

  // 득점자 목록 작성 - 일반 골만 필터링
  const goalEvents = eventsData?.filter((event: MatchEvent) => {
    // Goal cancelled나 VAR로 취소된 골은 제외
    if (event.detail?.toLowerCase().includes('cancelled') || 
        event.type?.toLowerCase() === 'var') {
      return false;
    }
    
    // 실제 골만 포함
    return event.type?.toLowerCase() === 'goal' && 
           event.detail?.toLowerCase().includes('goal');
  }) || [];

  // 리그 및 팀 로고 스토리지 URL 생성


  return (
    <div className="w-full md:max-w-screen-xl md:mx-auto">
      {/* 통합된 매치 헤더 카드 */}
      <Container className="mb-4 bg-white dark:bg-[#1D1D1D] rounded-none md:rounded-lg">
        {/* 리그 정보 및 경기 상태 */}
        <div className="h-12 flex items-center justify-between border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] md:rounded-t-lg px-4">
          {/* 리그 정보 - 모바일: 왼쪽 / 데스크톱: 왼쪽 1/3 */}
          <div className="flex items-center gap-1.5 md:gap-2 md:w-1/3 md:border-r md:border-r-black/5 md:dark:border-r-white/10 md:pr-4">
            <div className="relative w-4 h-4 md:w-6 md:h-6 flex items-center justify-center flex-shrink-0">
              {league?.id && (
                <UnifiedSportsImageClient
                  src={getLeagueLogo()}
                  alt={league?.name || ''}
                  width={24}
                  height={24}
                  className="object-contain w-full h-full"
                />
              )}
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-[#F0F0F0] truncate">
              {/* 리그 ID로 한국어 이름 가져오기 */}
              {league?.id ? getLeagueName(league.id) : (league?.name_ko || league?.name)}
            </span>
          </div>

          {/* 경기 날짜 및 라운드 - 모바일: 중앙(1/3 너비) / 데스크톱: 중앙 1/3 */}
          <div className="w-1/3 md:w-1/3 flex flex-col items-center justify-center md:border-r md:border-r-black/5 md:dark:border-r-white/10 md:px-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {fixture?.date ? formatDateToKorean(new Date(fixture.date)) : '날짜 정보 없음'}
            </div>
            {league?.round && (
              <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">
                {formatRound(league.round)}
              </div>
            )}
          </div>

          {/* 경기장 정보 - 데스크톱에서만 표시 */}
          <div className="hidden md:flex md:w-1/3 md:pl-4 items-center justify-center text-center">
            <div className="text-xs text-gray-700 dark:text-gray-300">
              {fixture?.venue?.name && fixture?.venue?.city
                ? `${fixture.venue.name} - ${fixture.venue.city}`
                : fixture?.venue?.name || fixture?.venue?.city || '정보 없음'}
            </div>
          </div>
        </div>

        <div className="px-2 py-3 md:px-4 md:py-4">
          {/* 팀 정보 영역 */}
          <div className="flex items-center justify-between">
            {/* 홈팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              {homeTeam?.id ? (
                <Link href={`/livescore/football/team/${homeTeam.id}`} className="group">
                  <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2 flex items-center justify-center">
                    <UnifiedSportsImageClient
                      src={getTeamLogo(homeTeam.id)}
                      alt={homeTeam.name || ''}
                      width={48}
                      height={48}
                      className="object-contain w-full h-full group-hover:brightness-75 transition-all"
                    />
                  </div>
                  {/* 한국어 팀명 우선 표시, 없으면 일반 이름 */}
                  <div className="font-bold text-sm md:text-base text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors">{homeTeam?.name_ko || homeTeam?.name}</div>
                  {homeTeam?.formation && (
                    <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300">{homeTeam.formation}</div>
                  )}
                </Link>
              ) : (
                <>
                  <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2 flex items-center justify-center">
                    {homeTeam?.id && (
                      <UnifiedSportsImageClient
                        src={getTeamLogo(homeTeam.id)}
                        alt={homeTeam.name || ''}
                        width={48}
                        height={48}
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시, 없으면 일반 이름 */}
                  <div className="font-bold text-sm md:text-base text-gray-900 dark:text-[#F0F0F0]">{homeTeam?.name_ko || homeTeam?.name}</div>
                  {homeTeam?.formation && (
                    <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300">{homeTeam.formation}</div>
                  )}
                </>
              )}
            </div>

            {/* 스코어 */}
            <div className="w-1/3 text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F0F0F0] mb-1">
                {displayInfo.scoreDisplay}
              </div>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {displayInfo.statusText}
              </div>
            </div>

            {/* 원정팀 */}
            <div className="w-1/3 md:w-1/3 text-center">
              {awayTeam?.id ? (
                <Link href={`/livescore/football/team/${awayTeam.id}`} className="group">
                  <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2 flex items-center justify-center">
                    <UnifiedSportsImageClient
                      src={getTeamLogo(awayTeam.id)}
                      alt={awayTeam.name || ''}
                      width={48}
                      height={48}
                      className="object-contain w-full h-full group-hover:brightness-75 transition-all"
                    />
                  </div>
                  {/* 한국어 팀명 우선 표시, 없으면 일반 이름 */}
                  <div className="font-bold text-sm md:text-base text-gray-900 dark:text-[#F0F0F0] group-hover:underline transition-colors">{awayTeam?.name_ko || awayTeam?.name}</div>
                  {awayTeam?.formation && (
                    <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300">{awayTeam.formation}</div>
                  )}
                </Link>
              ) : (
                <>
                  <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto mb-1 md:mb-2 flex items-center justify-center">
                    {awayTeam?.id && (
                      <UnifiedSportsImageClient
                        src={getTeamLogo(awayTeam.id)}
                        alt={awayTeam.name || ''}
                        width={48}
                        height={48}
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시, 없으면 일반 이름 */}
                  <div className="font-bold text-sm md:text-base text-gray-900 dark:text-[#F0F0F0]">{awayTeam?.name_ko || awayTeam?.name}</div>
                  {awayTeam?.formation && (
                    <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300">{awayTeam.formation}</div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 득점자 목록 */}
          {goalEvents.length > 0 && (
            <div className="flex flex-col md:flex-row mt-4 md:mt-6 border-t border-black/5 dark:border-white/10 pt-4">
              {/* 홈팀 득점자 */}
              <div className="w-full md:w-1/3 relative pl-2 md:px-2 mb-4 md:mb-0 md:text-center">
                {/* 홈팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center text-gray-900 dark:text-[#F0F0F0]">
                  <div className="relative w-4 h-4 mr-2 flex items-center justify-center">
                    {homeTeam?.id && (
                      <UnifiedSportsImageClient
                        src={getTeamLogo(homeTeam.id)}
                        alt={homeTeam.name || ''}
                        width={16}
                        height={16}
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {homeTeam?.name_ko || homeTeam?.name}
                </div>

                <div className="space-y-1">
                  {goalEvents
                    .filter((event: MatchEvent) => event.team?.id === homeTeam?.id)
                    .map((event: MatchEvent, index: number) => {
                      const koreanName = event.player?.id ? playerKoreanNames[event.player.id] : null;
                      const displayName = koreanName || event.player?.name || '알 수 없음';
                      const assistKoreanName = event.assist?.id ? playerKoreanNames[event.assist.id] : null;
                      const assistDisplayName = assistKoreanName || event.assist?.name;

                      return (
                        <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{displayName}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">{event.time?.elapsed}&apos;</span>
                          {assistDisplayName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                              어시스트: {assistDisplayName}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 중앙 vs 구분선 */}
              <div className="hidden md:flex md:w-1/3 items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400 font-medium">득점자</div>
              </div>

              {/* 원정팀 득점자 */}
              <div className="w-full md:w-1/3 relative pl-2 md:px-2 md:text-center">
                {/* 원정팀 헤더 - 모바일에서만 표시 */}
                <div className="md:hidden py-1 font-semibold mb-2 text-sm flex items-center text-gray-900 dark:text-[#F0F0F0]">
                  <div className="relative w-4 h-4 mr-2 flex items-center justify-center">
                    {awayTeam?.id && (
                      <UnifiedSportsImageClient
                        src={getTeamLogo(awayTeam.id)}
                        alt={awayTeam.name || ''}
                        width={16}
                        height={16}
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  {/* 한국어 팀명 우선 표시 */}
                  {awayTeam?.name_ko || awayTeam?.name}
                </div>

                <div className="space-y-1">
                  {goalEvents
                    .filter((event: MatchEvent) => event.team?.id === awayTeam?.id)
                    .map((event: MatchEvent, index: number) => {
                      const koreanName = event.player?.id ? playerKoreanNames[event.player.id] : null;
                      const displayName = koreanName || event.player?.name || '알 수 없음';
                      const assistKoreanName = event.assist?.id ? playerKoreanNames[event.assist.id] : null;
                      const assistDisplayName = assistKoreanName || event.assist?.name;

                      return (
                        <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">{displayName}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-1">{event.time?.elapsed}&apos;</span>
                          {assistDisplayName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                              어시스트: {assistDisplayName}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
});

MatchHeader.displayName = 'MatchHeader';

export default MatchHeader; 