'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { endDeal } from '../../actions/hotdeal';

interface HotdealEndButtonProps {
  postId: string;
}

const END_REASONS = [
  { value: '품절', label: '품절' },
  { value: '마감', label: '마감' },
  { value: '가격변동', label: '가격 변동' },
  { value: '링크오류', label: '링크 오류' },
  { value: '기타', label: '기타' },
] as const;

/**
 * 핫딜 종료 버튼 및 모달
 * 작성자만 핫딜을 종료 처리할 수 있음
 */
export function HotdealEndButton({ postId }: HotdealEndButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('품절');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('종료 사유를 선택해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await endDeal({
        postId,
        reason: selectedReason as any,
      });

      if (result.success) {
        toast.success('핫딜이 종료되었습니다');
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || '핫딜 종료 처리에 실패했습니다');
      }
    } catch (error) {
      console.error('핫딜 종료 오류:', error);
      toast.error('핫딜 종료 처리 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 종료 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        종료 처리
      </button>

      {/* 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative bg-white dark:bg-[#1D1D1D] rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#F0F0F0] mb-4">
              핫딜 종료 처리
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              종료 사유를 선택해주세요. 종료 후에는 게시글 목록에서 "종료" 배지가 표시됩니다.
            </p>

            {/* 종료 사유 선택 */}
            <div className="space-y-2 mb-6">
              {END_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-black/5 dark:border-white/10 cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-red-600 dark:text-red-400"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-900 dark:text-[#F0F0F0]">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>

            {/* 버튼 그룹 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-900 dark:text-[#F0F0F0] bg-[#F5F5F5] dark:bg-[#262626] rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '처리 중...' : '종료 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
