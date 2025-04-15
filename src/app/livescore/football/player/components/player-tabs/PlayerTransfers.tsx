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
    return (
      <div className="mb-4 bg-white rounded-lg">
        <div className="flex flex-col justify-center items-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-600 text-sm font-medium">이적 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 bg-white rounded-lg">
        <div className="flex flex-col justify-center items-center py-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-14 w-14 mx-auto text-red-500 mb-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">네트워크 연결을 확인하고 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  if (transfersData.length === 0) {
    return (
      <div className="mb-4 bg-white rounded-lg">
        <div className="text-center py-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">이적 기록이 없습니다</p>
        </div>
      </div>
    );
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
