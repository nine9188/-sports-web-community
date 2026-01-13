'use client';

import { useState, useEffect } from 'react';
import { fetchFriendlyMatches, fetchFriendlyTeams, fetchAllFriendlyTeams, uploadTeamLogosToStorage } from './actions';
import { fetchAllFixtureData } from '../actions';

interface FriendlyMatch {
  id: number;
  date: string;
  status: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  league: string;
  round: string;
}

interface NationalTeam {
  id: number;
  name: string;
  logo: string;
  country: string;
}

export default function FriendlyMatchesPage() {
  const [activeTab, setActiveTab] = useState<'matches' | 'teams'>('matches');
  const [matches, setMatches] = useState<FriendlyMatch[]>([]);
  const [teams, setTeams] = useState<NationalTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'upcoming' | 'recent'>('upcoming');
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');
  const [apiStats, setApiStats] = useState<{ totalFromApi: number; seasonsChecked: number[]; fromTeamsApi?: number; fromFixturesApi?: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    uploaded: number;
    skipped: number;
    failed: number;
  } | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    uploaded: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // 경기 상세 데이터
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchDetailLoading, setMatchDetailLoading] = useState(false);
  const [matchDetail, setMatchDetail] = useState<{
    fixture: any;
    events: any;
    lineups: any;
    statistics: any;
    predictions: any;
  } | null>(null);

  useEffect(() => {
    if (activeTab === 'matches') {
      loadMatches();
    } else {
      loadTeams();
    }
  }, [dateRange, activeTab, selectedSeason]);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchFriendlyMatches(dateRange);

    if (result.success) {
      setMatches(result.matches);
    } else {
      setError(result.error || '데이터를 불러오는데 실패했습니다.');
    }

    setLoading(false);
  };

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    setApiStats(null);

    if (selectedSeason === 'all') {
      // 모든 시즌에서 중복 제거하여 가져오기 (teams API + fixtures API)
      const result = await fetchAllFriendlyTeams();

      if (result.success) {
        setTeams(result.teams);
        setRawResponse(null);
        setApiStats({
          totalFromApi: result.totalFromApi,
          seasonsChecked: result.seasonsChecked,
          fromTeamsApi: result.fromTeamsApi,
          fromFixturesApi: result.fromFixturesApi,
        });
      } else {
        setError(result.error || '데이터를 불러오는데 실패했습니다.');
      }
    } else {
      // 단일 시즌
      const result = await fetchFriendlyTeams(selectedSeason);

      if (result.success) {
        setTeams(result.teams);
        setRawResponse(result.rawResponse);
      } else {
        setError(result.error || '데이터를 불러오는데 실패했습니다.');
      }
    }

    setLoading(false);
  };

  // 경기 상세 데이터 로드
  const loadMatchDetail = async (fixtureId: number) => {
    setSelectedMatchId(fixtureId);
    setMatchDetailLoading(true);
    setMatchDetail(null);

    try {
      const result = await fetchAllFixtureData(fixtureId.toString());
      setMatchDetail(result);
    } catch (err) {
      console.error('경기 상세 로드 실패:', err);
    } finally {
      setMatchDetailLoading(false);
    }
  };

  // Supabase Storage에 로고 업로드 (배치 처리)
  const handleUploadLogos = async () => {
    if (teams.length === 0) return;

    setUploading(true);
    setUploadResult(null);
    setUploadProgress({ current: 0, total: teams.length, uploaded: 0, skipped: 0, failed: 0 });

    const BATCH_SIZE = 20; // 한 번에 20개씩 처리
    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < teams.length; i += BATCH_SIZE) {
      const batch = teams.slice(i, i + BATCH_SIZE);
      const result = await uploadTeamLogosToStorage(batch);

      totalUploaded += result.uploaded;
      totalSkipped += result.skipped;
      totalFailed += result.failed;
      allErrors.push(...result.errors);

      setUploadProgress({
        current: Math.min(i + BATCH_SIZE, teams.length),
        total: teams.length,
        uploaded: totalUploaded,
        skipped: totalSkipped,
        failed: totalFailed,
      });
    }

    setUploadResult({
      success: totalFailed === 0,
      uploaded: totalUploaded,
      skipped: totalSkipped,
      failed: totalFailed,
      errors: allErrors,
    });
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#121212] p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          국가대표 친선경기 (International Friendlies)
        </h1>

        {/* 탭 선택 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-4 mb-6 shadow">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-md transition-colors font-medium ${
                activeTab === 'matches'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              경기 목록
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-4 py-2 rounded-md transition-colors font-medium ${
                activeTab === 'teams'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              등록된 팀 목록
            </button>
          </div>

          {/* 경기 탭일 때만 필터 표시 */}
          {activeTab === 'matches' && (
            <div className="flex gap-4">
              <button
                onClick={() => setDateRange('upcoming')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  dateRange === 'upcoming'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                예정된 경기
              </button>
              <button
                onClick={() => setDateRange('recent')}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  dateRange === 'recent'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                최근 경기
              </button>
            </div>
          )}

          {/* 팀 탭일 때 시즌 선택 */}
          {activeTab === 'teams' && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedSeason('all')}
                className={`px-3 py-1.5 rounded text-sm transition-colors font-medium ${
                  selectedSeason === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                전체 (중복제거)
              </button>
              {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedSeason(year)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    selectedSeason === year
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 컨텐츠 영역 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : activeTab === 'matches' ? (
            /* 경기 목록 */
            matches.length === 0 ? (
              <div className="p-8 text-center text-gray-500">경기가 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => match.status === 'FT' && loadMatchDetail(match.id)}
                    className={`p-4 transition-colors ${
                      match.status === 'FT'
                        ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    } ${selectedMatchId === match.id ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(match.date).toLocaleString('ko-KR')} | {match.round}
                      </span>
                      <div className="flex items-center gap-2">
                        {match.status === 'FT' && (
                          <span className="text-xs text-blue-500">클릭하여 상세보기</span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${
                          match.status === 'FT' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                          match.status === 'NS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <img src={match.homeLogo} alt={match.homeTeam} className="w-8 h-8" />
                        <span className="font-medium text-gray-900 dark:text-white">{match.homeTeam}</span>
                      </div>

                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded font-bold text-gray-900 dark:text-white min-w-[80px] text-center">
                        {match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
                      </div>

                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="font-medium text-gray-900 dark:text-white">{match.awayTeam}</span>
                        <img src={match.awayLogo} alt={match.awayTeam} className="w-8 h-8" />
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      Fixture ID: {match.id}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* 팀 목록 */
            teams.length === 0 ? (
              <div className="p-8 text-center text-gray-500">등록된 팀이 없습니다.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-16 h-16 mb-2"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                      {team.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {team.country}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      ID: {team.id}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* 경기 상세 데이터 */}
        {activeTab === 'matches' && selectedMatchId && (
          <div className="mt-6 bg-white dark:bg-[#1D1D1D] rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">
                경기 상세 데이터 (Fixture ID: {selectedMatchId})
              </h3>
              <button
                onClick={() => { setSelectedMatchId(null); setMatchDetail(null); }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕ 닫기
              </button>
            </div>

            {matchDetailLoading ? (
              <div className="p-8 text-center text-gray-500">상세 데이터 로딩 중...</div>
            ) : matchDetail ? (
              <div className="p-4 space-y-4">
                {/* 데이터 요약 */}
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  {[
                    { label: 'Fixture', data: matchDetail.fixture, key: 'fixture' },
                    { label: 'Events', data: matchDetail.events, key: 'events' },
                    { label: 'Lineups', data: matchDetail.lineups, key: 'lineups' },
                    { label: 'Statistics', data: matchDetail.statistics, key: 'statistics' },
                    { label: 'Predictions', data: matchDetail.predictions, key: 'predictions' },
                  ].map((item) => {
                    const count = item.data?.response?.length || 0;
                    return (
                      <div
                        key={item.key}
                        className={`p-3 rounded ${count > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                      >
                        <p className="font-bold text-lg">{count}</p>
                        <p className="text-xs text-gray-500">{item.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Events */}
                {matchDetail.events?.response?.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-bold mb-3 text-green-600">Events ({matchDetail.events.response.length}개)</h4>
                    <div className="space-y-2 max-h-60 overflow-auto">
                      {matchDetail.events.response.map((event: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="font-mono w-10">{event.time?.elapsed}'</span>
                          <span>{event.type === 'Goal' ? '⚽' : event.type === 'Card' ? (event.detail === 'Yellow Card' ? '🟨' : '🟥') : event.type === 'subst' ? '🔄' : '📋'}</span>
                          <span className="flex-1">{event.player?.name}</span>
                          <span className="text-gray-500 text-xs">{event.team?.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lineups */}
                {matchDetail.lineups?.response?.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-bold mb-3 text-purple-600">Lineups ({matchDetail.lineups.response.length}팀)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {matchDetail.lineups.response.map((team: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <img src={team.team?.logo} alt="" className="w-6 h-6" />
                            <span className="font-bold">{team.team?.name}</span>
                            <span className="text-gray-500">({team.formation})</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            선발: {team.startXI?.length || 0}명 | 교체: {team.substitutes?.length || 0}명
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                {matchDetail.statistics?.response?.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-bold mb-3 text-orange-600">Statistics ({matchDetail.statistics.response.length}팀)</h4>
                    <div className="space-y-2">
                      {matchDetail.statistics.response[0]?.statistics?.slice(0, 8).map((stat: any, idx: number) => {
                        const homeStat = matchDetail.statistics.response[0]?.statistics?.find((s: any) => s.type === stat.type);
                        const awayStat = matchDetail.statistics.response[1]?.statistics?.find((s: any) => s.type === stat.type);
                        return (
                          <div key={idx} className="flex items-center text-sm">
                            <span className="w-16 text-right font-bold">{homeStat?.value ?? '-'}</span>
                            <span className="flex-1 text-center text-xs text-gray-500">{stat.type}</span>
                            <span className="w-16 font-bold">{awayStat?.value ?? '-'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 데이터 없음 경고 */}
                {(!matchDetail.events?.response?.length && !matchDetail.lineups?.response?.length && !matchDetail.statistics?.response?.length) && (
                  <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-300">
                    <p className="font-bold">데이터 없음!</p>
                    <p className="text-sm">이 경기는 Events, Lineups, Statistics 데이터가 없습니다.</p>
                    <p className="text-sm mt-2">국가대표 친선경기는 일부 경기만 상세 데이터를 제공합니다.</p>
                  </div>
                )}

                {/* Raw JSON */}
                <details>
                  <summary className="cursor-pointer text-sm text-blue-600 hover:underline">Raw JSON 보기</summary>
                  <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-80 text-xs">
                    {JSON.stringify(matchDetail, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">데이터를 불러올 수 없습니다.</div>
            )}
          </div>
        )}

        {/* 총 개수 */}
        {!loading && (
          activeTab === 'matches' && matches.length > 0 ? (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              총 {matches.length}개 경기
            </div>
          ) : activeTab === 'teams' && teams.length > 0 ? (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              <p>총 {teams.length}개 팀 (중복 제거됨)</p>
              {apiStats && (
                <div className="text-xs mt-1 space-y-1">
                  <p>API 총 응답: {apiStats.totalFromApi}개 | 시즌: {apiStats.seasonsChecked.join(', ')}</p>
                  {(apiStats.fromTeamsApi !== undefined || apiStats.fromFixturesApi !== undefined) && (
                    <p className="text-blue-600 dark:text-blue-400">
                      teams API: {apiStats.fromTeamsApi || 0}개 | fixtures API: {apiStats.fromFixturesApi || 0}개 (경기에서 추출)
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-2 justify-center mt-3 flex-wrap">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(teams, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `friendly-teams-${teams.length}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  JSON 다운로드
                </button>
                <button
                  onClick={() => {
                    const header = 'id,name,logo,country\n';
                    const csv = teams.map(t => `${t.id},"${t.name}","${t.logo}","${t.country}"`).join('\n');
                    const blob = new Blob([header + csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `friendly-teams-${teams.length}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  CSV 다운로드
                </button>
                <button
                  onClick={handleUploadLogos}
                  disabled={uploading}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '업로드 중...' : 'Supabase Storage 업로드'}
                </button>
              </div>

              {/* 업로드 진행상황 */}
              {uploadProgress && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
                  <div className="flex justify-between text-sm mb-2">
                    <span>진행: {uploadProgress.current} / {uploadProgress.total}</span>
                    <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 mb-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600">업로드: {uploadProgress.uploaded}</span>
                    <span className="text-yellow-600">스킵: {uploadProgress.skipped}</span>
                    <span className="text-red-600">실패: {uploadProgress.failed}</span>
                  </div>
                </div>
              )}

              {/* 업로드 결과 */}
              {uploadResult && (
                <div className={`mt-4 p-4 rounded ${uploadResult.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <p className={`font-bold ${uploadResult.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                    {uploadResult.success ? '업로드 완료!' : '업로드 완료 (일부 실패)'}
                  </p>
                  <div className="flex gap-4 text-sm mt-2">
                    <span>업로드: {uploadResult.uploaded}</span>
                    <span>스킵(이미 있음): {uploadResult.skipped}</span>
                    <span>실패: {uploadResult.failed}</span>
                  </div>
                  {uploadResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer text-red-600">실패 목록 보기</summary>
                      <ul className="text-xs mt-2 max-h-40 overflow-auto">
                        {uploadResult.errors.map((err, i) => (
                          <li key={i} className="text-red-600">{err}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          ) : null
        )}

        {/* Raw API Response (단일 시즌 선택 시에만) */}
        {activeTab === 'teams' && selectedSeason !== 'all' && rawResponse && (
          <div className="mt-6 bg-white dark:bg-[#1D1D1D] rounded-lg shadow p-4">
            <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
              Raw API Response (디버그용)
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              요청: league={10}, season={selectedSeason}
            </div>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96 text-xs text-gray-800 dark:text-gray-200">
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
