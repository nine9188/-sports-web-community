'use client';

import { useRef, useEffect, useState } from 'react';
import { format, isSameDay, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  const scrollRef = useRef<HTMLDivElement>(null);
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

  // 선택된 날짜 중심으로 앞뒤 3일씩 총 7일 생성
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (i - 3)); // -3, -2, -1, 0, 1, 2, 3
    return normalizeDate(date);
  });

  // KST 기준 오늘 날짜를 사용 (라이브스코어 기준 일자 맞춤)
  const today = normalizeDate(toKst(new Date()));
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const handleDateClick = (date: Date) => {
    onDateChange(date);
  };

  const handlePrevMonth = () => {
    const newMonth = addMonths(currentMonth, -1);
    setCurrentMonth(newMonth);
    // 이전 달의 1일로 날짜 변경
    const firstDayOfPrevMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    onDateChange(firstDayOfPrevMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    // 다음 달의 1일로 날짜 변경
    const firstDayOfNextMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    onDateChange(firstDayOfNextMonth);
  };

  useEffect(() => {
    // 선택된 날짜로 스크롤 중앙 정렬
    if (scrollRef.current) {
      const selectedIndex = dates.findIndex(date => isSameDay(date, selectedDate));
      if (selectedIndex !== -1) {
        const container = scrollRef.current;
        const button = container.children[selectedIndex] as HTMLElement;
        if (button) {
          const containerWidth = container.offsetWidth;
          const buttonLeft = button.offsetLeft;
          const buttonWidth = button.offsetWidth;
          container.scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        }
      }
    }
  }, [selectedDate, dates]);

  useEffect(() => {
    // 마우스 휠 세로 스크롤을 가로 스크롤로 변환
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as EventListener);
  }, []);

  useEffect(() => {
    // 드래그 스크롤 (마우스)
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    const onDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onLeaveUp = () => {
      isDown = false;
    };
    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = x - startX;
      el.scrollLeft = scrollLeft - walk;
    };
    el.addEventListener('mousedown', onDown);
    el.addEventListener('mouseleave', onLeaveUp);
    el.addEventListener('mouseup', onLeaveUp);
    el.addEventListener('mousemove', onMove);
    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mouseleave', onLeaveUp);
      el.removeEventListener('mouseup', onLeaveUp);
      el.removeEventListener('mousemove', onMove);
    };
  }, []);

  useEffect(() => {
    // selectedDate가 변경되면 currentMonth도 업데이트
    setCurrentMonth(selectedDate);
  }, [selectedDate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', backgroundColor: 'white' }}>
      {/* 월 표시 + 화살표 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 0',
        gap: '8px'
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'black' }}>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '4px 0',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {weekDays.map((day) => (
          <div key={day} style={{
            width: '14.28%',
            textAlign: 'center',
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 슬라이드 */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          padding: '12px 0',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const hasMatch = datesWithMatches.some(matchDate => isSameDay(matchDate, date));

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px',
                minWidth: '14.28%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {/* 파란 점 (경기 있는 날) */}
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

              {/* 날짜 원 */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  fontSize: '14px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  backgroundColor: isSelected ? '#1f2937' : isToday ? '#e5e7eb' : 'transparent',
                  color: isSelected ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {format(date, 'd')}
              </div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
