'use client';

import { TeamStatsData } from '@/domains/livescore/types/stats';
import { Container, ContainerContent } from '@/shared/components/ui/container';

interface AdditionalStatsProps {
  stats: TeamStatsData;
}

export default function AdditionalStats({ stats }: AdditionalStatsProps) {
  return (
    <div className="space-y-4 mb-4">
      {/* 페널티 & 무득점 경기 */}
      <Container>
        {/* 메인 헤더 - 반으로 나눔 */}
        <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
            페널티 통계
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-300 dark:bg-gray-500" />
          </div>
          <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
            무득점 경기
          </div>
        </div>
        <ContainerContent className="!p-0">
          {/* 소제목 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 flex">
              {['총획득', '성공', '실패'].map((label) => (
                <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
              ))}
            </div>
            <div className="flex-1 flex">
              {['홈', '원정', '총경기'].map((label) => (
                <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
              ))}
            </div>
          </div>
          {/* 데이터 */}
          <div className="flex items-center py-3">
            <div className="flex-1 flex">
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.penalty?.total || 0}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.penalty?.scored?.total || 0}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.penalty?.missed?.total || 0}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-300 dark:bg-gray-500" />
              </div>
            </div>
            <div className="flex-1 flex">
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.failed_to_score?.home || 0}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.failed_to_score?.away || 0}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                {stats.failed_to_score?.total || 0}
              </div>
            </div>
          </div>
        </ContainerContent>
      </Container>

      {/* 연속 기록 & 최다 득실점 */}
      <Container>
        {/* 메인 헤더 - 반으로 나눔 */}
        <div className="flex h-12 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
            연속 기록
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-300 dark:bg-gray-500" />
          </div>
          <div className="flex-1 px-4 flex items-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
            최다 득실점
          </div>
        </div>
        <ContainerContent className="!p-0">
          {/* 소제목 */}
          <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 flex">
              {['연승', '연무', '연패'].map((label) => (
                <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
              ))}
            </div>
            <div className="flex-1 flex">
              {['득점(H)', '득점(A)', '실점(H)', '실점(A)'].map((label) => (
                <div key={label} className="flex-1 py-2 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
              ))}
            </div>
          </div>
          {/* 데이터 */}
          <div className="flex items-center py-3">
            <div className="flex-1 flex">
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.biggest?.streak?.wins || 0}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.biggest?.streak?.draws || 0}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.biggest?.streak?.loses || 0}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-300 dark:bg-gray-500" />
              </div>
            </div>
            <div className="flex-1 flex">
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.biggest?.wins?.home || '-'}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.biggest?.wins?.away || '-'}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0] relative">
                {stats.biggest?.loses?.home || '-'}
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-200 dark:bg-gray-600" />
              </div>
              <div className="flex-1 text-center text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                {stats.biggest?.loses?.away || '-'}
              </div>
            </div>
          </div>
        </ContainerContent>
      </Container>
    </div>
  );
}
