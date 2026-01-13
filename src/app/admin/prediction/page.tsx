'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

// Window 타입 확장
declare global {
  interface Window {
    predictionAutoInterval?: NodeJS.Timeout;
  }
}

import { toast } from 'react-toastify';
import Tabs, { TabItem } from '@/shared/ui/tabs';
import { RefreshCw, Check, X, Target, Eye } from 'lucide-react';
import { formatDate } from '@/shared/utils/date';
import Spinner from '@/shared/components/Spinner';
import {
  getUpcomingMatches,
  generateAllPredictions,
  generateSingleLeaguePrediction,
  getPredictionAutomationLogs,
  togglePredictionAutomation,
  testPredictionGeneration,
  fetchPredictionPreview
} from '@/domains/prediction/actions';

// Predictions API 타입 (전체 데이터)
interface MinuteStats {
  [key: string]: { total: number | null; percentage: string | null };
}

interface UnderOverStats {
  [key: string]: { over: number; under: number };
}

interface TeamLeagueData {
  form?: string;
  fixtures?: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals?: {
    for: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
    against: {
      total: { home: number; away: number; total: number };
      average: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
  };
  biggest?: {
    streak: { wins: number; draws: number; loses: number };
    wins: { home: string | null; away: string | null };
    loses: { home: string | null; away: string | null };
    goals: { for: { home: number; away: number }; against: { home: number; away: number } };
  };
  clean_sheet?: { home: number; away: number; total: number };
  failed_to_score?: { home: number; away: number; total: number };
  penalty?: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
    total: number;
  };
  lineups?: Array<{ formation: string; played: number }>;
  cards?: {
    yellow: MinuteStats;
    red: MinuteStats;
  };
}

