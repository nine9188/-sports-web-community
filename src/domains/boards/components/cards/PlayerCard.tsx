'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PlayerCardProps } from '@/shared/types/playerCard';

// 4590 표준: placeholder 및 Storage URL
const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

export function PlayerCard({ playerId, playerData, isEditable = false }: PlayerCardProps) {
  const { name, koreanName, team, photo } = playerData;
  const displayName = koreanName || name;
  const teamDisplayName = team?.koreanName || team?.name || '';
  const numericPlayerId = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;
  const teamId = typeof team?.id === 'string' ? parseInt(team.id, 10) : team?.id;

  // 4590 표준: Storage URL 사용
  const getTeamLogo = () => {
    if (!teamId) return TEAM_PLACEHOLDER;
    return `${SUPABASE_URL}/storage/v1/object/public/teams/${teamId}.png`;
  };

  const getPlayerPhoto = () => {
    if (!numericPlayerId) return PLAYER_PLACEHOLDER;
    return `${SUPABASE_URL}/storage/v1/object/public/players/${numericPlayerId}.png`;
  };

  const teamLogo = team?.id ? getTeamLogo() : TEAM_PLACEHOLDER;
  const playerPhoto = photo ? getPlayerPhoto() : PLAYER_PLACEHOLDER;

  const CardContent = () => (
    <>
      {/* 헤더: 팀 로고 + 팀명 */}
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="league-logo-box">
            <Image
              src={teamLogo}
              alt={teamDisplayName}
              width={24}
              height={24}
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </div>
          <span className="league-name">{teamDisplayName}</span>
        </div>
      </div>

      {/* 메인: 선수 사진 + 이름 */}
      <div className="player-main">
        <div className="player-photo">
          <Image
            src={playerPhoto}
            alt={displayName}
            width={64}
            height={64}
            style={{ width: '64px', height: '64px', objectFit: 'cover' }}
          />
        </div>
        <span className="player-name">{displayName}</span>
      </div>

      {/* 푸터: 선수 정보 확인 */}
      <div className="match-footer">
        <span className="footer-link">선수 정보 확인</span>
      </div>
    </>
  );

  if (isEditable) {
    return (
      <div className="player-card">
        <CardContent />
      </div>
    );
  }

  return (
    <div className="player-card">
      <Link href={`/livescore/football/player/${numericPlayerId}`} prefetch={false}>
        <CardContent />
      </Link>
    </div>
  );
}

export default PlayerCard;