'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { MultiDayMatchesResult } from '@/domains/livescore/actions/footballApi';
import LiveScoreContent from './LiveScoreContent';

interface LiveScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: MultiDayMatchesResult;
}

export default function LiveScoreModalClient({ isOpen, onClose, initialData }: LiveScoreModalProps) {
  // SSR 보호: 포털은 클라이언트 마운트 후에만 사용
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'yesterday' | 'today' | 'tomorrow'>('today');

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
            <FontAwesomeIcon icon={faFutbol} className="h-4 w-4 text-green-600" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-[#F0F0F0]">라이브스코어</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">최근 3일간 주요 경기</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-900 dark:text-[#F0F0F0]" />
          </button>
        </div>

        {/* 날짜 선택 탭 */}
        <div className="flex border-b border-black/7 dark:border-white/10">
          {[
            { key: 'yesterday', label: '어제' },
            { key: 'today', label: '오늘' },
            { key: 'tomorrow', label: '내일' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key as 'yesterday' | 'today' | 'tomorrow')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                selectedDate === key
                  ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-slate-800 dark:border-white text-gray-900 dark:text-[#F0F0F0]'
                  : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 경기 목록 */}
        <div className="flex-1 overflow-y-auto">
          <LiveScoreContent
            selectedDate={selectedDate}
            onClose={onClose}
            initialData={initialData}
          />
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-black/7 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] space-y-3">
          <Link
            href="/livescore/football"
            onClick={onClose}
            className="block w-full text-center py-2 px-4 bg-slate-800 dark:bg-[#3F3F3F] text-white hover:bg-slate-700 dark:hover:bg-[#4A4A4A] text-sm font-medium rounded-lg transition-colors"
          >
            전체 라이브스코어 보기
          </Link>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>최신 경기 정보</span>
          </div>
        </div>
      </div>
    </>
  );
}
