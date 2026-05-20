'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { PlayerCardProps } from '@/shared/types/playerCard';
import { getPlayerHref } from '@/domains/livescore/utils/entityLinks';
import { playerPhotoUrl, teamLogoUrl } from '@/shared/images/urls';

const PLAYER_PLACEHOLDER = '/images/placeholder-player.svg';
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';

export function PlayerCard({ playerId, playerData, isEditable = false }: PlayerCardProps) {
  const { name, koreanName, team, photo } = playerData;
  const displayName = koreanName || name;
  const teamDisplayName = team?.koreanName || team?.name || '';
  const numericPlayerId = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;
  const teamId = typeof team?.id === 'string' ? parseInt(team.id, 10) : team?.id;

  const teamLogo = teamId ? teamLogoUrl(teamId) : TEAM_PLACEHOLDER;
  const playerPhoto = photo && numericPlayerId ? playerPhotoUrl(numericPlayerId) : PLAYER_PLACEHOLDER;
  const href = getPlayerHref({ ...playerData, id: numericPlayerId });

  const CardContent = () => (
    <>
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="league-logo-box">
            <Image
              src={teamLogo}
              alt={teamDisplayName}
              width={24}
              height={24}
              draggable={false}
              unoptimized
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          </div>
          <span className="league-name">{teamDisplayName}</span>
        </div>
      </div>

      <div className="player-main">
        <div className="player-photo">
          <Image
            src={playerPhoto}
            alt={displayName}
            width={64}
            height={64}
            draggable={false}
            unoptimized
            style={{ width: '64px', height: '64px', objectFit: 'cover' }}
          />
        </div>
        <span className="player-name">{displayName}</span>
      </div>

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
      <Link href={href} prefetch={false}>
        <CardContent />
      </Link>
    </div>
  );
}

export default PlayerCard;
