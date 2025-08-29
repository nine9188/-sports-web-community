'use client';

import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const daysToShow = isMdUp ? 7 : 5;
  const middleIndex = Math.floor(daysToShow / 2);
  const normalizeDate = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const dates = Array.from({ length: daysToShow }, (_, i) => {
    const offsetFromMiddle = i - middleIndex;
    const date = addDays(selectedDate, offsetFromMiddle);
    const normalizedDate = normalizeDate(date);
    
    const today = normalizeDate(new Date());
    
    return {
      date: date,
      normalizedDate: normalizedDate,
      formattedDate: format(date, 'M월 d일', { locale: ko }),
      isSelected: normalizedDate.getTime() === normalizeDate(selectedDate).getTime(),
      isToday: normalizedDate.getTime() === today.getTime()
    };
  });

  const handleDateClick = (date: Date) => {
    onDateChange(date);
  };

  return (
    <div className="flex flex-1 h-full">
      {dates.map(({ date, formattedDate, isSelected, isToday }) => (
        <button
          key={date.toISOString()}
          onClick={() => handleDateClick(date)}
          className={`flex-1 h-full flex items-center justify-center text-center relative ${
            isSelected
              ? "text-blue-600 after:content-[''] after:block after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-blue-500"
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex flex-col items-center">
            {isToday ? (
              <>
                <span className="hidden md:block text-xs">{formattedDate}</span>
                <span className="text-xs text-blue-500">
                  <span className="block md:hidden">오늘</span>
                  <span className="hidden md:inline">(오늘)</span>
                </span>
              </>
            ) : (
              <span className="text-[11px] md:text-xs">{formattedDate}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
} 