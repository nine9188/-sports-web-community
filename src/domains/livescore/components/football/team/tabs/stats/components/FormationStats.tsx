'use client';

import { TeamStatsData } from '@/domains/livescore/types/stats';
import { useFormationDisplay } from '../hooks/useFormationDisplay';
import { Container, ContainerHeader, ContainerTitle, ContainerContent, Button } from '@/shared/components/ui';

interface FormationStatsProps {
  stats: TeamStatsData;
}

export default function FormationStats({ stats }: FormationStatsProps) {
  const lineups = stats.lineups || [];
  const { visibleFormations, toggleFormations, showAllFormations } = useFormationDisplay(lineups);
  
  // 포메이션이 없을 경우 null 반환
  if (!lineups || lineups.length === 0) {
    return null;
  }

  return (
    <Container className="mb-4">
      <ContainerHeader>
        <ContainerTitle>주로 사용하는 포메이션</ContainerTitle>
      </ContainerHeader>
      <ContainerContent className="!p-0">
        {/* 소제목 */}
        <div className="flex bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
          <div className="flex-1 py-2 px-4 text-[10px] font-medium text-gray-500 dark:text-gray-400">포메이션</div>
          <div className="w-3/5 py-2 px-4 text-[10px] font-medium text-gray-500 dark:text-gray-400">사용 비율</div>
        </div>
        <div className="space-y-3 p-4">
          {visibleFormations.map((formation, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0]">{formation.formation}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formation.played}경기 사용</p>
              </div>
              
              <div className="w-3/5">
                <div className="w-full bg-[#EAEAEA] dark:bg-[#333333] rounded-full h-2">
                  <div 
                    className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(formation.played / lineups[0].played) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {/* 더보기 버튼 (5개 이상일 경우) */}
          {lineups.length > 5 && (
            <Button
              variant="ghost"
              onClick={toggleFormations}
              className="mt-2 text-sm h-auto px-3 py-1"
            >
              {showAllFormations ? '접기' : '더 보기'}
            </Button>
          )}
        </div>
      </ContainerContent>
    </Container>
  );
} 