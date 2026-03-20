"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { type EmoticonPackInfo } from '@/domains/boards/actions/emoticons';
import EmoticonPackDetailContent from './EmoticonPackDetailContent';

interface DetailViewProps {
  packId: string;
  isMobile: boolean;
  onBack: () => void;
  onPurchase: (pack: EmoticonPackInfo) => void;
}

export default function DetailView({ packId, isMobile, onBack, onPurchase }: DetailViewProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* 툴바 */}
      <div className="flex items-center px-4 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] h-11 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F0F0F0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>돌아가기</span>
        </button>
      </div>

      {/* 공통 콘텐츠 */}
      <EmoticonPackDetailContent
        packId={packId}
        isMobile={isMobile}
        onPurchaseClick={onPurchase}
      />
    </div>
  );
}
