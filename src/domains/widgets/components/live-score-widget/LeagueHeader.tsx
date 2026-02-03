import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import type { League } from './types';

interface LeagueHeaderProps {
  league: League;
}

/**
 * 리그 헤더 서버 컴포넌트
 *
 * - 리그 로고 + 이름을 서버에서 렌더링
 * - 클라이언트 LeagueToggleClient의 header prop으로 전달됨
 */
export default function LeagueHeader({ league }: LeagueHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {league.logo && league.leagueIdNumber ? (
        <UnifiedSportsImage
          imageId={league.leagueIdNumber}
          imageType={ImageType.Leagues}
          alt={league.name}
          width={20}
          height={20}
          className="w-5 h-5 object-contain"
        />
      ) : league.icon ? (
        <span className="text-lg">{league.icon}</span>
      ) : null}
      <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
        {league.name}
      </span>
    </div>
  );
}
