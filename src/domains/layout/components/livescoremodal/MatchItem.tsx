'use client';

import React from 'react';
import { Trophy, Users } from 'lucide-react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { MatchData } from '@/domains/livescore/actions/footballApi';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { getTeamById } from '@/domains/livescore/constants/teams';

interface MatchItemProps {
  match: MatchData;
  onClose: () => void;
}

// 경기 상태에 따른 스타일 반환
const getMatchStatusStyle = (statusCode: string) => {
  switch (statusCode) {
    case 'LIVE':
    case '1H':
    case '2H':
    case 'HT':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'FT':
    case 'AET':
    case 'PEN':
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    case 'NS':
    case 'TBD':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
};

// 경기 상태에 따른 텍스트 반환 - elapsed 시간 포함
const getStatusText = (statusCode: string, statusDescription: string, elapsed?: number | null) => {
  switch (statusCode) {
    case 'LIVE':
    case '1H':
    case '2H':
      if (elapsed && elapsed > 0) {
        return `${elapsed}'`;
      }
      if (statusCode === '1H') return '전반전';
      if (statusCode === '2H') return '후반전';
      return '진행중';
    case 'HT':
      return '하프타임';
    case 'FT':
      return '종료';
    case 'AET':
      return '연장 종료';
    case 'PEN':
      return '승부차기 종료';
    case 'NS':
      return '예정';
    case 'TBD':
      return '미정';
    case 'CANC':
      return '취소됨';
    case 'PST':
      return '연기됨';
    case 'SUSP':
      return '중단됨';
    default:
      return statusDescription || statusCode;
  }
};

const MatchItem = React.memo(function MatchItem({ match, onClose }: MatchItemProps) {
  const isLive = ['LIVE', '1H', '2H', 'HT'].includes(match.status?.code || '');
  const isFinished = ['FT', 'AET', 'PEN'].includes(match.status?.code || '');

  // 한국어 매핑
  const leagueNameKo = getLeagueKoreanName(match.league?.name);
  const homeTeam = getTeamById(match.teams?.home?.id || 0);
  const awayTeam = getTeamById(match.teams?.away?.id || 0);

  const homeTeamName = homeTeam?.name_ko || match.teams?.home?.name || '홈팀';
  const awayTeamName = awayTeam?.name_ko || match.teams?.away?.name || '원정팀';

  // 경기 클릭 핸들러
  const handleMatchClick = () => {
    onClose();
    window.location.href = `/livescore/football/match/${match.id}`;
  };

  return (
    <div
      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
      onClick={handleMatchClick}
    >
      {/* 리그 정보 */}
      {match.league && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
          {match.league.id ? (
            <ApiSportsImage
              imageId={match.league.id}
              imageType={ImageType.Leagues}
              alt={match.league.name || '리그'}
              width={16}
              height={16}
              className="object-contain rounded"
              loading="eager"
              priority
              fetchPriority="high"
            />
          ) : (
            <Trophy className="w-4 h-4 text-gray-400" />
          )}
          <span className="truncate">{leagueNameKo || match.league.name || '알 수 없는 리그'}</span>
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          {match.displayDate && (
            <span className="ml-auto text-gray-500">{match.displayDate}</span>
          )}
        </div>
      )}

      {/* 경기 정보 */}
      <div className="flex items-center justify-between">
        {/* 홈팀 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.teams?.home?.logo ? (
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
              <ApiSportsImage
                imageId={match.teams.home.id}
                imageType={ImageType.Teams}
                alt={match.teams?.home?.name || '홈팀'}
                width={24}
                height={24}
                className="object-contain max-w-full max-h-full"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-gray-100 rounded w-6 h-6 flex-shrink-0">
              <Users className="w-3 h-3 text-gray-400" />
            </div>
          )}
          <span className="text-sm font-medium truncate">
            {homeTeamName}
          </span>
        </div>

        {/* 스코어 또는 시간 */}
        <div className="flex items-center gap-2 mx-4 flex-shrink-0">
          {match.goals && (isLive || isFinished) ? (
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800 mb-1">
                {match.goals.home || 0} - {match.goals.away || 0}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getMatchStatusStyle(match.status?.code || '')}`}>
                {getStatusText(match.status?.code || '', match.status?.name || '', match.status?.elapsed)}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">
                {match.time?.date ? new Date(match.time.date).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Seoul'
                }) : '--:--'}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${getMatchStatusStyle(match.status?.code || '')}`}>
                {getStatusText(match.status?.code || '', match.status?.name || '', match.status?.elapsed)}
              </div>
            </div>
          )}
        </div>

        {/* 원정팀 */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-sm font-medium truncate">
            {awayTeamName}
          </span>
          {match.teams?.away?.logo ? (
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
              <ApiSportsImage
                imageId={match.teams.away.id}
                imageType={ImageType.Teams}
                alt={match.teams?.away?.name || '원정팀'}
                width={24}
                height={24}
                className="object-contain max-w-full max-h-full"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-gray-100 rounded w-6 h-6 flex-shrink-0">
              <Users className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MatchItem;
