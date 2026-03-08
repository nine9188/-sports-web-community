'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { TabList, type TabItem, Button } from '@/shared/components/ui';
import { RefreshCw, Check, X, Target, Eye, CalendarDays } from 'lucide-react';
import { formatDate } from '@/shared/utils/dateUtils';
import Spinner from '@/shared/components/Spinner';
import Calendar from '@/shared/components/Calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  getUpcomingMatches,
  generateAllPredictions,
  generateSingleLeaguePrediction,
  getPredictionAutomationLogs,
  togglePredictionAutomation,
  testPredictionGeneration,
  fetchPredictionPreview
} from '@/domains/prediction/actions';
import {
  type UpcomingMatch,
  type PredictionLog,
  type PredictionApiData,
  PreviewModal,
} from '@/domains/admin/components/prediction';

// Window 타입 확장
declare global {
  interface Window {
    predictionAutoInterval?: NodeJS.Timeout;
  }
}

export default function PredictionAdminPage() {
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'automation'>('matches');
  const [isLoading, setIsLoading] = useState(false);
  const [automationLogs, setAutomationLogs] = useState<PredictionLog[]>([]);
  const [isPending, startTransition] = useTransition();

  // 날짜 선택 상태 (기본값: 내일)
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };
  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate());
  const [showCalendar, setShowCalendar] = useState(false);

  // Date를 YYYY-MM-DD 문자열로 변환
  const formatDateToString = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  // 선택된 경기 상태
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(new Set());

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
    loadUpcomingMatches(formatDateToString(selectedDate));
    loadAutomationLogs();

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      if (window.predictionAutoInterval) {
        clearInterval(window.predictionAutoInterval);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 날짜 변경 시 경기 목록 다시 로딩
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    setSelectedMatches(new Set()); // 날짜 변경 시 선택 초기화
    loadUpcomingMatches(formatDateToString(newDate));
  };

  // 경기 목록 가져오기
  const loadUpcomingMatches = async (dateStr?: string) => {
    try {
      setIsLoading(true);
      const targetDate = dateStr || formatDateToString(selectedDate);

      const matches = await getUpcomingMatches(targetDate);
      setUpcomingMatches(matches);
      setSelectedMatches(new Set()); // 새로고침 시 선택 초기화
    } catch (error) {
      console.error('경기 목록 가져오기 오류:', error);
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

  // 경기 선택 토글
  const toggleMatchSelection = (matchId: number) => {
    setSelectedMatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleAllMatches = () => {
    const allMatchIds = upcomingMatches.map(m => m.id);

    if (selectedMatches.size === allMatchIds.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(allMatchIds));
    }
  };

  // 리그별 전체 선택/해제
  const toggleLeagueMatches = (leagueId: number) => {
    const leagueMatchIds = upcomingMatches
      .filter(m => m.league.id === leagueId)
      .map(m => m.id);

    const allSelected = leagueMatchIds.every(id => selectedMatches.has(id));

    setSelectedMatches(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        leagueMatchIds.forEach(id => newSet.delete(id));
      } else {
        leagueMatchIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  // 모든 예측 분석 생성 (수동 실행)
  const handleGenerateAllPredictions = async () => {
    startTransition(async () => {
      try {
        const results = await generateAllPredictions(formatDateToString(selectedDate), 'manual');

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

  // 선택한 경기들 예측 분석 생성
  const handleGenerateSelectedPredictions = async () => {
    if (selectedMatches.size === 0) {
      toast.error('경기를 선택해주세요.');
      return;
    }

    // 선택된 경기들만 필터링
    const selectedMatchList = upcomingMatches.filter(m => selectedMatches.has(m.id));

    // 선택된 경기들을 리그별로 그룹화
    const groupedByLeague = selectedMatchList.reduce((acc, match) => {
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

    const selectedGroups = Object.values(groupedByLeague);

    startTransition(async () => {
      try {
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        let totalMatchesProcessed = 0;

        for (const group of selectedGroups) {
          // 선택된 경기 ID 목록 전달
          const matchIds = group.matches.map(m => m.id);
          const result = await generateSingleLeaguePrediction(formatDateToString(selectedDate), group.league.id, 'manual', matchIds);

          if (result.status === 'success') {
            successCount++;
            totalMatchesProcessed += result.matches_count;
          } else if (result.status === 'skipped') {
            skippedCount++;
          } else {
            errorCount++;
          }
        }

        loadAutomationLogs();
        toast.success(`${totalMatchesProcessed}경기 예측 게시글 생성 완료`);
        setSelectedMatches(new Set()); // 선택 초기화
      } catch (error) {
        console.error('선택 경기 예측 분석 생성 오류:', error);
        toast.error('예측 분석 생성에 실패했습니다.');
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

        const result = await testPredictionGeneration(formatDateToString(selectedDate));

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
    { id: 'matches', label: '경기 목록' },
    { id: 'automation', label: '자동화 설정' },
  ];

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-[#F0F0F0]">승무패 예측 관리</h1>

      <div className="mb-4 p-4 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg border border-black/7 dark:border-white/10">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>안내:</strong> 이 기능은 API-Football의 Predictions 데이터를 기반으로 경기 예측 게시글을 자동 생성합니다.<br />
          프리미어리그, 라리가, 분데스리가, 세리에A, 리그앙, K리그1, J1리그, 챔피언스리그 등 주요 리그만 필터링됩니다.
        </p>
      </div>

      <TabList
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'matches' | 'automation')}
        variant="minimal"
      />

      {activeTab === 'matches' && (
        <div className="space-y-4">
          {/* 날짜 선택 및 액션 버튼 */}
          <div className="flex flex-wrap gap-4 items-end mb-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                날짜 선택
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                <span>{format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}</span>
              </button>
              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      handleDateChange(date);
                      setShowCalendar(false);
                    }}
                    onClose={() => setShowCalendar(false)}
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => loadUpcomingMatches()}
              disabled={isLoading}
              className="bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#333333] flex items-center text-gray-900 dark:text-[#F0F0F0] h-[42px]"
            >
              {isLoading ? (
                <Spinner size="xs" className="mr-2" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              새로고침
            </button>
            <Button
              onClick={handleGenerateSelectedPredictions}
              disabled={isPending || selectedMatches.size === 0}
            >
              {isPending ? (
                <Spinner size="xs" className="mr-2" />
              ) : (
                <Target className="mr-2 h-4 w-4" />
              )}
              선택한 경기 예측 생성 ({selectedMatches.size})
            </Button>
            <Button
              onClick={handleGenerateAllPredictions}
              disabled={isPending}
              variant="outline"
            >
              {isPending ? (
                <Spinner size="xs" className="mr-2" />
              ) : (
                <Target className="mr-2 h-4 w-4" />
              )}
              전체 리그 예측 생성
            </Button>
          </div>

          {/* 전체 선택 체크박스 */}
          {upcomingMatches.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b border-black/7 dark:border-white/10">
              <input
                type="checkbox"
                id="select-all-matches"
                checked={selectedMatches.size === upcomingMatches.length && upcomingMatches.length > 0}
                onChange={toggleAllMatches}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-[#F0F0F0] focus:ring-gray-500"
              />
              <label htmlFor="select-all-matches" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                전체 선택 ({upcomingMatches.length}경기)
              </label>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : leagueGroups.length === 0 ? (
            <div className="text-center p-8 bg-[#F5F5F5] dark:bg-[#262626] rounded-lg">
              <p className="text-lg text-gray-600 dark:text-gray-400">{format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 예정된 경기가 없습니다.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                다른 날짜를 선택해보세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leagueGroups.map((group) => {
                const leagueMatchIds = group.matches.map(m => m.id);
                const allLeagueMatchesSelected = leagueMatchIds.every(id => selectedMatches.has(id));
                const someLeagueMatchesSelected = leagueMatchIds.some(id => selectedMatches.has(id));

                return (
                  <div key={group.league.id} className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {/* 리그 전체 선택 체크박스 */}
                        <input
                          type="checkbox"
                          id={`league-${group.league.id}`}
                          checked={allLeagueMatchesSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someLeagueMatchesSelected && !allLeagueMatchesSelected;
                          }}
                          onChange={() => toggleLeagueMatches(group.league.id)}
                          className="w-5 h-5 mr-3 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-[#F0F0F0] focus:ring-gray-500 cursor-pointer"
                        />
                        <Image
                          src={group.league.logo}
                          alt={group.league.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 mr-3"
                        />
                        <label htmlFor={`league-${group.league.id}`} className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] cursor-pointer">
                          {group.league.name}
                        </label>
                        <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-sm">
                          {group.matches.length}경기
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {group.matches.map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-[#F5F5F5] dark:bg-[#262626] rounded-md">
                          <div className="flex items-center space-x-4">
                            {/* 경기별 체크박스 */}
                            <input
                              type="checkbox"
                              id={`match-${match.id}`}
                              checked={selectedMatches.has(match.id)}
                              onChange={() => toggleMatchSelection(match.id)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-[#F0F0F0] focus:ring-gray-500 cursor-pointer"
                            />
                            <label htmlFor={`match-${match.id}`} className="flex items-center space-x-4 cursor-pointer">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{match.teams.home.name}</span>
                              </div>
                              <span className="text-gray-500 dark:text-gray-400">vs</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{match.teams.away.name}</span>
                              </div>
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handlePreview(match)}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              미리보기
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(match.date).toLocaleString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-6">
          {/* 자동화 상태 카드 */}
          <div className="bg-white dark:bg-[#1D1D1D] p-6 border border-black/7 dark:border-white/10 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F0F0F0]">예측 분석 자동 생성 상태</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                autoGenerateStatus === 'running' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                autoGenerateStatus === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {autoGenerateStatus === 'running' ? '🟢 실행 중' :
                 autoGenerateStatus === 'error' ? '🔴 오류' :
                 '⚪ 대기 중'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">자동화 상태</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">
                  {autoGenerateEnabled ? '🟢 활성화' : '🔴 비활성화'}
                </p>
              </div>

              <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">실행 시간</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">매일 {autoGenerateTime}</p>
              </div>

              <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">마지막 실행</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">
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

              <Button
                onClick={handleTestPredictionGeneration}
                disabled={isPending}
              >
                {isPending ? (
                  <Spinner size="xs" className="mr-2" />
                ) : (
                  <Target className="mr-2 h-4 w-4" />
                )}
                수동 테스트
              </Button>
            </div>
          </div>

          {/* 자동화 설정 카드 */}
          <div className="bg-white dark:bg-[#1D1D1D] p-6 border border-black/7 dark:border-white/10 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#F0F0F0]">자동화 설정</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  매일 실행 시간
                </label>
                <select
                  value={autoGenerateTime}
                  onChange={(e) => setAutoGenerateTime(e.target.value)}
                  className="w-full p-2 rounded-md bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 text-gray-900 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="06:00">오전 6시</option>
                  <option value="07:00">오전 7시</option>
                  <option value="08:00">오전 8시</option>
                  <option value="09:00">오전 9시 (권장)</option>
                  <option value="10:00">오전 10시</option>
                  <option value="21:00">오후 9시</option>
                  <option value="22:00">오후 10시</option>
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  다음날 경기 예측 분석을 생성할 시간을 설정합니다.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">📋 동작 방식</h3>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>• 매일 설정된 시간에 다음날 경기를 조회합니다</li>
                  <li>• API-Football Predictions API로 각 경기 예측 데이터를 가져옵니다</li>
                  <li>• 승률, 팀 비교, 최근 폼, 상대전적 등 데이터를 게시글로 작성합니다</li>
                  <li>• 해당 리그 게시판에 자동으로 게시됩니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 자동화 로그 카드 */}
          <div className="bg-white dark:bg-[#1D1D1D] p-6 border border-black/7 dark:border-white/10 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#F0F0F0]">자동화 로그</h2>
            <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">최근 자동화 실행 기록:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {automationLogs.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">아직 실행 기록이 없습니다.</div>
                ) : (
                  automationLogs.map((log, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{formatDate(log.created_at) || '-'}</span>
                      <span className={`ml-2 ${
                        log.status === 'success' ? 'text-green-600 dark:text-green-400' :
                        log.status === 'error' ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
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
      <PreviewModal
        match={previewMatch}
        data={previewData}
        isLoading={previewLoading}
        onClose={closePreview}
      />
    </div>
  );
}

