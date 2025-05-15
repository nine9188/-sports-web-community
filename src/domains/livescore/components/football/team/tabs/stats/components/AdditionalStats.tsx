'use client';

import { TeamStatsData } from '@/domains/livescore/types/stats';

interface AdditionalStatsProps {
  stats: TeamStatsData;
}

export default function AdditionalStats({ stats }: AdditionalStatsProps) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {/* 페널티 통계 */}
        {stats.penalty && (
          <div className="border-b md:border-b-0 md:border-r border-gray-200">
            <h3 className="text-sm font-medium p-3 border-b border-gray-200">페널티 통계</h3>
            <div className="p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">총 획득</span>
                <span className="font-medium">{stats.penalty?.total || 0}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">성공</span>
                <span className="font-medium text-green-600">
                  {stats.penalty?.scored?.total || 0}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">실패</span>
                <span className="font-medium text-red-600">
                  {stats.penalty?.missed?.total || 0}개
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* 무득점 경기 */}
        {stats.failed_to_score && (
          <div className="border-b md:border-b-0 md:border-r border-gray-200">
            <h3 className="text-sm font-medium p-3 border-b border-gray-200">무득점 경기</h3>
            <div className="p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold">{stats.failed_to_score?.home || 0}</p>
                <p className="text-xs text-gray-500">홈</p>
              </div>
              <div>
                <p className="text-base font-bold">{stats.failed_to_score?.away || 0}</p>
                <p className="text-xs text-gray-500">원정</p>
              </div>
              <div>
                <p className="text-base font-bold">{stats.failed_to_score?.total || 0}</p>
                <p className="text-xs text-gray-500">총 경기</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 연속 기록 */}
        {stats.biggest?.streak && (
          <div className="border-b md:border-b-0 md:border-r border-gray-200">
            <h3 className="text-sm font-medium p-3 border-b border-gray-200">연속 기록</h3>
            <div className="p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold">{stats.biggest?.streak?.wins || 0}</p>
                <p className="text-xs text-gray-500">연승</p>
              </div>
              <div>
                <p className="text-base font-bold">{stats.biggest?.streak?.draws || 0}</p>
                <p className="text-xs text-gray-500">연속 무</p>
              </div>
              <div>
                <p className="text-base font-bold">{stats.biggest?.streak?.loses || 0}</p>
                <p className="text-xs text-gray-500">연패</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 최다 득실점 - 세로 배치 */}
        {stats.biggest?.wins && (
          <div>
            <h3 className="text-sm font-medium p-3 border-b border-gray-200">최다 득실점</h3>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 최다 득점 */}
                <div>
                  <p className="text-xs text-gray-500 text-center mb-2">최다 득점</p>
                  <table className="w-full">
                    <tbody>
                      <tr className="h-8">
                        <td className="text-xs text-gray-500 text-left">홈</td>
                        <td className="text-base font-bold text-right">{stats.biggest?.wins?.home || '-'}</td>
                      </tr>
                      <tr className="h-8">
                        <td className="text-xs text-gray-500 text-left">원정</td>
                        <td className="text-base font-bold text-right">{stats.biggest?.wins?.away || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* 최다 실점 */}
                <div>
                  <p className="text-xs text-gray-500 text-center mb-2">최다 실점</p>
                  <table className="w-full">
                    <tbody>
                      <tr className="h-8">
                        <td className="text-xs text-gray-500 text-left">홈</td>
                        <td className="text-base font-bold text-right">{stats.biggest?.loses?.home || '-'}</td>
                      </tr>
                      <tr className="h-8">
                        <td className="text-xs text-gray-500 text-left">원정</td>
                        <td className="text-base font-bold text-right">{stats.biggest?.loses?.away || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 