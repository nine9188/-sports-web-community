'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth, getDay, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import "./calendar.css";

interface CalendarButtonProps {
  onDateChange: (date: Date) => void;
}

type ViewMode = 'day' | 'month' | 'year';

export default function CalendarButton({ onDateChange }: CalendarButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visibleDate, setVisibleDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const modalRef = useRef<HTMLDivElement>(null);

  const minDate = new Date(2024, 0, 1);
  const maxDate = new Date(2025, 11, 31);

  const handleConfirm = () => {
    onDateChange(selectedDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setVisibleDate(today);
    setViewMode('day');
  };

  // Modal size: 360x360 for desktop, 320x360 for mobile
  const modalSize = "w-[320px] sm:w-[360px] h-[360px]";

  return (
    <>
      <button
        onClick={() => {
          setViewMode('day');
          setVisibleDate(selectedDate);
          setOpen(true);
        }}
        className="h-10 flex items-center gap-2 px-3 md:px-4 rounded-lg font-medium text-sm md:text-base transition-colors border border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 md:h-6 md:w-6" />
        <span className="hidden md:inline">캘린더</span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
          <div 
            ref={modalRef}
            className={`${modalSize} bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col overflow-hidden relative z-10`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header - expanded touch targets */}
            <div className="h-12 flex items-center justify-between px-2 md:px-3 border-b">
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
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  if (viewMode === 'day') setViewMode('month');
                  else if (viewMode === 'month') setViewMode('year');
                }}
                className="font-semibold text-sm md:text-base hover:bg-gray-100 px-3 py-2 rounded"
                aria-live="polite"
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
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                  </div>

            {/* Body - flexible height */}
            <div className="flex-1 p-3">
              {viewMode === 'day' && <DayGrid visibleDate={visibleDate} selectedDate={selectedDate} onDateSelect={setSelectedDate} minDate={minDate} maxDate={maxDate} />}
              {viewMode === 'month' && (
                <MonthGrid
                  visibleDate={visibleDate}
                  selectedDate={selectedDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  onMonthSelect={(month) => { setVisibleDate(month); setViewMode('day'); }}
                />
              )}
              {viewMode === 'year' && (
                <YearGrid
                  visibleDate={visibleDate}
                  selectedDate={selectedDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  onYearSelect={(year) => { setVisibleDate(year); setViewMode('month'); }}
                />
              )}
                </div>

            {/* Footer - expanded touch targets */}
            <div className="h-12 flex items-center justify-between px-3 border-t">
              <button 
                onClick={handleToday}
                className="px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none"
              >
                오늘
              </button>
              <div className="flex gap-2">
                <button onClick={handleCancel} className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none">취소</button>
                <button onClick={handleConfirm} className="px-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 focus:outline-none">확인</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// DayGrid Component
function DayGrid({ visibleDate, selectedDate, onDateSelect, minDate, maxDate }: {
  visibleDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
}) {
  const monthStart = startOfMonth(visibleDate);
  const monthEnd = endOfMonth(visibleDate);
  const startWeekIndex = getDay(monthStart); // 0=Sunday, 6=Saturday
  
  // Calculate grid start (42 cells total)
  const gridStart = subDays(monthStart, startWeekIndex);
  
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  
  // Grid calculations: innerW = 336(360-24), innerH = 276(360-40-8-36)
  // DayGrid available height = 276 - 24(weekday header) - 8(gap) = 244px
  // Cell size = min((336-24)/7, (244-20)/6) = min(44.5, 37.3) = 37px

  return (
    <div className="grid grid-cols-7 gap-1 h-full">
      {/* Weekday header - 24px height */}
      {weekdays.map((day, idx) => (
        <div key={idx} className="h-6 flex items-center justify-center text-xs text-gray-500 font-medium">
          {day}
        </div>
      ))}
      
      {/* Date cells */}
      {days.map((day, idx) => {
        const isCurrentMonth = day >= monthStart && day <= monthEnd;
        const isSelected = isSameDay(day, selectedDate);
        const isToday_ = isToday(day);
        const isDisabled = day < minDate || day > maxDate;
        
        return (
          <button
            key={idx}
            onClick={() => !isDisabled && onDateSelect(day)}
            disabled={isDisabled}
            className={`
              h-8 flex items-center justify-center rounded text-sm transition-colors
              ${isSelected ? 'bg-blue-600 text-white font-medium' : ''}
              ${!isSelected && isToday_ ? 'ring-1 ring-blue-400' : ''}
              ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
              ${!isSelected && !isDisabled ? 'hover:bg-gray-100' : ''}
            `}
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            aria-current={isToday_ ? 'date' : undefined}
            role="gridcell"
          >
            {day.getDate()}
          </button>
        );
      })}
    </div>
  );
}

// MonthGrid Component  
function MonthGrid({ visibleDate, selectedDate, minDate, maxDate, onMonthSelect }: {
  visibleDate: Date;
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  onMonthSelect: (date: Date) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(visibleDate.getFullYear(), i, 1));
  
  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-2 h-full p-2" role="grid">
      {months.map((month, idx) => (
        (() => {
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          const monthEnd = endOfMonth(monthStart);
          const isDisabled = monthEnd < minDate || monthStart > maxDate;
          const isSelected = selectedDate.getFullYear() === month.getFullYear() && selectedDate.getMonth() === month.getMonth();
          return (
            <button
              key={idx}
              onClick={() => !isDisabled && onMonthSelect(month)}
              disabled={isDisabled}
              className={`h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                ${isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}
                ${isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
              `}
              role="gridcell"
              aria-disabled={isDisabled}
            >
              {format(month, 'M월', { locale: ko })}
            </button>
          );
        })()
      ))}
    </div>
  );
}

// YearGrid Component
function YearGrid({ visibleDate, selectedDate, minDate, maxDate, onYearSelect }: {
  visibleDate: Date;
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  onYearSelect: (date: Date) => void;
}) {
  const currentYear = visibleDate.getFullYear();
  const yearStart = Math.floor(currentYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => new Date(yearStart + i, 0, 1));
  
  return (
    <div className="grid grid-cols-4 grid-rows-3 gap-2 h-full p-2" role="grid">
      {years.map((year, idx) => (
        (() => {
          const yStart = new Date(year.getFullYear(), 0, 1);
          const yEnd = new Date(year.getFullYear(), 11, 31);
          const isDisabled = yEnd < minDate || yStart > maxDate;
          const isSelected = selectedDate.getFullYear() === year.getFullYear();
          return (
            <button
              key={idx}
              onClick={() => !isDisabled && onYearSelect(year)}
              disabled={isDisabled}
              className={`h-12 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                ${isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}
                ${isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
              `}
              role="gridcell"
              aria-disabled={isDisabled}
            >
              {year.getFullYear()}
            </button>
          );
        })()
      ))}
    </div>
  );
}