import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

export default function UserProfileLoading() {
  return (
    <main>
      {/* 프로필 헤더 */}
      <div className={skeletonCard}>
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* 프로필 이미지 */}
            <div className={`${skeletonBase} w-20 h-20 rounded-full`} />

            {/* 유저 정보 */}
            <div className="flex-1">
              <div className={`${skeletonBase} w-32 h-6 rounded mb-2`} />
              <div className="flex items-center gap-2 mb-2">
                <div className={`${skeletonBase} w-16 h-5 rounded`} />
                <div className={`${skeletonText} w-20`} />
              </div>
              <div className="flex items-center gap-4">
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonText} w-16`} />
                <div className={`${skeletonText} w-16`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className={`${skeletonCard} mt-0 md:mt-4 rounded-none md:rounded-lg`}>
        <div className="px-4 py-2.5 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-1">
            <div className={`${skeletonBase} w-20 h-8 rounded-md`} />
            <div className={`${skeletonBase} w-16 h-8 rounded-md`} />
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className={skeletonDivider}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-16 hidden sm:block`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center gap-2 py-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonBase} w-10 h-10 rounded`} />
          ))}
        </div>
      </div>
    </main>
  );
}
