'use client';

import Link from 'next/link';
import type { PlayerCardProps } from '@/shared/types/playerCard';

const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

export function PlayerCard({ playerId, playerData, isEditable = false }: PlayerCardProps) {
  const { name, koreanName, team, photo } = playerData;
  const displayName = koreanName || name;
  const teamDisplayName = team?.koreanName || team?.name || '';
  const numericPlayerId = typeof playerId === 'string' ? parseInt(playerId, 10) : playerId;

  // 이미지 URL
  const teamLogo = team?.id ? `${SUPABASE_URL}/storage/v1/object/public/teams/${team.id}.png` : null;
  const playerPhoto = photo || `https://media.api-sports.io/football/players/${numericPlayerId}.png`;

  const CardContent = () => (
    <>
      {/* 헤더: 팀 로고 + 팀명 */}
      <div className="league-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {teamLogo && (
            <div className="league-logo-box">
              <img
                src={teamLogo}
                alt={teamDisplayName}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <span className="league-name">{teamDisplayName}</span>
        </div>
      </div>

      {/* 메인: 선수 사진 + 이름 */}
      <div className="player-main">
        <div className="player-photo">
          <img
            src={playerPhoto}
            alt={displayName}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://media.api-sports.io/football/players/${numericPlayerId}.png`;
            }}
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
      <Link href={`/livescore/football/player/${numericPlayerId}`}>
        <CardContent />
      </Link>
    </div>
  );
}

export default PlayerCard;
