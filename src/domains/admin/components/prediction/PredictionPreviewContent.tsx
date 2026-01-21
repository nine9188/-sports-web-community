'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { PredictionApiData } from './types';
import { TeamDetailCard } from './TeamDetailCard';

interface PredictionPreviewContentProps {
  data: PredictionApiData;
}

// 값 정규화 함수 (0-100 스케일)
function normalizeValue(value: number | undefined, maxExpected: number): number {
  if (!value) return 0;
  return Math.min(Math.round((value / maxExpected) * 100), 100);
}

export function PredictionPreviewContent({ data }: PredictionPreviewContentProps) {
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
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold mb-1 text-center text-gray-900 dark:text-[#F0F0F0]">팀 성적 레이더 차트</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">최근 5경기 폼/공격력/수비력 + 시즌 승리/득점/실점</p>
        <div className="flex items-center justify-center gap-6 mb-2">
          <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <span className="w-3 h-3 bg-gray-700 dark:bg-gray-300 rounded-full"></span>
            {teams.home.name}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <span className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
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
              stroke="#374151"
              fill="#374151"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Radar
              name={teams.away.name}
              dataKey="away"
              stroke="#9CA3AF"
              fill="#9CA3AF"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-lg p-2 shadow-lg text-sm">
                      <p className="font-semibold mb-1 text-gray-900 dark:text-[#F0F0F0]">{label}</p>
                      {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-gray-700 dark:text-gray-300">
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
      <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg border border-black/7 dark:border-white/10">
        <h4 className="font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]">승률 예측</h4>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-[#F0F0F0]">{predictions.percent.home}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{teams.home.name}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-500 dark:text-gray-400">{predictions.percent.draw}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">무승부</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">{predictions.percent.away}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{teams.away.name}</p>
          </div>
        </div>
        {predictions.advice && (
          <p className="mt-4 text-center text-sm bg-white dark:bg-[#1D1D1D] p-2 rounded border border-black/7 dark:border-white/10 text-gray-700 dark:text-gray-300">
            {predictions.advice}
          </p>
        )}
      </div>

      {/* 팀 비교 막대 (comparison 데이터) */}
      <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]">팀 비교 (7개 지표)</h4>
        <div className="space-y-3">
          {comparisonData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="w-10 text-right font-medium text-gray-900 dark:text-[#F0F0F0]">{item.home}%</span>
              <div className="flex-1 flex h-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                <div className="bg-gray-700 dark:bg-gray-300" style={{ width: `${item.home}%` }} />
                <div className="bg-gray-400 dark:bg-gray-500" style={{ width: `${item.away}%` }} />
              </div>
              <span className="w-10 font-medium text-gray-700 dark:text-gray-300">{item.away}%</span>
              <span className="w-20 text-gray-500 dark:text-gray-400 text-xs">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-3">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-700 dark:bg-gray-300 rounded"></span>{teams.home.name}</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded"></span>{teams.away.name}</span>
        </div>
      </div>

      {/* 팀별 상세 데이터 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamDetailCard team={teams.home} label="HOME" color="blue" />
        <TeamDetailCard team={teams.away} label="AWAY" color="green" />
      </div>

      {/* 상대전적 */}
      {h2h && h2h.length > 0 && (
        <div className="bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]">상대전적 (최근 {h2h.length}경기)</h4>
          <div className="space-y-2">
            {h2h.slice(0, 5).map((match, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-[#F5F5F5] dark:bg-[#262626] rounded text-sm">
                <span className="text-gray-500 dark:text-gray-400 text-xs w-24">
                  {new Date(match.fixture.date).toLocaleDateString('ko-KR')}
                </span>
                <div className="flex items-center gap-2 flex-1 justify-center">
                  <span className={`text-gray-900 dark:text-[#F0F0F0] ${match.teams.home.winner ? 'font-bold' : ''}`}>
                    {match.teams.home.name}
                  </span>
                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded font-bold text-gray-900 dark:text-[#F0F0F0]">
                    {match.goals.home} - {match.goals.away}
                  </span>
                  <span className={`text-gray-900 dark:text-[#F0F0F0] ${match.teams.away.winner ? 'font-bold' : ''}`}>
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
        <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-[#F0F0F0]">예상 골</h4>
          <p className="text-gray-700 dark:text-gray-300">{teams.home.name}: <strong>{predictions.goals?.home || '-'}</strong></p>
          <p className="text-gray-700 dark:text-gray-300">{teams.away.name}: <strong>{predictions.goals?.away || '-'}</strong></p>
        </div>
        <div className="bg-[#F5F5F5] dark:bg-[#262626] p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-[#F0F0F0]">기타 정보</h4>
          <p className="text-gray-700 dark:text-gray-300">언더/오버: <strong>{predictions.under_over || '-'}</strong></p>
          <p className="text-gray-700 dark:text-gray-300">승/무 예상: <strong>{predictions.win_or_draw ? '홈 최소 무승부' : '-'}</strong></p>
          {predictions.winner?.name && (
            <p className="text-gray-700 dark:text-gray-300">예상 승자: <strong>{predictions.winner.name}</strong> {predictions.winner.comment && `(${predictions.winner.comment})`}</p>
          )}
        </div>
      </div>
    </div>
  );
}
