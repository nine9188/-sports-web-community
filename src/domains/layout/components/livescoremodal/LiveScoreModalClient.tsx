'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Clock, Trophy } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFutbol } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { MatchData, MultiDayMatchesResult } from '@/domains/livescore/actions/footballApi';
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

  if (!isOpen || !isMounted) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col`}>

        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faFutbol} className="h-4 w-4 text-green-600" />
            <div>
              <h2 className="text-sm font-semibold">라이브스코어</h2>
              <p className="text-xs text-gray-500">최근 3일간 주요 경기</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 날짜 선택 탭 */}
        <div className="flex border-b bg-gray-50">
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
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-600 hover:text-blue-600'
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
        <div className="p-4 border-t bg-gray-50 space-y-3">
          <Link
            href="/livescore/football"
            onClick={onClose}
            className="block w-full text-center py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            전체 라이브스코어 보기
          </Link>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>최신 경기 정보</span>
          </div>
        </div>
      </div>
    </div>,
    (document.body as Element)
  );
}
