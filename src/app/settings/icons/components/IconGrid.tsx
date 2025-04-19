'use client';

import Image from 'next/image';
import { useState } from 'react';
import { updateUserIcon } from '../actions';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

// 아이콘 아이템 타입
interface IconItem {
  id: number;
  name: string;
  image_url: string;
}

interface IconGridProps {
  userId: string;
  currentIconId: number | null;
  userIcons: IconItem[];
  levelIconUrl: string;
  userLevel: number;
}

export default function IconGrid({ userId, currentIconId, userIcons, levelIconUrl, userLevel }: IconGridProps) {
  const [selectedIconId, setSelectedIconId] = useState<number | null>(currentIconId);
  const [isLoading, setIsLoading] = useState(false);
  
  // 아이콘 선택 처리 함수
  const handleIconSelect = (iconId: number | null) => {
    setSelectedIconId(iconId);
  };
  
  // 아이콘 저장 처리 함수
  const handleSaveIcon = async () => {
    try {
      setIsLoading(true);
      
      // 서버에 아이콘 변경 요청
      const result = await updateUserIcon(userId, selectedIconId);
      
      if (result.success) {
        toast.success('아이콘이 변경되었습니다.');
      } else {
        toast.error(result.error || '아이콘 변경에 실패했습니다.');
        // 실패 시 원래 선택으로 되돌림
        setSelectedIconId(currentIconId);
      }
    } catch (error) {
      console.error('아이콘 변경 오류:', error);
      toast.error('아이콘 변경 중 오류가 발생했습니다.');
      setSelectedIconId(currentIconId);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">내 아이콘 목록</h2>
          
          {/* 저장 버튼 */}
          <button
            onClick={handleSaveIcon}
            disabled={isLoading || selectedIconId === currentIconId}
            className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 flex items-center rounded-md"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            아이콘 저장
          </button>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
          {/* 기본 레벨 아이콘 */}
          <button
            onClick={() => handleIconSelect(null)}
            disabled={isLoading}
            className={`relative p-2 rounded-lg border-2 transition-all ${
              selectedIconId === null 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={`레벨 ${userLevel} 기본 아이콘`}
          >
            <div className="rounded-full overflow-hidden bg-gray-50 w-12 h-12 mx-auto flex items-center justify-center">
              <Image
                src={levelIconUrl}
                alt={`레벨 ${userLevel} 기본 아이콘`}
                width={20}
                height={20}
                className="w-8 h-8 object-contain"
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
                className={`relative p-2 rounded-lg border-2 transition-all ${
                  selectedIconId === icon.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                title={icon.name}
              >
                <div className="rounded-full overflow-hidden bg-gray-50 w-12 h-12 mx-auto flex items-center justify-center">
                  <Image
                    src={icon.image_url}
                    alt={icon.name}
                    width={20}
                    height={20}
                    className="w-8 h-8 object-contain"
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
  );
} 