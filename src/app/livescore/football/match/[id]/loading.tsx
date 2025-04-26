import MatchHeaderSkeleton from '../components/MatchHeaderSkeleton';

export default function Loading() {
  return (
    <div className="w-full">
      <MatchHeaderSkeleton />
      
      <div className="mb-4">
        <div className="bg-white rounded-lg border overflow-hidden flex sticky top-0 z-10">
          {['이벤트', '라인업', '통계', '순위'].map((tab, idx) => (
            <div key={idx} className="px-4 py-3 text-sm font-medium flex-1 animate-pulse bg-gray-200"></div>
          ))}
        </div>
      </div>
      
      <div className="mb-4 bg-white rounded-lg border p-4">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    </div>
  );
} 