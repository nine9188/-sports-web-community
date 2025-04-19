'use client';

import React, { useState } from 'react';
import { LEVEL_EXP_REQUIREMENTS, getLevelIconUrl } from '@/app/utils/level-icons';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LevelListProps {
  currentLevel: number;
}

export default function LevelList({ currentLevel }: LevelListProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 레벨 목록 표시는 50레벨까지
  const totalLevels = Math.min(50, LEVEL_EXP_REQUIREMENTS.length);
  
  // 아코디언 토글 함수
  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* 헤더 (클릭 가능) */}
      <button 
        onClick={toggleAccordion}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-b focus:outline-none"
      >
        <h3 className="text-base font-medium text-gray-900">레벨 및 아이콘 목록</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      {/* 컨텐츠 (토글에 따라 보이거나 숨김) */}
      {isOpen && (
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            레벨별 필요 경험치와 아이콘을 확인하세요. 현재 레벨: <strong>Lv.{currentLevel}</strong>
          </p>
          
          {/* 모바일 화면에서 보이는 레벨 목록 */}
          <div className="grid grid-cols-5 gap-2 md:hidden">
            {Array.from({ length: totalLevels }, (_, i) => {
              const level = i + 1;
              const expRequired = LEVEL_EXP_REQUIREMENTS[i];
              const iconUrl = getLevelIconUrl(level);
              
              return (
                <div key={level} className={`flex flex-col items-center p-2 rounded-lg border text-center ${level === currentLevel ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                  <div className="relative w-6 h-6 mb-1">
                    <Image
                      src={iconUrl}
                      alt={`레벨 ${level} 아이콘`}
                      fill
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
          
          {/* PC 화면에서 보이는, 더 넓은 레벨 목록 */}
          <div className="hidden md:grid grid-cols-10 gap-2">
            {Array.from({ length: totalLevels }, (_, i) => {
              const level = i + 1;
              const expRequired = LEVEL_EXP_REQUIREMENTS[i];
              const iconUrl = getLevelIconUrl(level);
              
              return (
                <div key={level} className={`flex flex-col items-center p-2 rounded-lg border text-center ${level === currentLevel ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                  <div className="relative w-10 h-10 mb-1">
                    <Image
                      src={iconUrl}
                      alt={`레벨 ${level} 아이콘`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="font-medium text-sm">Lv.{level}</div>
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
  );
} 