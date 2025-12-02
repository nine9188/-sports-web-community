// 이적시장 관련 타입 정의

export interface Player {
  id: number;
  name: string;
  photo: string;
  age: number;
  nationality: string;
  position?: string;
}

export interface Team {
  id: number;
  name: string;
  logo: string;
  country?: string;
}

export interface Transfer {
  date: string;
  type: string;
  teams: {
    in: Team;
    out: Team;
  };
}

export interface TransferMarketItem {
  player: Player;
  update: string;
  transfers: Transfer[];
}

export interface TeamTransfers {
  team: Team;
  transfers: {
    in: TransferMarketItem[];
    out: TransferMarketItem[];
  };
}

export interface TransferFilters {
  league?: number;
  team?: number;
  season?: number;
  type?: 'in' | 'out' | 'all';
  search?: string;
  position?: string;
  nationality?: string;
}

export interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
}

// 이적 유형 매핑
export const TRANSFER_TYPES = {
  'Free': '자유이적',
  'Loan': '임대',
  'Permanent': '완전이적',
  'N/A': '정보없음',
  'Transfer': '이적',
  'Return': '복귀',
  'End of loan': '임대 종료'
} as const;

// 이적료 및 타입 처리 유틸리티 함수
export function formatTransferType(type: string): string {
  if (!type || type === 'N/A') {
    return '정보없음';
  }

  const originalType = type.trim();
  const lowerType = originalType.toLowerCase();

  // 특별한 케이스들을 먼저 처리
  if (lowerType === 'free transfer' || lowerType === 'free') {
    return '자유이적';
  }
  
  if (lowerType === 'free agent') {
    return '자유계약';
  }
  
  if (lowerType === 'raise') {
    return '승격';
  }
  
  if (lowerType === 'return from loan' || lowerType.includes('return from loan')) {
    return '임대복귀';
  }
  
  // 금액이 포함된 경우 (€, $, £ 등)
  if (originalType.match(/[€$£¥₩]/)) {
    const transferTypeText = '이적';
    let amountText = '';
    
    // 유로화 처리 (대략적인 환율: 1€ ≈ 1,450원)
    if (originalType.includes('€')) {
      // €25M, €25.5M 등의 패턴 매칭
      const euroMatch = originalType.match(/€\s*([\d.,]+)\s*M?/i);
      if (euroMatch) {
        const numericAmount = parseFloat(euroMatch[1]);
        const krwAmount = numericAmount * 1450 * 1000000; // M(Million)을 고려한 변환
        
        if (krwAmount >= 100000000) { // 1억원 이상
          amountText = `€${numericAmount}M (약 ${Math.round(krwAmount / 100000000)}억원)`;
        } else if (krwAmount >= 10000) { // 1만원 이상
          amountText = `€${numericAmount}M (약 ${Math.round(krwAmount / 10000)}만원)`;
        } else {
          amountText = `€${numericAmount}M`;
        }
      } else {
        amountText = originalType; // 매칭되지 않으면 원본
      }
    }
    
    // 달러화 처리 (대략적인 환율: 1$ ≈ 1,350원)
    else if (originalType.includes('$')) {
      const dollarMatch = originalType.match(/\$\s*([\d.,]+)\s*M?/i);
      if (dollarMatch) {
        const numericAmount = parseFloat(dollarMatch[1]);
        const krwAmount = numericAmount * 1350 * 1000000;
        
        if (krwAmount >= 100000000) {
          amountText = `$${numericAmount}M (약 ${Math.round(krwAmount / 100000000)}억원)`;
        } else if (krwAmount >= 10000) {
          amountText = `$${numericAmount}M (약 ${Math.round(krwAmount / 10000)}만원)`;
        } else {
          amountText = `$${numericAmount}M`;
        }
      } else {
        amountText = originalType;
      }
    }
    
    // 파운드화 처리
    else if (originalType.includes('£')) {
      const poundMatch = originalType.match(/£\s*([\d.,]+)\s*M?/i);
      if (poundMatch) {
        const numericAmount = parseFloat(poundMatch[1]);
        amountText = `£${numericAmount}M`;
      } else {
        amountText = originalType;
      }
    }
    
    else {
      amountText = originalType; // 다른 통화는 원본 그대로
    }
    
    return amountText ? `${transferTypeText} / ${amountText}` : transferTypeText;
  }

  // 영어 타입을 한국어로 변환 (금액 없는 경우)
  if (lowerType === 'loan') return '임대';
  if (lowerType === 'permanent') return '완전이적';
  if (lowerType === 'transfer') return '이적';
  if (lowerType === 'return') return '복귀';
  if (lowerType === 'free agent') return '자유계약';
  if (lowerType === 'raise') return '승격';
  if (lowerType === 'return from loan' || lowerType.includes('return from loan')) return '임대복귀';
  if (lowerType.includes('end of loan')) return '임대 종료';
  if (lowerType.includes('loan')) return '임대';
  
  // 기타 경우는 원본 반환
  return originalType;
}

// 이적 타입에 따른 색상 클래스 반환
export function getTransferTypeColor(type: string): string {
  if (!type) return 'bg-gray-100 text-gray-800';
  
  const lowerType = type.toLowerCase();
  
  // 금액이 포함된 경우
  if (type.match(/[€$£¥₩]/)) {
    return 'bg-blue-100 text-blue-800';
  }
  
  // Free Transfer 처리
  if (lowerType === 'free transfer' || lowerType === 'free') {
    return 'bg-green-100 text-green-800';
  }
  
  // 임대 관련
  if (lowerType.includes('loan')) {
    return 'bg-orange-100 text-orange-800';
  }
  
  // 완전이적
  if (lowerType === 'permanent' || lowerType === 'transfer') {
    return 'bg-purple-100 text-purple-800';
  }
  
  // 복귀
  if (lowerType === 'return') {
    return 'bg-indigo-100 text-indigo-800';
  }
  
  return 'bg-gray-100 text-gray-800'; // 기본
}

// 주요 리그 정보
export const MAJOR_LEAGUES: League[] = [
  { id: 39, name: '프리미어리그', logo: '', country: '영국' },
  { id: 140, name: '라리가', logo: '', country: '스페인' },
  { id: 135, name: '세리에A', logo: '', country: '이탈리아' },
  { id: 78, name: '분데스리가', logo: '', country: '독일' },
  { id: 61, name: '리그1', logo: '', country: '프랑스' }
];

// 선수 포지션 옵션
export const PLAYER_POSITIONS = [
  'Goalkeeper',
  'Defender', 
  'Midfielder',
  'Attacker'
] as const;

export type PlayerPosition = typeof PLAYER_POSITIONS[number];