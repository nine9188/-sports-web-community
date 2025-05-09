'use client';

interface NavigationBarProps {
  searchKeyword: string;
  showLiveOnly: boolean;
  liveMatchCount: number;  // 진행중인 경기 수
  onSearchChange: (value: string) => void;
  onLiveClick: () => void;  // LIVE 버튼 클릭 핸들러
  onDateChange: (date: Date) => void;  // 날짜 변경 props 추가
}

export default function NavigationBar({
  searchKeyword,
  showLiveOnly,
  liveMatchCount,
  onSearchChange,
  onLiveClick,
  onDateChange,
}: NavigationBarProps) {
  const handleLiveClick = () => {
    onLiveClick();
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <button
        onClick={handleLiveClick}
        className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors ${
          showLiveOnly
            ? 'border border-red-500 text-red-500 bg-red-50 hover:bg-red-100'
            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            liveMatchCount > 0 ? 'animate-pulse bg-red-500' : 'bg-gray-400'
          }`} />
          LIVE
          {liveMatchCount > 0 && (
            <span className="text-sm text-red-500">
              ({liveMatchCount})
            </span>
          )}
        </div>
      </button>

      <div className="flex-1">
        <input
          type="text"
          placeholder="경기 찾기"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
} 