'use server'

import React from 'react'
import UserIcon from '@/shared/components/UserIcon'
import { fetchCachedMultiplePlayerStats } from '@/domains/livescore/actions/match/playerStats'
import { fetchCachedMatchLineups } from '@/domains/livescore/actions/match/lineupData'
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage'
import { ImageType } from '@/shared/types/image'

export default async function TestPage({ searchParams }: { searchParams: Promise<{ fixture?: string; players?: string }> }) {
  const { fixture, players } = await searchParams;

  // 입력된 players 파싱
  const manualPlayerIds = (players || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);

  // 라인업 정보 (팀 식별 및 자동 선수 수집용)
  let autoPlayerIds: number[] = [];
  let homeTeamId: number | null = null;
  let awayTeamId: number | null = null;
  let homeTeamName: string | null = null;
  let awayTeamName: string | null = null;
  if (fixture) {
    const lineups = await fetchCachedMatchLineups(fixture);
    if (lineups?.success && lineups.response) {
      const { home, away } = lineups.response;
      homeTeamId = home?.team?.id ?? null;
      awayTeamId = away?.team?.id ?? null;
      homeTeamName = home?.team?.name ?? null;
      awayTeamName = away?.team?.name ?? null;

      if (manualPlayerIds.length === 0) {
        const ids = [
          ...(home.startXI || []).map((i) => i.player.id),
          ...(home.substitutes || []).map((i) => i.player.id),
          ...(away.startXI || []).map((i) => i.player.id),
          ...(away.substitutes || []).map((i) => i.player.id),
        ].filter((id) => Number.isFinite(id) && id > 0) as number[];
        autoPlayerIds = Array.from(new Set(ids));
      }
    }
  }

  const resolvedPlayerIds = manualPlayerIds.length > 0 ? manualPlayerIds : autoPlayerIds;

  let aggregatedStats: Awaited<ReturnType<typeof fetchCachedMultiplePlayerStats>> | null = null;
  if (fixture && resolvedPlayerIds.length > 0) {
    aggregatedStats = await fetchCachedMultiplePlayerStats(fixture, resolvedPlayerIds);
  }
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <h1 className="text-xl font-semibold">@test / 프로필 아이콘 확인</h1>

      {/* 경기 선수 통계 일괄 조회 (GET 폼) */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">경기 선수 통계 일괄 조회 (테스트)</h2>
        <form className="flex flex-col gap-3 rounded-lg border p-4" method="GET">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Fixture ID</span>
              <input
                type="text"
                name="fixture"
                defaultValue={fixture || ''}
                placeholder="예: 1035053"
                className="border rounded px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm text-gray-600">Player IDs (쉼표 구분)</span>
              <input
                type="text"
                name="players"
                defaultValue={players || (autoPlayerIds.length > 0 ? autoPlayerIds.join(',') : '')}
                placeholder="예: 874, 382, 2543"
                className="border rounded px-3 py-2"
              />
            </label>
          </div>
          <div>
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800">불러오기</button>
          </div>
        </form>

        {/* 결과 표 - 홈/원정 분리 */}
        {fixture && resolvedPlayerIds.length > 0 && (
          (() => {
            const homeRows: number[] = [];
            const awayRows: number[] = [];
            const unknownRows: number[] = [];

            resolvedPlayerIds.forEach((pid) => {
              const entry = aggregatedStats?.[pid]?.response?.[0];
              const teamId = entry?.statistics?.[0]?.team?.id ?? null;
              if (teamId && homeTeamId && teamId === homeTeamId) homeRows.push(pid);
              else if (teamId && awayTeamId && teamId === awayTeamId) awayRows.push(pid);
              else unknownRows.push(pid);
            });

            const Table = ({ title, ids, teamId }: { title: string; ids: number[]; teamId?: number | null }) => (
              <div className="rounded-lg border overflow-hidden">
                <div className="px-4 py-2 text-sm text-gray-700 border-b bg-gray-50 flex items-center gap-2">
                  {teamId ? (
                    <UnifiedSportsImage
                      imageId={teamId}
                      imageType={ImageType.Teams}
                      alt={`${title} 로고`}
                      size="sm"
                      variant="square"
                      fit="contain"
                    />
                  ) : null}
                  <span className="font-medium">{title}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">선수</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">분</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">평점</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">골</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">도움</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">슈팅(유효)</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">패스(키, 성공률)</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">드리블</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">듀얼</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">파울</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">카드</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {ids.map((pid) => {
                        const entry = aggregatedStats?.[pid]?.response?.[0];
                        const p = entry?.player;
                        const s = entry?.statistics?.[0];
                        return (
                          <tr key={pid} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              {p?.name || pid}
                              <span className="ml-1 text-xs text-gray-500">{s?.games?.position || p?.pos || '-'}</span>
                            </td>
                            <td className="px-3 py-2 text-right">{s?.games?.minutes ?? 0}</td>
                            <td className="px-3 py-2 text-right">{s?.games?.rating || '-'}</td>
                            <td className="px-3 py-2 text-right">{s?.goals?.total ?? 0}</td>
                            <td className="px-3 py-2 text-right">{s?.goals?.assists ?? 0}</td>
                            <td className="px-3 py-2 text-right">{s?.shots?.total ?? 0} ({s?.shots?.on ?? 0})</td>
                            <td className="px-3 py-2 text-right">{s?.passes?.total ?? 0} ({s?.passes?.key ?? 0}, {(s?.passes?.accuracy ?? '0')}%)</td>
                            <td className="px-3 py-2 text-right">{s?.dribbles?.success ?? 0}/{s?.dribbles?.attempts ?? 0}</td>
                            <td className="px-3 py-2 text-right">{s?.duels?.won ?? 0}/{s?.duels?.total ?? 0}</td>
                            <td className="px-3 py-2 text-right">{s?.fouls?.committed ?? 0}</td>
                            <td className="px-3 py-2 text-right">{s?.cards?.yellow ?? 0}/{s?.cards?.red ?? 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );

            return (
              <div className="space-y-4">
                <div className="px-4 py-2 text-sm text-gray-600 border rounded bg-gray-50">
                  조회 경기: <span className="font-medium">{fixture}</span>
                  {manualPlayerIds.length === 0 && autoPlayerIds.length > 0 && (
                    <span className="ml-2 text-xs text-gray-500">(라인업에서 자동 수집)</span>
                  )}
                </div>
                <div className="space-y-4">
                  <Table title={homeTeamName || '홈팀'} ids={homeRows} teamId={homeTeamId} />
                  <Table title={awayTeamName || '원정팀'} ids={awayRows} teamId={awayTeamId} />
                </div>
                {unknownRows.length > 0 && (
                  <div className="rounded-lg border p-3 text-xs text-gray-600">
                    팀 식별 불가 선수: {unknownRows.length}명 ({unknownRows.join(', ')})
                  </div>
                )}
              </div>
            );
          })()
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">실사용 맵핑 (모바일 | PC 나란히 보기)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mobile Preview */}
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-3">모바일 미리보기</div>
            <div className="space-y-4">
              {/* PostHeader - Mobile 20px */}
              <div>
                <div className="text-xs font-medium mb-1">PostHeader</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 mr-1.5 relative rounded-full overflow-hidden flex-shrink-0">
                    <UserIcon size={20} level={1} alt="PostHeader Mobile" className="object-cover" />
                  </div>
                  <span className="text-xs text-gray-500">20×20</span>
                </div>
              </div>

              {/* PostList - Mobile 20px */}
              <div>
                <div className="text-xs font-medium mb-1">PostList</div>
                <div className="flex items-center gap-2">
                  <div className="mr-0.5 flex items-center justify-center overflow-hidden">
                    <UserIcon size={20} level={3} alt="PostList Mobile" />
                  </div>
                  <span className="text-xs text-gray-500">20×20</span>
                </div>
              </div>
            </div>
          </div>

          {/* PC Preview */}
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-3">PC 미리보기</div>
            <div className="space-y-4">
              {/* PostHeader - Desktop 24px */}
              <div>
                <div className="text-xs font-medium mb-1">PostHeader</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 mr-1.5 relative rounded-full overflow-hidden flex-shrink-0">
                    <UserIcon size={20} level={1} alt="PostHeader Desktop" className="object-cover" />
                  </div>
                  <span className="text-xs text-gray-500">20×20</span>
                </div>
              </div>

              {/* PostList - Desktop 24px */}
              <div>
                <div className="text-xs font-medium mb-1">PostList</div>
                <div className="flex items-center gap-2">
                  <div className="mr-0.5 flex items-center justify-center overflow-hidden">
                    <UserIcon size={20} level={3} alt="PostList Desktop" />
                  </div>
                  <span className="text-xs text-gray-500">20×20</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 공통 크기 샘플 (브레이크포인트 무관) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Header Trigger: 20px 고정 */}
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Header Trigger</div>
            <div className="flex items-center gap-2">
              <UserIcon size={20} level={5} alt="Header Trigger" />
              <span className="text-xs text-gray-500">20×20</span>
            </div>
          </div>

          {/* Profile Dropdown Preview: 20px */}
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Profile Dropdown Preview</div>
            <div className="flex items-center gap-2">
              <UserIcon size={20} level={7} alt="Dropdown Preview" />
              <span className="text-xs text-gray-500">20×20</span>
            </div>
          </div>

          {/* Comment: 20px 고정 */}
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Comment</div>
            <div className="flex items-center gap-2">
              <UserIcon size={20} level={2} alt="Comment" />
              <span className="text-xs text-gray-500">20×20</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">자유 크기 프리뷰</h2>
        <div className="flex items-center gap-6 flex-wrap">
          {[16, 20, 24, 28, 32, 40].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <UserIcon size={s} level={Math.min(10, Math.max(1, Math.round(s / 2)))} alt={`size-${s}`} />
              <span className="text-xs text-gray-500">{s}px</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}


