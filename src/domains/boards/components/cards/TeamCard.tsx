'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import type { TeamCardProps } from '@/shared/types/teamCard';
import { DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';

const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

export function TeamCard({ teamId, teamData, isEditable = false }: TeamCardProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { name, koreanName, league } = teamData;
  const displayName = koreanName || name;
  const leagueDisplayName = league?.koreanName || league?.name || '';
  const numericTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;
  const isDark = mounted && resolvedTheme === 'dark';

  // 이미지 URL (다크모드 지원)
  const hasDarkLeagueLogo = league?.id && DARK_MODE_LEAGUE_IDS.includes(Number(league.id));
  const leagueLogo = league?.id
    ? `${SUPABASE_URL}/storage/v1/object/public/leagues/${league.id}${isDark && hasDarkLeagueLogo ? '-1' : ''}.png`
    : null;
  const teamLogo = `${SUPABASE_URL}/storage/v1/object/public/teams/${teamData.id || numericTeamId}.png`;

  const CardContent = () => (
    <>
      {/* 헤더: 리그 로고 + 리그명 */}
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {leagueLogo && (
            <div className="league-logo-box">
              <Image
                src={leagueLogo}
                alt={leagueDisplayName}
                width={24}
                height={24}
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
              />
            </div>
          )}
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
      <Link href={`/livescore/football/team/${numericTeamId}`}>
        <CardContent />
      </Link>
    </div>
  );
}

export default TeamCard;