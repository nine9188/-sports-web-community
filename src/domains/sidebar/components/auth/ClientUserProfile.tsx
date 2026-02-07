'use client';

import { useMemo } from 'react';
import { Coins } from 'lucide-react';
import UserIcon from '@/shared/components/UserIcon';
import UserStats from './UserStats';
import ProfileActions from './ProfileActions';
import {
  LEVEL_EXP_REQUIREMENTS,
  calculateLevelProgress,
  getExpToNextLevel,
  getLevelIconUrl
} from '@/shared/utils/level-icons';

// 프로필 데이터 타입 (SidebarUserData와 호환)
interface ProfileData {
  id?: string;
  nickname: string | null;
  level: number;
  exp: number;
  points: number;
  icon_url: string | null;
  postCount: number;
  commentCount: number;
}

interface ClientUserProfileProps {
  profileData: ProfileData | null;
  showActions?: boolean;
}

export default function ClientUserProfile({ profileData, showActions = true }: ClientUserProfileProps) {
  // null 체크
  if (!profileData) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">로딩 중...</p>
      </div>
    );
  }
  // 아이콘 URL 결정 - 커스텀 아이콘이 있으면 사용, 없으면 레벨 기본 아이콘
  const displayIconUrl = useMemo(() => {
    return profileData.icon_url || getLevelIconUrl(profileData.level);
  }, [profileData.icon_url, profileData.level]);

  return (
    <div className="space-y-3">
      <div className="py-3 px-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-md">
        {/* 닉네임 행: 아이콘 + 닉네임을 같은 라인에 배치 */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 relative rounded-full overflow-hidden flex-shrink-0" aria-hidden="true">
            <UserIcon
              iconUrl={displayIconUrl}
              level={profileData.level}
              exp={profileData.exp}
              size={20}
              alt=""
              className="object-cover"
            />
          </div>
          <p className="font-medium text-sm leading-5 text-gray-900 dark:text-[#F0F0F0]">
            {profileData.nickname || '사용자'}
          </p>
        </div>

        <div>

          {/* 레벨 정보 */}
          <div className="flex items-center gap-1 mb-1 mt-1">
            <span className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">레벨 {profileData.level}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({profileData.exp} / {LEVEL_EXP_REQUIREMENTS[profileData.level] || 0} EXP)
            </span>
          </div>

          {/* 레벨 진행률 */}
          <div className="w-full h-1.5 bg-[#EAEAEA] dark:bg-[#333333] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#262626] dark:bg-[#F0F0F0] rounded-full"
              style={{ width: `${calculateLevelProgress(profileData.level, profileData.exp)}%` }}
            ></div>
          </div>

          {/* 다음 레벨까지 필요한 경험치 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            다음 레벨까지 {getExpToNextLevel(profileData.level, profileData.exp)} EXP 필요
          </div>

          {/* 포인트 정보 */}
          <div className="flex items-center mt-2 gap-1.5">
            <Coins className="h-3 w-3 text-yellow-500 dark:text-yellow-400" />
            <span className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">포인트</span>
            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{profileData.points} P</span>
          </div>
        </div>
      </div>

      {/* 사용자 통계 및 액션 버튼 */}
      <UserStats
        postCount={profileData.postCount}
        commentCount={profileData.commentCount}
      />
      {showActions && <ProfileActions />}
    </div>
  );
} 