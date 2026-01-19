import Spinner from '@/shared/components/Spinner';
import { skeletonCard, skeletonHeader } from '@/shared/styles';

export default function LivescoreLoading() {
  return (
    <div className="container mx-auto">
      {/* 날짜 네비게이션 스켈레톤 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className="h-14 flex items-center justify-center gap-2 px-4">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="w-14 h-10 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* 리그/경기 목록 스켈레톤 */}
      <div className={skeletonCard}>
        <div className={skeletonHeader} />
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <span className="text-sm text-gray-500 dark:text-gray-400">경기 정보를 불러오는 중...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
