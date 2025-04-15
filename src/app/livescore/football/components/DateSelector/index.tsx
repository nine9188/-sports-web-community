'use client';

import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const normalizeDate = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const dates = Array.from({ length: 5 }, (_, i) => {
    const offsetFromMiddle = i - 2;
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
    console.log('Selected date for API call:', format(date, 'yyyy-MM-dd'));
    onDateChange(date);
  };

  return (
    <div className="flex flex-1">
      {dates.map(({ date, formattedDate, isSelected, isToday }) => (
        <button
          key={date.toISOString()}
          onClick={() => handleDateClick(date)}
          className={`flex-1 py-3 text-center border-b-2 ${
            isSelected
              ? 'border-blue-500 bg-gray-50 text-blue-600'
              : 'border-transparent hover:bg-gray-50 text-gray-700'
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
              <span className="text-xs">{formattedDate}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
} 