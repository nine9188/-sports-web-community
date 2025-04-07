'use client';

import { createClient } from '@/app/lib/supabase-browser';
import { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

interface ProfileData {
  nickname: string;
  icon_id?: number;
}

// 에러 타입 인터페이스 정의
interface ProfileError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function useProfileData(user: User | null) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProfileData = useCallback(async () => {
    if (!user) {
      setProfileData(null);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname, icon_id')
        .eq('id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          setProfileData({
            nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '사용자',
          });
        } else {
          throw error;
        }
      } else if (data) {
        setProfileData(data);
      }
    } catch (err: unknown) {
      console.error('프로필 데이터 가져오기 오류:', err);
      
      // 에러 메시지 추출을 위한 타입 가드
      let errorMessage = '프로필 정보를 가져오는 중 오류가 발생했습니다.';
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as ProfileError).message || errorMessage;
      }
      
      setError(errorMessage);
      
      setProfileData({
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || '사용자',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);
  
  return { profileData, isLoading, error, refreshProfileData: fetchProfileData };
} 