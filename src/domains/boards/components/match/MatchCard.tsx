'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { MatchCardProps } from '@/shared/types/matchCard';
import { getStatusInfo, DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';
import { getTeamById } from '@teams';
import { LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings';

// 4590 표준: placeholder 및 Storage URL
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

const MatchCard: React.FC<MatchCardProps> = ({ matchId, matchData, isEditable = false }) => {
  // 4590 표준: 다크모드 감지
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  if (!matchData || !matchData.teams) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-500 rounded">
        경기 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const actualMatchId = matchData.id?.toString() || String(matchId);

  const { teams, goals, league, status } = matchData;
  const homeTeam = teams.home;
  const awayTeam = teams.away;
  const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
  const awayScore = typeof goals?.away === 'number' ? goals.away : '-';

  // 팀 한국어 이름 매핑
  const homeTeamId = typeof homeTeam.id === 'string' ? parseInt(homeTeam.id, 10) : homeTeam.id;
  const awayTeamId = typeof awayTeam.id === 'string' ? parseInt(awayTeam.id, 10) : awayTeam.id;
  const homeTeamMapping = homeTeamId ? getTeamById(homeTeamId) : undefined;
  const awayTeamMapping = awayTeamId ? getTeamById(awayTeamId) : undefined;
  const homeTeamName = homeTeamMapping?.name_ko || homeTeam.name;
  const awayTeamName = awayTeamMapping?.name_ko || awayTeam.name;

  // 리그 한국어 이름 매핑
  const leagueId = typeof league.id === 'string' ? parseInt(league.id, 10) : league.id;
  const leagueName = (leagueId && LEAGUE_NAMES_MAP[leagueId]) || league.name;

  // 통합 유틸리티 사용
  const statusInfo = getStatusInfo(status);
  const statusText = statusInfo.text;

  // 4590 표준: Storage URL 사용 (다크모드 지원)
  const getLeagueLogo = () => {
    if (!leagueId) return LEAGUE_PLACEHOLDER;
    const hasDarkMode = DARK_MODE_LEAGUE_IDS.includes(leagueId);
    if (isDark && hasDarkMode) {
      return `${SUPABASE_URL}/storage/v1/object/public/leagues/${leagueId}-1.png`;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/leagues/${leagueId}.png`;
  };

  const getTeamLogo = (teamId: number | undefined) => {
    if (!teamId) return TEAM_PLACEHOLDER;
    return `${SUPABASE_URL}/storage/v1/object/public/teams/${teamId}.png`;
  };

  const leagueLogo = getLeagueLogo();
  const homeTeamLogo = getTeamLogo(homeTeamId);
  const awayTeamLogo = getTeamLogo(awayTeamId);

  const CardContent = () => (
    <>
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="league-logo-box">
            <Image
              src={leagueLogo}
              alt={leagueName}
              width={20}
              height={20}
              unoptimized
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
          </div>
          <span className="league-name">{leagueName}</span>
        </div>
      </div>

      <div className="match-main">
        <div className="team-info">
          <div className="team-logo-box">
            <Image
              src={homeTeamLogo}
              alt={homeTeamName}
              width={24}
              height={24}
              unoptimized
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </div>
          <span className={`team-name ${homeTeam.winner ? 'winner' : ''}`}>
            {homeTeamName}
          </span>
        </div>

        <div className="score-area">
          <div className="score">
            <span className="score-number">{homeScore}</span>
            <span className="score-separator">-</span>
            <span className="score-number">{awayScore}</span>
          </div>
          <div className={`match-status ${statusInfo.isLive ? 'live' : ''}`}>{statusText}</div>
        </div>

        <div className="team-info">
          <div className="team-logo-box">
            <Image
              src={awayTeamLogo}
              alt={awayTeamName}
              width={24}
              height={24}
              unoptimized
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </div>
          <span className={`team-name ${awayTeam.winner ? 'winner' : ''}`}>
            {awayTeamName}
          </span>
        </div>
      </div>

      <div className="match-footer">
        <span className="footer-link">매치 상세 정보</span>
      </div>
    </>
  );

  if (isEditable) {
    return (
      <div className="match-card">
        <CardContent />
      </div>
    );
  }

  return (
    <div className="match-card">
      <Link href={`/livescore/football/match/${actualMatchId}`}>
        <CardContent />
      </Link>
    </div>
  );
};

export default MatchCard;
