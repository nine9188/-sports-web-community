'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PeriodFilterProps {
  currentPeriod: string;
}

export default function PeriodFilter({ currentPeriod }: PeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const periods = [
    { value: 'today', label: '오늘' },
    { value: 'week', label: '이번 주' },
    { value: 'month', label: '이번 달' },
    { value: 'all', label: '전체' }
  ];

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period);
    params.set('page', '1'); // 기간 변경 시 첫 페이지로 이동
    router.push(`/boards/popular?${params.toString()}`);
  };

  return (
    <div className="overflow-hidden bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0">
      <div className="flex">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value)}
            className={`flex-1 h-12 text-xs px-1 transition-colors font-medium ${
              currentPeriod === period.value
                ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-slate-800 dark:border-white text-gray-900 dark:text-[#F0F0F0]'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400 hover:bg-[#EAEAEA] dark:hover:bg-[#333333]'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
