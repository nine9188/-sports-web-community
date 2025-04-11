'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins } from 'lucide-react';
import UserStats from './UserStats';
import ProfileActions from './ProfileActions';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import { createClient } from '@/app/lib/supabase-browser';
import { 
  LEVEL_EXP_REQUIREMENTS, 
  calculateLevelProgress,
  getExpToNextLevel,
  getUserIconInfo 
} from '@/app/utils/level-icons';

interface ProfileData {
  nickname?: string;
  fullName?: string;
  lastUpdated?: number;
  postCount?: number;
  commentCount?: number;
  points?: number;
  exp?: number;
  level?: number;
  nextLevelPoints?: number;
}

interface UserProfileProps {
  profileData?: ProfileData;
}

export default function UserProfile({ profileData = {} }: UserProfileProps) {
  const { user } = useAuth();
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isIconLoading, setIsIconLoading] = useState(false);
  const [userLevel, setUserLevel] = useState(profileData?.level || 1);
  const [userExp, setUserExp] = useState(profileData?.exp || 0);
  const [iconName, setIconName] = useState<string | null>(null);
  const [iconLoadFailed, setIconLoadFailed] = useState(false);
  const [stats, setStats] = useState({ 
    postCount: profileData?.postCount || 0, 
    commentCount: profileData?.commentCount || 0 
  });
  
  // 사용자 통계 정보 가져오기
  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      
      // 게시글 수 조회
      const { count: postCount, error: postError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (postError) throw postError;
      
      // 댓글 수 조회
      const { count: commentCount, error: commentError } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (commentError) throw commentError;
      
      // 상태 업데이트
      setStats({
        postCount: postCount || 0,
        commentCount: commentCount || 0
      });
      
    } catch {
    }
  }, [user]);
  
  // 아이콘 정보 가져오기 함수를 useCallback으로 메모이제이션
  const fetchIconInfo = useCallback(async () => {
    if (!user || isIconLoading) return;
    
    setIsIconLoading(true);
    try {
      // 유틸리티 함수로 아이콘 정보 가져오기
      const iconInfo = await getUserIconInfo(user.id);
      
      if (iconInfo) {
        setUserLevel(iconInfo.level);
        setUserExp(iconInfo.exp);
        setIconUrl(iconInfo.currentIconUrl);
        setIconName(iconInfo.currentIconName);
        setIconLoadFailed(false);
      }
    } catch {
      setIconLoadFailed(true);
    } finally {
      setIsIconLoading(false);
    }
  }, [user, isIconLoading]);
  
  // 초기 로딩 시 아이콘 정보와 통계 정보 가져오기
  useEffect(() => {
    if (user) {
      if (!iconUrl && !isIconLoading && !iconLoadFailed) {
        fetchIconInfo();
      }
      
      fetchUserStats();
    }
  }, [user, iconUrl, isIconLoading, fetchIconInfo, iconLoadFailed, fetchUserStats]);
  
  // 아이콘 업데이트 이벤트 리스너
  useEffect(() => {
    const handleIconUpdate = () => {
      if (user) {
        // 아이콘 업데이트 시에는 깜빡거림 없이 바로 로드
        fetchIconInfo();
      }
    };
    
    window.addEventListener('icon-updated', handleIconUpdate);
    return () => window.removeEventListener('icon-updated', handleIconUpdate);
  }, [user, fetchIconInfo]);

  // 이미지 로드 에러 핸들러
  const handleImageError = () => {
    setIconLoadFailed(true);
    setIconUrl(null);
  };

  // 기본 아이콘 또는 이니셜 표시
  const renderDefaultIcon = () => (
    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-white">
      {user?.email?.[0]?.toUpperCase() || '?'}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="py-3 px-4 flex items-start gap-3 bg-muted/50 rounded-md">
        <div className="flex-shrink-0">
          {isIconLoading ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          ) : iconUrl ? (
            <div className="w-10 h-10 relative rounded-full overflow-hidden" title={iconName || undefined}>
              <Image 
                src={iconUrl}
                alt="프로필 아이콘"
                fill
                sizes="40px"
                className="object-cover"
                unoptimized={true}
                onError={handleImageError}
                priority={true}
              />
            </div>
          ) : (
            renderDefaultIcon()
          )}
        </div>
        
        <div className="flex-1">
          <p className="font-medium text-sm">
            {profileData?.nickname || '사용자'}
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
          
          {/* 포인트 정보 (눈에 띄는 디자인) */}
          <div className="flex items-center mt-2 rounded-md">
            <div className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium">포인트</span>
            </div>
            <span className="text-xs font-semibold text-yellow-600">{profileData?.points || 0} P</span>
          </div>
        </div>
      </div>
      
      {/* 사용자 통계 및 액션 버튼 - 로컬 상태에서 가져온 값 사용 */}
      <UserStats postCount={stats.postCount} commentCount={stats.commentCount} />
      <ProfileActions />
    </div>
  );
} 