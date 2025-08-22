'use client';

import React from 'react';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { Team } from '@/domains/livescore/types/match';
import { StandingsData } from '@/domains/livescore/types/match';

interface PowerProps {
  matchId: string;
  homeTeam: Team;
  awayTeam: Team;
  data: {
    teamA: number;
    teamB: number;
    h2h: {
      last: number;
      items: Array<{
        fixtureId: number;
        utcDate: string;
        league: { name?: string };
        teams: { home: { id?: number; name?: string; logo?: string }; away: { id?: number; name?: string; logo?: string } };
        score: { home: number; away: number };
      }>;
      resultSummary: {
        teamA: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number };
        teamB: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number };
      };
    };
    recent: {
      teamA: { last: number; items: Array<{ fixtureId: number; opponent: { id?: number; name?: string; logo?: string }; venue: 'home'|'away'; score: { for: number; against: number }; result: 'W'|'D'|'L' }>; summary: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number } };
      teamB: { last: number; items: Array<{ fixtureId: number; opponent: { id?: number; name?: string; logo?: string }; venue: 'home'|'away'; score: { for: number; against: number }; result: 'W'|'D'|'L' }>; summary: { win: number; draw: number; loss: number; goalsFor: number; goalsAgainst: number; goalDiff: number } };
    };
    topPlayers: {
      teamA: { topScorers: Array<{ playerId: number; name?: string; goals: number }>; topAssist: Array<{ playerId: number; name?: string; assists: number }> };
      teamB: { topScorers: Array<{ playerId: number; name?: string; goals: number }>; topAssist: Array<{ playerId: number; name?: string; assists: number }> };
    };
    // 선택적: 순위 데이터(컨텍스트에서 로드됨)
    standings?: StandingsData | null;
  };
}

