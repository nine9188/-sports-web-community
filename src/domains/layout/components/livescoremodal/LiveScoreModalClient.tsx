'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Circle } from 'lucide-react';
import { Button, TabList, type TabItem } from '@/shared/components/ui';
import { useVisibilityActivityRefresh } from '@/shared/hooks/useVisibilityActivityRefresh';
import Link from 'next/link';
import {
  fetchTodayMatches,
  fetchMatchesByDateLabel,
  type MatchData,
} from '@/domains/livescore/actions/footballApi';
import LiveScoreContent from './LiveScoreContent';
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';

type DateTab = 'yesterday' | 'today' | 'tomorrow';

const DATE_TABS: TabItem[] = [
  { id: 'yesterday', label: '어제' },
  { id: 'today', label: '오늘' },
  { id: 'tomorrow', label: '내일' },
];

interface LiveScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveScoreModalClient({ isOpen, onClose }: LiveScoreModalProps) {
  // SSR 보호: 포털은 클라이언트 마운트 후에만 사용
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateTab>('today');
  const [matchesByDate, setMatchesByDate] = useState<Partial<Record<DateTab, MatchData[]>>>({});
  const [loadingDate, setLoadingDate] = useState<DateTab | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || matchesByDate[selectedDate]) return;

    let cancelled = false;

    const loadMatches = async () => {
      setLoadingDate(selectedDate);

      try {
        const matches = selectedDate === 'today'
          ? (await fetchTodayMatches()).data?.today?.matches || []
          : (await fetchMatchesByDateLabel(selectedDate)).matches || [];

        if (!cancelled) {
          setMatchesByDate((prev) => ({ ...prev, [selectedDate]: matches }));
        }
      } catch (error) {
        console.error('[LiveScoreModal] failed to load matches:', error);

        if (!cancelled) {
          setMatchesByDate((prev) => ({ ...prev, [selectedDate]: [] }));
        }
      } finally {
        if (!cancelled) {
          setLoadingDate(null);
        }
      }
    };

    loadMatches();

    return () => {
      cancelled = true;
    };
  }, [isOpen, matchesByDate, selectedDate]);

  useVisibilityActivityRefresh({
    enabled: isOpen && selectedDate === 'today',
    intervalMs: 60_000,
    onRefresh: async () => {
      try {
        const matches = (await fetchTodayMatches()).data?.today?.matches || [];
        setMatchesByDate((prev) => ({ ...prev, today: matches }));
      } catch (error) {
        console.error('[LiveScoreModal] failed to refresh today matches:', error);
      }
    },
  });

  // 탭 변경 핸들러
  const handleTabChange = (newDate: DateTab) => {
    setSelectedDate(newDate);
  };

  // 선택된 날짜의 경기 데이터 + 로딩 상태
  const getSelectedMatches = () => {
    return {
      matches: matchesByDate[selectedDate] || [],
      isLoading: loadingDate === selectedDate || !matchesByDate[selectedDate],
    };
  };

  if (!isMounted) return null;

  const { matches: currentMatches, isLoading } = getSelectedMatches();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[999] md:hidden"
          onClick={onClose}
        />
      )}

      {/* 경기일정 모달 */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1D1D1D] transform transition-transform duration-300 ease-in-out z-[1000] md:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col`}>

        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-green-600 fill-green-600" />
            <div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-[#F0F0F0]">라이브스코어</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">주요 경기 일정</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-md h-9 w-9"
            aria-label="경기일정 닫기"
          >
            <X className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" aria-hidden="true" />
          </Button>
        </div>

        {/* 날짜 선택 탭 */}
        <TabList
          tabs={DATE_TABS}
          activeTab={selectedDate}
          onTabChange={(tabId) => handleTabChange(tabId as DateTab)}
          variant="contained"
          className="mb-0"
        />

        {/* 광고 + 경기 목록 (함께 스크롤) */}
        <div className="flex-1 overflow-y-auto">
          {/* 카카오 광고 - 모달 열릴 때만 렌더링 (같은 adUnit 충돌 방지) */}
          {isOpen && (
            <div className="flex justify-center py-2 border-b border-black/7 dark:border-white/10">
              <KakaoAd adUnit={KAKAO.MOBILE_SLIM_BANNER} adWidth={320} adHeight={50} />
            </div>
          )}

          {isLoading ? (
            <div className="p-4">
              <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg">
                <div className="px-4 py-8 text-center text-[13px] text-gray-500 dark:text-gray-400">
                  불러오는 중...
                </div>
              </div>
            </div>
          ) : (
            <LiveScoreContent
              selectedDate={selectedDate}
              onClose={onClose}
              matches={currentMatches}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] space-y-3">
          <Link
            href="/livescore/football"
            prefetch={false}
            onClick={onClose}
            className="block w-full text-center py-2 px-4 bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] text-[13px] font-medium rounded-lg transition-colors"
          >
            전체 라이브스코어 보기
          </Link>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>최신 경기 정보</span>
          </div>
        </div>
      </div>
    </>
  );
}
