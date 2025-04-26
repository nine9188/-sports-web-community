export default function MatchHeaderSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
      <div className="flex items-center gap-2 justify-between mb-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
        <div className="w-16 h-5 bg-gray-200 rounded"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="w-1/3 flex flex-col items-center">
          <div className="w-14 h-14 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 my-1">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-3 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="w-1/3 flex flex-col items-center">
          <div className="w-14 h-14 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
        </div>
      </div>
    </div>
  );
} 