'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClient } from '@/app/lib/supabase-browser';
import IconSelector from '@/app/components/IconSelector';
import Image from 'next/image';
import Link from 'next/link';
import { 
  getUserIconInfo, 
  saveIconSetting 
} from '@/app/utils/level-icons';

export default function IconSettings() {
  const { user, refreshUserData } = useAuth();
  const [selectedIconId, setSelectedIconId] = useState<number | null>(null);
  const [currentIconImageUrl, setCurrentIconImageUrl] = useState<string | null>(null);
  const [currentIconName, setCurrentIconName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIconLoading, setIsIconLoading] = useState(false);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [usingLevelIcon, setUsingLevelIcon] = useState<boolean>(false);
  const [levelIconUrl, setLevelIconUrl] = useState<string | null>(null);
  
  // 사용자 프로필 로드 - 유틸리티 함수 사용
  useEffect(() => {
    if (!user) return;
    
    const loadUserIconInfo = async () => {
      try {
        setIsIconLoading(true);
        
        // 유틸리티 함수로 아이콘 정보 가져오기
        const iconInfo = await getUserIconInfo(user.id);
        
        if (iconInfo) {
          // 상태 업데이트
          setUserLevel(iconInfo.level);
          setLevelIconUrl(iconInfo.levelIconUrl);
          setUsingLevelIcon(iconInfo.isUsingLevelIcon);
          
          if (iconInfo.iconId && !iconInfo.isUsingLevelIcon) {
            setSelectedIconId(iconInfo.iconId);
          } else {
            setSelectedIconId(null);
          }
          
          setCurrentIconImageUrl(iconInfo.currentIconUrl);
          setCurrentIconName(iconInfo.currentIconName);
        }
      } catch (error) {
        console.error('사용자 아이콘 정보 로딩 오류:', error);
      } finally {
        setIsIconLoading(false);
      }
    };
    
    loadUserIconInfo();
  }, [user]);
  
  const handleIconSelect = async (iconId: number) => {
    setSelectedIconId(iconId);
    setUsingLevelIcon(false);
    
    // 유틸리티 함수로 아이콘 정보 가져오기
    try {
      setIsIconLoading(true);
      
      const { data: iconData } = await createClient()
        .from('shop_items')
        .select('image_url, name')
        .eq('id', iconId)
        .single();
        
      if (iconData) {
        setCurrentIconImageUrl(iconData.image_url);
        setCurrentIconName(iconData.name);
      }
    } catch (error) {
      console.error('아이콘 정보 로딩 오류:', error);
    } finally {
      setIsIconLoading(false);
    }
  };
  
  // 레벨 아이콘으로 변경
  const handleSelectLevelIcon = () => {
    setSelectedIconId(null);
    setUsingLevelIcon(true);
    setCurrentIconImageUrl(levelIconUrl);
    setCurrentIconName(`레벨 ${userLevel} 아이콘`);
  };

  // 유틸리티 함수 사용하여 아이콘 저장
  const handleSaveIcon = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // 유틸리티 함수로 아이콘 설정 저장
      const success = await saveIconSetting(user.id, {
        iconId: selectedIconId,
        usingLevelIcon
      });
      
      if (success) {
        await refreshUserData();
        toast.success('아이콘이 성공적으로 변경되었습니다.');
        
        // 0.5초 후 페이지 새로고침하여 변경사항 적용
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error('아이콘 저장 중 오류가 발생했습니다.');
      }
    } catch (error: unknown) {
      console.error('아이콘 업데이트 오류:', error);
      
      let errorMessage = '아이콘 업데이트 중 오류가 발생했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">아이콘 관리</h2>
      
      {/* 현재 선택된 아이콘 표시 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">현재 아이콘</h3>
        <div className="p-4 border rounded-lg">
          {isIconLoading ? (
            <div className="text-center py-3">아이콘 로딩 중...</div>
          ) : currentIconImageUrl ? (
            <div className="flex items-center">
              <div className="w-12 h-12 relative mr-4">
                <Image
                  src={currentIconImageUrl}
                  alt="현재 아이콘"
                  width={48}
                  height={48}
                  className="object-contain"
                  unoptimized={true}
                />
              </div>
              <div className="text-sm text-gray-700">
                <p className="font-medium">{currentIconName || '아이콘'}</p>
                <p className="text-xs text-gray-500 mt-1">선택된 아이콘이 프로필에 표시됩니다.</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500">
              선택된 아이콘이 없습니다
            </div>
          )}
        </div>
      </div>
      
      {/* 레벨 아이콘 선택 UI */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">레벨 아이콘</h3>
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 relative mr-4">
              {levelIconUrl && (
                <Image
                  src={levelIconUrl}
                  alt={`레벨 ${userLevel} 아이콘`}
                  width={48}
                  height={48}
                  className="object-contain"
                  unoptimized={true}
                />
              )}
            </div>
            <div className="text-sm text-gray-700">
              <p className="font-medium">레벨 {userLevel} 아이콘</p>
              <p className="text-xs text-gray-500 mt-1">기본 레벨 아이콘은 레벨에 따라 자동으로 변경됩니다.</p>
            </div>
          </div>
          
          <button
            onClick={handleSelectLevelIcon}
            className={`px-4 py-2 text-sm border rounded transition-colors ${
              usingLevelIcon 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {usingLevelIcon ? '기본 레벨 아이콘 사용 중' : '기본 레벨 아이콘 사용하기'}
          </button>
        </div>
      </div>
      
      {/* 구매한 아이콘 선택 UI */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">보유 중인 아이콘</h3>
        <div className="border rounded-lg p-4">
          <IconSelector
            userId={user.id}
            currentIconId={usingLevelIcon ? null : selectedIconId}
            onSelect={handleIconSelect}
          />
        </div>
      </div>
      
      {/* 아이콘 샵으로 이동 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleSaveIcon}
          disabled={isLoading || (!selectedIconId && !usingLevelIcon)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-50"
        >
          {isLoading ? '저장 중...' : '아이콘 저장'}
        </button>
        
        <Link href="/shop/profile-icons" className="text-slate-800 hover:text-slate-600 text-sm">
          더 많은 아이콘 구매하기 →
        </Link>
      </div>
      
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
} 