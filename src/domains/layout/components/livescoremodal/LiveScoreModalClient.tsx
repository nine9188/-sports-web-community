'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Circle } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchMultiDayMatches } from '@/domains/livescore/actions/footballApi';
import LiveScoreContent from './LiveScoreContent';
import KakaoAd from '@/shared/components/KakaoAd';
import { KAKAO } from '@/shared/constants/ad-constants';


interface LiveScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveScoreModalClient({ isOpen, onClose }: LiveScoreModalProps) {
  // SSR 보호: 포털은 클라이언트 마운트 후에만 사용
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'yesterday' | 'today' | 'tomorrow'>('today');

  // 모달이 열릴 때만 데이터 fetch (lazy loading)
  const { data: liveScoreData, isLoading } = useQuery({
    queryKey: ['multiDayMatches'],
    queryFn: () => fetchMultiDayMatches(),
    staleTime: 1000 * 60 * 5, // 5분 캐시
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = (newDate: 'yesterday' | 'today' | 'tomorrow') => {
    setSelectedDate(newDate);
  };

  if (!isMounted) return null;

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
              <h2 className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">라이브스코어</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">최근 3일간 주요 경기</p>
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
        <div className="flex border-b border-black/7 dark:border-white/10">
          {[
            { key: 'yesterday', label: '어제' },
            { key: 'today', label: '오늘' },
            { key: 'tomorrow', label: '내일' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant="ghost"
              onClick={() => handleTabChange(key as 'yesterday' | 'today' | 'tomorrow')}
              className={`flex-1 py-3 text-sm font-medium rounded-none h-auto ${
                selectedDate === key
                  ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0] text-gray-900 dark:text-[#F0F0F0]'
                  : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* 카카오 광고 - 모달 열릴 때만 렌더링 (같은 adUnit 충돌 방지) */}
        {isOpen && (
          <div className="flex justify-center py-2 border-b border-black/7 dark:border-white/10">
            <KakaoAd adUnit={KAKAO.MOBILE_BANNER} adWidth={320} adHeight={100} />
          </div>
        )}

        {/* 경기 목록 */}
        <div className="flex-1 overflow-y-auto">
          <LiveScoreContent
            selectedDate={selectedDate}
            onClose={onClose}
            initialData={liveScoreData}
          />
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] space-y-3">
          <Link
            href="/livescore/football"
            onClick={onClose}
            className="block w-full text-center py-2 px-4 bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] text-sm font-medium rounded-lg transition-colors"
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