export default function Power({ data }: PowerProps) {
  // 팀 메타 추출 (로고/이름)
  const findTeamMeta = (id: number) => {
    const item = data.h2h.items.find((m) => (m.teams.home?.id === id) || (m.teams.away?.id === id))
    if (item) {
      const t = item.teams.home?.id === id ? item.teams.home : item.teams.away
      return {
        name: t?.name || `#${id}`,
        logo: t?.logo || `https://media.api-sports.io/football/teams/${id}.png`
      }
    }
    return { name: `#${id}`, logo: `https://media.api-sports.io/football/teams/${id}.png` }
  }

  const teamAMeta = findTeamMeta(data.teamA)
  const teamBMeta = findTeamMeta(data.teamB)

  // 평균 득/실점 계산 (최근 폼 기준)
  const gamesA = Math.max(1, data.recent.teamA.last)
  const gamesB = Math.max(1, data.recent.teamB.last)
  const avgForA = data.recent.teamA.summary.goalsFor / gamesA
  const avgAgainstA = data.recent.teamA.summary.goalsAgainst / gamesA
  const avgForB = data.recent.teamB.summary.goalsFor / gamesB
  const avgAgainstB = data.recent.teamB.summary.goalsAgainst / gamesB

  // 바 차트 너비 정규화
  const maxFor = Math.max(avgForA, avgForB) || 1
  const maxAgainst = Math.max(avgAgainstA, avgAgainstB) || 1

  return (
    <>
      {/* 팀 비교(모바일 우선) */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        {/* 1) VS행: 팀명, 순위, 승무패 */}
        <div className="grid grid-cols-[2fr_1fr_2fr] items-center gap-1">
          <div className="text-right px-1">
            <div className="flex items-center justify-end gap-2 mb-1">
              <div className="font-semibold truncate text-right">{teamAMeta.name}</div>
              <ApiSportsImage
                imageId={data.teamA}
                imageType={ImageType.Teams}
                alt={teamAMeta.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
            {data.standings?.standings?.league?.standings ? (
              (() => {
                const group = data.standings!.standings.league.standings[0] || []
                const a = group.find(s => s.team.id === data.teamA)
                return (
                  <div className="text-[11px] text-gray-600">
                    <span>{a?.rank ? `${a.rank}위` : '-'}·{a ? `${a.all.win}승 ${a.all.draw}무 ${a.all.lose}패` : '0승 0무 0패'}</span>
                  </div>
                )
              })()
            ) : null}
          </div>
          <div className="text-center px-1">
            <div className="text-lg font-extrabold">VS</div>
          </div>
          <div className="text-left px-1">
            <div className="flex items-center justify-start gap-2 mb-1">
              <ApiSportsImage
                imageId={data.teamB}
                imageType={ImageType.Teams}
                alt={teamBMeta.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <div className="font-semibold truncate">{teamBMeta.name}</div>
            </div>
            {data.standings?.standings?.league?.standings ? (
              (() => {
                const group = data.standings!.standings.league.standings[0] || []
                const b = group.find(s => s.team.id === data.teamB)
                return (
                  <div className="text-[11px] text-gray-600">
                    <span>{b?.rank ? `${b.rank}위` : '-'}·{b ? `${b.all.win}승 ${b.all.draw}무 ${b.all.lose}패` : '0승 0무 0패'}</span>
                  </div>
                )
              })()
            ) : null}
          </div>
        </div>

        {/* 2) 최근경기행: W/D/L */}
        <div className="mt-3">
          <div className="grid grid-cols-[2fr_1fr_2fr] items-center gap-1 text-xs">
            <div className="flex gap-1 justify-end px-1">
              {data.recent.teamA.items.slice(0, 5).map((it) => (
                <span key={it.fixtureId} className={`w-6 h-6 flex items-center justify-center text-xs font-medium ${it.result === 'W' ? 'bg-emerald-100 text-emerald-700' : it.result === 'D' ? 'bg-gray-100 text-gray-700' : 'bg-rose-100 text-rose-700'}`}>{it.result}</span>
              ))}
            </div>
            <div className="text-center text-gray-600 text-xs px-1">최근경기</div>
            <div className="flex gap-1 justify-start px-1">
              {data.recent.teamB.items.slice(0, 5).map((it) => (
                <span key={it.fixtureId} className={`w-6 h-6 flex items-center justify-center text-xs font-medium ${it.result === 'W' ? 'bg-emerald-100 text-emerald-700' : it.result === 'D' ? 'bg-gray-100 text-gray-700' : 'bg-rose-100 text-rose-700'}`}>{it.result}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 3) 평균득점행 */}
        <div className="mt-4">
          <div className="grid grid-cols-[2fr_1fr_2fr] items-center gap-1 text-sm">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-gray-100 rounded relative">
                <div className="h-2 bg-red-500 rounded absolute right-0" style={{ width: `${(avgForA / maxFor) * 100}%` }} />
              </div>
              <span className="font-semibold min-w-8">{avgForA.toFixed(2)}</span>
            </div>
            <div className="text-center text-gray-600 text-xs px-1">평균득점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">{avgForB.toFixed(2)}</span>
              <div className="h-2 flex-1 bg-gray-100 rounded">
                <div className="h-2 bg-red-500 rounded" style={{ width: `${(avgForB / maxFor) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 4) 평균실점행 */}
        <div className="mt-3">
          <div className="grid grid-cols-[2fr_1fr_2fr] items-center gap-1 text-sm">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-gray-100 rounded relative">
                <div className="h-2 bg-blue-500 rounded absolute right-0" style={{ width: `${(avgAgainstA / maxAgainst) * 100}%` }} />
              </div>
              <span className="font-semibold min-w-8">{avgAgainstA.toFixed(2)}</span>
            </div>
            <div className="text-center text-gray-600 text-xs px-1">평균실점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">{avgAgainstB.toFixed(2)}</span>
              <div className="h-2 flex-1 bg-gray-100 rounded">
                <div className="h-2 bg-blue-500 rounded" style={{ width: `${(avgAgainstB / maxAgainst) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 최근 맞대결 리스트: 중앙 기준 좌/우 분할 */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="text-base font-semibold mb-3">최근 양팀 맞대결</h3>
        
        {/* 경기 결과 목록 */}
        <div className="space-y-1">
          {data.h2h.items.map((m) => {
            const isTeamAHome = m.teams.home?.id === data.teamA
            const aScore = isTeamAHome ? m.score.home : m.score.away
            const bScore = isTeamAHome ? m.score.away : m.score.home
            return (
              <div key={m.fixtureId} className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center py-2 border-b border-gray-100 last:border-b-0 text-sm">
                <div className="flex items-center justify-end px-1 gap-2">
                  <span className="text-sm">{teamAMeta.name}</span>
                  <ApiSportsImage
                    imageId={data.teamA}
                    imageType={ImageType.Teams}
                    alt={teamAMeta.name}
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                  <span className="font-semibold">{aScore}</span>
                </div>
                <div className="text-center text-gray-600 px-1">
                  <div className="text-xs whitespace-nowrap">{new Date(m.utcDate).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric' }).replace(/\./g, '. ')}</div>
                  <div className="text-xs truncate">{m.league.name}</div>
                </div>
                <div className="flex items-center justify-start px-1 gap-2">
                  <span className="font-semibold">{bScore}</span>
                  <ApiSportsImage
                    imageId={data.teamB}
                    imageType={ImageType.Teams}
                    alt={teamBMeta.name}
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-sm">{teamBMeta.name}</span>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 요약 통계 */}
        <div className="mt-4 pt-3 border-t space-y-3">
          {/* 승무패 통계 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 text-sm">
            <div className="flex items-center justify-end px-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.win}W</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.draw}D</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.loss}L</span>
                </div>
              </div>
            </div>
            <div className="text-center text-gray-600 text-xs">승무패</div>
            <div className="flex items-center justify-start px-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.win}W</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.draw}D</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.loss}L</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 평균 득실점 통계 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 text-sm">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-gray-100 rounded relative">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamA.goalsFor > 0 && (
                  <div className="h-2 bg-orange-500 rounded absolute right-0" style={{ width: `${Math.min((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last) / Math.max((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last), (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last)) * 100, 100)}%` }} />
                )}
              </div>
              <span className={`font-medium ${data.h2h.last > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {data.h2h.last > 0 ? (data.h2h.resultSummary.teamA.goalsFor / data.h2h.last).toFixed(1) : '0.0'}
              </span>
            </div>
            <div className="text-center text-gray-600 text-xs">평균득점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className={`font-medium ${data.h2h.last > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {data.h2h.last > 0 ? (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last).toFixed(1) : '0.0'}
              </span>
              <div className="h-2 flex-1 bg-gray-100 rounded">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamB.goalsFor > 0 && (
                  <div className="h-2 bg-orange-500 rounded" style={{ width: `${Math.min((data.h2h.resultSummary.teamB.goalsFor / data.h2h.last) / Math.max((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last), (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last)) * 100, 100)}%` }} />
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 text-sm">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-gray-100 rounded relative">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamA.goalsAgainst > 0 && (
                  <div className="h-2 bg-blue-500 rounded absolute right-0" style={{ width: `${Math.min((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)) / Math.max((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)), (data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1))) * 100, 100)}%` }} />
                )}
              </div>
              <span className="text-blue-600 font-medium">{(data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)).toFixed(1)}</span>
            </div>
            <div className="text-center text-gray-600 text-xs">평균실점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="text-blue-600 font-medium">{(data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1)).toFixed(1)}</span>
              <div className="h-2 flex-1 bg-gray-100 rounded">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamB.goalsAgainst > 0 && (
                  <div className="h-2 bg-blue-500 rounded" style={{ width: `${Math.min((data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1)) / Math.max((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)), (data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1))) * 100, 100)}%` }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 탑 플레이어 테이블 */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="text-base font-semibold mb-3">팀 탑 플레이어</h3>
        
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-[4fr_1fr_4fr] md:grid-cols-[3fr_1fr_3fr] gap-1 mb-3 text-sm font-medium text-gray-600 border-b pb-2">
          <div className="flex items-center justify-end gap-2 px-1">
            <span>{teamAMeta.name}</span>
            <ApiSportsImage
              imageId={data.teamA}
              imageType={ImageType.Teams}
              alt={teamAMeta.name}
              width={16}
              height={16}
              className="w-4 h-4 object-contain"
            />
          </div>
          <div className="text-center px-1">구분</div>
          <div className="flex items-center justify-start gap-2 px-1">
            <ApiSportsImage
              imageId={data.teamB}
              imageType={ImageType.Teams}
              alt={teamBMeta.name}
              width={16}
              height={16}
              className="w-4 h-4 object-contain"
            />
            <span>{teamBMeta.name}</span>
          </div>
        </div>
        
        {/* 탑 스코어러 */}
        <div className="mb-4">
          <div className="grid grid-cols-[4fr_1fr_4fr] md:grid-cols-[3fr_1fr_3fr] gap-1 items-center mb-2">
            <div></div>
            <div className="text-center text-sm font-medium text-gray-700">득점</div>
            <div></div>
          </div>
          
          {Array.from({ length: Math.max(data.topPlayers.teamA.topScorers.length, data.topPlayers.teamB.topScorers.length) }).map((_, index) => {
            const playerA = data.topPlayers.teamA.topScorers[index]
            const playerB = data.topPlayers.teamB.topScorers[index]
            
            return (
              <div key={`scorer-${index}`} className="grid grid-cols-[4fr_1fr_4fr] md:grid-cols-[3fr_1fr_3fr] gap-1 items-center py-1 text-sm">
                <div className="flex items-center gap-2 justify-end px-1">
                  {playerA && (
                    <>
                      <span className="truncate ">{playerA.name || `#${playerA.playerId}`}</span>
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <img src={`https://media.api-sports.io/football/players/${playerA.playerId}.png`} alt="player" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-orange-600 font-medium  flex-shrink-0">{playerA.goals}</span>
                    </>
                  )}
                </div>
                <div></div>
                <div className="flex items-center gap-2 justify-start px-1">
                  {playerB && (
                    <>
                      <span className="text-orange-600 font-medium  flex-shrink-0">{playerB.goals}</span>
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <img src={`https://media.api-sports.io/football/players/${playerB.playerId}.png`} alt="player" className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate ">{playerB.name || `#${playerB.playerId}`}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 탑 어시스터 */}
        <div>
          <div className="grid grid-cols-[4fr_1fr_4fr] md:grid-cols-[3fr_1fr_3fr] gap-1 items-center mb-2">
            <div></div>
            <div className="text-center text-sm font-medium text-gray-700">도움</div>
            <div></div>
          </div>
          
          {Array.from({ length: Math.max(data.topPlayers.teamA.topAssist.length, data.topPlayers.teamB.topAssist.length) }).map((_, index) => {
            const playerA = data.topPlayers.teamA.topAssist[index]
            const playerB = data.topPlayers.teamB.topAssist[index]
            
            return (
              <div key={`assist-${index}`} className="grid grid-cols-[4fr_1fr_4fr] md:grid-cols-[3fr_1fr_3fr] gap-1 items-center py-1 text-sm">
                <div className="flex items-center gap-2 justify-end px-1">
                  {playerA && (
                    <>
                      <span className="truncate ">{playerA.name || `#${playerA.playerId}`}</span>
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <img src={`https://media.api-sports.io/football/players/${playerA.playerId}.png`} alt="player" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-blue-600 font-medium  flex-shrink-0">{playerA.assists}</span>
                    </>
                  )}
                </div>
                <div></div>
                <div className="flex items-center gap-2 justify-start px-1">
                  {playerB && (
                    <>
                      <span className="text-blue-600 font-medium  flex-shrink-0">{playerB.assists}</span>
                      <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <img src={`https://media.api-sports.io/football/players/${playerB.playerId}.png`} alt="player" className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate ">{playerB.name || `#${playerB.playerId}`}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  );
}


