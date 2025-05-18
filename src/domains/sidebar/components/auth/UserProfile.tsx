'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Coins } from 'lucide-react';
import UserStats from './UserStats';
import ProfileActions from './ProfileActions';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import { getUserIconInfo } from '@/app/utils/level-icons-client';
import { 
  LEVEL_EXP_REQUIREMENTS, 
  calculateLevelProgress,
  getExpToNextLevel,
  getLevelIconUrl
} from '@/app/utils/level-icons';

interface ProfileData {
  id?: string;
  username?: string;
  email?: string;
  nickname?: string;
  full_name?: string;
  avatar_url?: string;
  level?: number;
  exp?: number;
  points?: number;
  created_at?: string;
  updated_at?: string;
  postCount?: number;
  commentCount?: number;
  icon_id?: number | null;
  icon_url?: string | null;
}

interface UserProfileProps {
  profileData: ProfileData | null;
}

export default function UserProfile({ profileData }: UserProfileProps) {
  const { user } = useAuth();
  
  // 프로필 데이터에서 기본 정보 추출
  const userLevel = useMemo(() => profileData?.level || 1, [profileData?.level]);
  const userExp = useMemo(() => profileData?.exp || 0, [profileData?.exp]);
  const iconId = useMemo(() => profileData?.icon_id || null, [profileData?.icon_id]);
  const userId = useMemo(() => profileData?.id || user?.id || null, [profileData?.id, user?.id]);
  
  // 기본 레벨 아이콘 URL (프로필 데이터에서 레벨 정보 추출)
  const defaultIconUrl = useMemo(() => getLevelIconUrl(userLevel), [userLevel]);
  
  // 초기 아이콘 URL - 서버에서 전달된 icon_url을 우선 사용
  // 없으면 icon_id 기반으로 판단하여 기본 레벨 아이콘 사용
  const initialIconUrl = useMemo(() => {
    // 이미 서버에서 icon_url을 전달받았다면 그대로 사용
    if (profileData?.icon_url) {
      return profileData.icon_url;
    }
    
    // 아이콘 ID가 null이면 기본 레벨 아이콘 사용 
    if (iconId === null) {
      return defaultIconUrl;
    }
    
    // 그 외의 경우 일단 기본 레벨 아이콘을 반환하고 나중에 정확한 아이콘을 로드
    return defaultIconUrl;
  }, [profileData?.icon_url, iconId, defaultIconUrl]);
  
  // 아이콘 상태 관리 - 초기값을 미리 설정하여 로딩 없이 즉시 렌더링
  const [iconUrl, setIconUrl] = useState<string>(initialIconUrl);
  const [iconName, setIconName] = useState<string>(`${profileData?.nickname || ''} 아이콘`);
  const [isLoadingAdditionalInfo, setIsLoadingAdditionalInfo] = useState<boolean>(false);
  
  // 상세 아이콘 정보 로드 함수 - 필요한 경우에만 실행
  const loadAdditionalIconInfo = useCallback(async () => {
    // 이미 서버에서 icon_url을 받았다면 추가 로드 불필요
    if (profileData?.icon_url || !userId || isLoadingAdditionalInfo) return;
    
    // 아이콘 ID가 null이 아니면서 추가 정보가 필요한 경우만 로드
    if (iconId !== null) {
      setIsLoadingAdditionalInfo(true);
      try {
        const iconInfo = await getUserIconInfo(userId);
        
        if (iconInfo) {
          setIconUrl(iconInfo.currentIconUrl);
          setIconName(iconInfo.currentIconName);
        }
      } catch (error) {
        console.error('아이콘 상세 정보 로드 오류:', error);
        // 오류 발생해도 이미 기본 아이콘은 표시 중이므로 UI 깨짐 없음
      } finally {
        setIsLoadingAdditionalInfo(false);
      }
    }
  }, [userId, iconId, profileData?.icon_url, isLoadingAdditionalInfo]);
  
  // 필요한 경우에만 추가 아이콘 정보를 비동기적으로 로드
  useEffect(() => {
    loadAdditionalIconInfo();
  }, [loadAdditionalIconInfo]);
  
  // 아이콘 업데이트 이벤트 리스너
  useEffect(() => {
    const handleIconUpdate = () => {
      loadAdditionalIconInfo();
    };
    
    window.addEventListener('icon-updated', handleIconUpdate);
    return () => window.removeEventListener('icon-updated', handleIconUpdate);
  }, [loadAdditionalIconInfo]);

  // 이미지 로드 에러 핸들러
  const handleImageError = useCallback(() => {
    setIconUrl(defaultIconUrl); // 오류 시 기본 레벨 아이콘으로 대체
  }, [defaultIconUrl]);

  if (!profileData) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="py-3 px-4 flex items-start gap-3 bg-muted/50 rounded-md">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 relative rounded-full overflow-hidden" title={iconName || undefined}>
            <Image 
              src={iconUrl}
              alt={`${profileData.nickname || '사용자'} 프로필`}
              fill
              sizes="40px"
              className="object-cover"
              unoptimized={true}
              onError={handleImageError}
              priority={true}
            />
          </div>
        </div>
        
        <div className="flex-1">
          <p className="font-medium text-sm">
            {profileData.nickname || '사용자'}
          </p>
          
          {/* 레벨 정보 */}
          <div className="flex items-center gap-1 mb-1 mt-1">
            <span className="text-xs font-medium">레벨 {userLevel}</span>
            <span className="text-xs text-muted-foreground">
              ({userExp} / {LEVEL_EXP_REQUIREMENTS[userLevel] || 0} EXP)
            </span>
          </div>
          
          {/* 레벨 진행률 */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${calculateLevelProgress(userLevel, userExp)}%` }}
            ></div>
          </div>
          
          {/* 다음 레벨까지 필요한 경험치 */}
          <div className="text-xs text-gray-500 mt-1">
            다음 레벨까지 {getExpToNextLevel(userLevel, userExp)} EXP 필요
          </div>
          
          {/* 포인트 정보 */}
          <div className="flex items-center mt-2 justify-between">
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium">포인트</span>
            </div>
            <span className="text-xs font-semibold text-yellow-600">{profileData.points || 0} P</span>
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