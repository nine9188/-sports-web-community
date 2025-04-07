'use client';

import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const convertToUTC = (date: Date) => {
    const utcDate = new Date(date);
    utcDate.setHours(0, 0, 0, 0);
    utcDate.setHours(utcDate.getHours() + 9);
    return utcDate;
  };

  const dates = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(subDays(selectedDate, 2), i);
    const utcDate = convertToUTC(date);
    const today = new Date();
    return {
      date: utcDate,
      formattedDate: format(date, 'M월 d일', { locale: ko }),
      isSelected: format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
      isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
    };
  });

  return (
    <div className="flex flex-1">
      {dates.map(({ date, formattedDate, isSelected, isToday }) => (
        <button
          key={date.toISOString()}
          onClick={() => onDateChange(date)}
          className={`flex-1 py-4 text-center border-b-2 ${
            isSelected
              ? 'border-blue-500 bg-gray-50 text-blue-600'
              : 'border-transparent hover:bg-gray-50 text-gray-700'
          }`}
        >
          <span className="text-xs">
            {formattedDate}
            {isToday && <span className="ml-1 text-xs text-blue-500">(오늘)</span>}
          </span>
        </button>
      ))}
    </div>
  );
} 