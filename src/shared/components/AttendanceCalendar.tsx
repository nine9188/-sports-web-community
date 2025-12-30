'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Gift, Calendar } from 'lucide-react';
import { getAttendanceData, type AttendanceData } from '@/shared/actions/attendance-actions';
import { CONSECUTIVE_LOGIN_BONUSES, ACTIVITY_REWARDS, ActivityTypes } from '@/shared/constants/rewards';

interface AttendanceCalendarProps {
  userId: string;
  variant?: 'full' | 'mini';
}

export default function AttendanceCalendar({ userId, variant = 'full' }: AttendanceCalendarProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // 출석 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getAttendanceData(userId, year, month);
        setAttendanceData(data);
      } catch (error) {
        console.error('출석 데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, year, month]);

  // 출석한 날짜 Set (날짜 형식 정규화)
  const attendedDates = useMemo(() => {
    if (!attendanceData?.loginHistory) return new Set<string>();
    return new Set(attendanceData.loginHistory.map(l => {
      // Supabase에서 반환되는 날짜를 YYYY-MM-DD 형식으로 정규화
      const dateStr = l.login_date;
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr.substring(0, 10); // 'YYYY-MM-DD' 형식 보장
    }));
  }, [attendanceData?.loginHistory]);

  // 이전 달로 이동
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = new Date(year, month, 1);
    if (nextMonth <= today) {
      setCurrentDate(nextMonth);
    }
  };

  // mini 버전 렌더링
  if (variant === 'mini') {
    return (
      <MiniCalendar
        attendanceData={attendanceData}
        attendedDates={attendedDates}
        isLoading={isLoading}
      />
    );
  }

  // full 버전 렌더링
  return (
    <FullCalendar
      year={year}
      month={month}
      attendanceData={attendanceData}
      attendedDates={attendedDates}
      isLoading={isLoading}
      onPrevMonth={goToPrevMonth}
      onNextMonth={goToNextMonth}
    />
  );
}

