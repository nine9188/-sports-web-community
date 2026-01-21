'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowser } from '@/shared/lib/supabase';
import { toast } from 'react-toastify';
import { Award } from 'lucide-react';
import { calculateLevelFromExp } from '@/shared/utils/level-icons';
import { getExpHistory } from '@/shared/actions/admin-actions';
import {
  ExpInfoCard,
  ExpAdjustForm,
  ExpHistoryTable,
  type ExpManagerProps,
  type ExpHistoryItem,
} from '@/domains/admin/components/exp';

const ITEMS_PER_PAGE = 5;

export default function ExpManager({ adminUser, selectedUser, onRefreshData, onSelectUser }: ExpManagerProps) {
  const [expAmountInput, setExpAmountInput] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expHistory, setExpHistory] = useState<ExpHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 페이지네이션 계산
  const totalPages = Math.ceil(expHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = expHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // 사용자 선택 시 내역 불러오기
  useEffect(() => {
    if (selectedUser) {
      setCurrentPage(1);
      fetchExpHistory(selectedUser.id);
    }
  }, [selectedUser]);

  // 경험치 내역 조회 함수
  const fetchExpHistory = async (userId: string) => {
    try {
      setLoadingHistory(true);

      const result = await getExpHistory(50);

      if (result.success && result.history) {
        const userHistory = result.history.filter((item) => item.userId === userId);
        setExpHistory(
          userHistory.map((item) => ({
            id: item.id,
            user_id: item.userId,
            exp: item.exp,
            reason: item.reason,
            created_at: item.createdAt,
          }))
        );
      } else {
        console.error('경험치 내역 조회 실패:', result.error);
        setExpHistory([]);
      }
    } catch (error) {
      console.error('경험치 내역 조회 중 오류:', error);
      setExpHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 경험치 조정 함수
  const handleAdjustExp = async (e: React.FormEvent) => {
    e.preventDefault();

    const expAmount = parseInt(expAmountInput, 10);

    if (!selectedUser) {
      toast.error('사용자를 선택해주세요.');
      return;
    }

    if (isNaN(expAmount) || expAmountInput === '') {
      toast.error('유효한 경험치 금액을 입력해주세요.');
      return;
    }

    if (!reason) {
      toast.error('사유를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const supabase = getSupabaseBrowser();

      const userExp = selectedUser.exp || 0;
      let updatedExp = 0;
      let updatedLevel = 1;

      try {
        const { error } = await supabase.rpc('admin_adjust_exp', {
          admin_id: adminUser?.id || '',
          target_user_id: selectedUser.id,
          exp_amount: expAmount,
          reason_text: reason,
        });

        if (error) throw error;

        const { data: updatedUserData, error: fetchError } = await supabase
          .from('profiles')
          .select('id, nickname, exp, level')
          .eq('id', selectedUser.id)
          .single();

        if (fetchError) {
          updatedExp = Math.max(0, userExp + expAmount);
          updatedLevel = calculateLevelFromExp(updatedExp);
        } else {
          updatedExp = updatedUserData.exp || 0;
          updatedLevel = updatedUserData.level || 1;
        }
      } catch {
        updatedExp = Math.max(0, userExp + expAmount);
        updatedLevel = calculateLevelFromExp(updatedExp);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            exp: updatedExp,
            level: updatedLevel,
          })
          .eq('id', selectedUser.id);

        if (updateError) throw updateError;

        try {
          const { error: historyError } = await supabase.from('exp_history').insert({
            user_id: selectedUser.id,
            exp: expAmount,
            reason: reason,
          });

          if (historyError) {
            console.error('경험치 기록 실패:', historyError);
          }
        } catch {
          console.error('경험치 기록 예외 발생');
        }
      }

      toast.success(`${selectedUser.nickname}님의 경험치가 ${expAmount > 0 ? '증가' : '차감'}되었습니다.`);

      setExpAmountInput('');
      setReason('');

      const updatedUser = {
        ...selectedUser,
        exp: updatedExp,
        level: updatedLevel,
      };

      if (typeof onSelectUser === 'function') {
        onSelectUser(updatedUser);
      }

      onRefreshData();
      fetchExpHistory(selectedUser.id);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`경험치 조정 실패: ${error.message}`);
      } else {
        toast.error('경험치 조정에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 선택된 사용자가 없는 경우
  if (!selectedUser) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Award className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">좌측에서 사용자를 선택하세요</p>
        </div>
      </div>
    );
  }

  const previewExpAmount = expAmountInput ? parseInt(expAmountInput, 10) : undefined;

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6 h-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-2">
          {selectedUser.nickname || '사용자'}님의 경험치 관리
        </h2>

        {/* 경험치 정보 표시 */}
        <ExpInfoCard user={selectedUser} previewExpAmount={previewExpAmount} />

        {/* 경험치 조정 폼 */}
        <ExpAdjustForm
          expAmount={expAmountInput}
          reason={reason}
          isSubmitting={isSubmitting}
          onExpAmountChange={setExpAmountInput}
          onReasonChange={setReason}
          onSubmit={handleAdjustExp}
        />

        {/* 경험치 내역 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-[#F0F0F0] mb-3">최근 경험치 내역</h3>
          <ExpHistoryTable
            history={paginatedHistory}
            currentPage={currentPage}
            totalPages={totalPages}
            isLoading={loadingHistory}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
