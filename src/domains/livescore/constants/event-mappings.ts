// 이벤트 매핑 상수 파일
// 축구 경기 이벤트 유형 매핑 및 표시 정보

import { StaticImageData } from 'next/image';

// 이벤트 아이콘 이미지를 임포트 (실제 구현에서는 이 부분을 적절히 수정)
// import goalIcon from '@/app/assets/icons/events/goal.svg';
// import yellowCardIcon from '@/app/assets/icons/events/yellow-card.svg';
// import redCardIcon from '@/app/assets/icons/events/red-card.svg';
// import substitutionIcon from '@/app/assets/icons/events/substitution.svg';
// import varIcon from '@/app/assets/icons/events/var.svg';
// import penaltyIcon from '@/app/assets/icons/events/penalty.svg';
// import missedPenaltyIcon from '@/app/assets/icons/events/missed-penalty.svg';
// import ownGoalIcon from '@/app/assets/icons/events/own-goal.svg';

// 이벤트 타입 정의
export type EventType = 
  | 'Goal'
  | 'Card'
  | 'Subst'
  | 'Var'
  | 'Penalty'
  | 'MissedPenalty'
  | 'OwnGoal';

// 카드 타입
export type CardType = 'Yellow' | 'Red';

// 이벤트 정보 인터페이스
export interface EventInfo {
  type: EventType;
  detail?: string;
  label: string;
  icon?: StaticImageData;
  iconColor?: string;
  description: string;
  longDescription: string;
  priority: number; // 표시 우선순위 (낮을수록 먼저 표시)
  showTime?: boolean; // 시간 표시 여부
  showPlayer?: boolean; // 선수 표시 여부
  showAssist?: boolean; // 어시스트 표시 여부
}

// 이벤트 유형별 정보 맵
export const EVENT_INFO_MAP: Record<string, EventInfo> = {
  // 골 관련 이벤트
  'goal': {
    type: 'Goal',
    label: '골',
    // icon: goalIcon,
    iconColor: '#00c170',
    description: '골',
    longDescription: '득점',
    priority: 10,
    showTime: true,
    showPlayer: true,
    showAssist: true,
  },
  'goal-penalty': {
    type: 'Penalty',
    detail: 'scored',
    label: '페널티킥 골',
    // icon: penaltyIcon,
    iconColor: '#00c170',
    description: '페널티킥 골',
    longDescription: '페널티킥 득점',
    priority: 11,
    showTime: true,
    showPlayer: true,
  },
  'own-goal': {
    type: 'OwnGoal',
    label: '자책골',
    // icon: ownGoalIcon,
    iconColor: '#ff4e4e',
    description: '자책골',
    longDescription: '자책골',
    priority: 12,
    showTime: true,
    showPlayer: true,
  },
  'missed-penalty': {
    type: 'MissedPenalty',
    label: '페널티킥 실축',
    // icon: missedPenaltyIcon,
    iconColor: '#ff4e4e',
    description: '페널티킥 실축',
    longDescription: '페널티킥 실축',
    priority: 13,
    showTime: true,
    showPlayer: true,
  },
  
  // 카드 관련 이벤트
  'yellow-card': {
    type: 'Card',
    detail: 'Yellow',
    label: '옐로카드',
    // icon: yellowCardIcon,
    iconColor: '#ffd600',
    description: '옐로카드',
    longDescription: '옐로카드',
    priority: 20,
    showTime: true,
    showPlayer: true,
  },
  'red-card': {
    type: 'Card',
    detail: 'Red',
    label: '레드카드',
    // icon: redCardIcon,
    iconColor: '#ff4e4e',
    description: '레드카드',
    longDescription: '레드카드',
    priority: 21,
    showTime: true,
    showPlayer: true,
  },
  'yellow-red-card': {
    type: 'Card',
    detail: 'YellowRed',
    label: '옐로&레드카드',
    // icon: redCardIcon,
    iconColor: '#ff4e4e',
    description: '옐로&레드카드',
    longDescription: '경고 누적 퇴장',
    priority: 22,
    showTime: true,
    showPlayer: true,
  },
  
  // 교체 관련 이벤트
  'substitution': {
    type: 'Subst',
    label: '선수 교체',
    // icon: substitutionIcon,
    iconColor: '#0078d7',
    description: '선수 교체',
    longDescription: '선수 교체',
    priority: 30,
    showTime: true,
    showPlayer: true,
  },
  
  // VAR 관련 이벤트
  'var': {
    type: 'Var',
    label: 'VAR',
    // icon: varIcon,
    iconColor: '#8a8d93',
    description: 'VAR 판정',
    longDescription: '비디오 판독 (VAR)',
    priority: 40,
    showTime: true,
  },
};

// API 타입 변환 맵
export const API_EVENT_TYPE_MAP: Record<string, string> = {
  'Goal': 'goal',
  'Card': 'card',
  'Subst': 'substitution',
  'Var': 'var',
  'Normal Goal': 'goal',
  'Penalty': 'goal-penalty',
  'Own Goal': 'own-goal',
  'Missed Penalty': 'missed-penalty',
  'Yellow Card': 'yellow-card',
  'Red Card': 'red-card',
  'Yellow Red': 'yellow-red-card',
  'Substitution': 'substitution',
};

// 이벤트 정보 가져오기
export const getEventInfo = (apiEventType: string, detail?: string): EventInfo => {
  let eventKey = API_EVENT_TYPE_MAP[apiEventType] || 'goal';
  
  // 세부 정보에 따라 이벤트 키 조정
  if (apiEventType === 'Card' && detail) {
    if (detail === 'Yellow Card') eventKey = 'yellow-card';
    else if (detail === 'Red Card') eventKey = 'red-card';
    else if (detail === 'Second Yellow card') eventKey = 'yellow-red-card';
  }
  
  else if (apiEventType === 'Goal' && detail) {
    if (detail === 'Penalty') eventKey = 'goal-penalty';
    else if (detail === 'Own Goal') eventKey = 'own-goal';
  }
  
  return EVENT_INFO_MAP[eventKey] || EVENT_INFO_MAP['goal'];
};

// 모든 이벤트 정보 가져오기
export const getAllEventInfo = (): EventInfo[] => {
  return Object.values(EVENT_INFO_MAP);
};

// 타입별 이벤트 가져오기
export const getEventsByType = (type: EventType): EventInfo[] => {
  return Object.values(EVENT_INFO_MAP).filter(event => event.type === type);
};

// 이벤트 맵 내보내기
export default EVENT_INFO_MAP; 