interface PredictionApiData {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null };
    win_or_draw: boolean;
    under_over: string | null;
    goals: { home: string; away: string };
    advice: string | null;
    percent: { home: string; draw: string; away: string };
  };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
  teams: {
    home: {
      id: number; name: string; logo: string;
      last_5: { form: string; att: string; def: string; goals: { for: { total: number; average: number }; against: { total: number; average: number } } };
      league?: TeamLeagueData;
    };
    away: {
      id: number; name: string; logo: string;
      last_5: { form: string; att: string; def: string; goals: { for: { total: number; average: number }; against: { total: number; average: number } } };
      league?: TeamLeagueData;
    };
  };
  h2h: Array<{
    fixture: { id: number; date: string };
    league?: { name: string; round: string };
    teams: { home: { id: number; name: string; logo?: string; winner: boolean | null }; away: { id: number; name: string; logo?: string; winner: boolean | null } };
    goals: { home: number; away: number };
    score?: { halftime: { home: number; away: number }; fulltime: { home: number; away: number } };
  }>;
}

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
  const [activeTab, setActiveTab] = useState<'matches' | 'automation'>('matches');
  const [isLoading, setIsLoading] = useState(false);
  const [automationLogs, setAutomationLogs] = useState<PredictionLog[]>([]);
  const [isPending, startTransition] = useTransition();

  // 자동화 상태 관리
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(false);
  const [autoGenerateTime, setAutoGenerateTime] = useState('09:00'); // 매일 오전 9시
  const [lastAutoGenerate, setLastAutoGenerate] = useState<string | null>(null);
  const [autoGenerateStatus, setAutoGenerateStatus] = useState<'idle' | 'running' | 'error'>('idle');

  // 미리보기 상태
  const [previewMatch, setPreviewMatch] = useState<UpcomingMatch | null>(null);
  const [previewData, setPreviewData] = useState<PredictionApiData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 미리보기 핸들러
  const handlePreview = async (match: UpcomingMatch) => {
    setPreviewMatch(match);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      const result = await fetchPredictionPreview(match.id);
      if (result.success && result.data) {
        setPreviewData(result.data);
      } else {
        toast.error(result.error || '미리보기 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      toast.error('미리보기 로드 실패');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewMatch(null);
    setPreviewData(null);
  };

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
          toast(`${leagueName}: ${result.message}`);
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

  // 탭 목록 정의
  const tabs: TabItem[] = [
    { id: 'matches', label: '다음날 경기' },
    { id: 'automation', label: '자동화 설정' },
  ];

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6">승무패 예측 관리</h1>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>안내:</strong> 이 기능은 API-Football의 Predictions 데이터를 기반으로 내일 경기 예측 게시글을 자동 생성합니다.<br />
          프리미어리그, 라리가, 분데스리가, 세리에A, 리그앙, K리그1, J1리그, 챔피언스리그 등 주요 리그만 필터링됩니다.
        </p>
      </div>
      
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'matches' | 'automation')}
        variant="minimal"
      />
      
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">내일 경기 목록</h2>
            <div className="flex gap-2">
              <button 
                onClick={loadUpcomingMatches} 
                disabled={isLoading}
                className="bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
              >
                {isLoading ? (
                  <Spinner size="xs" className="mr-2" />
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
                  <Spinner size="xs" className="mr-2" />
                ) : (
                  <Target className="mr-2 h-4 w-4" />
                )}
                모든 리그 예측 생성
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
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
                        <Spinner size="xs" className="mr-1" />
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
                            <span className="font-medium">{match.teams.home.name}</span>
                          </div>
                          <span className="text-gray-500">vs</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{match.teams.away.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handlePreview(match)}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            미리보기
                          </button>
                          <span className="text-sm text-gray-500">
                            {new Date(match.date).toLocaleString('ko-KR')}
                          </span>
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
                  {lastAutoGenerate ? (formatDate(lastAutoGenerate) || '-') : '없음'}
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
                  <Spinner size="xs" className="mr-2" />
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
                  <Spinner size="xs" className="mr-2" />
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
                  <li>• API-Football Predictions API로 각 경기 예측 데이터를 가져옵니다</li>
                  <li>• 승률, 팀 비교, 최근 폼, 상대전적 등 데이터를 게시글로 작성합니다</li>
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
                      <span className="text-gray-500">{formatDate(log.created_at) || '-'}</span>
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

      {/* 미리보기 모달 */}
      {previewMatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50" onClick={closePreview} />
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl relative">
              {/* 헤더 */}
              <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {previewMatch.teams.home.name} vs {previewMatch.teams.away.name}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    ID: {previewMatch.id}
                  </span>
                </div>
                <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>

              {/* 내용 */}
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                ) : previewData ? (
                  <PredictionPreviewContent data={previewData} />
                ) : (
                  <div className="text-center py-12 text-gray-500">데이터 없음</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 값 정규화 함수 (0-100 스케일)
function normalizeValue(value: number | undefined, maxExpected: number): number {
  if (!value) return 0;
  return Math.min(Math.round((value / maxExpected) * 100), 100);
}

// 미리보기 내용 컴포넌트
function PredictionPreviewContent({ data }: { data: PredictionApiData }) {
  const { predictions, comparison, teams, h2h } = data;

  // 레이더 차트용 데이터 (last_5 + league 시즌 데이터)
  const radarData = [
    {
      subject: '폼',
      home: parseInt(teams.home.last_5?.form) || 0,
      away: parseInt(teams.away.last_5?.form) || 0,
      fullMark: 100,
    },
    {
      subject: '공격력',
      home: parseInt(teams.home.last_5?.att) || 0,
      away: parseInt(teams.away.last_5?.att) || 0,
      fullMark: 100,
    },
    {
      subject: '수비력',
      home: parseInt(teams.home.last_5?.def) || 0,
      away: parseInt(teams.away.last_5?.def) || 0,
      fullMark: 100,
    },
    {
      subject: '승리',
      home: normalizeValue(teams.home.league?.fixtures?.wins?.total, 15),
      away: normalizeValue(teams.away.league?.fixtures?.wins?.total, 15),
      fullMark: 100,
    },
    {
      subject: '득점',
      home: normalizeValue(teams.home.league?.goals?.for?.total?.total, 50),
      away: normalizeValue(teams.away.league?.goals?.for?.total?.total, 50),
      fullMark: 100,
    },
    {
      subject: '실점↓',
      home: 100 - normalizeValue(teams.home.league?.goals?.against?.total?.total, 50),
      away: 100 - normalizeValue(teams.away.league?.goals?.against?.total?.total, 50),
      fullMark: 100,
    },
  ];

  // 비교 막대용 데이터 (comparison 7개 지표)
  const comparisonData = [
    { label: '최근 폼', home: parseInt(comparison.form?.home) || 0, away: parseInt(comparison.form?.away) || 0 },
    { label: '공격력', home: parseInt(comparison.att?.home) || 0, away: parseInt(comparison.att?.away) || 0 },
    { label: '수비력', home: parseInt(comparison.def?.home) || 0, away: parseInt(comparison.def?.away) || 0 },
    { label: '포아송 분포', home: parseInt(comparison.poisson_distribution?.home) || 0, away: parseInt(comparison.poisson_distribution?.away) || 0 },
    { label: '상대전적', home: parseInt(comparison.h2h?.home) || 0, away: parseInt(comparison.h2h?.away) || 0 },
    { label: '득점력', home: parseInt(comparison.goals?.home) || 0, away: parseInt(comparison.goals?.away) || 0 },
    { label: '승률', home: parseInt(predictions.percent?.home) || 0, away: parseInt(predictions.percent?.away) || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* 레이더 차트 (최근 5경기 + 시즌 통계) */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-semibold mb-1 text-center">📊 팀 성적 레이더 차트</h4>
        <p className="text-xs text-gray-500 text-center mb-3">최근 5경기 폼/공격력/수비력 + 시즌 승리/득점/실점</p>
        <div className="flex items-center justify-center gap-6 mb-2">
          <span className="flex items-center gap-1 text-sm">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            {teams.home.name}
          </span>
          <span className="flex items-center gap-1 text-sm">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            {teams.away.name}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickCount={6}
            />
            <Radar
              name={teams.home.name}
              dataKey="home"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Radar
              name={teams.away.name}
              dataKey="away"
              stroke="#22C55E"
              fill="#22C55E"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg text-sm">
                      <p className="font-semibold mb-1">{label}</p>
                      {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.name}: <span className="font-bold">{entry.value}%</span>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 승률 예측 */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">📊 승률 예측</h4>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{predictions.percent.home}</p>
            <p className="text-sm text-gray-600">{teams.home.name}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-500">{predictions.percent.draw}</p>
            <p className="text-sm text-gray-600">무승부</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{predictions.percent.away}</p>
            <p className="text-sm text-gray-600">{teams.away.name}</p>
          </div>
        </div>
        {predictions.advice && (
          <p className="mt-4 text-center text-sm bg-white p-2 rounded border">
            💡 {predictions.advice}
          </p>
        )}
      </div>

      {/* 팀 비교 막대 (comparison 데이터) */}
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-semibold mb-3">📈 팀 비교 (7개 지표)</h4>
        <div className="space-y-3">
          {comparisonData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="w-10 text-right font-medium text-blue-600">{item.home}%</span>
              <div className="flex-1 flex h-4 bg-gray-100 rounded overflow-hidden">
                <div className="bg-blue-500" style={{ width: `${item.home}%` }} />
                <div className="bg-green-500" style={{ width: `${item.away}%` }} />
              </div>
              <span className="w-10 font-medium text-green-600">{item.away}%</span>
              <span className="w-20 text-gray-500 text-xs">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span>{teams.home.name}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span>{teams.away.name}</span>
        </div>
      </div>

      {/* 팀별 상세 데이터 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 홈팀 */}
        <TeamDetailCard team={teams.home} label="HOME" color="blue" />
        {/* 원정팀 */}
        <TeamDetailCard team={teams.away} label="AWAY" color="green" />
      </div>

      {/* 상대전적 */}
      {h2h && h2h.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold mb-3">🏆 상대전적 (최근 {h2h.length}경기)</h4>
          <div className="space-y-2">
            {h2h.slice(0, 5).map((match, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-500 text-xs w-24">
                  {new Date(match.fixture.date).toLocaleDateString('ko-KR')}
                </span>
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <span className={match.teams.home.winner ? 'font-bold text-green-600' : ''}>
                    {match.teams.home.name}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 rounded font-bold">
                    {match.goals.home} - {match.goals.away}
                  </span>
                  <span className={match.teams.away.winner ? 'font-bold text-green-600' : ''}>
                    {match.teams.away.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 예상 골 & 기타 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">⚽ 예상 골</h4>
          <p>{teams.home.name}: <strong>{predictions.goals?.home || '-'}</strong></p>
          <p>{teams.away.name}: <strong>{predictions.goals?.away || '-'}</strong></p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">📋 기타 정보</h4>
          <p>언더/오버: <strong>{predictions.under_over || '-'}</strong></p>
          <p>승/무 예상: <strong>{predictions.win_or_draw ? '홈 최소 무승부' : '-'}</strong></p>
          {predictions.winner?.name && (
            <p>예상 승자: <strong>{predictions.winner.name}</strong> {predictions.winner.comment && `(${predictions.winner.comment})`}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 팀 상세 카드 컴포넌트 (tset 페이지와 동일한 데이터)
interface TeamData {
  id: number;
  name: string;
  logo: string;
  last_5: {
    form: string;
    att: string;
    def: string;
    goals: { for: { total: number; average: number }; against: { total: number; average: number } };
  };
  league?: TeamLeagueData;
}

function TeamDetailCard({ team, label, color }: { team: TeamData; label: string; color: 'blue' | 'green' }) {
  const [expanded, setExpanded] = useState(true);
  const colorClass = color === 'blue' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50';
  const textColor = color === 'blue' ? 'text-blue-800' : 'text-green-800';

  return (
    <div className={`border-l-4 ${colorClass} rounded-r-lg overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-white/50"
      >
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${textColor}`}>{label}: {team.name}</span>
          <span className="text-xs text-gray-500">ID: {team.id}</span>
        </div>
        <span className="text-gray-500">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="p-3 bg-white space-y-4 text-sm">
          {/* 최근 5경기 */}
          <div className="border rounded p-3">
            <h5 className="font-semibold text-gray-700 mb-2">🔥 최근 5경기</h5>
            <p className="text-xl font-mono mb-2">{team.last_5?.form || 'N/A'}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p>공격력: <strong>{team.last_5?.att || '-'}</strong></p>
              <p>수비력: <strong>{team.last_5?.def || '-'}</strong></p>
              <p>득점: <strong>{team.last_5?.goals?.for?.total || 0}</strong> (평균 {team.last_5?.goals?.for?.average || 0})</p>
              <p>실점: <strong>{team.last_5?.goals?.against?.total || 0}</strong> (평균 {team.last_5?.goals?.against?.average || 0})</p>
            </div>
          </div>

          {/* 시즌 폼 */}
          {team.league?.form && (
            <div className="border rounded p-3">
              <h5 className="font-semibold text-gray-700 mb-2">📈 시즌 전체 폼</h5>
              <p className="font-mono text-xs break-all">{team.league.form}</p>
              <p className="text-xs text-gray-500 mt-1">W=승, D=무, L=패 (최근이 오른쪽)</p>
            </div>
          )}

          {/* 경기 결과 테이블 */}
          {team.league?.fixtures && (
            <div className="border rounded p-3">
              <h5 className="font-semibold text-gray-700 mb-2">📊 경기 결과</h5>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1"></th>
                    <th className="text-center py-1">홈</th>
                    <th className="text-center py-1">원정</th>
                    <th className="text-center py-1 font-bold">합계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1">경기</td>
                    <td className="text-center">{team.league.fixtures.played?.home || 0}</td>
                    <td className="text-center">{team.league.fixtures.played?.away || 0}</td>
                    <td className="text-center font-bold">{team.league.fixtures.played?.total || 0}</td>
                  </tr>
                  <tr className="text-green-600">
                    <td className="py-1">승</td>
                    <td className="text-center">{team.league.fixtures.wins?.home || 0}</td>
                    <td className="text-center">{team.league.fixtures.wins?.away || 0}</td>
                    <td className="text-center font-bold">{team.league.fixtures.wins?.total || 0}</td>
                  </tr>
                  <tr className="text-yellow-600">
                    <td className="py-1">무</td>
                    <td className="text-center">{team.league.fixtures.draws?.home || 0}</td>
                    <td className="text-center">{team.league.fixtures.draws?.away || 0}</td>
                    <td className="text-center font-bold">{team.league.fixtures.draws?.total || 0}</td>
                  </tr>
                  <tr className="text-red-600">
                    <td className="py-1">패</td>
                    <td className="text-center">{team.league.fixtures.loses?.home || 0}</td>
                    <td className="text-center">{team.league.fixtures.loses?.away || 0}</td>
                    <td className="text-center font-bold">{team.league.fixtures.loses?.total || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 득실점 통계 */}
          {team.league?.goals && (
            <div className="border rounded p-3">
              <h5 className="font-semibold text-gray-700 mb-2">⚽ 득실점 통계</h5>
              <div className="space-y-2">
                <div>
                  <p className="text-green-600 font-medium text-xs mb-1">득점</p>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr>
                        <td>합계</td>
                        <td className="text-center">{team.league.goals.for?.total?.home || 0}</td>
                        <td className="text-center">{team.league.goals.for?.total?.away || 0}</td>
                        <td className="text-center font-bold">{team.league.goals.for?.total?.total || 0}</td>
                      </tr>
                      <tr>
                        <td>평균</td>
                        <td className="text-center">{team.league.goals.for?.average?.home || '-'}</td>
                        <td className="text-center">{team.league.goals.for?.average?.away || '-'}</td>
                        <td className="text-center font-bold">{team.league.goals.for?.average?.total || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="text-red-600 font-medium text-xs mb-1">실점</p>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr>
                        <td>합계</td>
                        <td className="text-center">{team.league.goals.against?.total?.home || 0}</td>
                        <td className="text-center">{team.league.goals.against?.total?.away || 0}</td>
                        <td className="text-center font-bold">{team.league.goals.against?.total?.total || 0}</td>
                      </tr>
                      <tr>
                        <td>평균</td>
                        <td className="text-center">{team.league.goals.against?.average?.home || '-'}</td>
                        <td className="text-center">{team.league.goals.against?.average?.away || '-'}</td>
                        <td className="text-center font-bold">{team.league.goals.against?.average?.total || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 최대 기록 */}
          {team.league?.biggest && (
            <div className="border rounded p-3">
              <h5 className="font-semibold text-gray-700 mb-2">🏆 최대 기록</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p>연승: <strong>{team.league.biggest.streak?.wins || 0}</strong></p>
                <p>연무: <strong>{team.league.biggest.streak?.draws || 0}</strong></p>
                <p>연패: <strong>{team.league.biggest.streak?.loses || 0}</strong></p>
                <p>홈 최다승: <strong>{team.league.biggest.wins?.home || '-'}</strong></p>
                <p>원정 최다승: <strong>{team.league.biggest.wins?.away || '-'}</strong></p>
                <p>홈 최다패: <strong>{team.league.biggest.loses?.home || '-'}</strong></p>
                <p>원정 최다패: <strong>{team.league.biggest.loses?.away || '-'}</strong></p>
                <p>홈 최다득점: <strong>{team.league.biggest.goals?.for?.home || 0}</strong></p>
                <p>원정 최다득점: <strong>{team.league.biggest.goals?.for?.away || 0}</strong></p>
              </div>
            </div>
          )}

          {/* 클린시트 & 무득점 */}
          {(team.league?.clean_sheet || team.league?.failed_to_score) && (
            <div className="border rounded p-3">
              <h5 className="font-semibold text-gray-700 mb-2">🛡️ 클린시트 / 무득점</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {team.league.clean_sheet && (
                  <>
                    <p>무실점(홈): <strong>{team.league.clean_sheet.home || 0}</strong></p>
                    <p>무실점(원정): <strong>{team.league.clean_sheet.away || 0}</strong></p>
                    <p>무실점(합계): <strong className="text-green-600">{team.league.clean_sheet.total || 0}</strong></p>
                  </>
                )}
                {team.league.failed_to_score && (
                  <>
                    <p>무득점(홈): <strong>{team.league.failed_to_score.home || 0}</strong></p>
                    <p>무득점(원정): <strong>{team.league.failed_to_score.away || 0}</strong></p>
                    <p>무득점(합계): <strong className="text-red-600">{team.league.failed_to_score.total || 0}</strong></p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 페널티킥 */}
          {team.league?.penalty && (
            <div className="border rounded p-3">
              <h5 className="font-semibold text-gray-700 mb-2">🎯 페널티킥</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p>성공: <strong className="text-green-600">{team.league.penalty.scored?.total || 0}</strong> ({team.league.penalty.scored?.percentage || '-'})</p>
                <p>실패: <strong className="text-red-600">{team.league.penalty.missed?.total || 0}</strong> ({team.league.penalty.missed?.percentage || '-'})</p>
                <p>총 시도: <strong>{team.league.penalty.total || 0}</strong></p>
              </div>
            </div>
          )}

          {/* 포메이션 */}
          {team.league?.lineups && team.league.lineups.length > 0 && (
            <div className="border rounded p-3">
              <h5 className="font-semibold text-gray-700 mb-2">📋 사용 포메이션</h5>
              <div className="flex flex-wrap gap-1">
                {team.league.lineups.map((lineup, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {lineup.formation} ({lineup.played}회)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}