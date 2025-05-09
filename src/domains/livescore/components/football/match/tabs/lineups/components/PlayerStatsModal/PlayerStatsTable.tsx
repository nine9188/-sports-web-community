'use client';

import Link from 'next/link';
import { PlayerStatistics } from '@/domains/livescore/actions/match/playerStats';

interface PlayerStatsTableProps {
  playerId: number;
  playerPosition: string;
  stats: PlayerStatistics;
}

export default function PlayerStatsTable({ playerId, playerPosition, stats }: PlayerStatsTableProps) {
  const isGoalkeeper = playerPosition === 'G';

  return (
    <div className="px-4 pb-8">
      <table className="w-full border-collapse">
        <TableSection title="기본 정보">
          <TableRow label="평점" value={stats.games?.rating || '-'} />
          <TableRow label="출전시간" value={`${stats.games?.minutes || 0}'`} />
        </TableSection>

        {/* 필드 플레이어 전용 스탯 */}
        {!isGoalkeeper && (
          <>
            <TableSection title="공격 스탯">
              <TableRow label="득점" value={stats.goals?.total || 0} />
              <TableRow label="도움" value={stats.goals?.assists || 0} />
              <TableRow label="슈팅" value={stats.shots?.total || 0} />
              <TableRow label="유효슈팅" value={stats.shots?.on || 0} />
            </TableSection>

            <TableSection title="드리블 & 듀얼">
              <TableRow label="드리블 시도" value={stats.dribbles?.attempts || 0} />
              <TableRow label="드리블 성공" value={stats.dribbles?.success || 0} />
              <TableRow label="듀얼 시도" value={stats.duels?.total || 0} />
              <TableRow label="듀얼 성공" value={stats.duels?.won || 0} />
            </TableSection>
          </>
        )}

        {/* 공통 스탯 */}
        <TableSection title="패스">
          <TableRow label="총 패스" value={stats.passes?.total || 0} />
          <TableRow label="키패스" value={stats.passes?.key || 0} />
          <TableRow label="패스 성공률" value={`${stats.passes?.accuracy || 0}%`} />
        </TableSection>

        <TableSection title="파울 & 카드">
          <TableRow label="파울 얻음" value={stats.fouls?.drawn || 0} />
          <TableRow label="파울 범함" value={stats.fouls?.committed || 0} />
          <TableRow label="옐로카드" value={stats.cards?.yellow || 0} />
          <TableRow label="레드카드" value={stats.cards?.red || 0} />
        </TableSection>

        {/* 골키퍼 전용 스탯 */}
        {isGoalkeeper && (
          <TableSection title="골키퍼 스탯">
            <TableRow label="실점" value={stats.goals?.conceded || 0} />
            <TableRow label="선방" value={stats.goals?.saves || 0} />
            <TableRow label="막아낸 PK" value={stats.penalty?.saved || 0} />
          </TableSection>
        )}
      </table>
      
      {/* 선수 상세 정보 페이지로 이동하는 버튼 */}
      <div className="mt-6 mb-4 text-center px-2">
        <Link 
          href={`/livescore/football/player/${playerId}`}
          className="inline-block w-full py-3 px-3 bg-gray-800 text-white font-medium rounded-lg shadow hover:bg-gray-700 transition-colors text-lg"
        >
          선수 정보 더보기
        </Link>
      </div>
    </div>
  );
}

interface TableSectionProps {
  title: string;
  children: React.ReactNode;
}

function TableSection({ title, children }: TableSectionProps) {
  return (
    <>
      <thead>
        <tr className="bg-gray-50">
          <th colSpan={2} className="px-4 py-2 text-left font-bold text-gray-700 border-b">
            {title}
          </th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </>
  );
}

interface TableRowProps {
  label: string;
  value: string | number;
}

function TableRow({ label, value }: TableRowProps) {
  return (
    <tr className="border-b">
      <td className="px-4 py-2 text-gray-600">{label}</td>
      <td className="px-4 py-2 font-medium">{value}</td>
    </tr>
  );
} 