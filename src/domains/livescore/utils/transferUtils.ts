// 이적 관련 유틸리티 함수들 (클라이언트/서버 공용)

import { TransferMarketData, TeamTransfersData } from '../types/transfers';

/**
 * 이적 데이터 통계 정보 생성
 */
export interface TransferStats {
  totalTransfers: number;
  transfersIn: number;
  transfersOut: number;
  totalValue: number;
  averageValue: number;
  freeTransfers: number;
  loanTransfers: number;
  permanentTransfers: number;
}

/**
 * 이적료 파싱 및 정렬
 */
export function parseTransferFee(feeString: string): number {
  if (!feeString || feeString === 'N/A' || feeString === 'Free' || feeString === 'Loan') {
    return 0;
  }
  
  const match = feeString.match(/€\s*([\d.]+)\s*([KMB])?/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();
  
  switch (unit) {
    case 'B': return value * 1000000000;
    case 'M': return value * 1000000;
    case 'K': return value * 1000;
    default: return value;
  }
}

/**
 * 이적 데이터를 날짜순으로 정렬
 */
export function sortTransfersByDate(transfers: TransferMarketData[], descending = true): TransferMarketData[] {
  return transfers.sort((a, b) => {
    const dateA = new Date(a.transfers[0]?.date || '').getTime();
    const dateB = new Date(b.transfers[0]?.date || '').getTime();
    return descending ? dateB - dateA : dateA - dateB;
  });
}

/**
 * 팀별 이적 통계 계산
 */
export function calculateTransferStats(transfers: TeamTransfersData): TransferStats {
  const allTransfers = [...transfers.transfers.in, ...transfers.transfers.out];
  
  const stats = {
    totalTransfers: allTransfers.length,
    transfersIn: transfers.transfers.in.length,
    transfersOut: transfers.transfers.out.length,
    totalValue: 0,
    averageValue: 0,
    freeTransfers: 0,
    loanTransfers: 0,
    permanentTransfers: 0
  };

  allTransfers.forEach(transfer => {
    const transferType = transfer.transfers[0]?.type || '';
    const transferValue = parseTransferFee(transferType);
    
    stats.totalValue += transferValue;

    switch (transferType.toLowerCase()) {
      case 'free':
        stats.freeTransfers++;
        break;
      case 'loan':
        stats.loanTransfers++;
        break;
      case 'permanent':
        stats.permanentTransfers++;
        break;
      default:
        if (transferValue > 0) {
          stats.permanentTransfers++;
        }
    }
  });

  stats.averageValue = stats.totalTransfers > 0 ? stats.totalValue / stats.totalTransfers : 0;

  return stats;
}

/**
 * 리그 이름 매핑 함수
 */
export function getLeagueName(leagueId: number): string {
  const leagueMap: { [key: number]: string } = {
    39: '프리미어리그',
    140: '라리가',
    135: '세리에A',
    78: '분데스리가',
    61: '리그1',
    88: '에레디비지에',
    94: '프리메이라리가',
    203: '슈퍼리그'
  };
  
  return leagueMap[leagueId] || `리그 ${leagueId}`;
}

/**
 * 이적료 포맷팅 (표시용)
 */
export function formatTransferFee(fee: number): string {
  if (fee === 0) return 'Free';
  if (fee >= 1000000000) return `€${(fee / 1000000000).toFixed(1)}B`;
  if (fee >= 1000000) return `€${(fee / 1000000).toFixed(1)}M`;
  if (fee >= 1000) return `€${(fee / 1000).toFixed(0)}K`;
  return `€${fee.toLocaleString()}`;
}

/**
 * 이적 유형 한국어 변환
 */
export function translateTransferType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'Free': '자유이적',
    'Loan': '임대',
    'Permanent': '완전이적',
    'N/A': '정보없음'
  };
  
  // 이적료가 포함된 경우
  if (type.includes('€')) return `완전이적 (${type})`;
  
  return typeMap[type] || type;
}