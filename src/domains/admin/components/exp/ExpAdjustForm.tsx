'use client';

import { Button } from '@/shared/components/ui';

interface ExpAdjustFormProps {
  expAmount: string;
  reason: string;
  isSubmitting: boolean;
  onExpAmountChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ExpAdjustForm({
  expAmount,
  reason,
  isSubmitting,
  onExpAmountChange,
  onReasonChange,
  onSubmit,
}: ExpAdjustFormProps) {
  const inputClassName =
    'w-full p-2 rounded-md bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-gray-400';

  return (
    <form onSubmit={onSubmit} className="mb-6">
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">경험치 조정</label>
          <div className="mt-1 relative rounded-md">
            <input
              type="number"
              value={expAmount}
              onChange={(e) => onExpAmountChange(e.target.value)}
              className={`${inputClassName} pr-12`}
              placeholder="0"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">EXP</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">양수(+)는 증가, 음수(-)는 차감입니다</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">사유</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className={inputClassName}
            placeholder="경험치 조정 사유"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '처리 중...' : '경험치 조정하기'}
      </Button>
    </form>
  );
}
