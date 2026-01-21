'use client';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  suffix?: string;
}

export function StatCard({ title, value, icon, suffix = '' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-[#F0F0F0] mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
        </div>
        <div className="p-3 rounded-full bg-[#F5F5F5] dark:bg-[#262626]">
          {icon}
        </div>
      </div>
    </div>
  );
}
