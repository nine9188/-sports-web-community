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
    <div className="flex items-center gap-2 md:gap-4 py-2 px-0 border-b">
      <button
        onClick={handleLiveClick}
        className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded font-medium ${
          showLiveOnly
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            liveMatchCount > 0 ? 'animate-pulse bg-red-500' : 'bg-gray-400'
          }`} />
          LIVE
          {liveMatchCount > 0 && (
            <span className={`text-sm ${showLiveOnly ? 'text-white' : 'text-red-500'}`}>
              ({liveMatchCount})
            </span>
          )}
        </div>
      </button>

      <div className="flex-1">
        <input
          type="text"
          placeholder="경기 찾기"
          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded border border-gray-200"
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
} 