'use client';

interface PlayerStatsLoadingProps {
  onClose: () => void;
  playerId: number;
}

export default function PlayerStatsLoading({ onClose, playerId }: PlayerStatsLoadingProps) {
  return (
    <div className="bg-white rounded-xl w-full max-w-md p-6 text-center">
      <div className="flex justify-end">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">선수 통계를 불러오는 중...</p>
        <p className="text-xs text-gray-500 mt-2">선수 ID: {playerId}</p>
      </div>
    </div>
  );
} 