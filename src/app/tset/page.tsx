'use client';

import { useState, useEffect } from 'react';
import { fetchPredictions, fetchTodayFixtures, PredictionApiResponse } from './actions';
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

interface Fixture {
  id: number;
  home: string;
  away: string;
  league: string;
  date: string;
  status: string;
}

export default function PredictionsTestPage() {
  const [fixtureId, setFixtureId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data: PredictionApiResponse | null;
    error: string | null;
    rawResponse?: unknown;
  } | null>(null);

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(true);

  // 오늘 경기 목록 가져오기
  useEffect(() => {
    async function loadFixtures() {
      setFixturesLoading(true);
      const res = await fetchTodayFixtures();
      if (res.success) {
        setFixtures(res.fixtures);
      }
      setFixturesLoading(false);
    }
    loadFixtures();
  }, []);

  // Predictions API 호출
  const handleFetch = async () => {
    if (!fixtureId.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetchPredictions(fixtureId);
      setResult(res);
    } catch (err) {
      setResult({
        success: false,
        data: null,
        error: err instanceof Error ? err.message : '알 수 없는 오류'
      });
    } finally {
      setLoading(false);
    }
  };

  // 경기 선택 시 자동 조회
  const handleFixtureSelect = (id: number) => {
    setFixtureId(id.toString());
    setTimeout(async () => {
      setLoading(true);
      setResult(null);
      const res = await fetchPredictions(id.toString());
      setResult(res);
      setLoading(false);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#121212] p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          API-Football Predictions 전체 데이터 분석
        </h1>

        {/* 입력 섹션 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-4 mb-6 shadow">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fixture ID
              </label>
              <input
                type="text"
                value={fixtureId}
                onChange={(e) => setFixtureId(e.target.value)}
                placeholder="예: 1388447"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-[#2D2D2D] text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              />
            </div>
            <button
              onClick={handleFetch}
              disabled={loading || !fixtureId.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '로딩...' : '조회'}
            </button>
          </div>
        </div>

        {/* 오늘 경기 목록 */}
        <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-4 mb-6 shadow">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            오늘 경기 (클릭하여 조회)
          </h2>
          {fixturesLoading ? (
            <p className="text-gray-500 dark:text-gray-400">경기 목록 로딩 중...</p>
          ) : fixtures.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">오늘 경기가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {fixtures.map((fixture) => (
                <button
                  key={fixture.id}
                  onClick={() => handleFixtureSelect(fixture.id)}
                  className={`p-3 text-left rounded border transition-colors ${
                    fixtureId === fixture.id.toString()
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {fixture.league} | ID: {fixture.id}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {fixture.home} vs {fixture.away}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 결과 표시 */}
        {result && (
          <div className="space-y-6">
            {result.error ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-600 dark:text-red-400">
                Error: {result.error}
              </div>
            ) : result.data?.response?.[0] && (
              <FullDataView data={result.data.response[0]} />
            )}

            {/* Raw JSON */}
            <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-4 shadow">
              <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Raw JSON Response
              </h2>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[400px] text-xs">
                {JSON.stringify(result.rawResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 데모 스타일 시각화 컴포넌트 (레이더 차트 + 비교 막대)
// ============================================
function DemoStyleVisualization({ data }: { data: any }) {
  const { predictions, teams, comparison } = data;

  // 레이더 차트용 데이터 변환 (0-100 스케일)
  const radarData = [
    {
      subject: 'Strength',
      home: parseInt(teams.home.last_5?.form) || 0,
      away: parseInt(teams.away.last_5?.form) || 0,
      fullMark: 100,
    },
    {
      subject: 'Attacking',
      home: parseInt(teams.home.last_5?.att) || 0,
      away: parseInt(teams.away.last_5?.att) || 0,
      fullMark: 100,
    },
    {
      subject: 'Defensive',
      home: parseInt(teams.home.last_5?.def) || 0,
      away: parseInt(teams.away.last_5?.def) || 0,
      fullMark: 100,
    },
    {
      subject: 'Wins',
      home: normalizeValue(teams.home.league?.fixtures?.wins?.total, 15),
      away: normalizeValue(teams.away.league?.fixtures?.wins?.total, 15),
      fullMark: 100,
    },
    {
      subject: 'Draws',
      home: normalizeValue(teams.home.league?.fixtures?.draws?.total, 10),
      away: normalizeValue(teams.away.league?.fixtures?.draws?.total, 10),
      fullMark: 100,
    },
    {
      subject: 'Loss',
      home: normalizeValue(teams.home.league?.fixtures?.loses?.total, 15),
      away: normalizeValue(teams.away.league?.fixtures?.loses?.total, 15),
      fullMark: 100,
    },
    {
      subject: 'Goals For',
      home: normalizeValue(teams.home.league?.goals?.for?.total?.total, 50),
      away: normalizeValue(teams.away.league?.goals?.for?.total?.total, 50),
      fullMark: 100,
    },
    {
      subject: 'Goals Against',
      home: 100 - normalizeValue(teams.home.league?.goals?.against?.total?.total, 50),
      away: 100 - normalizeValue(teams.away.league?.goals?.against?.total?.total, 50),
      fullMark: 100,
    },
  ];

  // 비교 막대 데이터
  const comparisonData = [
    { label: 'STRENGTH', home: parseInt(comparison.form?.home) || 0, away: parseInt(comparison.form?.away) || 0 },
    { label: 'ATTACKING POTENTIAL', home: parseInt(comparison.att?.home) || 0, away: parseInt(comparison.att?.away) || 0 },
    { label: 'DEFENSIVE POTENTIAL', home: parseInt(comparison.def?.home) || 0, away: parseInt(comparison.def?.away) || 0 },
    { label: 'POISSON DISTRIBUTION', home: parseInt(comparison.poisson_distribution?.home) || 0, away: parseInt(comparison.poisson_distribution?.away) || 0 },
    { label: 'STRENGTH H2H', home: parseInt(comparison.h2h?.home) || 0, away: parseInt(comparison.h2h?.away) || 0 },
    { label: 'GOALS H2H', home: parseInt(comparison.goals?.home) || 0, away: parseInt(comparison.goals?.away) || 0 },
    { label: 'WINS THE GAME', home: parseInt(predictions.percent?.home) || 0, away: parseInt(predictions.percent?.away) || 0 },
  ];

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg p-6 shadow">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white text-center">
        Match Prediction Analysis
      </h2>

      {/* 팀 헤더 */}
      <div className="flex items-center justify-center gap-8 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <img src={teams.home.logo} alt={teams.home.name} className="w-8 h-8" />
          <span className="font-semibold text-gray-900 dark:text-white">{teams.home.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <img src={teams.away.logo} alt={teams.away.name} className="w-8 h-8" />
          <span className="font-semibold text-gray-900 dark:text-white">{teams.away.name}</span>
        </div>
      </div>

      {/* 메인 시각화 - 레이더 + 비교 막대 (세로 배치) */}
      <div className="space-y-6">
        {/* 레이더 차트 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
            Team Comparison Radar
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                tickCount={11}
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
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
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

        {/* 비교 막대 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">
            Head-to-Head Comparison
          </h3>
          <div className="space-y-4">
            {comparisonData.map((item, idx) => (
              <DemoComparisonBar
                key={idx}
                label={item.label}
                homeValue={item.home}
                awayValue={item.away}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 예측 결과 요약 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">AI Prediction</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {predictions.advice || 'No advice available'}
          </p>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{predictions.percent?.home}</p>
              <p className="text-xs text-gray-500">Home Win</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{predictions.percent?.draw}</p>
              <p className="text-xs text-gray-500">Draw</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{predictions.percent?.away}</p>
              <p className="text-xs text-gray-500">Away Win</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 값 정규화 함수 (0-100 스케일)
function normalizeValue(value: number | undefined, maxExpected: number): number {
  if (!value) return 0;
  return Math.min(Math.round((value / maxExpected) * 100), 100);
}

// 데모 스타일 비교 막대
function DemoComparisonBar({ label, homeValue, awayValue }: { label: string; homeValue: number; awayValue: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-blue-600 w-12">{homeValue}%</span>
        <span className="text-gray-600 dark:text-gray-400 font-medium text-center flex-1">{label}</span>
        <span className="font-semibold text-green-600 w-12 text-right">{awayValue}%</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${homeValue}%` }}
        />
        <div
          className="bg-green-500 transition-all duration-500"
          style={{ width: `${awayValue}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// 전체 데이터 뷰 컴포넌트
// ============================================
function FullDataView({ data }: { data: any }) {
  const { predictions, league, teams, comparison, h2h } = data;

  return (
    <div className="space-y-6">
      {/* 데모 스타일 시각화 (최상단) */}
      <DemoStyleVisualization data={data} />

      {/* 1. PREDICTIONS - 예측 결과 */}
      <Section title="1. PREDICTIONS (예측 결과)" color="blue">
        <DataTable data={[
          { field: 'winner.id', value: predictions.winner?.id, desc: '예상 승자 팀 ID' },
          { field: 'winner.name', value: predictions.winner?.name, desc: '예상 승자 팀명' },
          { field: 'winner.comment', value: predictions.winner?.comment, desc: '승자 코멘트 (Win or draw 등)' },
          { field: 'win_or_draw', value: String(predictions.win_or_draw), desc: '승/무 가능성 (true=홈팀이 최소 무승부)' },
          { field: 'under_over', value: predictions.under_over, desc: '총 골 언더/오버 예측' },
          { field: 'goals.home', value: predictions.goals?.home, desc: '홈팀 예상 골 (마이너스=그 이하)' },
          { field: 'goals.away', value: predictions.goals?.away, desc: '원정팀 예상 골' },
          { field: 'advice', value: predictions.advice, desc: 'AI 베팅 조언' },
          { field: 'percent.home', value: predictions.percent?.home, desc: '홈 승리 확률' },
          { field: 'percent.draw', value: predictions.percent?.draw, desc: '무승부 확률' },
          { field: 'percent.away', value: predictions.percent?.away, desc: '원정 승리 확률' },
        ]} />
      </Section>

      {/* 2. LEAGUE - 리그 정보 */}
      <Section title="2. LEAGUE (리그 정보)" color="green">
        <DataTable data={[
          { field: 'id', value: league.id, desc: '리그 ID' },
          { field: 'name', value: league.name, desc: '리그명' },
          { field: 'country', value: league.country, desc: '국가' },
          { field: 'logo', value: league.logo, desc: '리그 로고 URL', isUrl: true },
          { field: 'flag', value: league.flag, desc: '국기 URL', isUrl: true },
          { field: 'season', value: league.season, desc: '시즌' },
        ]} />
      </Section>

      {/* 3. COMPARISON - 팀 비교 */}
      <Section title="3. COMPARISON (팀 비교 - 7개 지표)" color="purple">
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          각 지표별 홈/원정팀 우위를 백분율로 표시 (합계 100%)
        </div>
        <DataTable data={[
          { field: 'form', value: `홈 ${comparison.form?.home} / 원정 ${comparison.form?.away}`, desc: '최근 경기 폼' },
          { field: 'att', value: `홈 ${comparison.att?.home} / 원정 ${comparison.att?.away}`, desc: '공격력' },
          { field: 'def', value: `홈 ${comparison.def?.home} / 원정 ${comparison.def?.away}`, desc: '수비력' },
          { field: 'poisson_distribution', value: `홈 ${comparison.poisson_distribution?.home} / 원정 ${comparison.poisson_distribution?.away}`, desc: '포아송 분포 (통계 기반 승률)' },
          { field: 'h2h', value: `홈 ${comparison.h2h?.home} / 원정 ${comparison.h2h?.away}`, desc: '상대 전적' },
          { field: 'goals', value: `홈 ${comparison.goals?.home} / 원정 ${comparison.goals?.away}`, desc: '득점력' },
          { field: 'total', value: `홈 ${comparison.total?.home} / 원정 ${comparison.total?.away}`, desc: '종합 (모든 지표 평균)' },
        ]} />
        <ComparisonBars comparison={comparison} />
      </Section>

      {/* 4. TEAMS - 팀 상세 정보 */}
      <Section title="4. TEAMS (팀 상세 정보)" color="orange">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TeamDetailView team={teams.home} label="HOME (홈팀)" />
          <TeamDetailView team={teams.away} label="AWAY (원정팀)" />
        </div>
      </Section>

      {/* 5. H2H - 상대 전적 */}
      <Section title="5. H2H (상대 전적)" color="red">
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          두 팀의 과거 맞대결 기록 (최근 {h2h?.length || 0}경기)
        </div>
        {h2h && h2h.length > 0 ? (
          <div className="space-y-2">
            {h2h.map((match: any, idx: number) => (
              <H2HMatchRow key={match.fixture?.id || idx} match={match} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">상대 전적 데이터 없음</p>
        )}
      </Section>
    </div>
  );
}

// 팀 상세 정보 컴포넌트
function TeamDetailView({ team, label }: { team: any; label: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <img src={team.logo} alt={team.name} className="w-8 h-8" />
          <span className="font-semibold text-gray-900 dark:text-white">{label}: {team.name}</span>
          <span className="text-xs text-gray-500">ID: {team.id}</span>
        </div>
        <span className="text-gray-500">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="p-4 space-y-4 text-sm">
          {/* 4.1 last_5 - 최근 5경기 */}
          <SubSection title="4.1 last_5 (최근 5경기)">
            <DataTable compact data={[
              { field: 'played', value: team.last_5?.played, desc: '경기 수' },
              { field: 'form', value: team.last_5?.form, desc: '폼 지수 (%)' },
              { field: 'att', value: team.last_5?.att, desc: '공격력 (%)' },
              { field: 'def', value: team.last_5?.def, desc: '수비력 (%)' },
              { field: 'goals.for.total', value: team.last_5?.goals?.for?.total, desc: '득점' },
              { field: 'goals.for.average', value: team.last_5?.goals?.for?.average, desc: '평균 득점' },
              { field: 'goals.against.total', value: team.last_5?.goals?.against?.total, desc: '실점' },
              { field: 'goals.against.average', value: team.last_5?.goals?.against?.average, desc: '평균 실점' },
            ]} />
          </SubSection>

          {/* 4.2 league.form - 시즌 폼 */}
          <SubSection title="4.2 league.form (시즌 전체 폼)">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded font-mono text-xs">
              {team.league?.form || 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">W=승, D=무, L=패 (가장 최근이 맨 오른쪽)</p>
          </SubSection>

          {/* 4.3 league.fixtures - 경기 결과 */}
          <SubSection title="4.3 league.fixtures (경기 결과)">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div></div>
              <div className="text-center font-medium">홈</div>
              <div className="text-center font-medium">원정</div>
              <div className="text-center font-medium">합계</div>

              <div>played (경기)</div>
              <div className="text-center">{team.league?.fixtures?.played?.home}</div>
              <div className="text-center">{team.league?.fixtures?.played?.away}</div>
              <div className="text-center font-medium">{team.league?.fixtures?.played?.total}</div>

              <div className="text-green-600">wins (승)</div>
              <div className="text-center">{team.league?.fixtures?.wins?.home}</div>
              <div className="text-center">{team.league?.fixtures?.wins?.away}</div>
              <div className="text-center font-medium">{team.league?.fixtures?.wins?.total}</div>

              <div className="text-yellow-600">draws (무)</div>
              <div className="text-center">{team.league?.fixtures?.draws?.home}</div>
              <div className="text-center">{team.league?.fixtures?.draws?.away}</div>
              <div className="text-center font-medium">{team.league?.fixtures?.draws?.total}</div>

              <div className="text-red-600">loses (패)</div>
              <div className="text-center">{team.league?.fixtures?.loses?.home}</div>
              <div className="text-center">{team.league?.fixtures?.loses?.away}</div>
              <div className="text-center font-medium">{team.league?.fixtures?.loses?.total}</div>
            </div>
          </SubSection>

          {/* 4.4 league.goals - 득실점 */}
          <SubSection title="4.4 league.goals (득실점 통계)">
            <div className="space-y-3">
              <div>
                <p className="font-medium text-green-600 mb-1">득점 (goals.for)</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div></div>
                  <div className="text-center">홈</div>
                  <div className="text-center">원정</div>
                  <div className="text-center">합계</div>
                  <div>total</div>
                  <div className="text-center">{team.league?.goals?.for?.total?.home}</div>
                  <div className="text-center">{team.league?.goals?.for?.total?.away}</div>
                  <div className="text-center font-medium">{team.league?.goals?.for?.total?.total}</div>
                  <div>average</div>
                  <div className="text-center">{team.league?.goals?.for?.average?.home}</div>
                  <div className="text-center">{team.league?.goals?.for?.average?.away}</div>
                  <div className="text-center font-medium">{team.league?.goals?.for?.average?.total}</div>
                </div>
              </div>
              <div>
                <p className="font-medium text-red-600 mb-1">실점 (goals.against)</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div></div>
                  <div className="text-center">홈</div>
                  <div className="text-center">원정</div>
                  <div className="text-center">합계</div>
                  <div>total</div>
                  <div className="text-center">{team.league?.goals?.against?.total?.home}</div>
                  <div className="text-center">{team.league?.goals?.against?.total?.away}</div>
                  <div className="text-center font-medium">{team.league?.goals?.against?.total?.total}</div>
                  <div>average</div>
                  <div className="text-center">{team.league?.goals?.against?.average?.home}</div>
                  <div className="text-center">{team.league?.goals?.against?.average?.away}</div>
                  <div className="text-center font-medium">{team.league?.goals?.against?.average?.total}</div>
                </div>
              </div>
            </div>
          </SubSection>

          {/* 4.5 goals.minute - 시간대별 골 */}
          <SubSection title="4.5 goals.minute (시간대별 골)">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-green-600 mb-2">득점 시간대</p>
                <MinuteChart data={team.league?.goals?.for?.minute} />
              </div>
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">실점 시간대</p>
                <MinuteChart data={team.league?.goals?.against?.minute} />
              </div>
            </div>
          </SubSection>

          {/* 4.6 goals.under_over - 언더/오버 */}
          <SubSection title="4.6 goals.under_over (골 언더/오버)">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-green-600 mb-2">득점 언더/오버</p>
                <UnderOverTable data={team.league?.goals?.for?.under_over} />
              </div>
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">실점 언더/오버</p>
                <UnderOverTable data={team.league?.goals?.against?.under_over} />
              </div>
            </div>
          </SubSection>

          {/* 4.7 biggest - 최대 기록 */}
          <SubSection title="4.7 biggest (최대 기록)">
            <DataTable compact data={[
              { field: 'streak.wins', value: team.league?.biggest?.streak?.wins, desc: '연승 최대' },
              { field: 'streak.draws', value: team.league?.biggest?.streak?.draws, desc: '연속 무승부 최대' },
              { field: 'streak.loses', value: team.league?.biggest?.streak?.loses, desc: '연패 최대' },
              { field: 'wins.home', value: team.league?.biggest?.wins?.home, desc: '홈 최다 골 승리' },
              { field: 'wins.away', value: team.league?.biggest?.wins?.away, desc: '원정 최다 골 승리' },
              { field: 'loses.home', value: team.league?.biggest?.loses?.home, desc: '홈 최다 골 패배' },
              { field: 'loses.away', value: team.league?.biggest?.loses?.away, desc: '원정 최다 골 패배' },
              { field: 'goals.for.home', value: team.league?.biggest?.goals?.for?.home, desc: '홈 최다 득점' },
              { field: 'goals.for.away', value: team.league?.biggest?.goals?.for?.away, desc: '원정 최다 득점' },
              { field: 'goals.against.home', value: team.league?.biggest?.goals?.against?.home, desc: '홈 최다 실점' },
              { field: 'goals.against.away', value: team.league?.biggest?.goals?.against?.away, desc: '원정 최다 실점' },
            ]} />
          </SubSection>

          {/* 4.8 clean_sheet & failed_to_score */}
          <SubSection title="4.8 clean_sheet / failed_to_score">
            <DataTable compact data={[
              { field: 'clean_sheet.home', value: team.league?.clean_sheet?.home, desc: '홈 무실점 경기' },
              { field: 'clean_sheet.away', value: team.league?.clean_sheet?.away, desc: '원정 무실점 경기' },
              { field: 'clean_sheet.total', value: team.league?.clean_sheet?.total, desc: '총 무실점 경기' },
              { field: 'failed_to_score.home', value: team.league?.failed_to_score?.home, desc: '홈 무득점 경기' },
              { field: 'failed_to_score.away', value: team.league?.failed_to_score?.away, desc: '원정 무득점 경기' },
              { field: 'failed_to_score.total', value: team.league?.failed_to_score?.total, desc: '총 무득점 경기' },
            ]} />
          </SubSection>

          {/* 4.9 penalty - 페널티킥 */}
          <SubSection title="4.9 penalty (페널티킥)">
            <DataTable compact data={[
              { field: 'scored.total', value: team.league?.penalty?.scored?.total, desc: 'PK 성공' },
              { field: 'scored.percentage', value: team.league?.penalty?.scored?.percentage, desc: 'PK 성공률' },
              { field: 'missed.total', value: team.league?.penalty?.missed?.total, desc: 'PK 실패' },
              { field: 'missed.percentage', value: team.league?.penalty?.missed?.percentage, desc: 'PK 실패율' },
              { field: 'total', value: team.league?.penalty?.total, desc: 'PK 총 시도' },
            ]} />
          </SubSection>

          {/* 4.10 lineups - 포메이션 */}
          <SubSection title="4.10 lineups (사용 포메이션)">
            <div className="flex flex-wrap gap-2">
              {team.league?.lineups?.map((lineup: any, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {lineup.formation} ({lineup.played}회)
                </span>
              ))}
            </div>
          </SubSection>

          {/* 4.11 cards - 카드 */}
          <SubSection title="4.11 cards (카드 통계)">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-yellow-600 mb-2">옐로카드 시간대</p>
                <MinuteChart data={team.league?.cards?.yellow} isCard />
              </div>
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">레드카드 시간대</p>
                <MinuteChart data={team.league?.cards?.red} isCard />
              </div>
            </div>
          </SubSection>
        </div>
      )}
    </div>
  );
}

// 섹션 컴포넌트
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <div className={`border-l-4 ${colors[color]} rounded-r-lg p-4`}>
      <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

// 서브섹션 컴포넌트
function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
      {children}
    </div>
  );
}

// 데이터 테이블 컴포넌트
function DataTable({ data, compact }: { data: Array<{ field: string; value: any; desc: string; isUrl?: boolean }>; compact?: boolean }) {
  return (
    <table className={`w-full ${compact ? 'text-xs' : 'text-sm'}`}>
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th className="text-left p-2 text-gray-600 dark:text-gray-400">필드</th>
          <th className="text-left p-2 text-gray-600 dark:text-gray-400">값</th>
          <th className="text-left p-2 text-gray-600 dark:text-gray-400">설명</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
            <td className="p-2 font-mono text-blue-600 dark:text-blue-400">{row.field}</td>
            <td className="p-2 font-medium text-gray-900 dark:text-white">
              {row.isUrl ? (
                <a href={row.value} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-xs break-all">
                  {row.value}
                </a>
              ) : row.value ?? <span className="text-gray-400">null</span>}
            </td>
            <td className="p-2 text-gray-500 dark:text-gray-400">{row.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 비교 막대 그래프
function ComparisonBars({ comparison }: { comparison: any }) {
  const items = [
    { key: 'form', label: '폼' },
    { key: 'att', label: '공격' },
    { key: 'def', label: '수비' },
    { key: 'poisson_distribution', label: '포아송' },
    { key: 'h2h', label: 'H2H' },
    { key: 'goals', label: '골' },
    { key: 'total', label: '종합' },
  ];

  return (
    <div className="mt-4 space-y-2">
      {items.map(({ key, label }) => {
        const home = parseInt(comparison[key]?.home) || 0;
        const away = parseInt(comparison[key]?.away) || 0;
        return (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-12 text-right font-medium">{comparison[key]?.home}</span>
            <div className="flex-1 flex h-5 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <div className="bg-blue-500" style={{ width: `${home}%` }} />
              <div className="bg-green-500" style={{ width: `${away}%` }} />
            </div>
            <span className="w-12 font-medium">{comparison[key]?.away}</span>
            <span className="w-16 text-gray-500">{label}</span>
          </div>
        );
      })}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span> 홈팀</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> 원정팀</span>
      </div>
    </div>
  );
}

// 시간대별 차트
function MinuteChart({ data, isCard }: { data: any; isCard?: boolean }) {
  const periods = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'];

  return (
    <div className="space-y-1">
      {periods.map((period) => {
        const item = data?.[period];
        const total = item?.total || 0;
        const pct = item?.percentage ? parseInt(item.percentage) : 0;
        return (
          <div key={period} className="flex items-center gap-2 text-xs">
            <span className="w-14 text-gray-500">{period}</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded h-3 overflow-hidden">
              <div
                className={isCard ? 'bg-yellow-500' : 'bg-blue-500'}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-right">{total || '-'}</span>
            <span className="w-12 text-gray-400">{item?.percentage || '-'}</span>
          </div>
        );
      })}
    </div>
  );
}

// 언더/오버 테이블
function UnderOverTable({ data }: { data: any }) {
  const lines = ['0.5', '1.5', '2.5', '3.5', '4.5'];

  return (
    <div className="text-xs">
      <div className="grid grid-cols-3 gap-1 mb-1 font-medium">
        <span>라인</span>
        <span className="text-center">오버</span>
        <span className="text-center">언더</span>
      </div>
      {lines.map((line) => (
        <div key={line} className="grid grid-cols-3 gap-1 py-1 border-t border-gray-100 dark:border-gray-800">
          <span>{line}</span>
          <span className="text-center text-green-600">{data?.[line]?.over ?? '-'}</span>
          <span className="text-center text-red-600">{data?.[line]?.under ?? '-'}</span>
        </div>
      ))}
    </div>
  );
}

// H2H 매치 행
function H2HMatchRow({ match }: { match: any }) {
  const date = new Date(match.fixture?.date);
  const homeWin = match.teams?.home?.winner;
  const awayWin = match.teams?.away?.winner;

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {date.toLocaleDateString()} | {match.league?.name} | {match.league?.round}
        </span>
        <span className="text-xs text-gray-400">ID: {match.fixture?.id}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 ${homeWin ? 'font-bold text-green-600' : ''}`}>
          <img src={match.teams?.home?.logo} alt="" className="w-6 h-6" />
          <span>{match.teams?.home?.name}</span>
        </div>
        <div className="px-4 py-1 bg-gray-200 dark:bg-gray-700 rounded font-bold">
          {match.goals?.home} - {match.goals?.away}
        </div>
        <div className={`flex items-center gap-2 ${awayWin ? 'font-bold text-green-600' : ''}`}>
          <span>{match.teams?.away?.name}</span>
          <img src={match.teams?.away?.logo} alt="" className="w-6 h-6" />
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2 text-center">
        HT: {match.score?.halftime?.home}-{match.score?.halftime?.away} |
        FT: {match.score?.fulltime?.home}-{match.score?.fulltime?.away}
        {match.score?.extratime?.home !== null && ` | ET: ${match.score?.extratime?.home}-${match.score?.extratime?.away}`}
        {match.score?.penalty?.home !== null && ` | PK: ${match.score?.penalty?.home}-${match.score?.penalty?.away}`}
      </div>
    </div>
  );
}
