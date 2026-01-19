import Spinner from '@/shared/components/Spinner';

export default function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="flex items-center gap-2 text-gray-600">
        <Spinner size="sm" />
        <span className="text-sm">경기 정보 로딩중...</span>
      </div>
    </div>
  );
}
