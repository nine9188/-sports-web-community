'use client';

import Link from 'next/link';
import { useState } from 'react';
import { updateUserIconServer } from '@/domains/settings/actions/icons';
import { toast } from 'react-toastify';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { IconItem } from '../../types';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';
import { LEVEL_EXP_REQUIREMENTS, getLevelIconUrl } from '@/shared/utils/level-icons';

interface IconFormProps {
  userId: string;
  currentIconId: number | null;
  userIcons: IconItem[];
  levelIconUrl: string;
  userLevel: number;
  displayIconUrl: string;
  displayIconName: string;
}

/**
 * 아이콘 선택 및 변경 폼 컴포넌트
 */
export default function IconForm({ 
  userId, 
  currentIconId, 
  userIcons, 
  levelIconUrl, 
  userLevel,
  displayIconUrl,
  displayIconName
}: IconFormProps) {
  const [selectedIconId, setSelectedIconId] = useState<number | null>(currentIconId);
  const [isLoading, setIsLoading] = useState(false);
  const [isLevelGuideOpen, setIsLevelGuideOpen] = useState(false);
  const { updateUserIconState, refreshUserIcon } = useIcon(); // 전역 아이콘 상태 업데이트 함수 사용
  
  // 아이콘 선택 처리 함수
  const handleIconSelect = (iconId: number | null) => {
    setSelectedIconId(iconId);
  };
  
  // 아이콘 저장 처리 함수
  const handleSaveIcon = async () => {
    // 이미 로딩 중이거나 선택된 아이콘이 현재 아이콘과 같다면 무시
    if (isLoading || selectedIconId === currentIconId) return;
    
    try {
      setIsLoading(true);
      
      // 토스트가 이미 열려있다면 모두 닫기
      toast.dismiss();
      
      // 서버에 아이콘 변경 요청
      const result = await updateUserIconServer(userId, selectedIconId);
      
      if (result.success) {
        // 고유 ID로 토스트 생성하여 중복 방지
        toast.success('아이콘이 변경되었습니다.', {
          toastId: 'icon-update-success',
          autoClose: 2000
        });
        
        // 선택된 아이콘에 따라 전역 상태 업데이트
        if (selectedIconId === null) {
          // 기본 아이콘으로 설정한 경우
          updateUserIconState(levelIconUrl, `레벨 ${userLevel} 기본 아이콘`);
        } else {
          // 커스텀 아이콘으로 설정한 경우
          const selectedIcon = userIcons.find(icon => icon.id === selectedIconId);
          if (selectedIcon) {
            updateUserIconState(selectedIcon.image_url, selectedIcon.name);
          }
        }
        
        // 전역 아이콘 정보 새로고침 (다른 컴포넌트에서도 반영되도록)
        await refreshUserIcon();
      } else {
        // 고유 ID로 토스트 생성하여 중복 방지
        toast.error(result.error || '아이콘 변경에 실패했습니다.', {
          toastId: 'icon-update-error',
          autoClose: 2000
        });
        // 실패 시 원래 선택으로 되돌림
        setSelectedIconId(currentIconId);
      }
    } catch (error) {
      console.error('아이콘 변경 오류:', error);
      toast.error('아이콘 변경 중 오류가 발생했습니다.', {
        toastId: 'icon-update-exception',
        autoClose: 2000
      });
      setSelectedIconId(currentIconId);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* 현재 아이콘 정보 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-base font-medium text-gray-900">현재 사용 중인 아이콘</h3>
        </div>

        <div className="p-4">
          <div className="flex items-center">
            {/* 현재 아이콘 표시 - 20px 통일 */}
            <div className="rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 w-5 h-5 flex items-center justify-center mr-3">
              <UserIcon
                iconUrl={displayIconUrl}
                level={userLevel}
                size={20}
                alt="현재 아이콘"
                className="object-contain"
              />
            </div>

            <div>
              <div className="font-medium text-gray-700">{displayIconName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 레벨별 아이콘 가이드 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <button
          onClick={() => setIsLevelGuideOpen(!isLevelGuideOpen)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-b focus:outline-none"
        >
          <h3 className="text-base font-medium text-gray-900">레벨별 기본 아이콘 가이드</h3>
          {isLevelGuideOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {isLevelGuideOpen && (
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              레벨별 기본 아이콘을 확인하세요. 현재 레벨: <strong>Lv.{userLevel}</strong>
            </p>

            {/* 모바일용 그리드 (20px) */}
            <div className="grid grid-cols-5 gap-2 md:hidden">
              {Array.from({ length: Math.min(50, LEVEL_EXP_REQUIREMENTS.length) }, (_, i) => {
                const level = i + 1;
                const expRequired = LEVEL_EXP_REQUIREMENTS[level - 1];
                const iconUrl = getLevelIconUrl(level);
                const isCurrentLevel = level === userLevel;

                return (
                  <div
                    key={level}
                    className={`
                      flex flex-col items-center p-2 rounded-lg border text-center
                      ${isCurrentLevel ? 'bg-blue-50 border-blue-200' : 'bg-white'}
                    `}
                  >
                    <div className="relative w-5 h-5 mb-1">
                      <UserIcon
                        iconUrl={iconUrl}
                        level={level}
                        size={20}
                        alt={`레벨 ${level} 아이콘`}
                        className="object-contain"
                      />
                    </div>
                    <div className="font-medium text-xs">Lv.{level}</div>
                    <div className="text-xs text-gray-500">
                      {expRequired.toLocaleString()}~
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 데스크탑용 그리드 (20px) */}
            <div className="hidden md:grid grid-cols-10 gap-2">
              {Array.from({ length: Math.min(50, LEVEL_EXP_REQUIREMENTS.length) }, (_, i) => {
                const level = i + 1;
                const expRequired = LEVEL_EXP_REQUIREMENTS[level - 1];
                const iconUrl = getLevelIconUrl(level);
                const isCurrentLevel = level === userLevel;

                return (
                  <div
                    key={level}
                    className={`
                      flex flex-col items-center p-2 rounded-lg border text-center
                      ${isCurrentLevel ? 'bg-blue-50 border-blue-200' : 'bg-white'}
                    `}
                  >
                    <div className="relative w-5 h-5 mb-1">
                      <UserIcon
                        iconUrl={iconUrl}
                        level={level}
                        size={20}
                        alt={`레벨 ${level} 아이콘`}
                        className="object-contain"
                      />
                    </div>
                    <div className="font-medium text-xs">Lv.{level}</div>
                    <div className="text-xs text-gray-500">
                      {expRequired.toLocaleString()}~
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 아이콘 선택 영역 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-medium text-gray-900">아이콘 선택</h3>

          {/* 저장 버튼 */}
          <button
            onClick={handleSaveIcon}
            disabled={isLoading || selectedIconId === currentIconId}
            className="mt-2 sm:mt-0 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 flex items-center rounded-md"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            아이콘 저장
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {/* 기본 레벨 아이콘 */}
            <button
              onClick={() => handleIconSelect(null)}
              disabled={isLoading}
              className={`relative p-2 rounded-lg border-2 transition-all aspect-square flex items-center justify-center ${
                selectedIconId === null
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              title={`레벨 ${userLevel} 기본 아이콘`}
            >
              <div className="rounded-full overflow-hidden bg-gray-50 w-5 h-5 mx-auto flex items-center justify-center">
                <UserIcon
                  iconUrl={levelIconUrl}
                  level={userLevel}
                  size={20}
                  alt={`레벨 ${userLevel} 기본 아이콘`}
                  className="object-contain"
                />
              </div>

              {selectedIconId === null && (
                <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>

            {/* 구매한 아이콘 목록 */}
            {userIcons.length === 0 ? (
              <div className="col-span-full p-4 text-center text-gray-500">
                보유한 아이콘이 없습니다. 포인트 상점에서 아이콘을 구매해보세요.
              </div>
            ) : (
              userIcons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => handleIconSelect(icon.id)}
                  disabled={isLoading}
                  className={`relative p-2 rounded-lg border-2 transition-all aspect-square flex items-center justify-center ${
                    selectedIconId === icon.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  title={icon.name}
                >
                  <div className="rounded-full overflow-hidden bg-gray-50 w-5 h-5 mx-auto flex items-center justify-center">
                    <UserIcon
                      iconUrl={icon.image_url}
                      level={userLevel}
                      size={20}
                      alt={icon.name}
                      className="object-contain"
                    />
                  </div>

                  {selectedIconId === icon.id && (
                    <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 상점 안내 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-base font-medium text-gray-900">새로운 아이콘</h3>
        </div>

        <div className="p-4">
          <p className="text-gray-600 text-sm mb-4">
            다양한 프로필 아이콘을 포인트 상점에서 구매할 수 있습니다.
          </p>
          <Link
            href="/shop"
            className="inline-block px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded-md"
          >
            포인트 상점 방문하기
          </Link>
        </div>
      </div>
    </div>
  );
} 