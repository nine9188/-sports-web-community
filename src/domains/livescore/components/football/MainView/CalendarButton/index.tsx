'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, endOfMonth, getDay, addDays, subDays, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { fetchMonthMatchDates } from '../actions';
import "./calendar.css";

interface CalendarButtonProps {
  onDateChange: (date: Date) => void;
  datesWithMatches?: Date[]; // 경기가 있는 날짜 목록
  onMonthChange?: (year: number, month: number) => void; // 월 변경 콜백
}

type ViewMode = 'day' | 'month' | 'year';

export default function CalendarButton({ onDateChange, datesWithMatches = [], onMonthChange: _onMonthChange }: CalendarButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visibleDate, setVisibleDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [calendarMatchDates, setCalendarMatchDates] = useState<Date[]>([]); // 캘린더용 경기 날짜
  const [isLoadingDots, setIsLoadingDots] = useState(false); // 파란점 로딩 상태
  const loadedMonthsRef = useRef<Set<string>>(new Set()); // 로드된 월 추적 (YYYY-MM 형식)
  const modalRef = useRef<HTMLDivElement>(null);

  const minDate = new Date(2024, 0, 1);
  const maxDate = new Date(2025, 11, 31);

  // 캘린더가 열릴 때 외부에서 받은 datesWithMatches를 먼저 사용
  useEffect(() => {
    if (open) {
      setCalendarMatchDates(datesWithMatches);
      // 현재 선택된 달을 로드된 것으로 표시
      const currentKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
      loadedMonthsRef.current.add(currentKey);
    }
  }, [open, datesWithMatches, selectedDate]);

  // visibleDate의 월이 변경되면 현재/이전/다음 달 데이터를 함께 로드
  useEffect(() => {
    const loadThreeMonths = async () => {
      if (open && viewMode === 'day') {
        const year = visibleDate.getFullYear();
        const month = visibleDate.getMonth();

        // 이전 달, 현재 달, 다음 달 계산
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;

        // 각 달의 키 생성
        const prevKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
        const currentKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const nextKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`;

        // 현재 달이 없는 경우만 로딩 스피너 표시
        const needCurrentMonth = !loadedMonthsRef.current.has(currentKey);

        // 없는 달만 병렬로 로드
        const loadPromises: Promise<string[]>[] = [];
        const monthsToLoad: string[] = [];

        if (!loadedMonthsRef.current.has(prevKey)) {
          loadPromises.push(fetchMonthMatchDates(prevYear, prevMonth));
          monthsToLoad.push(prevKey);
        }

        if (needCurrentMonth) {
          loadPromises.push(fetchMonthMatchDates(year, month));
          monthsToLoad.push(currentKey);
        }

        if (!loadedMonthsRef.current.has(nextKey)) {
          loadPromises.push(fetchMonthMatchDates(nextYear, nextMonth));
          monthsToLoad.push(nextKey);
        }

        // 로드할 게 있으면 로드
        if (loadPromises.length > 0) {
          // 현재 달 데이터가 필요한 경우만 로딩 표시
          if (needCurrentMonth) {
            setIsLoadingDots(true);
          }

          try {
            const results = await Promise.all(loadPromises);

            // 로드된 월 표시
            monthsToLoad.forEach(key => loadedMonthsRef.current.add(key));

            // 모든 결과 합치기
            const allDateStrings = results.flat();
            if (allDateStrings.length > 0) {
              const matchDates = allDateStrings.map(dateStr => {
                const date = new Date(dateStr);
                date.setHours(0, 0, 0, 0);
                return date;
              });
              // 기존 데이터와 합침
              setCalendarMatchDates(prev => [...prev, ...matchDates]);
            }
          } catch (error) {
            console.error('Failed to load calendar match dates:', error);
          } finally {
            if (needCurrentMonth) {
              setIsLoadingDots(false);
            }
          }
        }
      }
    };

    loadThreeMonths();
  }, [visibleDate, open, viewMode]);

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
            <div className="h-12 flex items-center justify-between px-2 md:px-3 border-b relative">
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'day') {
                    const newDate = subMonths(visibleDate, 1);
                    setVisibleDate(newDate);
                    _onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
                  }
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
              
              <div className="flex items-center gap-2">
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
                {isLoadingDots && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'day') {
                    const newDate = addMonths(visibleDate, 1);
                    setVisibleDate(newDate);
                    _onMonthChange?.(newDate.getFullYear(), newDate.getMonth());
                  }
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
              {viewMode === 'day' && <DayGrid visibleDate={visibleDate} selectedDate={selectedDate} onDateSelect={setSelectedDate} minDate={minDate} maxDate={maxDate} datesWithMatches={calendarMatchDates} />}
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
function DayGrid({ visibleDate, selectedDate, onDateSelect, minDate, maxDate, datesWithMatches = [] }: {
  visibleDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate: Date;
  maxDate: Date;
  datesWithMatches?: Date[];
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
        const hasMatch = datesWithMatches.some(matchDate => isSameDay(matchDate, day));

        return (
          <button
            key={idx}
            onClick={() => !isDisabled && onDateSelect(day)}
            disabled={isDisabled}
            className={`
              h-8 flex flex-col items-center justify-center rounded text-sm transition-colors relative
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
            {/* 경기 있는 날 표시 (점) */}
            {hasMatch && (
              <div style={{
                position: 'absolute',
                top: '2px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: isSelected ? 'white' : '#3b82f6'
              }} />
            )}
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