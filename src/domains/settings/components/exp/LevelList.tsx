'use client';

import React, { useState } from 'react';
import { LEVEL_EXP_REQUIREMENTS, getLevelIconUrl } from '@/shared/utils/level-icons';
import { ChevronDown, ChevronUp } from 'lucide-react';
import UserIcon from '@/shared/components/UserIcon';
import { Button, Container } from '@/shared/components/ui';

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
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <AccordionHeader
        isOpen={isOpen}
        onClick={toggleAccordion}
      />

      {isOpen && (
        <div className="p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
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
    </Container>
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
    <Button
      variant="header"
      onClick={onClick}
      className={`w-full px-4 py-3 h-auto flex items-center justify-between rounded-none border-b ${isOpen ? 'border-black/5 dark:border-white/10' : 'border-transparent'}`}
    >
      <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">레벨 및 아이콘 목록</h3>
      {isOpen ? (
        <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      )}
    </Button>
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
          />
        );
      })}
    </div>
  );
}

interface LevelItemProps {
  level: number;
  isCurrentLevel: boolean;
}

/**
 * 개별 레벨 아이템 컴포넌트
 */
function LevelItem({ level, isCurrentLevel }: LevelItemProps) {
  const expRequired = LEVEL_EXP_REQUIREMENTS[level - 1];
  const iconUrl = getLevelIconUrl(level);

  return (
    <div
      className={`
        flex flex-col items-center p-2 rounded-lg border text-center
        ${isCurrentLevel ? 'bg-[#EAEAEA] dark:bg-[#333333] border-black/15 dark:border-white/20' : 'bg-white dark:bg-[#1D1D1D] border-black/7 dark:border-white/10'}
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
      <div className="font-medium text-xs text-gray-900 dark:text-[#F0F0F0]">Lv.{level}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {expRequired.toLocaleString()}~
      </div>
    </div>
  );
}
