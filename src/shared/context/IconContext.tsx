'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { createClient } from '@/shared/api/supabase';
import { getLevelIconUrl } from '@/app/utils/level-icons';

interface IconContextType {
  iconUrl: string;
  iconName: string;
  updateUserIconState: (iconUrl: string, iconName: string) => void;
  isIconLoading: boolean;
  refreshUserIcon: () => Promise<void>;
}

const IconContext = createContext<IconContextType>({
  iconUrl: '',
  iconName: '',
  updateUserIconState: () => {},
  isIconLoading: false,
  refreshUserIcon: async () => {}
});

export const useIcon = () => useContext(IconContext);

export function IconProvider({ 
  children, 
  initialIconUrl = '', 
  initialIconName = '' 
}: { 
  children: ReactNode;
  initialIconUrl?: string;
  initialIconName?: string;
}) {
  const [iconUrl, setIconUrl] = useState<string>(initialIconUrl);
  const [iconName, setIconName] = useState<string>(initialIconName);
  const [isIconLoading, setIsIconLoading] = useState<boolean>(false);

  // 아이콘 상태 업데이트 함수
  const updateUserIconState = useCallback((newIconUrl: string, newIconName: string) => {
    setIsIconLoading(true);
    setIconUrl(newIconUrl);
    setIconName(newIconName);
    // 로딩 상태 변경을 위한 약간의 지연
    setTimeout(() => setIsIconLoading(false), 300);
  }, []);

  // 아이콘 새로고침 함수 - Supabase에서 최신 아이콘 정보 로드
  const refreshUserIcon = useCallback(async () => {
    try {
      setIsIconLoading(true);
      
      const supabase = createClient();
      
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsIconLoading(false);
        return;
      }
      
      // 사용자 기본 레벨 아이콘 (fallback용)
      const userLevel = user.user_metadata?.level || 1;
      const defaultLevelIcon = getLevelIconUrl(userLevel);
      const defaultIconName = `레벨 ${userLevel} 기본 아이콘`;
      
      // 프로필 정보에서 아이콘 ID 가져오기
      const { data: profile } = await supabase
        .from('profiles')
        .select('icon_id')
        .eq('id', user.id)
        .single();
      
      // 아이콘 ID가 null이면 기본 레벨 아이콘 사용
      if (!profile?.icon_id) {
        updateUserIconState(defaultLevelIcon, defaultIconName);
        return;
      }
      
      // 선택된 아이콘 정보 가져오기
      const { data: iconData } = await supabase
        .from('shop_items')
        .select('name, image_url')
        .eq('id', profile.icon_id)
        .single();
      
      if (iconData?.image_url && iconData?.name) {
        updateUserIconState(iconData.image_url, iconData.name);
      } else {
        // 아이콘 정보가 없으면 기본 아이콘으로 설정
        updateUserIconState(defaultLevelIcon, defaultIconName);
      }
    } catch (error) {
      console.error('아이콘 정보 로드 중 오류 발생:', error);
      // 오류 발생 시 기본값 설정
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const userLevel = user.user_metadata?.level || 1;
        const defaultIcon = getLevelIconUrl(userLevel);
        updateUserIconState(defaultIcon, `레벨 ${userLevel} 기본 아이콘`);
      }
    } finally {
      setIsIconLoading(false);
    }
  }, [updateUserIconState]);

  return (
    <IconContext.Provider value={{ 
      iconUrl, 
      iconName,
      updateUserIconState,
      refreshUserIcon,
      isIconLoading 
    }}>
      {children}
    </IconContext.Provider>
  );
} 