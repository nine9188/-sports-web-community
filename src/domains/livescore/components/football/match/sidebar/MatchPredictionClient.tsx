'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { 
  savePrediction, 
  getCachedUserPrediction, 
  getCachedPredictionStats,
  type PredictionType,
  type PredictionStats,
  type MatchPrediction
} from '@/domains/livescore/actions/match/predictions';

// 매치 데이터 타입 정의
interface MatchDataType {
  fixture?: {
    date?: string;
    timezone?: string;
    status?: {
      short?: string;
      long?: string;
      elapsed?: number | null;
    };
    venue?: {
      id?: number;
      name?: string;
      city?: string;
    };
    referee?: string;
    periods?: {
      first?: number;
      second?: number;
    };
  };
  league?: {
    id?: number;
    name?: string;
    name_ko?: string;
    country?: string;
    season?: number;
    round?: string;
    logo?: string;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
    };
    away?: {
      id?: number;
      name?: string;
      name_ko?: string;
      logo?: string;
    };
  };
}

// 승무패 예측 섹션 컴포넌트
export default function MatchPredictionClient({ 
  matchData,
  initialPrediction,
  initialStats
}: { 
  matchData: MatchDataType;
  initialPrediction?: MatchPrediction | null;
  initialStats?: PredictionStats | null;
}) {
  const pathname = usePathname();
  const matchId = pathname?.split('/').pop() || '';
  
  const [prediction, setPrediction] = useState<PredictionType | null>(
    initialPrediction?.prediction_type as PredictionType || null
  );
  const [stats, setStats] = useState<PredictionStats | null>(initialStats || null);
  const [isLoading, setIsLoading] = useState(false);
  
  const homeTeam = matchData.teams?.home;
  const awayTeam = matchData.teams?.away;
  const fixture = matchData.fixture;

  // 경기 상태 확인 함수
  const isMatchFinished = () => {
    const status = fixture?.status?.short;
    // FT: Full Time, AET: After Extra Time, PEN: Penalty, AWD: Awarded, WO: Walkover, CANC: Cancelled, SUSP: Suspended
    return ['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'SUSP'].includes(status || '');
  };

  // 경기 시작 여부 확인
  const isMatchStarted = () => {
    const status = fixture?.status?.short;
    // NS: Not Started, TBD: To Be Determined, PST: Postponed
    return !['NS', 'TBD', 'PST'].includes(status || '');
  };

  // 경기 상태 메시지
  const getMatchStatusMessage = () => {
    if (isMatchFinished()) {
      return '경기가 종료되어 예측할 수 없습니다';
    }
    if (isMatchStarted()) {
      return '경기가 시작되어 예측할 수 없습니다';
    }
    return null;
  };

  // 초기 데이터가 없는 경우에만 로드
  useEffect(() => {
    const loadInitialData = async () => {
      if (!matchId || (initialPrediction !== undefined && initialStats !== undefined)) return;
      
      try {
        // 사용자 예측과 통계를 병렬로 가져오기
        const [userPredictionResult, statsResult] = await Promise.all([
          getCachedUserPrediction(matchId),
          getCachedPredictionStats(matchId)
        ]);

        // 사용자 예측 설정
        if (userPredictionResult.success && userPredictionResult.data) {
          const predictionData = userPredictionResult.data as MatchPrediction;
          setPrediction(predictionData.prediction_type as PredictionType);
        }

        // 통계 설정
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data as PredictionStats);
        }
      } catch (error) {
        console.error('초기 데이터 로드 오류:', error);
      }
    };

    loadInitialData();
  }, [matchId, initialPrediction, initialStats]);

  // 예측 처리
  const handlePrediction = async (type: PredictionType) => {
    if (!matchId) return;
    
    // 경기가 끝났거나 시작된 경우 예측 불가
    if (isMatchFinished() || isMatchStarted()) {
      const message = getMatchStatusMessage();
      if (message) {
        toast.error(message);
      }
      return;
    }
    
    // 같은 예측을 다시 클릭하면 취소 (삭제는 구현하지 않고 변경만 허용)
    if (prediction === type) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await savePrediction(matchId, type);
      
      if (result.success) {
        setPrediction(type);
        toast.success(result.message || '예측이 저장되었습니다!');
        
        // 통계 새로고침
        const statsResult = await getCachedPredictionStats(matchId);
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data as PredictionStats);
        }
      } else {
        toast.error(result.error || '예측 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('예측 저장 오류:', error);
      toast.error('예측 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const canPredict = !isMatchFinished() && !isMatchStarted();
  const statusMessage = getMatchStatusMessage();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-800">승부 예측</h3>
          {canPredict ? (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              10점 적립
            </span>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
              {isMatchFinished() ? '경기 종료' : '경기 진행중'}
            </span>
          )}
        </div>
      </div>
      
      {/* 상태 메시지 (경기가 끝났거나 시작된 경우) */}
      {statusMessage && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100">
          <p className="text-xs text-yellow-700 text-center">
            {statusMessage}
          </p>
        </div>
      )}
      
      {/* 예측 버튼들 */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {/* 홈팀 승리 */}
          <button
            onClick={() => handlePrediction('home')}
            disabled={isLoading || !canPredict}
            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center relative ${
              prediction === 'home'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${isLoading || !canPredict ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="relative w-8 h-8 mb-1">
              <Image
                src={homeTeam?.logo || '/images/team-placeholder.png'} 
                alt={homeTeam?.name || 'Home Team'} 
                fill
                sizes="32px"
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/images/team-placeholder.png';
                }}
              />
            </div>
            {stats && stats.total_votes > 0 && (
              <div className="text-xs text-gray-600 font-medium">
                {stats.home_percentage}%
              </div>
            )}
            {prediction === 'home' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
          
          {/* 무승부 */}
          <button
            onClick={() => handlePrediction('draw')}
            disabled={isLoading || !canPredict}
            className={`p-3 rounded-lg border-2 transition-all duration-200 relative ${
              prediction === 'draw'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            } ${isLoading || !canPredict ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-center">
              <div className="text-xs font-medium mb-1">무승부</div>
              <div className="text-xs text-gray-500">DRAW</div>
              {stats && stats.total_votes > 0 && (
                <div className="text-xs text-gray-600 font-medium mt-1">
                  {stats.draw_percentage}%
                </div>
              )}
            </div>
            {prediction === 'draw' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
          
          {/* 원정팀 승리 */}
          <button
            onClick={() => handlePrediction('away')}
            disabled={isLoading || !canPredict}
            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center relative ${
              prediction === 'away'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${isLoading || !canPredict ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="relative w-8 h-8 mb-1">
              <Image
                src={awayTeam?.logo || '/images/team-placeholder.png'} 
                alt={awayTeam?.name || 'Away Team'} 
                fill
                sizes="32px"
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/images/team-placeholder.png';
                }}
              />
            </div>
            {stats && stats.total_votes > 0 && (
              <div className="text-xs text-gray-600 font-medium">
                {stats.away_percentage}%
              </div>
            )}
            {prediction === 'away' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        </div>
        
        {/* 예측 결과 및 통계 표시 */}
        {prediction && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-center text-gray-600">
              내 예측: <span className="font-medium text-gray-800">
                {prediction === 'home' && `${homeTeam?.name_ko || homeTeam?.name || '홈팀'} 승리`}
                {prediction === 'draw' && '무승부'}
                {prediction === 'away' && `${awayTeam?.name_ko || awayTeam?.name || '원정팀'} 승리`}
              </span>
            </div>
          </div>
        )}

        {/* 전체 통계 표시 */}
        {stats && stats.total_votes > 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-2 text-center">
              총 {stats.total_votes}명이 예측했습니다
            </div>
            
            {/* 통계 바 */}
            <div className="space-y-2">
              {/* 홈팀 */}
              <div className="flex items-center text-xs">
                <div className="w-8 h-4 relative mr-2">
                  <Image
                    src={homeTeam?.logo || '/images/team-placeholder.png'} 
                    alt={homeTeam?.name || 'Home'} 
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.home_percentage}%` }}
                  ></div>
                </div>
                <span className="font-medium text-gray-700 w-8 text-right">
                  {stats.home_percentage}%
                </span>
              </div>
              
              {/* 무승부 */}
              <div className="flex items-center text-xs">
                <div className="w-8 h-4 mr-2 flex items-center justify-center">
                  <span className="text-gray-500 font-bold text-xs">D</span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.draw_percentage}%` }}
                  ></div>
                </div>
                <span className="font-medium text-gray-700 w-8 text-right">
                  {stats.draw_percentage}%
                </span>
              </div>
              
              {/* 원정팀 */}
              <div className="flex items-center text-xs">
                <div className="w-8 h-4 relative mr-2">
                  <Image
                    src={awayTeam?.logo || '/images/team-placeholder.png'} 
                    alt={awayTeam?.name || 'Away'} 
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.away_percentage}%` }}
                  ></div>
                </div>
                <span className="font-medium text-gray-700 w-8 text-right">
                  {stats.away_percentage}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 