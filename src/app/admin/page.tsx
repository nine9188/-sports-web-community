'use client';

import { Users, FileText, MessageSquare, Coins, TrendingUp } from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import { useAdminDashboard } from '@/domains/admin/hooks/useAdminDashboard';
import { StatCard } from '@/domains/admin/components/StatCard';

export default function AdminDashboard() {
  const { data: stats, isLoading, isError } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" className="mr-2" />
        <p className="text-gray-600 dark:text-gray-400">데이터 로딩 중...</p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-400">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="전체 회원"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
        />
        <StatCard
          title="전체 게시글"
          value={stats.totalPosts}
          icon={<FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
        />
        <StatCard
          title="전체 댓글"
          value={stats.totalComments}
          icon={<MessageSquare className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
        />
        <StatCard
          title="게시판 수"
          value={stats.totalBoards}
          icon={<FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
        />
      </div>

      {/* 관리자 기능 안내 */}
      <div className="bg-[#F5F5F5] dark:bg-[#262626] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F0F0F0] mb-6">
          관리자 기능 안내
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureItem
            icon={<Users className="h-6 w-6 text-gray-600 dark:text-gray-400" />}
            title="사용자 관리"
            description="사용자 계정을 검색하고 관리할 수 있습니다."
          />
          <FeatureItem
            icon={<FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />}
            title="게시판 관리"
            description="게시판을 생성, 수정하거나 권한을 설정할 수 있습니다."
          />
          <FeatureItem
            icon={<Coins className="h-6 w-6 text-gray-600 dark:text-gray-400" />}
            title="포인트 관리"
            description="사용자 포인트를 조정하고 내역을 확인할 수 있습니다."
          />
          <FeatureItem
            icon={<TrendingUp className="h-6 w-6 text-gray-600 dark:text-gray-400" />}
            title="경험치/레벨 관리"
            description="사용자의 경험치와 레벨을 조정할 수 있습니다."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start">
      <div className="mr-4 mt-1">{icon}</div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-[#F0F0F0]">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
}
