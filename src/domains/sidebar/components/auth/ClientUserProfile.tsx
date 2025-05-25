'use client';

import { useMemo } from 'react';
import { Coins } from 'lucide-react';
import Image from 'next/image';
import UserStats from './UserStats';
import ProfileActions from './ProfileActions';
import { SidebarUserProfile } from '../../actions/userProfile';
import { 
  LEVEL_EXP_REQUIREMENTS, 
  calculateLevelProgress,
  getExpToNextLevel,
  getLevelIconUrl
} from '@/shared/utils/level-icons';
import { profileImageProps } from '@/shared/utils/user-icons';

interface ClientUserProfileProps {
  profileData: SidebarUserProfile;
}

export default function ClientUserProfile({ profileData }: ClientUserProfileProps) {
  // 아이콘 URL 결정 - 커스텀 아이콘이 있으면 사용, 없으면 레벨 기본 아이콘
  const displayIconUrl = useMemo(() => {
    return profileData.icon_url || getLevelIconUrl(profileData.level);
  }, [profileData.icon_url, profileData.level]);
  
  // 아이콘 이름 결정
  const displayIconName = useMemo(() => {
    return profileData.icon_name || `레벨 ${profileData.level} 기본 아이콘`;
  }, [profileData.icon_name, profileData.level]);

  return (
    <div className="space-y-3">
      <div className="py-3 px-4 flex items-start gap-3 bg-muted/50 rounded-md">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 relative rounded-full overflow-hidden">
            <Image 
              src={displayIconUrl}
              alt={`${profileData.nickname || '사용자'} 프로필`}
              fill
              className="object-cover"
              {...profileImageProps}
              title={displayIconName}
            />
          </div>
        </div>
        
        <div className="flex-1">
          <p className="font-medium text-sm">
            {profileData.nickname || '사용자'}
          </p>
          
          {/* 레벨 정보 */}
          <div className="flex items-center gap-1 mb-1 mt-1">
            <span className="text-xs font-medium">레벨 {profileData.level}</span>
            <span className="text-xs text-muted-foreground">
              ({profileData.exp} / {LEVEL_EXP_REQUIREMENTS[profileData.level] || 0} EXP)
            </span>
          </div>
          
          {/* 레벨 진행률 */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${calculateLevelProgress(profileData.level, profileData.exp)}%` }}
            ></div>
          </div>
          
          {/* 다음 레벨까지 필요한 경험치 */}
          <div className="text-xs text-gray-500 mt-1">
            다음 레벨까지 {getExpToNextLevel(profileData.level, profileData.exp)} EXP 필요
          </div>
          
          {/* 포인트 정보 */}
          <div className="flex items-center mt-2 justify-between">
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium">포인트</span>
            </div>
            <span className="text-xs font-semibold text-yellow-600">{profileData.points} P</span>
          </div>
        </div>
      </div>
      
      {/* 사용자 통계 및 액션 버튼 */}
      <UserStats 
        postCount={profileData.postCount} 
        commentCount={profileData.commentCount} 
      />
      <ProfileActions />
    </div>
  );
} 