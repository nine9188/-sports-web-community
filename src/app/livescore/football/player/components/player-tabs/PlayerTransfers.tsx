'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { EmptyState } from '@/app/livescore/football/components/CommonComponents';
import { TransferData } from '@/app/livescore/football/player/types/player';

interface PlayerTransfersProps {
  playerId: number;
  transfersData?: TransferData[];
}

// 이적 유형 한글 매핑
const transferTypeMap: { [key: string]: string } = {
  'Loan': '임대',
  'Free': '자유 이적',
  'N/A': '정보 없음',
};

export default function PlayerTransfers({
  transfersData = []
}: PlayerTransfersProps) {
  // 이적료 포맷팅 함수
  const formatTransferType = (type: string) => {
    // 이적 유형이 매핑에 있는 경우 한글로 변환
    if (type in transferTypeMap) {
      return transferTypeMap[type];
    }
    // 그 외의 경우 (이적료가 있는 경우) 금액 표시
    return `${type}`;
  };
  
  if (transfersData.length === 0) {
    return <EmptyState title="이적 기록이 없습니다" message="이 선수의 이적 기록 정보를 찾을 수 없습니다." />;
  }

  return (
    <div className="mb-4 bg-white rounded-lg overflow-hidden">
      <div className="space-y-2">
        {transfersData.map((transfer, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
            {/* 날짜 - 상단에 배치 */}
            <div className="text-center mb-2 pb-1 border-b border-gray-200">
              <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                {transfer.date ? format(new Date(transfer.date), 'yyyy년 MM월 dd일') : '날짜 정보 없음'}
              </span>
            </div>

            <div className="flex items-center">
              {/* 이전 팀 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center p-1.5 overflow-hidden">
                  <Image
                    src={transfer.teams.from.logo || '/placeholder-team.png'}
                    alt={transfer.teams.from.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-team.png';
                    }}
                  />
                </div>
                <p className="mt-1 text-sm font-medium text-center text-gray-800 max-w-[120px] truncate">{transfer.teams.from.name}</p>
              </div>

              {/* 이적 정보 */}
              <div className="flex-1 flex flex-col items-center px-2">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                  <svg 
                    className="w-4 h-4 text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 8l4 4m0 0l-4 4m4-4H3" 
                    />
                  </svg>
                </div>
                <div className="mt-1 px-2 py-1 bg-gray-100 rounded-full text-center">
                  <span className="text-xs font-bold text-gray-800">
                    {formatTransferType(transfer.type)}
                  </span>
                </div>
              </div>

              {/* 새로운 팀 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center p-1.5 overflow-hidden">
                  <Image
                    src={transfer.teams.to.logo || '/placeholder-team.png'}
                    alt={transfer.teams.to.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-team.png';
                    }}
                  />
                </div>
                <p className="mt-1 text-sm font-medium text-center text-gray-800 max-w-[120px] truncate">{transfer.teams.to.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}