'use client';

import { useState } from 'react';
import { ChevronsDown, ChevronsUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  isNavigating?: boolean;
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
  isNavigating = false,
}: NavigationBarProps) {
  const [showCalendar, setShowCalendar] = useState(false);

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
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const kstSelected = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const todayStr = kstNow.toISOString().split('T')[0];
    const selectedStr = kstSelected.toISOString().split('T')[0];
    const today = new Date(todayStr);
    const selected = new Date(selectedStr);
    const diffDays = Math.round((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === -1) return '어제';

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul',
    });
  };

  const currentYear = new Date().getFullYear();
  const minDate = new Date(currentYear - 2, 0, 1);
  const maxDate = new Date(currentYear + 1, 11, 31);

  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-4 flex items-center justify-between border-b border-black/5 dark:border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevDay}
          disabled={isNavigating}
          className="h-8 w-8"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex min-w-[130px] items-center justify-center gap-2">
          <Button
            variant="ghost"
            onClick={handleToday}
            disabled={isNavigating}
            className="h-auto min-w-[92px] px-2 py-1 text-[13px] font-semibold"
          >
            {isNavigating ? '불러오는 중...' : formatDate(selectedDate)}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCalendar(true)}
            disabled={isNavigating}
            className="h-8 w-8"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextDay}
          disabled={isNavigating}
          className="h-8 w-8"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCalendar(false)} />
          <div className="relative z-10">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setShowCalendar(false);
                onDateChange(date);
              }}
              onClose={() => setShowCalendar(false)}
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant={showLiveOnly ? 'primary' : 'secondary'}
            onClick={onLiveClick}
            disabled={isNavigating}
            className="h-10 px-3 md:px-4 font-medium text-[13px] md:text-base"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                liveMatchCount > 0 ? 'animate-pulse bg-red-500' : 'bg-gray-400'
              }`} />
              LIVE
              {liveMatchCount > 0 && (
                <span className={`text-[13px] ${showLiveOnly ? 'text-red-400' : 'text-red-500'}`}>
                  ({liveMatchCount})
                </span>
              )}
            </div>
          </Button>

          <div className="flex-1">
            <input
              type="text"
              placeholder="경기 찾기"
              className="w-full h-10 px-3 md:px-4 rounded-lg bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] placeholder:text-gray-500 dark:placeholder:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] focus:bg-[#EAEAEA] dark:focus:bg-[#333333] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-[13px] md:text-base"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <Button
            variant="secondary"
            size="icon"
            onClick={onToggleExpandAll}
            title={allExpanded ? '모두 접기' : '모두 펼치기'}
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