// Mini 버전 (모바일 사이드바용)
function MiniCalendar({
  attendanceData,
  attendedDates,
  isLoading,
}: {
  attendanceData: AttendanceData | null;
  attendedDates: Set<string>;
  isLoading: boolean;
}) {
  // 이번 주 날짜 계산 (월~일)
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      dates.push(date);
    }
    return dates;
  }, []);

  const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];
  const today = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg animate-pulse">
        <div className="h-16 bg-[#EAEAEA] dark:bg-[#333333] rounded" />
      </div>
    );
  }

  return (
    <div className="p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
      {/* 연속 출석 배지 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">출석 현황</span>
          {attendanceData?.todayAttended && (
            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-[10px] font-medium rounded">
              오늘 출석 완료
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <Gift className="h-3 w-3" />
          <span>{attendanceData?.consecutiveDays || 0}일 연속</span>
        </div>
      </div>

      {/* 이번 주 출석 */}
      <div className="flex gap-1">
        {weekDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const isAttended = attendedDates.has(dateStr);
          const isToday = dateStr === today;
          const isFuture = date > new Date();

          return (
            <div
              key={dateStr}
              className={`flex-1 flex flex-col items-center py-1.5 rounded ${
                isToday
                  ? 'bg-[#EAEAEA] dark:bg-[#3F3F3F]'
                  : ''
              }`}
            >
              <span className={`text-[10px] mb-1 ${
                isToday
                  ? 'text-slate-700 dark:text-white font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {dayLabels[index]}
              </span>
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${
                  isFuture
                    ? 'text-gray-300 dark:text-gray-600'
                    : isAttended
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : isToday
                        ? 'bg-slate-200 dark:bg-[#3F3F3F] text-slate-700 dark:text-white font-medium'
                        : 'bg-white dark:bg-[#1D1D1D] text-gray-500 dark:text-gray-400'
                }`}
              >
                {isAttended ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  date.getDate()
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 다음 보너스 안내 */}
      {attendanceData?.nextBonus && (
        <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
            {attendanceData.nextBonus.label}까지{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {attendanceData.nextBonus.daysRemaining}일
            </span>{' '}
            남음
          </p>
        </div>
      )}
    </div>
  );
}

// Full 버전 (PC 프로필 페이지용)
function FullCalendar({
  year,
  month,
  attendanceData,
  attendedDates,
  isLoading,
  onPrevMonth,
  onNextMonth,
}: {
  year: number;
  month: number;
  attendanceData: AttendanceData | null;
  attendedDates: Set<string>;
  isLoading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const canGoNext = !isCurrentMonth;

  // 달력 날짜 계산
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];

    // 이전 달 빈 칸
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // 현재 달 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="border-t border-black/5 dark:border-white/10 pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">출석 현황</h3>
        <div className="flex items-center gap-1 text-xs">
          <Gift className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          <span className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">{attendanceData?.consecutiveDays || 0}일</span> 연속 출석
          </span>
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onPrevMonth}
          className="p-1 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
          {year}년 {month}월
        </span>
        <button
          onClick={onNextMonth}
          disabled={!canGoNext}
          className={`p-1 rounded transition-colors ${
            canGoNext
              ? 'hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((label, index) => (
          <div
            key={label}
            className={`text-center text-xs py-1 ${
              index === 0
                ? 'text-red-500 dark:text-red-400'
                : index === 6
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 달력 본체 */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isAttended = attendedDates.has(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = new Date(dateStr) > today;
            const dayOfWeek = (index) % 7;

            return (
              <div
                key={dateStr}
                className={`aspect-square flex items-center justify-center rounded text-xs ${
                  isAttended
                    ? isToday
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-2 border-green-500 dark:border-green-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : isToday
                      ? 'bg-[#EAEAEA] dark:bg-[#333333]'
                      : isFuture
                        ? 'bg-[#F5F5F5]/50 dark:bg-[#262626]/30'
                        : 'bg-[#F5F5F5] dark:bg-[#262626]'
                }`}
              >
                {isAttended ? (
                  <div className="flex flex-col items-center">
                    <Check className="h-4 w-4 text-green-800 dark:text-green-400" />
                  </div>
                ) : (
                  <span
                    className={`${
                      isFuture
                        ? 'text-gray-300 dark:text-gray-600'
                        : dayOfWeek === 0
                          ? 'text-red-500 dark:text-red-400'
                          : dayOfWeek === 6
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 출석 보상 안내 */}
      <div className="mt-4 space-y-3">
        {/* 일일 출석 보상 */}
        <div className="p-2 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">일일 출석 보상</span>
            {attendanceData?.todayAttended && (
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-[10px] font-medium rounded">
                완료
              </span>
            )}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400">
            매일 접속 시 {ACTIVITY_REWARDS[ActivityTypes.DAILY_LOGIN].exp} XP + {ACTIVITY_REWARDS[ActivityTypes.DAILY_LOGIN].points} P 획득
          </div>
        </div>

        {/* 연속 출석 보너스 목록 */}
        <div className="p-2 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-xs font-medium text-gray-900 dark:text-[#F0F0F0]">연속 출석 보너스</span>
          </div>

          <div className="space-y-2">
            {CONSECUTIVE_LOGIN_BONUSES.map((bonus) => {
              const consecutiveDays = attendanceData?.consecutiveDays || 0;
              const isAchieved = consecutiveDays >= bonus.days;
              const isCurrent = !isAchieved && (
                CONSECUTIVE_LOGIN_BONUSES.findIndex(b => b.days === bonus.days) === 0 ||
                consecutiveDays >= CONSECUTIVE_LOGIN_BONUSES[CONSECUTIVE_LOGIN_BONUSES.findIndex(b => b.days === bonus.days) - 1]?.days
              );
              const progress = Math.min((consecutiveDays / bonus.days) * 100, 100);

              return (
                <div key={bonus.days} className="relative">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      {isAchieved ? (
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <div className={`w-3 h-3 rounded-full border ${
                          isCurrent
                            ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
                            : 'border-gray-300 dark:border-gray-600'
                        }`} />
                      )}
                      <span className={`${
                        isAchieved
                          ? 'text-green-700 dark:text-green-400 font-medium'
                          : isCurrent
                            ? 'text-gray-900 dark:text-[#F0F0F0] font-medium'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {bonus.label}
                      </span>
                    </div>
                    <span className={`${
                      isAchieved
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {bonus.exp} XP + {bonus.points} P
                    </span>
                  </div>

                  {/* 진행률 바 (현재 목표만 표시) */}
                  {isCurrent && !isAchieved && (
                    <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 dark:bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 현재 진행 상황 */}
          {attendanceData?.nextBonus && (
            <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 dark:text-gray-400">
                  다음 보너스까지
                </span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {attendanceData.nextBonus.daysRemaining}일 남음
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
