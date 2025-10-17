'use client';

import Image from 'next/image';
import { EmptyState } from '@/domains/livescore/components/common';
import { TrophyData } from '@/domains/livescore/types/player';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';

interface PlayerTrophiesProps {
  playerId: number;
  trophiesData?: TrophyData[];
}

export default function PlayerTrophies({ 
  trophiesData = [] 
}: PlayerTrophiesProps) {
  // 트로피 종류별 분류 및 집계
  const trophySummary = trophiesData.reduce((acc, trophy) => {
    if (trophy.place === '우승') {
      acc.champion++;
    } else if (trophy.place === '준우승') {
      acc.runnerUp++;
    } else {
      acc.other++;
    }
    return acc;
  }, { total: trophiesData.length, champion: 0, runnerUp: 0, other: 0 });
  
  // 트로피 아이콘 렌더링 함수
  const renderTrophyIcon = (place: string) => {
    if (place === '우승') {
      return (
        <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C8.7 15 6 12.3 6 9V1H18V9C18 12.3 15.3 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 3H3V6C3 7.7 4.3 9 6 9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 3H21V6C21 7.7 19.7 9 18 9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 21H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    } else if (place === '준우승') {
      return (
        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C8.7 15 6 12.3 6 9V1H18V9C18 12.3 15.3 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 3H3V6C3 7.7 4.3 9 6 9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 3H21V6C21 7.7 19.7 9 18 9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 21H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-6 h-6 bg-amber-700 rounded-full flex items-center justify-center text-white">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C8.7 15 6 12.3 6 9V1H18V9C18 12.3 15.3 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 21H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
  };
  
  if (trophiesData.length === 0) {
    return <EmptyState title="트로피 기록이 없습니다" message="이 선수의 트로피 기록 정보를 찾을 수 없습니다." />;
  }

  return (
    <div className="mb-4 bg-white rounded-lg border overflow-hidden">
      {/* 트로피 요약 정보 */}
      <div className="p-3 border-b bg-blue-50">
        <h3 className="text-sm font-semibold mb-2">트로피 통계</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-white rounded-lg border text-center">
            <p className="text-xs text-gray-600">총</p>
            <p className="text-lg font-bold">{trophySummary.total}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border text-center">
            <p className="text-xs text-gray-600">우승</p>
            <p className="text-lg font-bold text-yellow-500">{trophySummary.champion}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border text-center">
            <p className="text-xs text-gray-600">준우승</p>
            <p className="text-lg font-bold text-gray-500">{trophySummary.runnerUp}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border text-center">
            <p className="text-xs text-gray-600">기타</p>
            <p className="text-lg font-bold text-amber-700">{trophySummary.other}</p>
          </div>
        </div>
      </div>
      
      {/* 트로피 목록 */}
      <div className="p-3">
        <h3 className="text-sm font-semibold mb-2">트로피 목록</h3>
        <div className="space-y-3">
          {trophiesData.map((trophy, index) => (
            <div key={index} className="flex items-center p-2 bg-white rounded-lg border">
              <div className="mr-3">
                {renderTrophyIcon(trophy.place)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {trophy.leagueLogo && (
                    <div className="w-4 h-4 relative flex-shrink-0">
                      <Image
                        src={trophy.leagueLogo}
                        alt={trophy.league}
                        width={16}
                        height={16}
                        className="w-4 h-4 object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <p className="text-sm font-medium truncate">
                    {getLeagueKoreanName(trophy.league) || trophy.league}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{trophy.country}</span>
                  <span>•</span>
                  <span className="font-medium">{trophy.place}</span>
                  <span>•</span>
                  <span>{trophy.season}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 