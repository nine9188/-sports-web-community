'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import type { MatchCardProps } from '@/shared/types/matchCard';
import { getStatusInfo, DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';
import { getTeamById } from '@teams';
import { LEAGUE_NAMES_MAP } from '@/domains/livescore/constants/league-mappings';

const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

const MatchCard: React.FC<MatchCardProps> = ({ matchId, matchData, isEditable = false }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 테마 확인 (hydration 에러 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!matchData || !matchData.teams) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-500 rounded">
        경기 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const actualMatchId = matchData.id?.toString() || String(matchId);
  const isDark = mounted && resolvedTheme === 'dark';

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

  // 이미지 URL (다크모드 지원)
  const hasDarkLeagueLogo = league.id && DARK_MODE_LEAGUE_IDS.includes(Number(league.id));
  const leagueLogo = league.id
    ? `${SUPABASE_URL}/storage/v1/object/public/leagues/${league.id}${isDark && hasDarkLeagueLogo ? '-1' : ''}.png`
    : null;
  const homeTeamLogo = homeTeam.id ? `${SUPABASE_URL}/storage/v1/object/public/teams/${homeTeam.id}.png` : null;
  const awayTeamLogo = awayTeam.id ? `${SUPABASE_URL}/storage/v1/object/public/teams/${awayTeam.id}.png` : null;

  const CardContent = () => (
    <>
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {leagueLogo && (
            <div className="league-logo-box">
              <Image
                src={leagueLogo}
                alt={leagueName}
                width={20}
                height={20}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <span className="league-name">{leagueName}</span>
        </div>
      </div>

      <div className="match-main">
        <div className="team-info">
          {homeTeamLogo && (
            <div className="team-logo-box">
              <Image
                src={homeTeamLogo}
                alt={homeTeamName}
                width={24}
                height={24}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder.png';
                }}
              />
            </div>
          )}
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
          {awayTeamLogo && (
            <div className="team-logo-box">
              <Image
                src={awayTeamLogo}
                alt={awayTeamName}
                width={24}
                height={24}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder.png';
                }}
              />
            </div>
          )}
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
