'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, isSameDay, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  datesWithMatches?: Date[];
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  datesWithMatches = []
}: DateSelectorProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const toKst = (d: Date) => {
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 9 * 60 * 60 * 1000);
  };

  const normalizeDate = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // 선택된 날짜 중심으로 앞뒤 7일씩 총 15일 생성
  const dates = Array.from({ length: 15 }, (_, i) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (i - 7)); // -7 ~ +7
    return normalizeDate(date);
  });

  // KST 기준 오늘 날짜
  const today = normalizeDate(toKst(new Date()));
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // Embla Carousel 설정
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: false,
    dragFree: false,
    loop: false,
    skipSnaps: false
  });

  const handleDateClick = (date: Date) => {
    onDateChange(date);
  };

  const handlePrevMonth = () => {
    const newMonth = addMonths(currentMonth, -1);
    setCurrentMonth(newMonth);
    const firstDayOfPrevMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    onDateChange(firstDayOfPrevMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    const firstDayOfNextMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    onDateChange(firstDayOfNextMonth);
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // selectedDate가 변경되면 중앙으로 스크롤
  useEffect(() => {
    if (!emblaApi) return;

    const selectedIndex = dates.findIndex(date => isSameDay(date, selectedDate));
    if (selectedIndex !== -1) {
      // 선택된 날짜가 중앙(인덱스 7)이 되도록 스크롤
      const offset = selectedIndex - 3; // 7개 보이니까 4번째가 중앙
      emblaApi.scrollTo(offset >= 0 ? offset : 0, false);
    }
  }, [selectedDate, dates, emblaApi]);

  useEffect(() => {
    setCurrentMonth(selectedDate);
  }, [selectedDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: 'white' }}>
      {/* 월 표시 + 화살표 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 0 8px',
        gap: '8px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button
          onClick={handlePrevMonth}
          style={{
            padding: '4px',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronLeft size={20} color="black" />
        </button>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'black', minWidth: '100px', textAlign: 'center' }}>
          {format(currentMonth, 'yyyy M월', { locale: ko })}
        </span>
        <button
          onClick={handleNextMonth}
          style={{
            padding: '4px',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronRight size={20} color="black" />
        </button>
      </div>

      {/* 날짜 캐러셀 */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* PC용 좌측 버튼 */}
        <button
          onClick={scrollPrev}
          className="hidden md:flex"
          style={{
            position: 'absolute',
            left: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <ChevronLeft size={16} color="black" />
        </button>

        {/* Embla Carousel */}
        <div ref={emblaRef} style={{ overflow: 'hidden', padding: '12px 0', width: '100%' }}>
          <div style={{ display: 'flex', touchAction: 'pan-y', width: '100%' }}>
            {dates.map((date) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              const hasMatch = datesWithMatches.some(matchDate => isSameDay(matchDate, date));

              return (
                <div
                  key={date.toISOString()}
                  style={{
                    flex: '0 0 auto',
                    width: 'calc(100% / 7)',
                    minWidth: '60px'
                  }}
                >
                  <button
                    onClick={() => handleDateClick(date)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '12px 4px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                  {/* 요일 표시 */}
                  <div style={{
                    fontSize: '11px',
                    color: isSelected ? '#1f2937' : '#9ca3af',
                    fontWeight: isSelected ? '600' : '500'
                  }}>
                    {weekDays[date.getDay()]}
                  </div>

                  {/* 날짜 원 */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      fontSize: '15px',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      backgroundColor: isSelected ? '#1f2937' : isToday ? '#e5e7eb' : 'transparent',
                      color: isSelected ? 'white' : '#374151',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {format(date, 'd')}

                    {/* 파란 점 (경기 있는 날) - 날짜 아래에 표시 */}
                    {hasMatch && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'white' : '#3b82f6'
                      }} />
                    )}
                  </div>
                </button>
              </div>
              );
            })}
          </div>
        </div>

        {/* PC용 우측 버튼 */}
        <button
          onClick={scrollNext}
          className="hidden md:flex"
          style={{
            position: 'absolute',
            right: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <ChevronRight size={16} color="black" />
        </button>
      </div>
    </div>
  );
}
