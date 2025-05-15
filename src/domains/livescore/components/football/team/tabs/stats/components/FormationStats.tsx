'use client';

import { TeamStatsData } from '@/domains/livescore/types/stats';
import { useFormationDisplay } from '../hooks/useFormationDisplay';

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
    <div className="bg-white rounded-lg border overflow-hidden mb-4">
      <h3 className="text-sm font-medium p-3 border-b border-gray-200">
        주로 사용하는 포메이션
      </h3>
      <div className="p-4">
        <div className="space-y-3">
          {visibleFormations.map((formation, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium">{formation.formation}</h4>
                <p className="text-xs text-gray-500">{formation.played}경기 사용</p>
              </div>
              
              <div className="w-3/5">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${(formation.played / lineups[0].played) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 더보기 버튼 (5개 이상일 경우) */}
        {lineups.length > 5 && (
          <button 
            onClick={toggleFormations}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            {showAllFormations ? '접기' : '더 보기'}
          </button>
        )}
      </div>
    </div>
  );
} 