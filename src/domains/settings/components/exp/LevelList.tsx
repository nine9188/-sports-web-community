'use client';

import React, { useState } from 'react';
import { LEVEL_EXP_REQUIREMENTS, getLevelIconUrl } from '@/shared/utils/level-icons';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LevelListProps {
  currentLevel: number;
}

/**
 * 레벨 목록 컴포넌트
 * 사용자에게 각 레벨별 필요 경험치와 아이콘을 보여줍니다.
 */
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
      <AccordionHeader 
        isOpen={isOpen}
        onClick={toggleAccordion}
      />
      
      {isOpen && (
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            레벨별 필요 경험치와 아이콘을 확인하세요. 현재 레벨: <strong>Lv.{currentLevel}</strong>
          </p>
          
          <MobileLevelGrid 
            totalLevels={totalLevels} 
            currentLevel={currentLevel} 
          />
          
          <DesktopLevelGrid 
            totalLevels={totalLevels} 
            currentLevel={currentLevel} 
          />
        </div>
      )}
    </div>
  );
}

interface AccordionHeaderProps {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * 아코디언 헤더 컴포넌트
 */
function AccordionHeader({ isOpen, onClick }: AccordionHeaderProps) {
  return (
    <button 
      onClick={onClick}
      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-b focus:outline-none"
    >
      <h3 className="text-base font-medium text-gray-900">레벨 및 아이콘 목록</h3>
      {isOpen ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </button>
  );
}

interface LevelGridProps {
  totalLevels: number;
  currentLevel: number;
}

/**
 * 모바일용 레벨 그리드 컴포넌트
 */
function MobileLevelGrid({ totalLevels, currentLevel }: LevelGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2 md:hidden">
      {Array.from({ length: totalLevels }, (_, i) => {
        const level = i + 1;
        return (
          <LevelItem 
            key={level}
            level={level}
            isCurrentLevel={level === currentLevel}
            size="small"
          />
        );
      })}
    </div>
  );
}

/**
 * 데스크탑용 레벨 그리드 컴포넌트
 */
function DesktopLevelGrid({ totalLevels, currentLevel }: LevelGridProps) {
  return (
    <div className="hidden md:grid grid-cols-10 gap-2">
      {Array.from({ length: totalLevels }, (_, i) => {
        const level = i + 1;
        return (
          <LevelItem 
            key={level}
            level={level}
            isCurrentLevel={level === currentLevel}
            size="normal"
          />
        );
      })}
    </div>
  );
}

interface LevelItemProps {
  level: number;
  isCurrentLevel: boolean;
  size: 'small' | 'normal';
}

/**
 * 개별 레벨 아이템 컴포넌트
 */
function LevelItem({ level, isCurrentLevel, size }: LevelItemProps) {
  const expRequired = LEVEL_EXP_REQUIREMENTS[level - 1];
  const iconUrl = getLevelIconUrl(level);
  
  const iconSizeClass = size === 'small' ? 'w-6 h-6' : 'w-10 h-10';
  const fontSizeClass = size === 'small' ? 'text-xs' : 'text-sm';
  
  return (
    <div 
      className={`
        flex flex-col items-center p-2 rounded-lg border text-center
        ${isCurrentLevel ? 'bg-blue-50 border-blue-200' : 'bg-white'}
      `}
    >
      <div className={`relative ${iconSizeClass} mb-1`}>
        <Image
          src={iconUrl}
          alt={`레벨 ${level} 아이콘`}
          fill
          className="object-contain"
        />
      </div>
      <div className={`font-medium ${fontSizeClass}`}>Lv.{level}</div>
      <div className="text-xs text-gray-500">
        {expRequired.toLocaleString()}~
      </div>
    </div>
  );
} 