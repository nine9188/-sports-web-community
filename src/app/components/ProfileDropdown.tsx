'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { User, X, LogOut, Coins } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { createClient } from '@/app/lib/supabase-browser';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { 
  getUserIconInfo
} from '@/app/utils/level-icons-client';
import { 
  LEVEL_EXP_REQUIREMENTS, 
  calculateLevelProgress,
  getExpToNextLevel
} from '@/app/utils/level-icons';

// 프로필 데이터 타입 정의
interface ProfileDataType {
  nickname: string;
  iconUrl: string | null;
  iconName: string | null;
  level: number;
  exp: number;
  points: number;
  postCount: number;
  commentCount: number;
}

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  // 프로필 데이터의 상태를 추적하기 위한 상태 추가
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  // 마지막으로 로드된 프로필 데이터를 캐싱하기 위한 참조
  const lastProfileDataRef = useRef<ProfileDataType | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileDataType>({
    nickname: '',
    iconUrl: null,
    iconName: null,
    level: 1,
    exp: 0,
    points: 0,
    postCount: 0,
    commentCount: 0
  });

  // 즉시 기본 사용자 데이터 설정 (깜빡임 방지)
  useEffect(() => {
    if (user) {
      // 로그인 상태 즉시 반영
      setAuthState('authenticated');
      
      // 기본 정보 즉시 설정
      setProfileData(prev => ({
        ...prev,
        nickname: user.user_metadata?.nickname || '사용자',
      }));
      
      // 이전에 캐시된 데이터가 있으면 사용
      if (lastProfileDataRef.current) {
        setProfileData(lastProfileDataRef.current);
      }
    } else {
      setAuthState('unauthenticated');
    }
  }, [user]);

  // 프로필 데이터 로드 함수를 useCallback으로 메모이제이션
  const updateProfileData = useCallback(async () => {
    // 사용자가 없으면 로드하지 않음
    if (!user) {
      setAuthState('unauthenticated');
      return;
    }
    
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoading) return;
    
    // 로딩 상태 설정 (기존 데이터 유지하며 로드)
    setIsLoading(true);
    
    try {
      // 유저 메타데이터에서 닉네임 가져오기
      const nickname = user.user_metadata?.nickname || '사용자';
      
      // getUserIconInfo 함수를 사용하여 아이콘 정보 가져오기
      const iconInfo = await getUserIconInfo(user.id);
      
      // 프로필 데이터에서 포인트 정보 가져오기
      const supabase = createClient();
      const { data: profileInfo } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();
        
      // 게시글 수 조회
      const { count: postCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      // 댓글 수 조회
      const { count: commentCount } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      const newProfileData = {
        nickname: nickname,
        iconUrl: iconInfo?.currentIconUrl || null,
        iconName: iconInfo?.currentIconName || null,
        level: iconInfo?.level || 1,
        exp: iconInfo?.exp || 0,
        points: profileInfo?.points || 0,
        postCount: postCount || 0,
        commentCount: commentCount || 0
      };
      
      // 데이터 캐싱
      lastProfileDataRef.current = newProfileData;
      
      // 상태 업데이트
      setProfileData(newProfileData);
      setAuthState('authenticated');
      setIsInitialized(true);
    } catch (error) {
      console.error('프로필 데이터 로드 오류:', error);
      // 에러 발생 시 기본 정보만 표시
      if (user) {
        setProfileData(prev => ({
          ...prev,
          nickname: user.user_metadata?.nickname || '사용자',
        }));
        setAuthState('authenticated');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading]);

  // 백그라운드에서 데이터 로드 (깜빡임 없이)
  useEffect(() => {
    if (user && !isInitialized) {
      // 기본적인 사용자 정보 먼저 설정
      setProfileData(prev => ({
        ...prev,
        nickname: user.user_metadata?.nickname || '사용자',
      }));
      
      // 상세 정보는 백그라운드에서 로드
      updateProfileData();
    }
  }, [user, updateProfileData, isInitialized]);
  
  // 아이콘 업데이트 이벤트 리스너
  useEffect(() => {
    const handleIconUpdate = () => {
      if (user) updateProfileData();
    };
    
    window.addEventListener('icon-updated', handleIconUpdate);
    return () => window.removeEventListener('icon-updated', handleIconUpdate);
  }, [user, updateProfileData]);

  // 클릭 이벤트 처리
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 사용자 아이콘 렌더링 함수 (반복 코드 제거)
  const renderUserIcon = () => {
    // 로그인 되어있고 아이콘이 있는 경우
    if (user && profileData.iconUrl) {
      return (
        <div className="w-7 h-7 relative rounded-full overflow-hidden">
          <Image
            src={profileData.iconUrl}
            alt="프로필 이미지"
            fill
            sizes="28px"
            className="object-cover"
            unoptimized={true}
            title={profileData.iconName || undefined}
          />
        </div>
      );
    }
    
    // 로그인 되어있지만 아이콘이 없는 경우
    if (user) {
      return (
        <div className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded-full">
          <User className="h-5 w-5" />
        </div>
      );
    }
    
    // 로그인 되어있지 않은 경우
    return <User className="h-5 w-5" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 프로필 아이콘 버튼 - 로그인 여부와 상관없이 항상 아이콘 표시 */}
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
        aria-label={user ? '프로필 메뉴 열기' : '로그인 메뉴 열기'}
      >
        {renderUserIcon()}
      </button>

      {/* 드롭다운 메뉴 - talk.op.gg 스타일로 변경 */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-white">
          {/* 헤더 - 닫기 버튼 */}
          <div className="flex items-center justify-between p-5">
            <span className="font-medium">{authState === 'authenticated' ? '프로필' : '정보'}</span>
            <button 
              className="text-gray-500" 
              onClick={() => setIsOpen(false)}
              aria-label="닫기"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* 로그인/계정 타이틀 */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-6">
              {user && profileData.iconUrl ? (
                <div className="w-6 h-6 relative rounded-full overflow-hidden">
                  <Image
                    src={profileData.iconUrl}
                    alt="프로필 이미지"
                    fill
                    sizes="24px"
                    className="object-cover"
                    unoptimized={true}
                  />
                </div>
              ) : (
                <User className="h-5 w-5 text-gray-500" />
              )}
              <h1 className="text-xl font-medium">{user ? profileData.nickname : '로그인'}</h1>
            </div>
          
            {/* 컨텐츠 영역 */}
            <div className="flex flex-col space-y-4">
              {authState === 'loading' ? (
                <div className="flex items-center justify-center p-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : authState === 'authenticated' ? (
                <>
                  {/* 사용자 정보 섹션 - 레벨, 경험치, 포인트 */}
                  <div className="py-2">
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      {/* 레벨 정보 */}
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium">레벨 {profileData.level}</span>
                        <span className="text-xs text-gray-500">
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
                      <div className="text-xs text-gray-500 mt-1 mb-3">
                        다음 레벨까지 {getExpToNextLevel(profileData.level, profileData.exp)} EXP 필요
                      </div>
                      
                      {/* 포인트 정보 */}
                      <div className="flex items-center justify-between mt-3 py-2 px-3 bg-white rounded border">
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="text-xs font-medium">포인트</span>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">{profileData.points} P</span>
                      </div>
                      
                      {/* 게시글/댓글 통계 */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Link 
                          href="/settings/posts" 
                          className="py-1.5 px-3 flex justify-center items-center bg-white hover:bg-gray-50 transition-colors border rounded-md"
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-xs font-medium text-gray-700">{profileData.postCount} 게시글</span>
                        </Link>
                        
                        <Link 
                          href="/settings/comments" 
                          className="py-1.5 px-3 flex justify-center items-center bg-white hover:bg-gray-50 transition-colors border rounded-md"
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-xs font-medium text-gray-700">{profileData.commentCount} 댓글</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* 프로필 설정 */}
                  <div className="py-2">
                    <Link 
                      href="/settings/profile" 
                      className="flex items-center justify-between w-full py-3"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-base">프로필 설정</span>
                      <span className="text-gray-400">&gt;</span>
                    </Link>
                  </div>
                  
                  {/* 로그아웃 */}
                  <div className="py-2">
                    <button
                      onClick={async () => {
                        try {
                          const supabase = createClient();
                          await supabase.auth.signOut();
                          toast.success('로그아웃되었습니다.');
                          setIsOpen(false);
                          router.push('/');
                          
                          // 로그인 상태 변경 이벤트 발생
                          window.dispatchEvent(new Event('auth-state-changed'));
                        } catch (error) {
                          console.error('로그아웃 오류:', error);
                          toast.error('로그아웃 중 오류가 발생했습니다.');
                        }
                      }}
                      className="flex items-center justify-between w-full py-3"
                    >
                      <span className="text-base">로그아웃</span>
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* 로그인 버튼 */}
                  <div className="py-2">
                    <Link 
                      href="/signin" 
                      className="flex items-center justify-between w-full py-3"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="text-base">로그인</span>
                      <LogOut className="h-5 w-5 transform rotate-180" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 