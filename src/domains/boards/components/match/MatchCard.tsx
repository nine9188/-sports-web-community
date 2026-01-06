'use client';

import React from 'react';
import Link from 'next/link';
import type { MatchCardProps } from '@/shared/types/matchCard';
import { getStatusInfo } from '@/shared/utils/matchCard';

const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

const MatchCard: React.FC<MatchCardProps> = ({ matchId, matchData, isEditable = false }) => {
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

  // 통합 유틸리티 사용
  const statusInfo = getStatusInfo(status);
  const statusText = statusInfo.text;

  // 이미지 URL
  const leagueLogo = league.id ? `${SUPABASE_URL}/storage/v1/object/public/leagues/${league.id}.png` : null;
  const homeTeamLogo = homeTeam.id ? `${SUPABASE_URL}/storage/v1/object/public/teams/${homeTeam.id}.png` : null;
  const awayTeamLogo = awayTeam.id ? `${SUPABASE_URL}/storage/v1/object/public/teams/${awayTeam.id}.png` : null;

  const CardContent = () => (
    <>
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {leagueLogo && (
            <div className="league-logo-box">
              <img
                src={leagueLogo}
                alt={league.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <span className="league-name">{league.name}</span>
        </div>
      </div>

      <div className="match-main">
        <div className="team-info">
          {homeTeamLogo && (
            <div className="team-logo-box">
              <img
                src={homeTeamLogo}
                alt={homeTeam.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder.png';
                }}
              />
            </div>
          )}
          <span className={`team-name ${homeTeam.winner ? 'winner' : ''}`}>
            {homeTeam.name}
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
              <img
                src={awayTeamLogo}
                alt={awayTeam.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder.png';
                }}
              />
            </div>
          )}
          <span className={`team-name ${awayTeam.winner ? 'winner' : ''}`}>
            {awayTeam.name}
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
