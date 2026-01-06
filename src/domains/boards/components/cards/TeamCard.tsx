'use client';

import Link from 'next/link';
import type { TeamCardProps } from '@/shared/types/teamCard';

const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

export function TeamCard({ teamId, teamData, isEditable = false }: TeamCardProps) {
  const { name, koreanName, league } = teamData;
  const displayName = koreanName || name;
  const leagueDisplayName = league?.koreanName || league?.name || '';
  const numericTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;

  // 이미지 URL
  const leagueLogo = league?.id ? `${SUPABASE_URL}/storage/v1/object/public/leagues/${league.id}.png` : null;
  const teamLogo = `${SUPABASE_URL}/storage/v1/object/public/teams/${teamData.id || numericTeamId}.png`;

  const CardContent = () => (
    <>
      {/* 헤더: 리그 로고 + 리그명 */}
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {leagueLogo && (
            <div className="league-logo-box">
              <img
                src={leagueLogo}
                alt={leagueDisplayName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <span className="league-name">{leagueDisplayName}</span>
        </div>
      </div>

      {/* 메인: 팀 로고 + 팀명 */}
      <div className="team-main">
        <div className="team-logo-box">
          <img
            src={teamLogo}
            alt={displayName}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/placeholder.png';
            }}
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
