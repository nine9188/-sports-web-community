'use client';

import { useState } from 'react';
import { ChevronsDown, ChevronsUp, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import Calendar from '@/shared/components/Calendar';
import { Button, Container } from '@/shared/components/ui';

interface NavigationBarProps {
  searchKeyword: string;
  showLiveOnly: boolean;
  liveMatchCount: number;
  onSearchChange: (value: string) => void;
  onLiveClick: () => void;
  onDateChange: (date: Date) => void;
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  selectedDate: Date;
}

export default function NavigationBar({
  searchKeyword,
  showLiveOnly,
  liveMatchCount,
  onSearchChange,
  onLiveClick,
  onDateChange,
  allExpanded,
  onToggleExpandAll,
  selectedDate,
}: NavigationBarProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleLiveClick = () => {
    onLiveClick();
  };

  const handlePrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    onDateChange(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formatDate = (date: Date) => {
    // KST 기준으로 오늘/내일/어제 판단
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstSelected = new Date(date.getTime() + 9 * 60 * 60 * 1000);

    // 날짜만 비교 (시간 제거)
    const todayStr = kstNow.toISOString().split('T')[0];
    const selectedStr = kstSelected.toISOString().split('T')[0];

    const today = new Date(todayStr);
    const selected = new Date(selectedStr);

    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '내일';
    } else if (diffDays === -1) {
      return '어제';
    }

    // 그 외의 날짜는 기존 포맷
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul'
    });
  };

  // 현재 연도 기준 동적 설정 (과거 2년 ~ 미래 1년)
  const currentYear = new Date().getFullYear();
  const minDate = new Date(currentYear - 2, 0, 1);
  const maxDate = new Date(currentYear + 1, 11, 31);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      {/* 헤더: 날짜 네비게이션 */}
      <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center justify-between border-b border-black/5 dark:border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevDay}
          className="h-8 w-8"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleToday}
            className="text-sm font-semibold h-auto px-2 py-1"
          >
            {formatDate(selectedDate)}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCalendar(true)}
            className="h-8 w-8"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextDay}
          className="h-8 w-8"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 캘린더 모달 */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCalendar(false)} />
          <div className="relative z-10">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={onDateChange}
              onClose={() => setShowCalendar(false)}
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>
        </div>
      )}

      {/* 본문: 검색 및 필터 */}
      <div className="p-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant={showLiveOnly ? 'primary' : 'secondary'}
            onClick={handleLiveClick}
            className="h-10 px-3 md:px-4 font-medium text-sm md:text-base"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                liveMatchCount > 0 ? 'animate-pulse bg-red-500' : 'bg-gray-400'
              }`} />
              LIVE
              {liveMatchCount > 0 && (
                <span className={`text-sm ${showLiveOnly ? 'text-red-400' : 'text-red-500'}`}>
                  ({liveMatchCount})
                </span>
              )}
            </div>
          </Button>

          <div className="flex-1">
            <input
              type="text"
              placeholder="경기 찾기"
              className="w-full h-10 px-3 md:px-4 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] focus:bg-[#EAEAEA] dark:focus:bg-[#333333] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-sm md:text-base"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleExpandAll}
            title={allExpanded ? '모두 닫기' : '모두 열기'}
          >
            {allExpanded ? (
              <ChevronsUp className="w-5 h-5" />
            ) : (
              <ChevronsDown className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </Container>
  );
} 