'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { getCurrentUserIconData } from '@/shared/actions/user';

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

  // 아이콘 새로고침 함수 - 서버 액션으로 최신 아이콘 정보 로드
  const refreshUserIcon = useCallback(async () => {
    try {
      setIsIconLoading(true);

      const data = await getCurrentUserIconData();
      if (!data) {
        setIsIconLoading(false);
        return;
      }

      updateUserIconState(data.iconUrl, data.iconName);
    } catch (error) {
      console.error('아이콘 정보 로드 중 오류 발생:', error);
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