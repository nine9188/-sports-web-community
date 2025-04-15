'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from '@/app/lib/supabase-browser';
import UserProfile from './auth/UserProfile';
import Link from 'next/link';

// 프로필 데이터 인터페이스 정의
interface ProfileData {
  id: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // 추가 속성을 위한 인덱스 시그니처 - 알 수 없는 속성도 허용
}

// 캐시 유효 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

export default function AuthSection() {
  const { session, user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // 프로필 데이터 로드 함수 - 메모이제이션으로 불필요한 재생성 방지
  const loadProfileData = useCallback(async () => {
    if (!user || isLoadingProfile) return;
    
    // 캐시가 유효한 경우 불필요한 요청 방지
    if (profileData && (Date.now() - lastUpdated < CACHE_DURATION)) {
      return;
    }
    
    try {
      setIsLoadingProfile(true);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('프로필 데이터 로드 오류:', error);
        return;
      }

      setProfileData(data);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('프로필 데이터 로드 중 예외 발생:', error);
    } finally {
      setIsLoadingProfile(false);
      setLoading(false);
    }
  }, [user, profileData, lastUpdated, isLoadingProfile]);

  // 초기 프로필 데이터 로드
  useEffect(() => {
    if (user) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [user, loadProfileData]);

  // 페이지 포커스 시 데이터 갱신
  useEffect(() => {
    const handleFocus = () => {
      // 마지막 업데이트 시간이 캐시 유효 시간을 초과했을 때만 데이터 갱신
      if (Date.now() - lastUpdated > CACHE_DURATION) {
        loadProfileData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadProfileData, lastUpdated]);

  // 프로필 업데이트 이벤트 리스너
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfileData();
    };
    
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, [loadProfileData]);

  // 로딩 상태 렌더링
  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  // 로그인/비로그인 상태에 따른 렌더링
  return session ? (
    <UserProfile profileData={profileData || undefined} />
  ) : (
    <>
      <Link 
        href="/signin" 
        className="flex items-center justify-center bg-slate-800 text-white py-2 rounded-md font-medium w-full mb-2 hover:bg-slate-700 transition-colors"
      >
        <span className="font-bold mr-1">SPORTS</span> 로그인
      </Link>
      <div className="flex justify-center gap-2 text-xs text-gray-500 mt-2">
        <Link href="/help/account-recovery?tab=id" className="hover:underline">아이디 찾기</Link>
        <span className="text-gray-300">|</span>
        <Link href="/help/account-recovery?tab=password" className="hover:underline">비밀번호 찾기</Link>
        <span className="text-gray-300">|</span>
        <Link href="/signup" className="hover:underline">회원가입</Link>
      </div>
    </>
  );
}
