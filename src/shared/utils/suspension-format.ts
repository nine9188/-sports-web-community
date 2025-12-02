'use client'

interface SuspensionInfo {
  until: string | null
  reason: string | null
}

/**
 * 정지 정보 포맷팅 (클라이언트용)
 */
export function formatSuspensionInfo(suspensionInfo: SuspensionInfo | null): string {
  if (!suspensionInfo) return ''
  
  const reason = suspensionInfo.reason || '정책 위반'
  
  if (suspensionInfo.until) {
    const until = new Date(suspensionInfo.until)
    const now = new Date()
    
    // 정지 기간이 만료되었는지 확인
    if (now.getTime() > until.getTime()) {
      return ''
    }
    
    const untilStr = until.toLocaleDateString('ko-KR', { 
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    return `계정이 정지되었습니다. 사유: ${reason} (해제일: ${untilStr})`
  }
  
  return `계정이 정지되었습니다. 사유: ${reason}`
} 