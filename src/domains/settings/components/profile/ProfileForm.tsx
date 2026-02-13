'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Edit2, Ticket } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils/dateUtils';
import AttendanceCalendar from '@/shared/components/AttendanceCalendar';
import NicknameChangeModal from './NicknameChangeModal';
import ReferralSection from './ReferralSection';
import PhoneVerificationForm from '../phone/PhoneVerificationForm';
import { useNicknameTicketCount, useNicknameTicketCache } from '../../hooks/useProfileQueries';
import type { AttendanceData } from '@/shared/actions/attendance-actions';
import type { ReferralStats } from '@/shared/actions/referral-actions';

interface ProfileFormProps {
  initialData: {
    id: string;
    nickname: string | null;
    email: string | null;
    full_name: string | null;
    created_at?: string;
    last_sign_in_at?: string;
  };
  initialTicketCount?: number;
  initialAttendanceData?: AttendanceData | null;
  initialReferralStats?: ReferralStats | null;
  initialPhoneStatus?: { verified: boolean; phoneNumber?: string };
}

export default function ProfileForm({
  initialData,
  initialTicketCount,
  initialAttendanceData,
  initialReferralStats,
  initialPhoneStatus,
}: ProfileFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nickname, setNickname] = useState(initialData.nickname || '');

  // React Query로 티켓 개수 관리
  const { data: ticketCount = 0 } = useNicknameTicketCount(initialData.id, {
    initialData: initialTicketCount,
  });
  const { decrementTicketCount } = useNicknameTicketCache();

  const handleNicknameChange = (newNickname: string) => {
    setNickname(newNickname);
    decrementTicketCount(initialData.id);
  };

  return (
    <div className="space-y-4">
      {/* 이메일 필드 */}
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
          이메일
        </label>
        <input
          type="email"
          id="email"
          value={initialData.email || ''}
          disabled
          className="w-full px-3 py-2 border border-black/7 dark:border-white/10 bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] rounded-md shadow-sm cursor-not-allowed outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          이메일 주소는 로그인 및 계정 복구에 사용됩니다.
        </p>
      </div>

      {/* 실명 필드 */}
      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
          이름
        </label>
        <input
          type="text"
          id="full_name"
          value={initialData.full_name || ''}
          disabled
          className="w-full px-3 py-2 border border-black/7 dark:border-white/10 bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] rounded-md shadow-sm cursor-not-allowed outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          이름은 계정 복구 및 관리 용도로만 사용됩니다.
        </p>
      </div>

      {/* 닉네임 필드 */}
      <div className="space-y-1">
        <label htmlFor="nickname" className="block text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">
          닉네임
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            id="nickname"
            value={nickname}
            disabled
            className="flex-1 px-3 py-2 border border-black/7 dark:border-white/10 bg-[#EAEAEA] dark:bg-[#333333] text-gray-900 dark:text-[#F0F0F0] rounded-md shadow-sm cursor-not-allowed outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {ticketCount > 0 ? (
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <Edit2 className="h-4 w-4" />
              변경
            </Button>
          ) : (
            <Button
              asChild
              variant="secondary"
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <a href="/shop?category=special-items">
                <Ticket className="h-4 w-4" />
                구매
              </a>
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {ticketCount > 0
            ? `변경권 ${ticketCount}개 보유 중 - 클릭하여 닉네임을 변경할 수 있습니다.`
            : '샵에서 닉네임 변경권을 구매하면 변경할 수 있습니다.'
          }
        </p>
      </div>

      {/* 전화번호 인증 */}
      <div className="space-y-1 border-t border-black/5 dark:border-white/10 pt-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] mb-3">전화번호 인증</h3>
        <PhoneVerificationForm userId={initialData.id} initialStatus={initialPhoneStatus} />
      </div>

      {/* 계정 정보 */}
      <div className="space-y-3 border-t border-black/5 dark:border-white/10 pt-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">계정 정보</h3>

        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="mr-1 font-medium">가입일:</span>
          {formatDate(initialData.created_at) || '-'}
        </div>

        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span className="mr-1 font-medium">마지막 로그인:</span>
          {formatDate(initialData.last_sign_in_at) || '-'}
        </div>
      </div>

      {/* 출석 현황 캘린더 */}
      <AttendanceCalendar userId={initialData.id} variant="full" initialData={initialAttendanceData} />

      {/* 친구 추천 */}
      <ReferralSection userId={initialData.id} initialStats={initialReferralStats} />

      {/* 닉네임 변경 모달 */}
      <NicknameChangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentNickname={nickname}
        ticketCount={ticketCount}
        onSuccess={handleNicknameChange}
      />
    </div>
  );
} 