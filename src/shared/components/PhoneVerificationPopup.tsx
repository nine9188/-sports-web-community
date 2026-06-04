'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, X } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface PhoneVerificationPopupProps {
  userId: string;
  phoneVerified: boolean;
}

export default function PhoneVerificationPopup({ userId, phoneVerified }: PhoneVerificationPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (phoneVerified) return;

    const dismissKey = `phone-verify-dismiss-${userId}`;
    const dismissed = localStorage.getItem(dismissKey);
    if (dismissed) {
      const dismissedDate = new Date(dismissed).toDateString();
      const today = new Date().toDateString();
      if (dismissedDate === today) return;
    }

    setIsVisible(true);
  }, [phoneVerified, userId]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleDismissToday = () => {
    localStorage.setItem(`phone-verify-dismiss-${userId}`, new Date().toISOString());
    setIsVisible(false);
  };

  const handleVerify = () => {
    setIsVisible(false);
    router.push('/settings/phone');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1D1D1D] rounded-xl shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors outline-none focus:outline-none"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0] mb-2">
            전화번호 인증이 필요합니다
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
            원활한 서비스 이용을 위해<br />
            전화번호 인증을 완료해주세요.
          </p>

          <div className="bg-gray-50 dark:bg-[#2D2D2D] rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">인증 완료 보상</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">500P</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">100EXP</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleVerify}
              className="w-full py-2.5 h-auto font-medium"
            >
              인증하러 가기
            </Button>
            <button
              onClick={handleDismissToday}
              className="w-full py-2.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              오늘 하루 안 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
