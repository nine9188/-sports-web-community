// 이벤트 타입 인터페이스 (실제 API 응답 구조와 일치)
export interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number | null;
  };
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id?: number | null;
    name?: string | null;
  };
  type: string;
  detail: string;
  comments?: string | null;
}

/**
 * 이벤트 타입 정의
 */
export enum EventType {
  GOAL = 'Goal',
  CARD = 'Card',
  SUBSTITUTION = 'subst',
  VAR = 'Var',
  MISS = 'Miss'
}

/**
 * 이벤트 세부 정보 정의
 */
export enum EventDetail {
  // 골 관련
  NORMAL_GOAL = 'Normal Goal',
  PENALTY = 'Penalty',
  OWN_GOAL = 'Own Goal',
  
  // 카드 관련
  YELLOW_CARD = 'Yellow Card',
  RED_CARD = 'Red Card',
  SECOND_YELLOW = 'Second Yellow card',
  
  // 교체 관련
  SUBSTITUTION_1 = 'Substitution 1',
  SUBSTITUTION_2 = 'Substitution 2',
  SUBSTITUTION_3 = 'Substitution 3',
  SUBSTITUTION_4 = 'Substitution 4',
  SUBSTITUTION_5 = 'Substitution 5',
  SUBSTITUTION_IN = 'Substitution In',
  SUBSTITUTION_OUT = 'Substitution Out',
  
  // VAR 관련
  GOAL_CANCELLED = 'Goal cancelled',
  PENALTY_CONFIRMED = 'Penalty confirmed',
  NO_PENALTY = 'No penalty',
  GOAL_CONFIRMED = 'Goal confirmed',
  
  // 실축 관련
  PENALTY_MISSED = 'Penalty missed'
}

/**
 * 이벤트를 한국어 문장으로 매핑하는 함수
 */
