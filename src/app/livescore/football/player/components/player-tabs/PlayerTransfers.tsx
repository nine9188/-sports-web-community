'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';

interface Transfer {
  date: string;
  type: string;
  teams: {
    from: {
      id: number;
      name: string;
      logo: string;
    };
    to: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

interface PlayerTransfersProps {
  playerId: number;
  baseUrl?: string;
  transfersData?: Transfer[];
}

// 이적 유형 한글 매핑
const transferTypeMap: { [key: string]: string } = {
  'Loan': '임대',
  'Free': '자유 이적',
  'N/A': '정보 없음',
};

export default function PlayerTransfers({
  playerId,
  baseUrl = '',
  transfersData: initialTransfersData = []
}: PlayerTransfersProps) {
  const [transfersData, setTransfersData] = useState<Transfer[]>(initialTransfersData);
  const [loading, setLoading] = useState<boolean>(initialTransfersData.length === 0);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 이적 데이터 가져오기
  useEffect(() => {
    // 이미 데이터가 있으면 가져오지 않음
    if (initialTransfersData.length > 0) return;
    
    const fetchTransfersData = async () => {
      try {
        setLoading(true);
        
        // API 요청 URL 설정
        const apiUrl = baseUrl 
          ? `${baseUrl}/api/livescore/football/players/${playerId}/transfers` 
          : `/api/livescore/football/players/${playerId}/transfers`;
        
        const response = await fetch(apiUrl, { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('이적 정보를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setTransfersData(data || []);
      } catch (error) {
        console.error('이적 데이터 로딩 오류:', error);
        setError('이적 정보를 불러오는데 실패했습니다.');
        setTransfersData([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransfersData();
  }, [playerId, baseUrl, initialTransfersData.length]);

  // 이적료 포맷팅 함수
  const formatTransferType = (type: string) => {
    // 이적 유형이 매핑에 있는 경우 한글로 변환
    if (type in transferTypeMap) {
      return transferTypeMap[type];
    }
    // 그 외의 경우 (이적료가 있는 경우) 금액 표시
    return `${type}`;
  };
  
  if (loading) {
    return <div className="text-center py-8">이적 정보를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (transfersData.length === 0) return <div className="p-4">이적 기록이 없습니다.</div>;

  return (
    <div className="w-full">
      <div className="space-y-4">
        {transfersData.map((transfer, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-3">
            {/* 날짜 */}
            <div className="text-center mb-2">
              <span className="text-xs text-gray-600">
                {transfer.date ? format(new Date(transfer.date), 'yyyy년 MM월 dd일') : '날짜 정보 없음'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              {/* 이전 팀 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="relative w-16 h-16">
                  <Image
                    src={transfer.teams.from.logo}
                    alt={transfer.teams.from.name}
                    width={64}
                    height={64}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <p className="mt-1 text-xs font-medium text-center">{transfer.teams.from.name}</p>
              </div>

              {/* 이적 정보 */}
              <div className="flex-1 flex flex-col items-center px-2">
                <div className="flex items-center">
                  <svg 
                    className="w-5 h-5 text-gray-400" 
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
                <div className="mt-1 text-center">
                  <span className="text-base font-bold text-gray-900">
                    {formatTransferType(transfer.type)}
                  </span>
                </div>
              </div>

              {/* 새로운 팀 */}
              <div className="flex-1 flex flex-col items-center">
                <div className="relative w-16 h-16">
                  <Image
                    src={transfer.teams.to.logo}
                    alt={transfer.teams.to.name}
                    width={64}
                    height={64}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <p className="mt-1 text-xs font-medium text-center">{transfer.teams.to.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
