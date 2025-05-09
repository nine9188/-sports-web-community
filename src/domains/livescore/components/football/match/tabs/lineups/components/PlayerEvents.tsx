'use client';

import { MatchEvent } from '@/domains/livescore/types/match';
import { FaFutbol, FaShoePrints } from 'react-icons/fa';
import { BsCardText, BsCardHeading } from 'react-icons/bs';
import { IoMdSwap } from 'react-icons/io';

interface Player {
  id: number;
  name: string;
  number: number;
  pos: string;
  grid?: string | null;
  captain?: boolean;
  photo?: string;
}

export default function PlayerEvents({ player, events }: { player: Player; events: MatchEvent[] | undefined }) {
  if (!events || events.length === 0) return null;
  
  // 해당 선수의 이벤트 필터링 - 더 정확한 필터링
  const playerEvents = events.filter(event => {
    // ID가 없는 경우 필터링에서 제외
    if (!event?.player?.id && !event?.assist?.id) return false;
    
    // 교체 이벤트의 경우 특별 처리
    if (event.type === 'subst' || event.type === 'Substitution') {
      return event.player?.id === player.id || event.assist?.id === player.id;
    }
    
    // 일반 이벤트의 경우 기본 처리
    return event.player?.id === player.id || event.assist?.id === player.id;
  });
  
  if (playerEvents.length === 0) return null;
  
  return (
    <div className="inline-flex flex-wrap gap-1 ml-1">
      {playerEvents.map((event, index) => {
        if (!event) return null;
        
        // 이벤트 시간 포맷팅
        const timeStr = `${event.time.elapsed || '0'}${event.time.extra ? '+' + event.time.extra : ''}`;
        
        // 이벤트 타입에 따른 아이콘 및 텍스트 렌더링
        if (event.type === 'Goal') {
          // 골 또는 어시스트
          if (event.player?.id === player.id) {
            // 골
            return (
              <span key={`goal-${index}`} className="inline-flex items-center text-xs bg-green-100 text-green-800 rounded px-1">
                <FaFutbol className="text-green-600 mr-0.5" />
                {timeStr}&apos;
              </span>
            );
          } else if (event.assist?.id === player.id) {
            // 어시스트
            return (
              <span key={`assist-${index}`} className="inline-flex items-center text-xs bg-blue-100 text-blue-800 rounded px-1">
                <FaShoePrints className="text-blue-600 mr-0.5" />
                {timeStr}&apos;
              </span>
            );
          }
        } else if (event.type === 'Card') {
          if (event.player?.id === player.id) {
            if (event.detail === 'Yellow Card') {
              // 옐로카드
              return (
                <span key={`yellow-${index}`} className="inline-flex items-center text-xs bg-yellow-100 text-yellow-800 rounded px-1">
                  <BsCardText className="text-yellow-500 mr-0.5" />
                  {timeStr}&apos;
                </span>
              );
            } else if (event.detail === 'Red Card') {
              // 레드카드
              return (
                <span key={`red-${index}`} className="inline-flex items-center text-xs bg-red-100 text-red-800 rounded px-1">
                  <BsCardHeading className="text-red-600 mr-0.5" />
                  {timeStr}&apos;
                </span>
              );
            }
          }
        } else if (event.type === 'subst' || event.type === 'Substitution') {
          // 교체 정보 매핑 수정 - API 응답에 따라 다른 구조일 수 있음
          let isIn = false;
          let isOut = false;
          
          // 교체 OUT은 player ID, 교체 IN은 assist ID에 해당
          // 선수가 나가는 경우 (player ID가 OUT 선수)
          if (event.player?.id === player.id && (event.detail === 'Substitution Out' || event.detail?.includes('Out'))) {
            isOut = true;
          } 
          // 선수가 들어오는 경우 (assist ID가 IN 선수)
          else if (event.assist?.id === player.id && (event.detail === 'Substitution In' || event.detail?.includes('In'))) {
            isIn = true;
          }
          
          // 이전 로직 백업 (일부 API는 다른 구조 사용)
          if (!isIn && !isOut) {
            // player가 교체 아웃, assist가 교체 투입 선수인 경우
            if (event.detail === 'Substitution' || event.detail?.includes('Substitution')) {
              if (event.player?.id === player.id) {
                isOut = true;
              } else if (event.assist?.id === player.id) {
                isIn = true;
              }
            }
          }
          
          if (isIn) {
            return (
              <span key={`in-${index}`} className="inline-flex items-center text-xs bg-green-100 text-green-800 rounded px-1">
                <IoMdSwap className="text-green-600 mr-0.5" />
                IN {timeStr}&apos;
              </span>
            );
          } else if (isOut) {
            return (
              <span key={`out-${index}`} className="inline-flex items-center text-xs bg-red-100 text-red-800 rounded px-1">
                <IoMdSwap className="text-red-600 mr-0.5 rotate-180" />
                OUT {timeStr}&apos;
              </span>
            );
          }
        }
        
        // 기본 이벤트 표시 (위에서 처리되지 않은 모든 이벤트)
        return (
          <span key={`event-${index}`} className="inline-flex items-center text-xs bg-gray-100 text-gray-800 rounded px-1">
            {timeStr}&apos;
          </span>
        );
      })}
    </div>
  );
} 