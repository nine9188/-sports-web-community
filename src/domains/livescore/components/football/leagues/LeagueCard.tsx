'use client';

import Link from 'next/link';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';

interface LeagueCardProps {
  leagueId: number;
  name: string;
}

export default function LeagueCard({ leagueId, name }: LeagueCardProps) {
  // 리그별 추가 정보 매핑
  const getLeagueInfo = (id: number) => {
    const leagueInfoMap: Record<number, { country: string; type: string; teams?: number }> = {
      39: { country: '잉글랜드', type: '1부 리그', teams: 20 },
      140: { country: '스페인', type: '1부 리그', teams: 20 },
      78: { country: '독일', type: '1부 리그', teams: 18 },
      135: { country: '이탈리아', type: '1부 리그', teams: 20 },
      61: { country: '프랑스', type: '1부 리그', teams: 18 },
      2: { country: '유럽', type: '클럽 대회' },
      3: { country: '유럽', type: '클럽 대회' },
      848: { country: '유럽', type: '클럽 대회' },
      292: { country: '한국', type: '1부 리그', teams: 12 },
      98: { country: '일본', type: '1부 리그', teams: 18 },
      253: { country: '미국', type: '1부 리그', teams: 29 },
      71: { country: '브라질', type: '1부 리그', teams: 20 },
      40: { country: '잉글랜드', type: '2부 리그', teams: 24 },
      88: { country: '네덜란드', type: '1부 리그', teams: 18 },
      94: { country: '포르투갈', type: '1부 리그', teams: 18 },
    };
    return leagueInfoMap[id] || { country: '', type: '' };
  };

  const leagueInfo = getLeagueInfo(leagueId);
  const hasInfo = Boolean(leagueInfo.country || leagueInfo.type || leagueInfo.teams);

  // 이미지 URL은 ApiSportsImage 내부에서 해석

  return (
    <Link
      href={`/livescore/football/leagues/${leagueId}`}
      className="group block bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 p-2 lg:p-4 h-full min-h-[140px] lg:min-h-[180px]"
    >
      <div className={`flex flex-col items-center text-center space-y-1 lg:space-y-3 h-full ${hasInfo ? 'justify-between' : 'justify-center'}`}>
        {/* 리그 로고 */}
        <div className="relative w-8 h-8 lg:w-12 lg:h-12 flex-shrink-0">
          <ApiSportsImage
            imageId={leagueId}
            imageType={ImageType.Leagues}
            alt={`${name} 로고`}
            width={48}
            height={48}
            className="object-contain group-hover:scale-105 transition-transform duration-200 w-8 h-8 lg:w-12 lg:h-12"
          />
        </div>

        {/* 리그 정보 */}
        <div className="w-full flex flex-col">
          {/* 리그 이름 */}
          <h3 className={`${name.length >= 8 ? 'text-[9px] lg:text-[11px]' : 'text-[11px] lg:text-sm'} font-medium lg:font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2 mb-1 lg:mb-2`}>
            {name}
          </h3>
          
          {/* PC에서만 표시되는 추가 정보 */}
          {hasInfo && (
            <div className="block space-y-1 text-[10px] lg:text-xs mt-1 lg:mt-0">
              {leagueInfo.country && (
                <p className="text-xs text-gray-500">
                  {leagueInfo.country}
                </p>
              )}
              
              {leagueInfo.type && (
                <p className="text-xs text-gray-400">
                  {leagueInfo.type}
                </p>
              )}
              
              {leagueInfo.teams && (
                <p className="text-xs text-blue-600 font-medium">
                  {leagueInfo.teams}개 팀
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
} 