export function mapEventToKoreanText(event: MatchEvent): string {
  const { type, detail, player, assist, time } = event;
  
  // 선수 이름
  const playerName = player?.name || '알 수 없는 선수';
  const assistName = assist?.name || '';
  
  // 시간 텍스트 (예: 90+3′)
  const timeText = `${time.elapsed || 0}${time.extra ? '+' + time.extra : ''}′`;
  
  // 문장 생성
  let sentenceText = '';
  
  switch (type) {
    case EventType.GOAL:
      if (detail === EventDetail.OWN_GOAL) {
        sentenceText = `${playerName}이(가) 자책골로 실점했습니다.`;
      } else if (detail === EventDetail.PENALTY) {
        sentenceText = `${playerName}이(가) 페널티킥으로 골을 넣었습니다.`;
      } else if (detail === EventDetail.NORMAL_GOAL) {
        if (assistName) {
          sentenceText = `${playerName}이(가) ${assistName}의 도움으로 골을 넣었습니다!`;
        } else {
          sentenceText = `${playerName}이(가) 골을 기록했습니다!`;
        }
      } else {
        // 기본 골 메시지
        sentenceText = `${playerName}이(가) 골을 기록했습니다!`;
      }
      break;
      
    case EventType.CARD:
      if (detail === EventDetail.YELLOW_CARD || detail.includes('Yellow Card')) {
        // 'Yellow Card - Foul'과 같은 형식 처리
        const reason = detail.includes('-') ? detail.split('-')[1].trim() : '';
        if (reason) {
          sentenceText = `${playerName}이(가) ${reason}으로 경고를 받았습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 경고를 받았습니다.`;
        }
      } else if (detail === EventDetail.RED_CARD || detail.includes('Red Card')) {
        sentenceText = `${playerName}이(가) 퇴장당했습니다.`;
      } else if (detail === EventDetail.SECOND_YELLOW) {
        sentenceText = `${playerName}이(가) 두 번째 경고로 퇴장당했습니다.`;
      } else {
        sentenceText = `${playerName}이(가) ${detail} 카드를 받았습니다.`;
      }
      break;
      
    case EventType.SUBSTITUTION:
      // 교체 이벤트: player가 투입(IN), assist가 교체아웃(OUT)
      if (detail === EventDetail.SUBSTITUTION_1 || detail === 'Substitution 1') {
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) 첫 번째 교체 선수로 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 첫 번째 교체로 투입됐습니다.`;
        }
      } else if (detail === EventDetail.SUBSTITUTION_2 || detail === 'Substitution 2') {
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) 두 번째 교체 선수로 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 두 번째 교체로 투입됐습니다.`;
        }
      } else if (detail === EventDetail.SUBSTITUTION_3 || detail === 'Substitution 3') {
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) 세 번째 교체 선수로 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 세 번째 교체로 투입됐습니다.`;
        }
      } else if (detail === EventDetail.SUBSTITUTION_4 || detail === 'Substitution 4') {
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) 네 번째 교체 선수로 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 네 번째 교체로 투입됐습니다.`;
        }
      } else if (detail === EventDetail.SUBSTITUTION_5 || detail === 'Substitution 5') {
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) 다섯 번째 교체 선수로 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 다섯 번째 교체로 투입됐습니다.`;
        }
      } else if (detail.startsWith('Substitution ') && /\d+$/.test(detail)) {
        // 그 외 숫자가 있는 교체
        const match = detail.match(/\d+$/);
        const num = match ? match[0] : '';
        let numText = '';
        
        switch(num) {
          case '1': numText = '첫'; break;
          case '2': numText = '두'; break;
          case '3': numText = '세'; break;
          case '4': numText = '네'; break;
          case '5': numText = '다섯'; break;
          default: numText = num;
        }
        
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) ${numText} 번째 교체 선수로 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) ${numText} 번째 교체로 투입됐습니다.`;
        }
      } else if (detail === EventDetail.SUBSTITUTION_IN) {
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 교체 투입됐습니다.`;
        }
      } else if (detail === EventDetail.SUBSTITUTION_OUT) {
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 교체 투입됐습니다.`;
        }
      } else {
        // 기본 교체 메시지
        if (assistName) {
          sentenceText = `${assistName}이(가) 나가고 ${playerName}이(가) 투입됐습니다.`;
        } else {
          sentenceText = `${playerName}이(가) 교체 투입됐습니다.`;
        }
      }
      break;
      
    case EventType.VAR:
      if (detail === EventDetail.GOAL_CANCELLED) {
        sentenceText = `VAR 판독 결과, ${playerName}의 골이 취소되었습니다.`;
      } else if (detail === EventDetail.PENALTY_CONFIRMED) {
        sentenceText = `VAR 판독 결과, 페널티킥이 확정되었습니다.`;
      } else if (detail === EventDetail.NO_PENALTY) {
        sentenceText = `VAR 판독 결과, 페널티킥이 아닌 것으로 확인되었습니다.`;
      } else if (detail === EventDetail.GOAL_CONFIRMED) {
        sentenceText = `VAR 판독 결과, ${playerName}의 골이 인정되었습니다.`;
      } else {
        sentenceText = `VAR 판독: ${detail}`;
      }
      break;
      
    case EventType.MISS:
      if (detail === EventDetail.PENALTY_MISSED) {
        sentenceText = `${playerName}이(가) 페널티킥을 실축했습니다.`;
      } else {
        sentenceText = `${playerName}이(가) 결정적인 기회를 놓쳤습니다.`;
      }
      break;
      
    default:
      // 기본 텍스트
      sentenceText = `${playerName} ${detail || type}`;
  }
  
  // 시간과 문장 조합
  return `${timeText} ${sentenceText}`;
}

/**
 * 이벤트에 해당하는 아이콘 이름을 반환하는 함수
 */
export function getEventIcon(type: string, detail: string): string {
  if (type === EventType.GOAL) {
    if (detail === EventDetail.OWN_GOAL) return '❗';
    return '⚽';
  } else if (type === EventType.CARD) {
    if (detail.includes('Yellow Card')) return '🟨';
    return '🟥';
  } else if (type === EventType.SUBSTITUTION) {
    return '🔄';
  } else if (type === EventType.VAR) {
    if (detail === EventDetail.GOAL_CANCELLED) return '❌';
    if (detail === EventDetail.PENALTY_CONFIRMED) return '✅';
    return '📺';
  } else if (type === EventType.MISS) {
    if (detail === EventDetail.PENALTY_MISSED) return '❌';
    return '😞';
  }
  
  return '';
}