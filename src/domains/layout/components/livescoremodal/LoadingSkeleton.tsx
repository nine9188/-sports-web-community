export default function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="flex items-center gap-2 text-gray-600">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <span className="text-sm">경기 정보 로딩중...</span>
      </div>
    </div>
  );
}
