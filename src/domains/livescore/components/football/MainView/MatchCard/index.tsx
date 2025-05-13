'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { Match } from '@/domains/livescore/types/match';

// 매치 카드 props
interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match: initialMatch }: MatchCardProps) {
  const router = useRouter();
  const [match] = useState(initialMatch);

  const homeTeam = {
    name: match.teams?.home?.name || '',
    logo: match.teams?.home?.img || '',
    score: match.teams?.home?.score ?? 0
  };

  const awayTeam = {
    name: match.teams?.away?.name || '',
    logo: match.teams?.away?.img || '',
    score: match.teams?.away?.score ?? 0
  };

  // 모바일용 시간/상태 표시 (왼쪽에 표시될 내용)
  const getMobileTimeOrStatus = () => {
    const code = match.status?.code || '';
    
    // 진행중인 경기
    if (['1H', '2H', 'LIVE', 'IN_PLAY'].includes(code)) {
      const elapsed = 0; // Match 타입에는 elapsed가 없음
      return `${elapsed}'`;
    }
    
    // 나머지는 모두 경기 시작 시간 표시
    return new Date(match.time?.date || Date.now()).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    });
  };

  const getStatusColor = () => {
    const code = match.status?.code || '';
    
    if (code === 'LIVE' || code === '1H' || code === '2H') return 'text-red-500';
    if (code === 'FT' || code === 'AET' || code === 'PEN') return 'text-gray-500';
    if (code === 'NS') return 'text-blue-500';
    return 'text-yellow-500';
  };

  // PC용 상태 표시 (오른쪽에 표시될 내용)
  const getStatusDisplay = () => {
    const code = match.status?.code || '';
    
    switch(code) {
      case 'NS': return '예정';
      case 'FT':
      case 'AET':
      case 'PEN': return '종료';
      case '1H':
      case '2H':
      case 'LIVE':
      case 'IN_PLAY': return '진행중';
      case 'HT': return '휴식';
      case 'CANC': return '취소';
      case 'PST': return '연기';
      default: return code;
    }
  };

  // 스코어 표시 함수 수정
  const getScore = (isHome: boolean) => {
    const code = match.status?.code || '';
    const score = isHome ? homeTeam.score : awayTeam.score;
    
    // 경기 예정인 경우 '-' 표시
    if (code === 'NS' || code === 'TBD') {
      return '-';
    }
    
    // 일반 경기
    return score ?? '-';
  };

  // 클릭 이벤트 핸들러
  const handleClick = () => {
    router.push(`/livescore/football/match/${match.id}`);
  };

  return (
    <div 
      className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border-gray-100 max-w-full"
      onClick={handleClick}
    >
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-[40px]"/>
          <col className="w-[100px]"/>
          <col className="w-[40px]"/>
          <col className="w-[100px]"/>
          <col style={{ width: '40px' }}/>
        </colgroup>
        <tbody>
          <tr className="text-sm">
            {/* 시간/상태 */}
            <td className={`py-4 px-1 font-medium whitespace-nowrap ${getStatusColor()}`}>
              {/* 모바일 버전과 PC 버전 모두 왼쪽에는 시간 표시 */}
              <span className="text-left block">
                {getMobileTimeOrStatus()}
              </span>
            </td>

            {/* 홈팀 */}
            <td className="py-4 pl-1 pr-0 md:pr-0">
              <div className="md:flex md:items-center md:justify-end">
                <div className="flex items-center justify-end gap-1 md:w-auto">
                  <span className="truncate font-medium">{homeTeam.name}</span>
                  <div className="relative w-6 h-6 shrink-0">
                    {/* 빈 문자열 체크 추가 */}
                    {homeTeam.logo ? (
                      <Image 
                        src={homeTeam.logo} 
                        alt={homeTeam.name}
                        fill
                        sizes="24px"
                        className="object-contain"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </td>

            {/* 스코어 */}
            <td className="py-4 px-1 text-center">
              <span className="font-bold">
                {getScore(true)} - {getScore(false)}
              </span>
            </td>

            {/* 원정팀 */}
            <td className="py-4 pl-0 pr-1 md:pl-0">
              <div className="flex items-center gap-1 md:w-auto">
                <div className="relative w-6 h-6 shrink-0">
                  {/* 빈 문자열 체크 추가 */}
                  {awayTeam.logo ? (
                    <Image 
                      src={awayTeam.logo} 
                      alt={awayTeam.name}
                      fill
                      sizes="24px"
                      className="object-contain"
                    />
                  ) : null}
                </div>
                <span className="truncate font-medium">{awayTeam.name}</span>
              </div>
            </td>

            {/* PC 상태 (오른쪽) */}
            <td className="hidden md:table-cell py-4 pr-2 text-gray-500 font-medium whitespace-nowrap text-center">
              {getStatusDisplay()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 