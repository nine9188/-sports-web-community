'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, Image, Activity } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import { StatCard } from '@/domains/admin/components/StatCard';
import { getMatchCacheStats } from '@/domains/admin/actions/cacheManagement';
import { getAssetCacheStats } from '@/domains/admin/actions/cacheManagement';
import { getApiUsageSummary } from '@/domains/admin/actions/cacheManagement';

interface CacheOverview {
  matchCache: { totalEntries: number; completeEntries: number; incompleteEntries: number };
  assetCache: { total: number; byStatus: Record<string, number> };
  apiUsage: { totalCalls: number; errors: number; remainingDaily: number | null };
}

export default function CacheManagementPage() {
  const [data, setData] = useState<CacheOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [matchStats, assetStats, apiStats] = await Promise.all([
        getMatchCacheStats(),
        getAssetCacheStats(),
        getApiUsageSummary(),
      ]);
      setData({
        matchCache: matchStats,
        assetCache: assetStats,
        apiUsage: apiStats,
      });
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const pages = [
    {
      href: '/admin/cache-management/matches',
      icon: <Database className="w-8 h-8 text-blue-500" />,
      title: '경기 캐시',
      stats: `${data.matchCache.totalEntries.toLocaleString()}건 (불완전: ${data.matchCache.incompleteEntries}건)`,
    },
    {
      href: '/admin/cache-management/assets',
      icon: <Image className="w-8 h-8 text-green-500" />,
      title: '이미지 캐시',
      stats: `${data.assetCache.total.toLocaleString()}건 (에러: ${data.assetCache.byStatus['error'] || 0}건)`,
    },
    {
      href: '/admin/cache-management/api-usage',
      icon: <Activity className="w-8 h-8 text-purple-500" />,
      title: 'API 사용량',
      stats: `오늘 ${data.apiUsage.totalCalls}회 (잔여: ${data.apiUsage.remainingDaily?.toLocaleString() || '확인 안 됨'})`,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-[#F0F0F0]">캐시 관리</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="경기 캐시"
          value={data.matchCache.totalEntries}
          icon={<Database className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
        />
        <StatCard
          title="이미지 캐시"
          value={data.assetCache.total}
          icon={<Image className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
        />
        <StatCard
          title="오늘 API 호출"
          value={data.apiUsage.totalCalls}
          icon={<Activity className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="block bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
          >
            <div className="flex items-center gap-4 mb-3">
              {page.icon}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">{page.title}</h3>
            </div>
            <p className="text-[13px] text-gray-600 dark:text-gray-400">{page.stats}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
