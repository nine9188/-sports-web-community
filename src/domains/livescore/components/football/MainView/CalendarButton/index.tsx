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
    
    // 선택한 날짜를 로컬 기준으로 00:00 정규화만 수행 (타임존 보정 제거)
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    onDateChange(normalized);
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