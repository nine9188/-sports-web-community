import { skeletonBase, skeletonCard, skeletonText, skeletonDivider } from '@/shared/styles';

export default function HomeLoading() {
  return (
    <main className="space-y-4">
      {/* 게시판 바로가기 아이콘 (6개) */}
      <nav className="w-full grid grid-cols-6 gap-2 md:gap-3 max-md:bg-white max-md:dark:bg-[#1D1D1D] max-md:border max-md:border-black/7 max-md:dark:border-0 max-md:p-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col items-center md:flex-row md:justify-center gap-1 md:gap-0 md:bg-[#F5F5F5] md:dark:bg-[#262626] md:border md:border-black/7 md:dark:border-0 md:h-12 rounded-lg">
            {/* 모바일 아이콘 */}
            <div className={`${skeletonBase} w-12 h-12 rounded-lg md:hidden`} />
            {/* PC 아이콘 */}
            <div className={`${skeletonBase} hidden md:block w-5 h-5 rounded mr-1`} />
            <div className={`${skeletonText} w-8 md:w-12 mt-1 md:mt-0`} />
          </div>
        ))}
      </nav>

      {/* 라이브스코어 위젯 */}
      <div className={skeletonCard}>
        {/* 헤더 */}
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-24`} />
          <div className={`${skeletonText} w-16`} />
        </div>
        {/* 리그 헤더 */}
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className="flex items-center gap-3">
            <div className={`${skeletonBase} w-5 h-5 rounded-full`} />
            <div className={`${skeletonText} w-28`} />
          </div>
          <div className="flex items-center gap-3">
            <div className={`${skeletonBase} w-7 h-5 rounded-full`} />
            <div className={`${skeletonBase} w-4 h-4 rounded`} />
          </div>
        </div>
        {/* 경기 목록 */}
        <div className={skeletonDivider}>
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-12 px-4 flex items-center">
              <div className={`${skeletonBase} w-14 h-5 rounded`} />
              <div className="flex-1 flex items-center justify-center gap-2">
                <div className={`${skeletonText} w-20`} />
                <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                <div className={`${skeletonText} w-12`} />
                <div className={`${skeletonBase} w-6 h-6 rounded-full`} />
                <div className={`${skeletonText} w-20`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 게시판 모음 위젯 */}
      <div className={skeletonCard}>
        {/* 헤더 */}
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
          <div className={`${skeletonBase} w-4 h-4 rounded`} />
        </div>
        {/* 탭 네비게이션 */}
        <div className="px-4 py-2 flex gap-2 border-b border-black/5 dark:border-white/10">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className={`${skeletonBase} w-16 h-7 rounded-full`} />
          ))}
        </div>
        {/* 게시글 목록 */}
        <div className={skeletonDivider}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* 최신 게시글 위젯 */}
      <div className={skeletonCard}>
        {/* 헤더 */}
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-20`} />
          <div className={`${skeletonBase} w-5 h-5 rounded`} />
        </div>
        {/* 게시글 목록 */}
        <div className={skeletonDivider}>
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`${skeletonText} w-14`} />
              <div className={`${skeletonText} flex-1`} />
              <div className={`${skeletonText} w-16 hidden sm:block`} />
              <div className={`${skeletonText} w-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* 뉴스 위젯 */}
      <div className={skeletonCard}>
        {/* 헤더 */}
        <div className="h-12 px-4 flex items-center justify-between bg-[#F5F5F5] dark:bg-[#262626]">
          <div className={`${skeletonText} w-12`} />
          <div className={`${skeletonBase} w-5 h-5 rounded`} />
        </div>
        {/* 탭 */}
        <div className="px-4 py-2 flex gap-2 border-b border-black/5 dark:border-white/10">
          <div className={`${skeletonBase} w-16 h-7 rounded-full`} />
          <div className={`${skeletonBase} w-16 h-7 rounded-full`} />
        </div>
        {/* 뉴스 목록 */}
        <div className="p-4 space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className={`${skeletonBase} w-20 h-14 rounded flex-shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className={`${skeletonText} w-full`} />
                <div className={`${skeletonText} w-3/4`} />
                <div className={`${skeletonText} w-16 opacity-60`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
