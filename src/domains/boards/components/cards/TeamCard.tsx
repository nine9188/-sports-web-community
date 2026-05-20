'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { TeamCardProps } from '@/shared/types/teamCard';
import { getTeamHref } from '@/domains/livescore/utils/entityLinks';
import { DARK_MODE_LEAGUE_IDS, leagueLogoUrl, teamLogoUrl } from '@/shared/images/urls';

const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

export function TeamCard({ teamId, teamData, isEditable = false }: TeamCardProps) {
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

  const getLeagueLogo = () => {
    if (!leagueId) return LEAGUE_PLACEHOLDER;
    const hasDarkMode = DARK_MODE_LEAGUE_IDS.includes(leagueId);
    if (isDark && hasDarkMode) {
      return leagueLogoUrl(leagueId, { dark: true });
    }
    return leagueLogoUrl(leagueId);
  };

  const teamLogo = logo && numericTeamId ? teamLogoUrl(numericTeamId) : TEAM_PLACEHOLDER;
  const href = getTeamHref({ ...teamData, id: numericTeamId });

  const CardContent = () => (
    <>
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="league-logo-box">
            <Image
              src={getLeagueLogo()}
              alt={leagueDisplayName}
              width={24}
              height={24}
              draggable={false}
              unoptimized
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </div>
          <span className="league-name">{leagueDisplayName}</span>
        </div>
      </div>

      <div className="team-main">
        <div className="team-logo-box">
          <Image
            src={teamLogo}
            alt={displayName}
            width={64}
            height={64}
            draggable={false}
            unoptimized
            style={{ width: '64px', height: '64px', objectFit: 'contain' }}
          />
        </div>
        <span className="team-name">{displayName}</span>
      </div>

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
      <Link href={href} prefetch={false}>
        <CardContent />
      </Link>
    </div>
  );
}

export default TeamCard;
