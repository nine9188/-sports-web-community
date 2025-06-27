'use client';

import { useState, useEffect, useTransition } from 'react';

// Window 타입 확장
declare global {
  interface Window {
    predictionAutoInterval?: NodeJS.Timeout;
  }
}

import { toast } from 'react-toastify';
import Image from 'next/image';
import { Loader2, RefreshCw, Check, X, Target } from 'lucide-react';
import { getMajorLeagueIds } from '@/domains/livescore/constants/league-mappings';
import { 
  getUpcomingMatches,
  generateAllPredictions,
  generateSingleLeaguePrediction,
  getPredictionAutomationLogs,
  togglePredictionAutomation,
  testPredictionGeneration
} from '@/domains/prediction/actions';

interface UpcomingMatch {
  id: number;
  date: string;
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; };
    away: { id: number; name: string; logo: string; };
  };
  status: string;
}

interface PredictionLog {
  id: string;
  trigger_type: string;
  status: string;
  matches_processed: number;
  posts_created: number;
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
  details?: string;
}

export default function PredictionAdminPage() {
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');
  const [isPending, startTransition] = useTransition();
  
  // 자동화 상태 관리
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(false);
  const [autoGenerateTime, setAutoGenerateTime] = useState('09:00'); // 매일 오전 9시
  const [lastAutoGenerate, setLastAutoGenerate] = useState<string | null>(null);
  const [autoGenerateStatus, setAutoGenerateStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [automationLogs, setAutomationLogs] = useState<PredictionLog[]>([]);
  


  // 메이저 리그 정보
  const majorLeagueIds = getMajorLeagueIds();

  // 초기 데이터 로딩
  useEffect(() => {
    loadUpcomingMatches();
    loadAutomationLogs();
    
    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      if (window.predictionAutoInterval) {
        clearInterval(window.predictionAutoInterval);
      }
    };
  }, []);

  // 다음날 경기 목록 가져오기
  const loadUpcomingMatches = async () => {
    try {
      setIsLoading(true);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const matches = await getUpcomingMatches(dateStr);
      setUpcomingMatches(matches);
    } catch (error) {
      console.error('다음날 경기 목록 가져오기 오류:', error);
      toast.error('경기 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 자동화 로그 가져오기
  const loadAutomationLogs = async () => {
    try {
      const logs = await getPredictionAutomationLogs(10);
      setAutomationLogs(logs);
      
      // 최신 로그에서 마지막 실행 시간 업데이트
      if (logs.length > 0) {
        setLastAutoGenerate(logs[0].created_at);
      }
    } catch (error) {
      console.error('자동화 로그 가져오기 오류:', error);
    }
  };

  // 모든 예측 분석 생성 (수동 실행)
  const handleGenerateAllPredictions = async () => {
    startTransition(async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const results = await generateAllPredictions(dateStr, 'manual');
        
        // 성공 및 실패 리그 개수
        const successCount = results.filter((r) => r.status === 'success').length;
        const errorCount = results.filter((r) => r.status === 'error').length;
        const skippedCount = results.filter((r) => r.status === 'skipped').length;

        loadAutomationLogs();
        toast.success(`${successCount}개 리그 성공, ${errorCount}개 실패, ${skippedCount}개 스킵`);
      } catch (error) {
        console.error('예측 분석 생성 오류:', error);
        toast.error('예측 분석 생성에 실패했습니다.');
      }
    });
  };

  // 단일 리그 예측 분석 생성
  const handleGenerateSingleLeaguePrediction = async (leagueId: number, leagueName: string) => {
    startTransition(async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const result = await generateSingleLeaguePrediction(dateStr, leagueId, 'manual');
        
        if (result.status === 'success') {
          toast.success(`${leagueName} 예측 분석 생성 완료!`);
        } else if (result.status === 'skipped') {
          toast.info(`${leagueName}: ${result.message}`);
        } else {
          toast.error(`${leagueName} 실패: ${result.message}`);
        }
        
        loadAutomationLogs();
      } catch (error) {
        console.error('단일 리그 예측 분석 생성 오류:', error);
        toast.error(`${leagueName} 예측 분석 생성에 실패했습니다.`);
      }
    });
  };

  // 자동화 토글 핸들러
  const handleToggleAutomation = async () => {
    startTransition(async () => {
      try {
        setAutoGenerateStatus('running');
        
        const result = await togglePredictionAutomation(!autoGenerateEnabled, autoGenerateTime);
        
        if (result.success) {
          setAutoGenerateEnabled(!autoGenerateEnabled);
          toast.success(result.message);
          setAutoGenerateStatus('idle');
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('자동화 토글 오류:', error);
        toast.error('자동화 설정 변경에 실패했습니다.');
        setAutoGenerateStatus('error');
      }
    });
  };

  // 자동화 테스트 핸들러
  const handleTestPredictionGeneration = async () => {
    startTransition(async () => {
      try {
        setAutoGenerateStatus('running');
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const result = await testPredictionGeneration(dateStr);
        
        if (result.success) {
          toast.success(`테스트 완료! ${result.message}`);
          setLastAutoGenerate(new Date().toISOString());
          setAutoGenerateStatus('idle');
          loadAutomationLogs();
        } else {
          throw new Error(result.message || '테스트 실패');
        }
      } catch (error) {
        console.error('테스트 오류:', error);
        toast.error(error instanceof Error ? error.message : '테스트에 실패했습니다.');
        setAutoGenerateStatus('error');
      }
    });
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  // 리그별 경기 그룹화
  const groupMatchesByLeague = (matches: UpcomingMatch[]) => {
    const grouped = matches.reduce((acc, match) => {
      const leagueId = match.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = {
          league: match.league,
          matches: []
        };
      }
      acc[leagueId].matches.push(match);
      return acc;
    }, {} as Record<number, { league: UpcomingMatch['league']; matches: UpcomingMatch[] }>);
    
    return Object.values(grouped);
  };

  const leagueGroups = groupMatchesByLeague(upcomingMatches);

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">⚽ 축구 예측 분석 관리</h1>
      
      {/* 메이저 리그 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">📊 분석 대상 리그</h2>
        <p className="text-blue-700 text-sm mb-2">
          총 <strong>{majorLeagueIds.length}개</strong> 메이저 리그의 경기만 분석합니다.
        </p>
        <div className="text-xs text-blue-600">
          프리미어리그, 라리가, 분데스리가, 세리에A, 리그앙, K리그1, J1리그, 챔피언스리그 등 주요 리그만 필터링됩니다.
        </div>
      </div>
      
      <div className="mb-4">
        <ul className="flex border-b">
          <li className="mr-1">
            <button 
              className={`py-2 px-4 ${activeTab === 'matches' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:text-blue-500'}`} 
              onClick={() => setActiveTab('matches')}
            >
              다음날 경기
            </button>
          </li>
          <li className="mr-1">
            <button 
              className={`py-2 px-4 ${activeTab === 'automation' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:text-blue-500'}`} 
              onClick={() => setActiveTab('automation')}
            >
              자동화 설정
            </button>
          </li>
        </ul>
      </div>
      
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">내일 경기 목록</h2>
            <div className="flex gap-2">
              <button 
                onClick={loadUpcomingMatches} 
                disabled={isPending}
                className="bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                경기 새로고침
              </button>
              <button 
                onClick={handleGenerateAllPredictions} 
                disabled={isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Target className="mr-2 h-4 w-4" />
                )}
                모든 리그 예측 생성
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : leagueGroups.length === 0 ? (
            <div className="text-center p-8 bg-gray-100 rounded-lg">
              <p className="text-lg text-gray-600">내일 예정된 경기가 없습니다.</p>
              <p className="text-sm text-gray-500 mt-2">
                경기 일정을 확인해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {leagueGroups.map((group) => (
                <div key={group.league.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Image 
                        src={group.league.logo} 
                        alt={group.league.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 mr-3"
                      />
                      <h3 className="text-lg font-semibold">{group.league.name}</h3>
                      <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {group.matches.length}경기
                      </span>
                    </div>
                    <button
                      onClick={() => handleGenerateSingleLeaguePrediction(group.league.id, group.league.name)}
                      disabled={isPending}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center text-sm"
                    >
                      {isPending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Target className="mr-1 h-3 w-3" />
                      )}
                      이 리그만 예측 생성
                    </button>
                  </div>
                  
                  <div className="grid gap-2">
                    {group.matches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Image src={match.teams.home.logo} alt={match.teams.home.name} width={24} height={24} className="w-6 h-6" />
                            <span className="font-medium">{match.teams.home.name}</span>
                          </div>
                          <span className="text-gray-500">vs</span>
                          <div className="flex items-center space-x-2">
                            <Image src={match.teams.away.logo} alt={match.teams.away.name} width={24} height={24} className="w-6 h-6" />
                            <span className="font-medium">{match.teams.away.name}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(match.date).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-6">
          {/* 자동화 상태 카드 */}
          <div className="bg-white p-6 border rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">예측 분석 자동 생성 상태</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                autoGenerateStatus === 'running' ? 'bg-green-100 text-green-800' :
                autoGenerateStatus === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {autoGenerateStatus === 'running' ? '🟢 실행 중' :
                 autoGenerateStatus === 'error' ? '🔴 오류' :
                 '⚪ 대기 중'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-1">자동화 상태</h3>
                <p className="text-lg font-semibold">
                  {autoGenerateEnabled ? '🟢 활성화' : '🔴 비활성화'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-1">실행 시간</h3>
                <p className="text-lg font-semibold">매일 {autoGenerateTime}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-1">마지막 실행</h3>
                <p className="text-lg font-semibold">
                  {lastAutoGenerate ? formatDate(lastAutoGenerate) : '없음'}
                </p>
              </div>
            </div>

            {/* 자동화 제어 버튼들 */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleToggleAutomation}
                disabled={isPending}
                className={`px-4 py-2 rounded-md font-medium flex items-center ${
                  autoGenerateEnabled 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : autoGenerateEnabled ? (
                  <X className="mr-2 h-4 w-4" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {autoGenerateEnabled ? '자동화 중지' : '자동화 시작'}
              </button>

              <button
                onClick={handleTestPredictionGeneration}
                disabled={isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Target className="mr-2 h-4 w-4" />
                )}
                수동 테스트
              </button>
            </div>
          </div>

          {/* 자동화 설정 카드 */}
          <div className="bg-white p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">자동화 설정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  매일 실행 시간
                </label>
                <select
                  value={autoGenerateTime}
                  onChange={(e) => setAutoGenerateTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="06:00">오전 6시</option>
                  <option value="07:00">오전 7시</option>
                  <option value="08:00">오전 8시</option>
                  <option value="09:00">오전 9시 (권장)</option>
                  <option value="10:00">오전 10시</option>
                  <option value="21:00">오후 9시</option>
                  <option value="22:00">오후 10시</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  다음날 경기 예측 분석을 생성할 시간을 설정합니다.
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">📋 동작 방식</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 매일 설정된 시간에 다음날 경기를 조회합니다</li>
                  <li>• 리그별로 경기를 그룹화하여 AI 분석을 수행합니다</li>
                  <li>• 각 리그별로 &quot;6월 22일 프리미어리그 분석!&quot; 형태의 게시글을 작성합니다</li>
                  <li>• 해당 리그 게시판에 자동으로 게시됩니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 자동화 로그 카드 */}
          <div className="bg-white p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">자동화 로그</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">최근 자동화 실행 기록:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {automationLogs.length === 0 ? (
                  <div className="text-sm text-gray-500">아직 실행 기록이 없습니다.</div>
                ) : (
                  automationLogs.map((log, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-500">{formatDate(log.created_at)}</span>
                      <span className={`ml-2 ${
                        log.status === 'success' ? 'text-green-600' :
                        log.status === 'error' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {log.status === 'success' ? '✅' : 
                         log.status === 'error' ? '❌' : '⚠️'} 
                        {log.status === 'success' ? '성공' :
                         log.status === 'error' ? '실패' : '부분 성공'} - 
                        {log.matches_processed}경기 처리, {log.posts_created}개 게시글 생성
                        ({log.execution_time_ms}ms)
                        {log.error_message && ` - ${log.error_message}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 