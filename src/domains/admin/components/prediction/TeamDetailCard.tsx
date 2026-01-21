'use client';

import { useState } from 'react';
import type { TeamData } from './types';

interface TeamDetailCardProps {
  team: TeamData;
  label: string;
  color: 'blue' | 'green';
}

export function TeamDetailCard({ team, label, color }: TeamDetailCardProps) {
  const [expanded, setExpanded] = useState(true);
  const colorClass = color === 'blue' ? 'border-gray-700 dark:border-gray-300 bg-gray-50 dark:bg-[#262626]' : 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-[#262626]';
  const textColor = color === 'blue' ? 'text-gray-900 dark:text-[#F0F0F0]' : 'text-gray-700 dark:text-gray-300';

  return (
    <div className={`border-l-4 ${colorClass} rounded-r-lg overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-white/50 dark:hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${textColor}`}>{label}: {team.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">ID: {team.id}</span>
        </div>
        <span className="text-gray-500 dark:text-gray-400">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="p-3 bg-white dark:bg-[#1D1D1D] space-y-4 text-sm">
          {/* 최근 5경기 */}
          <div className="border border-black/7 dark:border-white/10 rounded p-3">
            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">최근 5경기</h5>
            <p className="text-xl font-mono mb-2 text-gray-900 dark:text-[#F0F0F0]">{team.last_5?.form || 'N/A'}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
              <p>공격력: <strong>{team.last_5?.att || '-'}</strong></p>
              <p>수비력: <strong>{team.last_5?.def || '-'}</strong></p>
              <p>득점: <strong>{team.last_5?.goals?.for?.total || 0}</strong> (평균 {team.last_5?.goals?.for?.average || 0})</p>
              <p>실점: <strong>{team.last_5?.goals?.against?.total || 0}</strong> (평균 {team.last_5?.goals?.against?.average || 0})</p>
            </div>
          </div>

          {/* 시즌 폼 */}
          {team.league?.form && (
            <div className="border border-black/7 dark:border-white/10 rounded p-3">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">시즌 전체 폼</h5>
              <p className="font-mono text-xs break-all text-gray-900 dark:text-[#F0F0F0]">{team.league.form}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">W=승, D=무, L=패 (최근이 오른쪽)</p>
            </div>
          )}

          {/* 경기 결과 테이블 */}
          {team.league?.fixtures && (
            <div className="border border-black/7 dark:border-white/10 rounded p-3">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">경기 결과</h5>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black/7 dark:border-white/10">
                    <th className="text-left py-1 text-gray-700 dark:text-gray-300"></th>
                    <th className="text-center py-1 text-gray-700 dark:text-gray-300">홈</th>
                    <th className="text-center py-1 text-gray-700 dark:text-gray-300">원정</th>
                    <th className="text-center py-1 font-bold text-gray-700 dark:text-gray-300">합계</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-300">
                  <tr>
                    <td className="py-1">경기</td>
                    <td className="text-center">{team.league.fixtures.played?.home || 0}</td>
                    <td className="text-center">{team.league.fixtures.played?.away || 0}</td>
                    <td className="text-center font-bold">{team.league.fixtures.played?.total || 0}</td>
                  </tr>
                  <tr className="text-green-600 dark:text-green-400">
                    <td className="py-1">승</td>
                    <td className="text-center">{team.league.fixtures.wins?.home || 0}</td>
                    <td className="text-center">{team.league.fixtures.wins?.away || 0}</td>
                    <td className="text-center font-bold">{team.league.fixtures.wins?.total || 0}</td>
                  </tr>
                  <tr className="text-yellow-600 dark:text-yellow-400">
                    <td className="py-1">무</td>
                    <td className="text-center">{team.league.fixtures.draws?.home || 0}</td>
                    <td className="text-center">{team.league.fixtures.draws?.away || 0}</td>
                    <td className="text-center font-bold">{team.league.fixtures.draws?.total || 0}</td>
                  </tr>
                  <tr className="text-red-600 dark:text-red-400">
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
            <div className="border border-black/7 dark:border-white/10 rounded p-3">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">득실점 통계</h5>
              <div className="space-y-2">
                <div>
                  <p className="text-green-600 dark:text-green-400 font-medium text-xs mb-1">득점</p>
                  <table className="w-full text-xs text-gray-700 dark:text-gray-300">
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
                  <p className="text-red-600 dark:text-red-400 font-medium text-xs mb-1">실점</p>
                  <table className="w-full text-xs text-gray-700 dark:text-gray-300">
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
            <div className="border border-black/7 dark:border-white/10 rounded p-3">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">최대 기록</h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
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
            <div className="border border-black/7 dark:border-white/10 rounded p-3">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">클린시트 / 무득점</h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                {team.league.clean_sheet && (
                  <>
                    <p>무실점(홈): <strong>{team.league.clean_sheet.home || 0}</strong></p>
                    <p>무실점(원정): <strong>{team.league.clean_sheet.away || 0}</strong></p>
                    <p>무실점(합계): <strong className="text-green-600 dark:text-green-400">{team.league.clean_sheet.total || 0}</strong></p>
                  </>
                )}
                {team.league.failed_to_score && (
                  <>
                    <p>무득점(홈): <strong>{team.league.failed_to_score.home || 0}</strong></p>
                    <p>무득점(원정): <strong>{team.league.failed_to_score.away || 0}</strong></p>
                    <p>무득점(합계): <strong className="text-red-600 dark:text-red-400">{team.league.failed_to_score.total || 0}</strong></p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 페널티킥 */}
          {team.league?.penalty && (
            <div className="border border-black/7 dark:border-white/10 rounded p-3">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">페널티킥</h5>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                <p>성공: <strong className="text-green-600 dark:text-green-400">{team.league.penalty.scored?.total || 0}</strong> ({team.league.penalty.scored?.percentage || '-'})</p>
                <p>실패: <strong className="text-red-600 dark:text-red-400">{team.league.penalty.missed?.total || 0}</strong> ({team.league.penalty.missed?.percentage || '-'})</p>
                <p>총 시도: <strong>{team.league.penalty.total || 0}</strong></p>
              </div>
            </div>
          )}

          {/* 포메이션 */}
          {team.league?.lineups && team.league.lineups.length > 0 && (
            <div className="border border-black/7 dark:border-white/10 rounded p-3">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">사용 포메이션</h5>
              <div className="flex flex-wrap gap-1">
                {team.league.lineups.map((lineup, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
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
