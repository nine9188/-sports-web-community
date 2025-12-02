'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth, getDay, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
}

type ViewMode = 'day' | 'month' | 'year';

export default function Calendar({ selectedDate, onDateSelect, onClose, minDate, maxDate }: CalendarProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(selectedDate);
  const [visibleDate, setVisibleDate] = useState(selectedDate);
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const handleConfirm = () => {
    onDateSelect(internalSelectedDate);
    onClose();
  };

  const handleToday = () => {
    const today = new Date();
    setInternalSelectedDate(today);
    setVisibleDate(today);
    setViewMode('day');
  };

  return (
    <div className="w-[320px] sm:w-[360px] h-[360px] bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (viewMode === 'day') setVisibleDate(subMonths(visibleDate, 1));
            else if (viewMode === 'month') setVisibleDate(subYears(visibleDate, 1));
            else {
              const currentYearStart = Math.floor(visibleDate.getFullYear() / 12) * 12;
              setVisibleDate(new Date(currentYearStart - 12, 0, 1));
            }
          }}
          className="w-10 h-10 flex items-center justify-center hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors outline-none focus:outline-none"
        >
          <ChevronLeft className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0]" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (viewMode === 'day') setViewMode('month');
            else if (viewMode === 'month') setViewMode('year');
          }}
          className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-3 py-2 rounded transition-colors outline-none focus:outline-none"
        >
          {viewMode === 'day' && format(visibleDate, 'yyyy. M.', { locale: ko })}
          {viewMode === 'month' && format(visibleDate, 'yyyy', { locale: ko })}
          {viewMode === 'year' && (() => {
            const yearStart = Math.floor(visibleDate.getFullYear() / 12) * 12;
            return `${yearStart} ~ ${yearStart + 11}`;
          })()}
        </button>

        <button
          type="button"
          onClick={() => {
            if (viewMode === 'day') setVisibleDate(addMonths(visibleDate, 1));
            else if (viewMode === 'month') setVisibleDate(addYears(visibleDate, 1));
            else {
              const currentYearStart = Math.floor(visibleDate.getFullYear() / 12) * 12;
              setVisibleDate(new Date(currentYearStart + 12, 0, 1));
            }
          }}
          className="w-10 h-10 flex items-center justify-center hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors outline-none focus:outline-none"
        >
          <ChevronRight className="w-4 h-4 text-gray-900 dark:text-[#F0F0F0]" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-3 bg-white dark:bg-[#1D1D1D]">
        {viewMode === 'day' && (
          <DayGrid
            visibleDate={visibleDate}
            selectedDate={internalSelectedDate}
            onDateSelect={setInternalSelectedDate}
            minDate={minDate}
            maxDate={maxDate}
          />
        )}
        {viewMode === 'month' && (
          <MonthGrid
            visibleDate={visibleDate}
            selectedDate={internalSelectedDate}
            minDate={minDate}
            maxDate={maxDate}
            onMonthSelect={(month) => {
              setVisibleDate(month);
              setViewMode('day');
            }}
          />
        )}
        {viewMode === 'year' && (
          <YearGrid
            visibleDate={visibleDate}
            selectedDate={internalSelectedDate}
            minDate={minDate}
            maxDate={maxDate}
            onYearSelect={(year) => {
              setVisibleDate(year);
              setViewMode('month');
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="h-12 bg-[#F5F5F5] dark:bg-[#262626] px-3 flex items-center justify-between">
        <button
          onClick={handleToday}
          className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors outline-none focus:outline-none"
        >
          오늘
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors outline-none focus:outline-none"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-2 text-sm font-semibold bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] rounded transition-colors outline-none focus:outline-none"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

// DayGrid Component
function DayGrid({
  visibleDate,
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
}: {
  visibleDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}) {
  const monthStart = startOfMonth(visibleDate);
  const monthEnd = endOfMonth(visibleDate);
  const startWeekIndex = getDay(monthStart);
  const gridStart = subDays(monthStart, startWeekIndex);

  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="grid grid-cols-7 gap-1 h-full">
      {/* Weekday header */}
      {weekdays.map((day, idx) => (
        <div
          key={idx}
          className="h-6 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
        >
          {day}
        </div>
      ))}

      {/* Date cells */}
      {days.map((day, idx) => {
        const isCurrentMonth = day >= monthStart && day <= monthEnd;
        const isSelected = isSameDay(day, selectedDate);
        const isToday_ = isToday(day);
        const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate);

        return (
          <button
            key={idx}
            onClick={() => !isDisabled && onDateSelect(day)}
            disabled={isDisabled}
            className={`
              h-8 flex items-center justify-center rounded text-sm transition-colors outline-none focus:outline-none
              ${isSelected ? 'bg-slate-800 dark:bg-[#3F3F3F] text-white font-semibold' : ''}
              ${!isSelected && isToday_ ? 'ring-1 ring-slate-400 dark:ring-slate-500' : ''}
              ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-[#F0F0F0]'}
              ${!isSelected && !isDisabled ? 'hover:bg-[#F5F5F5] dark:hover:bg-[#262626]' : ''}
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            {day.getDate()}
          </button>
        );
      })}
    </div>
  );
}

// MonthGrid Component
function MonthGrid({
  visibleDate,
  selectedDate,
  minDate,
  maxDate,
  onMonthSelect,
}: {
  visibleDate: Date;
  selectedDate: Date;
  minDate?: Date;
  maxDate?: Date;
  onMonthSelect: (date: Date) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(visibleDate.getFullYear(), i, 1));

  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-2 h-full">
      {months.map((month, idx) => {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = endOfMonth(monthStart);
        const isDisabled = (minDate && monthEnd < minDate) || (maxDate && monthStart > maxDate);
        const isSelected = selectedDate.getFullYear() === month.getFullYear() && selectedDate.getMonth() === month.getMonth();

        return (
          <button
            key={idx}
            onClick={() => !isDisabled && onMonthSelect(month)}
            disabled={isDisabled}
            className={`
              h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-colors outline-none focus:outline-none
              ${isSelected ? 'bg-slate-800 dark:bg-[#3F3F3F] text-white' : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'}
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            {format(month, 'M월', { locale: ko })}
          </button>
        );
      })}
    </div>
  );
}

// YearGrid Component
function YearGrid({
  visibleDate,
  selectedDate,
  minDate,
  maxDate,
  onYearSelect,
}: {
  visibleDate: Date;
  selectedDate: Date;
  minDate?: Date;
  maxDate?: Date;
  onYearSelect: (date: Date) => void;
}) {
  const currentYear = visibleDate.getFullYear();
  const yearStart = Math.floor(currentYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => new Date(yearStart + i, 0, 1));

  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-2 h-full">
      {years.map((year, idx) => {
        const yStart = new Date(year.getFullYear(), 0, 1);
        const yEnd = new Date(year.getFullYear(), 11, 31);
        const isDisabled = (minDate && yEnd < minDate) || (maxDate && yStart > maxDate);
        const isSelected = selectedDate.getFullYear() === year.getFullYear();

        return (
          <button
            key={idx}
            onClick={() => !isDisabled && onYearSelect(year)}
            disabled={isDisabled}
            className={`
              h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-colors outline-none focus:outline-none
              ${isSelected ? 'bg-slate-800 dark:bg-[#3F3F3F] text-white' : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0] hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'}
              ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            {year.getFullYear()}
          </button>
        );
      })}
    </div>
  );
}
