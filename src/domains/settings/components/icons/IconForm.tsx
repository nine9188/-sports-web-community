'use client';

import Link from 'next/link';
import { useState } from 'react';
import { updateUserIconServer } from '@/domains/settings/actions/icons';
import { toast } from 'react-toastify';
import { IconItem } from '../../types';
import { useIcon } from '@/shared/context/IconContext';
import UserIcon from '@/shared/components/UserIcon';
import { getLevelIconUrl } from '@/shared/utils/level-icons';
import LevelList from '../exp/LevelList';
import Spinner from '@/shared/components/Spinner';

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
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
        <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">현재 사용 중인 아이콘</h3>
        </div>

        <div className="p-4">
          <div className="flex items-center">
            {/* 현재 아이콘 표시 */}
            <div className="mr-2">
              <UserIcon
                iconUrl={displayIconUrl}
                level={userLevel}
                alt="현재 아이콘"
              />
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{displayIconName}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 레벨별 아이콘 가이드 */}
      <LevelList currentLevel={userLevel} />

      {/* 아이콘 선택 영역 */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
        <div className="px-4 py-3 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">아이콘 선택</h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {/* 기본 레벨 아이콘 */}
            <button
              onClick={() => handleIconSelect(null)}
              disabled={isLoading}
              className={`relative p-2 rounded-lg border-2 transition-colors aspect-square flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                selectedIconId === null
                  ? 'border-slate-800 dark:border-white bg-[#EAEAEA] dark:bg-[#333333]'
                  : 'border-black/7 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
              }`}
              title={`레벨 ${userLevel} 기본 아이콘`}
            >
              <div className="rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] w-5 h-5 mx-auto flex items-center justify-center">
                <UserIcon
                  iconUrl={levelIconUrl}
                  level={userLevel}
                  size={20}
                  alt={`레벨 ${userLevel} 기본 아이콘`}
                  className="object-contain"
                />
              </div>

              {selectedIconId === null && (
                <div className="absolute top-1 right-1 bg-slate-800 dark:bg-[#F0F0F0] rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white dark:text-slate-800" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>

            {/* 구매한 아이콘 목록 */}
            {userIcons.map((icon) => (
              <button
                key={icon.id}
                onClick={() => handleIconSelect(icon.id)}
                disabled={isLoading}
                className={`relative p-2 rounded-lg border-2 transition-colors aspect-square flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                  selectedIconId === icon.id
                    ? 'border-slate-800 dark:border-white bg-[#EAEAEA] dark:bg-[#333333]'
                    : 'border-black/7 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 hover:bg-[#F5F5F5] dark:hover:bg-[#262626]'
                }`}
                title={icon.name}
              >
                <div className="rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] w-5 h-5 mx-auto flex items-center justify-center">
                  <UserIcon
                    iconUrl={icon.image_url}
                    level={userLevel}
                    size={20}
                    alt={icon.name}
                    className="object-contain"
                  />
                </div>

                {selectedIconId === icon.id && (
                  <div className="absolute top-1 right-1 bg-slate-800 dark:bg-[#F0F0F0] rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white dark:text-slate-800" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* 저장 버튼 및 상점 링크 */}
          <div className="mt-4 flex items-center justify-between">
            <Link
              href="/shop"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              더 많은 아이콘 보기 →
            </Link>
            <button
              onClick={handleSaveIcon}
              disabled={isLoading || selectedIconId === currentIconId}
              className="px-4 py-2 bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center rounded-md transition-colors"
            >
              {isLoading && <Spinner size="xs" className="mr-2" />}
              <span className="text-sm">아이콘 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
