import { skeletonCard, skeletonHeader, skeletonText } from '@/shared/styles';

export default function SettingsLoading() {
  return (
    <div className="container mx-auto max-w-2xl">
      {/* 설정 헤더 스켈레톤 */}
      <div className={`${skeletonCard} mb-4`}>
        <div className={skeletonHeader} />
      </div>

      {/* 설정 메뉴 스켈레톤 */}
      <div className={skeletonCard}>
        <div className="divide-y divide-black/5 dark:divide-white/10">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F5F5F5] dark:bg-[#262626] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-24`} />
                <div className={`${skeletonText} w-40 opacity-60`} />
              </div>
              <div className="w-6 h-6 bg-[#F5F5F5] dark:bg-[#262626] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
