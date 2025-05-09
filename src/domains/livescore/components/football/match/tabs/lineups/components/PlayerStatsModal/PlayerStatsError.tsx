'use client';

interface PlayerStatsErrorProps {
  onClose: () => void;
  playerId: number;
  matchId: string;
  error: string;
  onRetry: () => void;
}

export default function PlayerStatsError({ onClose, playerId, matchId, error, onRetry }: PlayerStatsErrorProps) {
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
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-700">{error}</p>
        <p className="text-xs text-gray-500 mt-2">선수 ID: {playerId}, 매치 ID: {matchId}</p>
        <button 
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
} 