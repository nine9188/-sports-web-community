'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { TeamCardProps } from '@/shared/types/teamCard';
import { DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';

// 4590 표준: placeholder 및 Storage URL
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

export function TeamCard({ teamId, teamData, isEditable = false }: TeamCardProps) {
  // 4590 표준: 다크모드 감지
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const { name, koreanName, league, logo } = teamData;
  const displayName = koreanName || name;
  const leagueDisplayName = league?.koreanName || league?.name || '';
  const numericTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;
  const leagueId = typeof league?.id === 'string' ? parseInt(league.id, 10) : league?.id;

  // 4590 표준: Storage URL 사용 (다크모드 지원)
  const getLeagueLogo = () => {
    if (!leagueId) return LEAGUE_PLACEHOLDER;
    const hasDarkMode = DARK_MODE_LEAGUE_IDS.includes(leagueId);
    if (isDark && hasDarkMode) {
      return `${SUPABASE_URL}/storage/v1/object/public/leagues/${leagueId}-1.png`;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/leagues/${leagueId}.png`;
  };

  const getTeamLogo = () => {
    if (!numericTeamId) return TEAM_PLACEHOLDER;
    return `${SUPABASE_URL}/storage/v1/object/public/teams/${numericTeamId}.png`;
  };

  const leagueLogo = getLeagueLogo();
  const teamLogo = logo ? getTeamLogo() : TEAM_PLACEHOLDER;

  const CardContent = () => (
    <>
      {/* 헤더: 리그 로고 + 리그명 */}
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="league-logo-box">
            <Image
              src={leagueLogo}
              alt={leagueDisplayName}
              width={24}
              height={24}
              unoptimized
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </div>
          <span className="league-name">{leagueDisplayName}</span>
        </div>
      </div>

      {/* 메인: 팀 로고 + 팀명 */}
      <div className="team-main">
        <div className="team-logo-box">
          <Image
            src={teamLogo}
            alt={displayName}
            width={64}
            height={64}
            unoptimized
            style={{ width: '64px', height: '64px', objectFit: 'contain' }}
          />
        </div>
        <span className="team-name">{displayName}</span>
      </div>

      {/* 푸터: 팀 정보 확인 */}
      <div className="match-footer">
        <span className="footer-link">팀 정보 확인</span>
      </div>
    </>
  );

  if (isEditable) {
    return (
      <div className="team-card">
        <CardContent />
      </div>
    );
  }

  return (
    <div className="team-card">
      <Link href={`/livescore/football/team/${numericTeamId}`} prefetch={false}>
        <CardContent />
      </Link>
    </div>
  );
}

export default TeamCard;