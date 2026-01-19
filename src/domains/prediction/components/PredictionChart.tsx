'use client';

import React, { useEffect, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { getTeamById } from '@teams';

// 시간대별 통계 타입
interface MinuteStats {
  [key: string]: { total: number | null; percentage: string | null };
}

// 언더/오버 통계 타입
interface UnderOverStats {
  [key: string]: { over: number; under: number };
}

// 팀 리그 통계 타입
interface TeamLeagueStats {
  form?: string;
  fixtures?: {
    played?: { home: number; away: number; total: number };
    wins?: { home: number; away: number; total: number };
    draws?: { home: number; away: number; total: number };
    loses?: { home: number; away: number; total: number };
  };
  goals?: {
    for?: {
      total?: { home: number; away: number; total: number };
      average?: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
    against?: {
      total?: { home: number; away: number; total: number };
      average?: { home: string; away: string; total: string };
      minute?: MinuteStats;
      under_over?: UnderOverStats;
    };
  };
  biggest?: {
    streak?: { wins: number; draws: number; loses: number };
    wins?: { home: string | null; away: string | null };
    loses?: { home: string | null; away: string | null };
    goals?: { for?: { home: number; away: number }; against?: { home: number; away: number } };
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

// 팀 데이터 타입
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
  league?: TeamLeagueStats;
}

// H2H 매치 타입
interface H2HMatch {
  fixture: { id: number; date: string };
  teams: {
    home: { id: number; name: string; winner: boolean | null };
    away: { id: number; name: string; winner: boolean | null };
  };
  goals: { home: number; away: number };
}

// 예측 차트 데이터 타입
export interface PredictionChartData {
  predictions: {
    percent: { home: string; draw: string; away: string };
    advice?: string | null;
    goals?: { home: string; away: string };
    winner?: { id?: number | null; name: string | null; comment: string | null };
    under_over?: string | null;
    win_or_draw?: boolean;
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
    home: TeamData;
    away: TeamData;
  };
  h2h?: H2HMatch[];
}

interface PredictionChartProps {
  data: PredictionChartData;
  showRadar?: boolean;
  showComparison?: boolean;
  showPrediction?: boolean;
  showTeamDetails?: boolean;
  showH2H?: boolean;
  compact?: boolean;
}

// 값 정규화 함수 (0-100 스케일)
function normalizeValue(value: number | undefined, maxExpected: number): number {
  if (!value) return 0;
  return Math.min(Math.round((value / maxExpected) * 100), 100);
}

// 팀 이름 한국어 가져오기 (매핑 없으면 원본 이름 사용)
function getTeamNameKo(teamId: number, fallbackName: string): string {
  const team = getTeamById(teamId);
  return team?.name_ko || fallbackName;
}

// W/D/L 배지 컴포넌트
function FormBadge({ result }: { result: string }) {
  const getStyle = () => {
    switch (result.toUpperCase()) {
      case 'W':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'D':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'L':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-[#F5F5F5] dark:bg-[#333333] text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-medium ${getStyle()}`}>
      {result.toUpperCase()}
    </span>
  );
}

// 폼 문자열을 배지로 렌더링
function FormDisplay({ form }: { form: string }) {
  if (!form) return null;
  return (
    <div className="flex flex-wrap gap-0.5">
      {form.split('').map((char, idx) => (
        <FormBadge key={idx} result={char} />
      ))}
    </div>
  );
}

// 섹션 헤더
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F5F5F5] dark:bg-[#262626] px-3 py-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 border-b border-black/5 dark:border-white/10">
      {children}
    </div>
  );
}

// 데이터 행
function DataRow({ label, value, subValue, color }: { label: string; value: string | number; subValue?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/5 dark:border-white/10 last:border-b-0">
      <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-[11px] font-medium ${color || 'text-gray-900 dark:text-[#F0F0F0]'}`}>
        {value}
        {subValue && <span className="text-gray-400 ml-1">({subValue})</span>}
      </span>
    </div>
  );
}

// 시간대별 골 차트 (간소화)
function GoalsByMinuteCompact({ scoredMinute, concededMinute }: { scoredMinute?: MinuteStats; concededMinute?: MinuteStats }) {
  const timeSlots = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90'];

  const getMaxValue = () => {
    let max = 0;
    timeSlots.forEach(slot => {
      const scored = scoredMinute?.[slot]?.total || 0;
      const conceded = concededMinute?.[slot]?.total || 0;
      if (scored > max) max = scored;
      if (conceded > max) max = conceded;
    });
    return max || 1;
  };

  const maxValue = getMaxValue();

  return (
    <div className="divide-y divide-black/5 dark:divide-white/10">
      {timeSlots.map((slot) => {
        const scored = scoredMinute?.[slot]?.total || 0;
        const conceded = concededMinute?.[slot]?.total || 0;
        const scoredPct = (scored / maxValue) * 100;
        const concededPct = (conceded / maxValue) * 100;

        return (
          <div key={slot} className="flex items-center h-7 px-2">
            <div className="flex-1 flex items-center justify-end gap-1">
              <span className="text-[10px] text-gray-500 w-4 text-right">{scored || '-'}</span>
              <div className="flex-1 flex justify-end max-w-[60px]">
                <div className="h-3 bg-green-200 dark:bg-green-800/50 rounded-l" style={{ width: `${scoredPct}%` }} />
              </div>
            </div>
            <div className="w-12 text-center text-[10px] text-gray-500 dark:text-gray-400">{slot}</div>
            <div className="flex-1 flex items-center gap-1">
              <div className="flex-1 flex justify-start max-w-[60px]">
                <div className="h-3 bg-red-200 dark:bg-red-800/50 rounded-r" style={{ width: `${concededPct}%` }} />
              </div>
              <span className="text-[10px] text-gray-500 w-4">{conceded || '-'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 팀 상세 카드 컴포넌트 (간소화)
function TeamDetailCard({ team, label, predictedGoals }: { team: TeamData; label: string; predictedGoals?: string }) {
  const league = team.league;
  const teamNameKo = getTeamNameKo(team.id, team.name);

  return (
    <div className="h-full bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/5 dark:border-white/10 overflow-hidden text-xs">
      {/* 헤더 */}
      <div className="flex flex-col items-center gap-1 px-3 py-2 bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
        <div className="flex items-center justify-center gap-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${label === 'HOME' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'}`}>
            {label === 'HOME' ? '홈' : '원정'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-900 dark:text-[#F0F0F0]">{teamNameKo}</span>
            {team.logo && (
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                <img src={team.logo} alt={teamNameKo} className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>
        </div>
        {predictedGoals && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            예상골: <strong className="text-gray-900 dark:text-[#F0F0F0]">{predictedGoals}</strong>
          </span>
        )}
      </div>

      {/* 최근 5경기 */}
      <SectionHeader>최근 5경기</SectionHeader>
      <div className="flex px-3 py-1.5 border-b border-black/5 dark:border-white/10">
        <div className="flex-1 text-center">
          <div className="text-[10px] text-gray-400">폼</div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{team.last_5?.form || '-'}</div>
        </div>
        <div className="flex-1 text-center border-x border-black/5 dark:border-white/10">
          <div className="text-[10px] text-gray-400">공격</div>
          <div className="text-sm font-bold text-green-600 dark:text-green-400">{team.last_5?.att || '-'}</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-[10px] text-gray-400">수비</div>
          <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{team.last_5?.def || '-'}</div>
        </div>
      </div>
      <div className="flex text-center text-[10px] border-b border-black/5 dark:border-white/10">
        <div className="flex-1 py-1 border-r border-black/5 dark:border-white/10">
          <span className="text-gray-400">득점 </span>
          <span className="text-green-600 dark:text-green-400 font-medium">{team.last_5?.goals?.for?.total || 0}</span>
          <span className="text-gray-400"> ({team.last_5?.goals?.for?.average || 0})</span>
        </div>
        <div className="flex-1 py-1">
          <span className="text-gray-400">실점 </span>
          <span className="text-red-600 dark:text-red-400 font-medium">{team.last_5?.goals?.against?.total || 0}</span>
          <span className="text-gray-400"> ({team.last_5?.goals?.against?.average || 0})</span>
        </div>
      </div>

      {/* 시즌 폼 */}
      {league?.form && (
        <>
          <SectionHeader>시즌 폼</SectionHeader>
          <div className="px-3 py-2 border-b border-black/5 dark:border-white/10">
            <FormDisplay form={league.form} />
          </div>
        </>
      )}

      {/* 시즌 통계 */}
      {league?.fixtures && (
        <>
          <SectionHeader>시즌 통계</SectionHeader>
          <div className="flex text-center text-[10px] bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            {['', '경기', '승', '무', '패'].map((h, i) => (
              <div key={i} className="flex-1 py-1 text-gray-400 font-medium">{h}</div>
            ))}
          </div>
          {['total', 'home', 'away'].map((type) => (
            <div key={type} className="flex text-center text-[11px] border-b border-black/5 dark:border-white/10 last:border-b-0">
              <div className="flex-1 py-1 text-gray-400">{type === 'total' ? '합계' : type === 'home' ? '홈' : '원정'}</div>
              <div className="flex-1 py-1 font-medium text-gray-900 dark:text-[#F0F0F0]">
                {league.fixtures.played?.[type as keyof typeof league.fixtures.played] || 0}
              </div>
              <div className="flex-1 py-1 font-medium text-green-600 dark:text-green-400">
                {league.fixtures.wins?.[type as keyof typeof league.fixtures.wins] || 0}
              </div>
              <div className="flex-1 py-1 font-medium text-yellow-600 dark:text-yellow-400">
                {league.fixtures.draws?.[type as keyof typeof league.fixtures.draws] || 0}
              </div>
              <div className="flex-1 py-1 font-medium text-red-600 dark:text-red-400">
                {league.fixtures.loses?.[type as keyof typeof league.fixtures.loses] || 0}
              </div>
            </div>
          ))}
        </>
      )}

      {/* 득실점 */}
      {league?.goals && (
        <>
          <SectionHeader>득실점</SectionHeader>
          <div className="flex text-center text-[10px] bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            {['', '홈', '원정', '합계', '평균'].map((h, i) => (
              <div key={i} className="flex-1 py-1 text-gray-400 font-medium">{h}</div>
            ))}
          </div>
          <div className="flex text-center text-[11px] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 py-1 text-green-600 dark:text-green-400">득점</div>
            <div className="flex-1 py-1 font-medium text-gray-900 dark:text-[#F0F0F0]">{league.goals.for?.total?.home || 0}</div>
            <div className="flex-1 py-1 font-medium text-gray-900 dark:text-[#F0F0F0]">{league.goals.for?.total?.away || 0}</div>
            <div className="flex-1 py-1 font-bold text-gray-900 dark:text-[#F0F0F0]">{league.goals.for?.total?.total || 0}</div>
            <div className="flex-1 py-1 text-gray-500">{league.goals.for?.average?.total || '-'}</div>
          </div>
          <div className="flex text-center text-[11px] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 py-1 text-red-600 dark:text-red-400">실점</div>
            <div className="flex-1 py-1 font-medium text-gray-900 dark:text-[#F0F0F0]">{league.goals.against?.total?.home || 0}</div>
            <div className="flex-1 py-1 font-medium text-gray-900 dark:text-[#F0F0F0]">{league.goals.against?.total?.away || 0}</div>
            <div className="flex-1 py-1 font-bold text-gray-900 dark:text-[#F0F0F0]">{league.goals.against?.total?.total || 0}</div>
            <div className="flex-1 py-1 text-gray-500">{league.goals.against?.average?.total || '-'}</div>
          </div>
        </>
      )}

      {/* 시간대별 득실점 */}
      {(league?.goals?.for?.minute || league?.goals?.against?.minute) && (
        <>
          <SectionHeader>시간대별 득실점</SectionHeader>
          <div className="flex text-center text-[9px] bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 py-0.5 text-green-600 dark:text-green-400">득점</div>
            <div className="w-12 py-0.5 text-gray-400">시간</div>
            <div className="flex-1 py-0.5 text-red-600 dark:text-red-400">실점</div>
          </div>
          <GoalsByMinuteCompact scoredMinute={league.goals?.for?.minute} concededMinute={league.goals?.against?.minute} />
        </>
      )}

      {/* 언더/오버 */}
      {(league?.goals?.for?.under_over || league?.goals?.against?.under_over) && (
        <>
          <SectionHeader>언더/오버</SectionHeader>
          <div className="flex text-center text-[10px] bg-[#F5F5F5] dark:bg-[#262626] border-b border-black/5 dark:border-white/10">
            <div className="w-10 py-1 text-gray-400">라인</div>
            <div className="flex-1 py-1 text-green-600 dark:text-green-400">득점O</div>
            <div className="flex-1 py-1 text-red-600 dark:text-red-400">득점U</div>
            <div className="flex-1 py-1 text-green-600 dark:text-green-400">실점O</div>
            <div className="flex-1 py-1 text-red-600 dark:text-red-400">실점U</div>
          </div>
          {['0.5', '1.5', '2.5', '3.5'].map((line) => (
            <div key={line} className="flex text-center text-[11px] border-b border-black/5 dark:border-white/10 last:border-b-0">
              <div className="w-10 py-1 text-gray-400">{line}</div>
              <div className="flex-1 py-1 text-gray-900 dark:text-[#F0F0F0]">{league.goals?.for?.under_over?.[line]?.over ?? '-'}</div>
              <div className="flex-1 py-1 text-gray-900 dark:text-[#F0F0F0]">{league.goals?.for?.under_over?.[line]?.under ?? '-'}</div>
              <div className="flex-1 py-1 text-gray-900 dark:text-[#F0F0F0]">{league.goals?.against?.under_over?.[line]?.over ?? '-'}</div>
              <div className="flex-1 py-1 text-gray-900 dark:text-[#F0F0F0]">{league.goals?.against?.under_over?.[line]?.under ?? '-'}</div>
            </div>
          ))}
        </>
      )}

      {/* 최대 기록 */}
      {league?.biggest && (
        <>
          <SectionHeader>최대 기록</SectionHeader>
          <div className="flex text-center text-[11px] border-b border-black/5 dark:border-white/10">
            <div className="flex-1 py-1.5">
              <div className="text-[9px] text-gray-400">연승</div>
              <div className="font-bold text-green-600 dark:text-green-400">{league.biggest.streak?.wins || 0}</div>
            </div>
            <div className="flex-1 py-1.5 border-x border-black/5 dark:border-white/10">
              <div className="text-[9px] text-gray-400">연속무</div>
              <div className="font-bold text-yellow-600 dark:text-yellow-400">{league.biggest.streak?.draws || 0}</div>
            </div>
            <div className="flex-1 py-1.5">
              <div className="text-[9px] text-gray-400">연패</div>
              <div className="font-bold text-red-600 dark:text-red-400">{league.biggest.streak?.loses || 0}</div>
            </div>
          </div>
          <div className="px-3 py-1.5 text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5 border-b border-black/5 dark:border-white/10">
            <div>홈 최다골 승: <span className="text-gray-900 dark:text-[#F0F0F0]">{league.biggest.wins?.home || '-'}</span></div>
            <div>원정 최다골 승: <span className="text-gray-900 dark:text-[#F0F0F0]">{league.biggest.wins?.away || '-'}</span></div>
            <div>홈 최다골 패: <span className="text-gray-900 dark:text-[#F0F0F0]">{league.biggest.loses?.home || '-'}</span></div>
            <div>원정 최다골 패: <span className="text-gray-900 dark:text-[#F0F0F0]">{league.biggest.loses?.away || '-'}</span></div>
          </div>
        </>
      )}

      {/* 클린시트 & 무득점 & 페널티 */}
      {(league?.clean_sheet || league?.failed_to_score || league?.penalty) && (
        <>
          <SectionHeader>기타 통계</SectionHeader>
          <div className="flex text-center text-[11px] border-b border-black/5 dark:border-white/10">
            {league?.clean_sheet && (
              <div className="flex-1 py-1.5 border-r border-black/5 dark:border-white/10">
                <div className="text-[9px] text-gray-400">무실점</div>
                <div className="font-bold text-green-600 dark:text-green-400">{league.clean_sheet.total}</div>
                <div className="text-[8px] text-gray-400">홈{league.clean_sheet.home} 원정{league.clean_sheet.away}</div>
              </div>
            )}
            {league?.failed_to_score && (
              <div className="flex-1 py-1.5 border-r border-black/5 dark:border-white/10">
                <div className="text-[9px] text-gray-400">무득점</div>
                <div className="font-bold text-red-600 dark:text-red-400">{league.failed_to_score.total}</div>
                <div className="text-[8px] text-gray-400">홈{league.failed_to_score.home} 원정{league.failed_to_score.away}</div>
              </div>
            )}
            {league?.penalty && (
              <div className="flex-1 py-1.5">
                <div className="text-[9px] text-gray-400">페널티</div>
                <div className="font-bold text-gray-900 dark:text-[#F0F0F0]">{league.penalty.scored.total}/{league.penalty.total}</div>
                <div className="text-[8px] text-gray-400">{league.penalty.scored.percentage}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 포메이션 */}
      <SectionHeader>포메이션</SectionHeader>
      <div className="px-3 py-1.5 grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((i) => {
          const lineup = league?.lineups?.[i];
          return (
            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#F5F5F5] dark:bg-[#262626] rounded text-gray-700 dark:text-gray-300 text-center truncate">
              {lineup ? (
                <>{lineup.formation} <span className="text-gray-400">({lineup.played})</span></>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function PredictionChart({
  data,
  showRadar = true,
  showComparison = true,
  showPrediction = true,
  showTeamDetails = true,
  showH2H = true,
  compact = false,
}: PredictionChartProps) {
  const { predictions, comparison, teams, h2h } = data;

  // 팀 이름 한국어
  const homeNameKo = getTeamNameKo(teams.home.id, teams.home.name);
  const awayNameKo = getTeamNameKo(teams.away.id, teams.away.name);

  // 다크 모드 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // 레이더 차트용 데이터 (8개 지표) - 각 팀의 개별 능력치 (last_5 기반)
  const radarData = [
    { subject: '경기력', home: parseInt(teams.home.last_5?.form) || 0, away: parseInt(teams.away.last_5?.form) || 0, fullMark: 100 },
    { subject: '공격력', home: parseInt(teams.home.last_5?.att) || 0, away: parseInt(teams.away.last_5?.att) || 0, fullMark: 100 },
    { subject: '수비력', home: parseInt(teams.home.last_5?.def) || 0, away: parseInt(teams.away.last_5?.def) || 0, fullMark: 100 },
    { subject: '승', home: normalizeValue(teams.home.league?.fixtures?.wins?.total, 15), away: normalizeValue(teams.away.league?.fixtures?.wins?.total, 15), fullMark: 100 },
    { subject: '무', home: normalizeValue(teams.home.league?.fixtures?.draws?.total, 10), away: normalizeValue(teams.away.league?.fixtures?.draws?.total, 10), fullMark: 100 },
    { subject: '패', home: normalizeValue(teams.home.league?.fixtures?.loses?.total, 15), away: normalizeValue(teams.away.league?.fixtures?.loses?.total, 15), fullMark: 100 },
    { subject: '득점', home: normalizeValue(teams.home.league?.goals?.for?.total?.total, 50), away: normalizeValue(teams.away.league?.goals?.for?.total?.total, 50), fullMark: 100 },
    { subject: '실점', home: normalizeValue(teams.home.league?.goals?.against?.total?.total, 50), away: normalizeValue(teams.away.league?.goals?.against?.total?.total, 50), fullMark: 100 },
  ];

  // 비교 막대용 데이터 (상대 비교 - 합이 100%)
  const comparisonData = [
    { label: '경기력', home: parseInt(comparison.form?.home) || 0, away: parseInt(comparison.form?.away) || 0 },
    { label: '공격력', home: parseInt(comparison.att?.home) || 0, away: parseInt(comparison.att?.away) || 0 },
    { label: '수비력', home: parseInt(comparison.def?.home) || 0, away: parseInt(comparison.def?.away) || 0 },
    { label: '통계예측', home: parseInt(comparison.poisson_distribution?.home) || 0, away: parseInt(comparison.poisson_distribution?.away) || 0 },
    { label: '상대전적', home: parseInt(comparison.h2h?.home) || 0, away: parseInt(comparison.h2h?.away) || 0 },
    { label: '득점력', home: parseInt(comparison.goals?.home) || 0, away: parseInt(comparison.goals?.away) || 0 },
    { label: '종합', home: parseInt(comparison.total?.home) || 0, away: parseInt(comparison.total?.away) || 0, highlight: true },
  ];

  const chartHeight = compact ? 240 : 280;

  return (
    <div className="prediction-chart bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 overflow-hidden my-4">
      {/* AI 예측 */}
      {showPrediction && (
        <div className="p-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center justify-center gap-6 mb-2">
            {/* 홈팀 */}
            <div className="flex items-center gap-2">
              {teams.home.logo && (
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                  <img src={teams.home.logo} alt={homeNameKo} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{predictions.percent.home}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[70px]">{homeNameKo}</div>
              </div>
            </div>
            {/* 무승부 */}
            <div className="text-center">
              <div className="text-xl font-bold text-gray-400 dark:text-gray-500">{predictions.percent.draw}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">무승부</div>
            </div>
            {/* 원정팀 */}
            <div className="flex items-center gap-2">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">{predictions.percent.away}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[70px]">{awayNameKo}</div>
              </div>
              {teams.away.logo && (
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                  <img src={teams.away.logo} alt={awayNameKo} className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>
          {/* 예측 상세 */}
          <div className="flex justify-center gap-4 text-[10px] text-gray-500 dark:text-gray-400">
            {predictions.winner?.name && (
              <span>승자: <strong className="text-gray-900 dark:text-[#F0F0F0]">
                {predictions.winner.id ? getTeamNameKo(predictions.winner.id, predictions.winner.name) : predictions.winner.name}
              </strong></span>
            )}
            {predictions.under_over && (() => {
              const val = parseFloat(predictions.under_over);
              if (isNaN(val)) return <span>U/O: <strong className="text-gray-900 dark:text-[#F0F0F0]">{predictions.under_over}</strong></span>;
              const label = val < 0 ? `U${Math.abs(val)}` : `O${val}`;
              return <span>총골: <strong className="text-gray-900 dark:text-[#F0F0F0]">{label}</strong></span>;
            })()}
          </div>
          {predictions.advice && (
            <div className="mt-2 text-center text-[10px] text-gray-600 dark:text-gray-300 bg-[#F5F5F5] dark:bg-[#262626] py-1.5 px-2 rounded">
              💡 {predictions.advice}
            </div>
          )}
        </div>
      )}

      {/* 레이더 & 비교 */}
      {showRadar && (
        <>
          <SectionHeader>팀 비교 레이더</SectionHeader>
          <div className="p-3">
            <div className="flex items-center justify-center gap-3 mb-1 text-[10px]">
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>{homeNameKo}</span>
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{awayNameKo}</span>
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={isDark ? '#4B5563' : '#e5e7eb'} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#9CA3AF' : '#6b7280', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: isDark ? '#6B7280' : '#9ca3af', fontSize: 8 }} tickCount={5} />
                <Radar name={homeNameKo} dataKey="home" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.4} strokeWidth={2} />
                <Radar name={awayNameKo} dataKey="away" stroke="#22C55E" fill="#22C55E" fillOpacity={0.4} strokeWidth={2} />
                <Tooltip content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded p-1.5 shadow text-[10px]">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-0.5">{label}</p>
                        {payload.map((e, i) => <p key={i} style={{ color: e.color }}>{e.name}: {e.value}%</p>)}
                      </div>
                    );
                  }
                  return null;
                }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {showComparison && (
        <>
          <SectionHeader>상대 비교 지표</SectionHeader>
          <div className="p-3 space-y-1">
            {comparisonData.map((item, idx) => (
              <div key={idx} className={`flex items-center gap-1.5 text-[10px] ${item.highlight ? 'bg-[#F5F5F5] dark:bg-[#262626] py-0.5 px-1 rounded' : ''}`}>
                <span className={`w-7 text-right text-blue-600 dark:text-blue-400 ${item.highlight ? 'font-bold' : ''}`}>{item.home}%</span>
                <div className="flex-1 flex h-2.5 bg-[#EAEAEA] dark:bg-[#333333] rounded overflow-hidden">
                  <div className="bg-blue-500" style={{ width: `${item.home}%` }} />
                  <div className="bg-green-500" style={{ width: `${item.away}%` }} />
                </div>
                <span className={`w-7 text-green-600 dark:text-green-400 ${item.highlight ? 'font-bold' : ''}`}>{item.away}%</span>
                <span className={`w-10 text-gray-500 dark:text-gray-400 ${item.highlight ? 'font-medium text-gray-700 dark:text-gray-300' : ''}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 팀 상세 */}
      {showTeamDetails && (() => {
        // 예상골 라벨 계산
        const homeGoalVal = predictions.goals ? parseFloat(predictions.goals.home) : NaN;
        const awayGoalVal = predictions.goals ? parseFloat(predictions.goals.away) : NaN;
        const homeGoalLabel = !isNaN(homeGoalVal) ? (homeGoalVal < 0 ? `U${Math.abs(homeGoalVal)}` : `O${homeGoalVal}`) : undefined;
        const awayGoalLabel = !isNaN(awayGoalVal) ? (awayGoalVal < 0 ? `U${Math.abs(awayGoalVal)}` : `O${awayGoalVal}`) : undefined;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
            <TeamDetailCard team={teams.home} label="HOME" predictedGoals={homeGoalLabel} />
            <TeamDetailCard team={teams.away} label="AWAY" predictedGoals={awayGoalLabel} />
          </div>
        );
      })()}

      {/* 상대전적 */}
      {showH2H && h2h && h2h.length > 0 && (
        <div className="border-t border-black/5 dark:border-white/10">
          <SectionHeader>상대전적 (최근 {Math.min(h2h.length, 5)}경기)</SectionHeader>
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {h2h.slice(0, 5).map((match, idx) => {
              const matchHomeNameKo = getTeamNameKo(match.teams.home.id, match.teams.home.name);
              const matchAwayNameKo = getTeamNameKo(match.teams.away.id, match.teams.away.name);
              return (
                <div key={idx} className="flex items-center py-1.5 px-3 text-[11px]">
                  <span className="text-gray-400 w-20">
                    {new Date(match.fixture.date).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' })}
                  </span>
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <span className={`text-right flex-1 truncate ${match.teams.home.winner ? 'font-bold text-green-600 dark:text-green-400' : match.teams.home.winner === false ? 'text-red-500' : ''}`}>
                      {matchHomeNameKo}
                    </span>
                    <span className="px-2 py-0.5 bg-[#F5F5F5] dark:bg-[#262626] rounded font-bold text-gray-900 dark:text-[#F0F0F0] min-w-[44px] text-center">
                      {match.goals.home}-{match.goals.away}
                    </span>
                    <span className={`text-left flex-1 truncate ${match.teams.away.winner ? 'font-bold text-green-600 dark:text-green-400' : match.teams.away.winner === false ? 'text-red-500' : ''}`}>
                      {matchAwayNameKo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
