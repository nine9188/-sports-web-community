'use client';

import React from 'react';
import Image from 'next/image';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';
import { Team } from '@/domains/livescore/types/match';
import { StandingsData } from '@/domains/livescore/types/match';
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';
import { getTeamDisplayName } from '@/domains/livescore/constants/teams';
import { getLeagueKoreanName } from '@/domains/livescore/constants/league-mappings';
import { Container, ContainerHeader, ContainerTitle, ContainerContent } from '@/shared/components/ui';

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
    const originalName = item ? (item.teams.home?.id === id ? item.teams.home?.name : item.teams.away?.name) : undefined

    // 한국어 매핑 시도, 없으면 원래 영어 이름 사용
    const koreanName = getTeamDisplayName(id, { language: 'ko' })
    const displayName = koreanName.startsWith('팀 ') ? (originalName || `#${id}`) : koreanName

    if (item) {
      const t = item.teams.home?.id === id ? item.teams.home : item.teams.away
      return {
        name: displayName,
        logo: t?.logo || `https://media.api-sports.io/football/teams/${id}.png`
      }
    }
    return { name: displayName, logo: `https://media.api-sports.io/football/teams/${id}.png` }
  }

  const teamAMeta = findTeamMeta(data.teamA)
  const teamBMeta = findTeamMeta(data.teamB)

  // 데이터 확인용 콘솔 로그
  console.log('Team A recent games:', data.recent.teamA.items.length, data.recent.teamA.items);
  console.log('Team B recent games:', data.recent.teamB.items.length, data.recent.teamB.items);

  // 평균 득/실점 계산 (최근 폼 기준)
  const gamesA = Math.max(1, data.recent.teamA.last)
  const gamesB = Math.max(1, data.recent.teamB.last)
  const avgForA = data.recent.teamA.summary.goalsFor / gamesA
  const avgAgainstA = data.recent.teamA.summary.goalsAgainst / gamesA
  const avgForB = data.recent.teamB.summary.goalsFor / gamesB
  const avgAgainstB = data.recent.teamB.summary.goalsAgainst / gamesB

  // 바 차트 너비 정규화는 각 섹션에서 상대 비교로 처리

  return (
    <>
      {/* 팀 비교(모바일 우선) */}
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle>팀 비교</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
        {/* 1) VS행: 팀명, 순위, 승무패 */}
        <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1">
          <div className="text-right px-1">
            <div className="flex items-center justify-end gap-2 mb-1">
              <div className="font-semibold truncate text-right text-gray-900 dark:text-[#F0F0F0]">{teamAMeta.name}</div>
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
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    <span>{a?.rank ? `${a.rank}위` : '-'}·{a ? `${a.all.win}승 ${a.all.draw}무 ${a.all.lose}패` : '0승 0무 0패'}</span>
                  </div>
                )
              })()
            ) : null}
          </div>
          <div className="text-center px-1">
            <div className="text-lg font-extrabold text-gray-900 dark:text-[#F0F0F0]">VS</div>
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
              <div className="font-semibold truncate text-gray-900 dark:text-[#F0F0F0]">{teamBMeta.name}</div>
            </div>
            {data.standings?.standings?.league?.standings ? (
              (() => {
                const group = data.standings!.standings.league.standings[0] || []
                const b = group.find(s => s.team.id === data.teamB)
                return (
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    <span>{b?.rank ? `${b.rank}위` : '-'}·{b ? `${b.all.win}승 ${b.all.draw}무 ${b.all.lose}패` : '0승 0무 0패'}</span>
                  </div>
                )
              })()
            ) : null}
          </div>
        </div>

        {/* 2) 평균득점행 (최근 양팀 맞대결 UI와 동일 처리) */}
        <div className="mt-4">
          <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1 text-sm">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded relative">
                {avgForA > 0 && (
                  <div
                    className="h-2 bg-red-500 rounded absolute right-0"
                    style={{ width: `${Math.min((avgForA / Math.max(avgForA, avgForB)) * 100, 100)}%` }}
                  />
                )}
              </div>
              <span className="font-semibold min-w-8">{avgForA.toFixed(2)}</span>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs px-1 whitespace-nowrap">평균득점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">{avgForB.toFixed(2)}</span>
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded">
                {avgForB > 0 && (
                  <div
                    className="h-2 bg-red-500 rounded"
                    style={{ width: `${Math.min((avgForB / Math.max(avgForA, avgForB)) * 100, 100)}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4) 평균실점행 (최근 양팀 맞대결 UI와 동일 처리) */}
        <div className="mt-3">
          <div className="grid grid-cols-[3fr_1fr_3fr] items-center gap-1 text-sm">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded relative">
                {avgAgainstA > 0 && (
                  <div
                    className="h-2 bg-blue-500 rounded absolute right-0"
                    style={{ width: `${Math.min((avgAgainstA / Math.max(avgAgainstA, avgAgainstB)) * 100, 100)}%` }}
                  />
                )}
              </div>
              <span className="font-semibold min-w-8">{avgAgainstA.toFixed(2)}</span>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs px-1 whitespace-nowrap">평균실점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">{avgAgainstB.toFixed(2)}</span>
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded">
                {avgAgainstB > 0 && (
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${Math.min((avgAgainstB / Math.max(avgAgainstA, avgAgainstB)) * 100, 100)}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        </ContainerContent>
      </Container>

      {/* 최근 경기 */}
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle>최근 경기</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
            {/* Team A 최근 경기 */}
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">{teamAMeta.name}</div>
              <div className="space-y-1.5">
                {data.recent.teamA.items.slice(0, 5).map((it) => {
                  const opponentName = it.opponent.name || `팀 #${it.opponent.id}`;
                  const displayName = getTeamDisplayName(it.opponent.id || 0, { language: 'ko' });
                  const finalName = displayName.startsWith('팀 ') ? opponentName : displayName;
                  const bgColor = it.result === 'W'
                    ? 'bg-green-100 dark:bg-green-900'
                    : it.result === 'D'
                    ? 'bg-yellow-100 dark:bg-yellow-900'
                    : 'bg-red-100 dark:bg-red-900';
                  const textColor = it.result === 'W'
                    ? 'text-green-800 dark:text-green-200'
                    : it.result === 'D'
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-red-800 dark:text-red-200';

                  // 홈 경기: TeamA vs 상대팀, 원정 경기: 상대팀 vs TeamA
                  return (
                    <div key={it.fixtureId} className="flex items-center gap-1.5 text-xs">
                      {it.venue === 'home' ? (
                        <>
                          <span className="text-gray-900 dark:text-[#F0F0F0] truncate flex-1 text-right">{teamAMeta.name}</span>
                          <span className={`px-2 py-1 rounded font-semibold flex-shrink-0 ${bgColor} ${textColor}`}>{it.score.for}-{it.score.against}</span>
                          <span className="text-gray-900 dark:text-[#F0F0F0] truncate flex-1">{finalName}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-900 dark:text-[#F0F0F0] truncate flex-1 text-right">{finalName}</span>
                          <span className={`px-2 py-1 rounded font-semibold flex-shrink-0 ${bgColor} ${textColor}`}>{it.score.against}-{it.score.for}</span>
                          <span className="text-gray-900 dark:text-[#F0F0F0] truncate flex-1">{teamAMeta.name}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-black/5 dark:bg-white/10"></div>

            {/* Team B 최근 경기 */}
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">{teamBMeta.name}</div>
              <div className="space-y-1.5">
                {data.recent.teamB.items.slice(0, 5).map((it) => {
                  const opponentName = it.opponent.name || `팀 #${it.opponent.id}`;
                  const displayName = getTeamDisplayName(it.opponent.id || 0, { language: 'ko' });
                  const finalName = displayName.startsWith('팀 ') ? opponentName : displayName;
                  const bgColor = it.result === 'W'
                    ? 'bg-green-100 dark:bg-green-900'
                    : it.result === 'D'
                    ? 'bg-yellow-100 dark:bg-yellow-900'
                    : 'bg-red-100 dark:bg-red-900';
                  const textColor = it.result === 'W'
                    ? 'text-green-800 dark:text-green-200'
                    : it.result === 'D'
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-red-800 dark:text-red-200';

                  // 홈 경기: TeamB vs 상대팀, 원정 경기: 상대팀 vs TeamB
                  return (
                    <div key={it.fixtureId} className="flex items-center gap-1.5 text-xs">
                      {it.venue === 'home' ? (
                        <>
                          <span className="text-gray-900 dark:text-[#F0F0F0] truncate flex-1 text-right">{teamBMeta.name}</span>
                          <span className={`px-2 py-1 rounded font-semibold flex-shrink-0 ${bgColor} ${textColor}`}>{it.score.for}-{it.score.against}</span>
                          <span className="text-gray-900 dark:text-[#F0F0F0] truncate flex-1">{finalName}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-900 dark:text-[#F0F0F0] truncate flex-1 text-right">{finalName}</span>
                          <span className={`px-2 py-1 rounded font-semibold flex-shrink-0 ${bgColor} ${textColor}`}>{it.score.against}-{it.score.for}</span>
                          <span className="text-gray-900 dark:text-[#F0F0F0] truncate flex-1">{teamBMeta.name}</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ContainerContent>
      </Container>

      {/* 최근 맞대결 리스트: 중앙 기준 좌/우 분할 */}
      <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
        <ContainerHeader>
          <ContainerTitle>최근 양팀 맞대결</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
        
        {/* 경기 결과 목록 */}
        <div className="space-y-1">
          {data.h2h.items.map((m) => {
            const isTeamAHome = m.teams.home?.id === data.teamA
            const aScore = isTeamAHome ? m.score.home : m.score.away
            const bScore = isTeamAHome ? m.score.away : m.score.home
            return (
              <div key={m.fixtureId} className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center py-2 border-b border-black/5 dark:border-white/10 last:border-b-0 text-sm">
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
                <div className="text-center text-gray-500 dark:text-gray-400 px-1">
                  <div className="text-xs whitespace-nowrap">{new Date(m.utcDate).toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric', timeZone: 'Asia/Seoul' }).replace(/\./g, '. ')}</div>
                  <div className="text-xs truncate">{getLeagueKoreanName(m.league.name)}</div>
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
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.win}W</span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.draw}D</span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs font-medium">{data.h2h.resultSummary.teamA.loss}L</span>
                </div>
              </div>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs">승무패</div>
            <div className="flex items-center justify-start px-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.win}W</span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.draw}D</span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs font-medium">{data.h2h.resultSummary.teamB.loss}L</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 평균 득실점 통계 */}
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 text-sm">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded relative">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamA.goalsFor > 0 && (
                  <div className="h-2 bg-red-500 rounded absolute right-0" style={{ width: `${Math.min((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last) / Math.max((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last), (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last)) * 100, 100)}%` }} />
                )}
              </div>
              <span className="font-semibold min-w-8">
                {data.h2h.last > 0 ? (data.h2h.resultSummary.teamA.goalsFor / data.h2h.last).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs">평균득점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">
                {data.h2h.last > 0 ? (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last).toFixed(2) : '0.00'}
              </span>
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamB.goalsFor > 0 && (
                  <div className="h-2 bg-red-500 rounded" style={{ width: `${Math.min((data.h2h.resultSummary.teamB.goalsFor / data.h2h.last) / Math.max((data.h2h.resultSummary.teamA.goalsFor / data.h2h.last), (data.h2h.resultSummary.teamB.goalsFor / data.h2h.last)) * 100, 100)}%` }} />
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 text-sm">
            <div className="flex items-center justify-end px-1 gap-2">
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded relative">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamA.goalsAgainst > 0 && (
                  <div className="h-2 bg-blue-500 rounded absolute right-0" style={{ width: `${Math.min((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)) / Math.max((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)), (data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1))) * 100, 100)}%` }} />
                )}
              </div>
              <span className="font-semibold min-w-8">{(data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)).toFixed(2)}</span>
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs">평균실점</div>
            <div className="flex items-center justify-start px-1 gap-2">
              <span className="font-semibold min-w-8">{(data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1)).toFixed(2)}</span>
              <div className="h-2 flex-1 bg-[#EAEAEA] dark:bg-[#333333] rounded">
                {data.h2h.last > 0 && data.h2h.resultSummary.teamB.goalsAgainst > 0 && (
                  <div className="h-2 bg-blue-500 rounded" style={{ width: `${Math.min((data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1)) / Math.max((data.h2h.resultSummary.teamA.goalsAgainst / Math.max(data.h2h.last, 1)), (data.h2h.resultSummary.teamB.goalsAgainst / Math.max(data.h2h.last, 1))) * 100, 100)}%` }} />
                )}
              </div>
            </div>
          </div>
        </div>
        </ContainerContent>
      </Container>

      {/* 탑 플레이어 테이블 */}
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerHeader>
          <ContainerTitle>팀 탑 플레이어</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
        
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 mb-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-black/5 dark:border-white/10 pb-2">
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
          <div className="text-center px-1 border-x border-black/5 dark:border-white/10">구분</div>
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
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center mb-2">
            <div></div>
            <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-x border-black/5 dark:border-white/10">득점</div>
            <div></div>
          </div>
          
          {Array.from({ length: Math.max(data.topPlayers.teamA.topScorers.length, data.topPlayers.teamB.topScorers.length) }).map((_, index) => {
            const playerA = data.topPlayers.teamA.topScorers[index]
            const playerB = data.topPlayers.teamB.topScorers[index]

            const playerAKoreanName = playerA ? getPlayerKoreanName(playerA.playerId) : null;
            const playerADisplayName = playerAKoreanName || playerA?.name || `#${playerA?.playerId}`;
            const playerBKoreanName = playerB ? getPlayerKoreanName(playerB.playerId) : null;
            const playerBDisplayName = playerBKoreanName || playerB?.name || `#${playerB?.playerId}`;

            return (
              <div key={`scorer-${index}`} className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center py-2 text-sm border-b border-black/5 dark:border-white/10 last:border-b-0">
                <div className="flex items-center gap-3 justify-end px-1">
                  {playerA && (
                    <>
                      <span className="text-sm sm:text-base leading-snug line-clamp-2 max-w-[160px] text-right">{playerADisplayName}</span>
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center flex-shrink-0">
                        <Image src={`https://media.api-sports.io/football/players/${playerA.playerId}.png`} alt="player" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      </div>
                      <span className="text-orange-600 font-semibold flex-shrink-0 text-base">{playerA.goals}</span>
                    </>
                  )}
                </div>
                <div className="border-x border-black/5 dark:border-white/10 h-full" />
                <div className="flex items-center gap-3 justify-start px-1">
                  {playerB && (
                    <>
                      <span className="text-orange-600 font-semibold flex-shrink-0 text-base">{playerB.goals}</span>
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center flex-shrink-0">
                        <Image src={`https://media.api-sports.io/football/players/${playerB.playerId}.png`} alt="player" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      </div>
                      <span className="text-sm sm:text-base leading-snug line-clamp-2 max-w-[160px]">{playerBDisplayName}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* 탑 어시스터 */}
        <div>
          <div className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center mb-2">
            <div></div>
            <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-x border-black/5 dark:border-white/10">도움</div>
            <div></div>
          </div>
          
          {Array.from({ length: Math.max(data.topPlayers.teamA.topAssist.length, data.topPlayers.teamB.topAssist.length) }).map((_, index) => {
            const playerA = data.topPlayers.teamA.topAssist[index]
            const playerB = data.topPlayers.teamB.topAssist[index]

            const playerAKoreanName = playerA ? getPlayerKoreanName(playerA.playerId) : null;
            const playerADisplayName = playerAKoreanName || playerA?.name || `#${playerA?.playerId}`;
            const playerBKoreanName = playerB ? getPlayerKoreanName(playerB.playerId) : null;
            const playerBDisplayName = playerBKoreanName || playerB?.name || `#${playerB?.playerId}`;

            return (
              <div key={`assist-${index}`} className="grid grid-cols-[3fr_1fr_3fr] gap-1 items-center py-2 text-sm border-b border-black/5 dark:border-white/10 last:border-b-0">
                <div className="flex items-center gap-3 justify-end px-1">
                  {playerA && (
                    <>
                      <span className="text-sm sm:text-base leading-snug line-clamp-2 max-w-[160px] text-right">{playerADisplayName}</span>
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center flex-shrink-0">
                        <Image src={`https://media.api-sports.io/football/players/${playerA.playerId}.png`} alt="player" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      </div>
                      <span className="text-blue-600 font-semibold flex-shrink-0 text-base">{playerA.assists}</span>
                    </>
                  )}
                </div>
                <div className="border-x border-black/5 dark:border-white/10 h-full" />
                <div className="flex items-center gap-3 justify-start px-1">
                  {playerB && (
                    <>
                      <span className="text-blue-600 font-semibold flex-shrink-0 text-base">{playerB.assists}</span>
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#F5F5F5] dark:bg-[#262626] flex items-center justify-center flex-shrink-0">
                        <Image src={`https://media.api-sports.io/football/players/${playerB.playerId}.png`} alt="player" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                      </div>
                      <span className="text-sm sm:text-base leading-snug line-clamp-2 max-w-[160px]">{playerBDisplayName}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </ContainerContent>
      </Container>
    </>
  );
}


