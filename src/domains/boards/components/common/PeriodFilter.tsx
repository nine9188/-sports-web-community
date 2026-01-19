'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Container } from '@/shared/components/ui';

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
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <div className="flex">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant={currentPeriod === period.value ? 'ghost' : 'secondary'}
            onClick={() => handlePeriodChange(period.value)}
            className={`flex-1 h-12 text-xs px-1 font-medium rounded-none ${
              currentPeriod === period.value
                ? 'bg-white dark:bg-[#1D1D1D] border-b-2 border-[#262626] dark:border-[#F0F0F0] text-gray-900 dark:text-[#F0F0F0] hover:bg-white dark:hover:bg-[#1D1D1D]'
                : 'bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-400'
            }`}
          >
            {period.label}
          </Button>
        ))}
      </div>
    </Container>
  );
}
