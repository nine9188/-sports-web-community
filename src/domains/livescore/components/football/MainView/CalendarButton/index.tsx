'use client';

import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";

interface CalendarButtonProps {
  onDateChange: (date: Date) => void;
}

export default function CalendarButton({ onDateChange }: CalendarButtonProps) {
  const handleChange = (date: Date | null) => {
    if (!date) return;
    
    const utcDate = new Date(date);
    utcDate.setHours(0, 0, 0, 0);
    utcDate.setHours(utcDate.getHours() + 9);
    onDateChange(utcDate);
  };

  return (
    <DatePicker
      onChange={handleChange}
      customInput={
        <button className="h-full md:px-8 px-4 text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-colors">
          <Calendar className="h-5 w-5 md:h-6 md:w-6" />
          <span className="hidden md:inline">일정 보기</span>
        </button>
      }
      locale={ko}
      dateFormat="yyyy년 MM월 dd일"
      minDate={new Date(2024, 0, 1)}
      maxDate={new Date(2025, 11, 31)}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      popperClassName="z-50"
      popperPlacement="bottom-end"
    />
  );
} 