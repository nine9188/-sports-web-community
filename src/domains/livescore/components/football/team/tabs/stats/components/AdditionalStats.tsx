'use client';

import { TeamStatsData } from '@/domains/livescore/types/stats';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui/container';

interface AdditionalStatsProps {
  stats: TeamStatsData;
}

export default function AdditionalStats({ stats }: AdditionalStatsProps) {
  return (
    <Container>
      <ContainerHeader>
        <ContainerTitle>추가 통계</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {/* 페널티 통계 */}
          {stats.penalty && (
            <div className="border-b border-r md:border-b-0 md:border-r border-black/5 dark:border-white/10">
              <h3 className="text-xs font-bold p-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">페널티 통계</h3>
              <div className="p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">총 획득</span>
                <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{stats.penalty?.total || 0}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">성공</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {stats.penalty?.scored?.total || 0}개
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">실패</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {stats.penalty?.missed?.total || 0}개
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* 무득점 경기 */}
        {stats.failed_to_score && (
          <div className="border-b md:border-b-0 md:border-r border-black/5 dark:border-white/10">
            <h3 className="text-xs font-bold p-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">무득점 경기</h3>
            <div className="p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{stats.failed_to_score?.home || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">홈</p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{stats.failed_to_score?.away || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">원정</p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{stats.failed_to_score?.total || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">총 경기</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 연속 기록 */}
        {stats.biggest?.streak && (
          <div className="border-r md:border-r border-black/5 dark:border-white/10">
            <h3 className="text-xs font-bold p-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">연속 기록</h3>
            <div className="p-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{stats.biggest?.streak?.wins || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">연승</p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{stats.biggest?.streak?.draws || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">연속 무</p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900 dark:text-[#F0F0F0]">{stats.biggest?.streak?.loses || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">연패</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 최다 득실점 - 세로 배치 */}
        {stats.biggest?.wins && (
          <div>
            <h3 className="text-xs font-bold p-3 border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626] text-gray-900 dark:text-[#F0F0F0]">최다 득실점</h3>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {/* 최다 득점 */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">최다 득점</p>
                  <table className="w-full">
                    <tbody>
                      <tr className="h-8">
                        <td className="text-xs text-gray-500 dark:text-gray-400 text-left">홈</td>
                        <td className="text-base font-bold text-right text-gray-900 dark:text-[#F0F0F0]">{stats.biggest?.wins?.home || '-'}</td>
                      </tr>
                      <tr className="h-8">
                        <td className="text-xs text-gray-500 dark:text-gray-400 text-left">원정</td>
                        <td className="text-base font-bold text-right text-gray-900 dark:text-[#F0F0F0]">{stats.biggest?.wins?.away || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* 최다 실점 */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">최다 실점</p>
                  <table className="w-full">
                    <tbody>
                      <tr className="h-8">
                        <td className="text-xs text-gray-500 dark:text-gray-400 text-left">홈</td>
                        <td className="text-base font-bold text-right text-gray-900 dark:text-[#F0F0F0]">{stats.biggest?.loses?.home || '-'}</td>
                      </tr>
                      <tr className="h-8">
                        <td className="text-xs text-gray-500 dark:text-gray-400 text-left">원정</td>
                        <td className="text-base font-bold text-right text-gray-900 dark:text-[#F0F0F0]">{stats.biggest?.loses?.away || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </ContainerContent>
    </Container>
  );
} 