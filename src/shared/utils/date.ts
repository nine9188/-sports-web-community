/**
 * 날짜 포맷 유틸리티 - OP.GG 스타일
 * 오늘: 시간만 표시 (예: "16:29")
 * 어제 이전: 날짜만 표시 (예: "2025.06.05")
 */

/**
 * OP.GG 스타일 날짜 포맷팅
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    // KST 기준 날짜/시간 파츠 추출
    const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const now = new Date();
    const [yNow, mNow, dNow] = extractYMD(kstFormatter, now);
    const [yTar, mTar, dTar] = extractYMD(kstFormatter, date);

    // 오늘이면 HH:mm, 아니면 YYYY.MM.DD
    if (yNow === yTar && mNow === mTar && dNow === dTar) {
      const [, , , hh, mm] = extractYMDHM(kstFormatter, date);
      return `${hh}:${mm}`;
    }
    return `${yTar}.${mTar}.${dTar}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '';
  }
}

/**
 * 기본 날짜 포맷 (YYYY-MM-DD 또는 YYYY-MM-DD HH:mm)
 * @param dateString ISO 형식의 날짜 문자열
 * @param includeTime 시간 포함 여부
 * @returns 포맷된 날짜 문자열
 */
export function formatDateBasic(dateString: string, includeTime = false): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
      hour12: false,
    });

    if (!includeTime) {
      const [y, m, d] = extractYMD(kstFormatter, date);
      return `${y}-${m}-${d}`;
    }
    const [y, m, d, hh, mm] = extractYMDHM(kstFormatter, date);
    return `${y}-${m}-${d} ${hh}:${mm}`;
  } catch (error) {
    console.error('날짜 포맷 오류:', error);
    return '';
  }
}

/**
 * 현재 시간으로부터 얼마나 지났는지 표시 (예: '3분 전', '2시간 전')
 * @param dateString ISO 형식의 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export function getRelativeTimeFromNow(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // KST 기준의 현재/대상 시각으로 계산 (서버/클라이언트 일관)
    const date = new Date(dateString);
    const now = new Date();
    const dateMs = getKSTTimestamp(date);
    const nowMs = getKSTTimestamp(now);

    const diffInMs = nowMs - dateMs;
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHour = Math.floor(diffInMin / 60);
    const diffInDay = Math.floor(diffInHour / 24);
    
    if (diffInSec < 60) {
      return '방금 전';
    } else if (diffInMin < 60) {
      return `${diffInMin}분 전`;
    } else if (diffInHour < 24) {
      return `${diffInHour}시간 전`;
    } else if (diffInDay < 7) {
      return `${diffInDay}일 전`;
    } else {
      return formatDateBasic(dateString);
    }
  } catch (error) {
    console.error('상대 시간 계산 오류:', error);
    return '';
  }
} 

// 내부 유틸: KST 기준 Y, M, D 추출
function extractYMD(formatter: Intl.DateTimeFormat, date: Date): [string, string, string] {
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value ?? '';
  const month = parts.find(p => p.type === 'month')?.value ?? '';
  const day = parts.find(p => p.type === 'day')?.value ?? '';
  return [year, month, day];
}

// 내부 유틸: KST 기준 Y, M, D, H, m 추출
function extractYMDHM(formatter: Intl.DateTimeFormat, date: Date): [string, string, string, string, string] {
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value ?? '';
  const month = parts.find(p => p.type === 'month')?.value ?? '';
  const day = parts.find(p => p.type === 'day')?.value ?? '';
  const hour = parts.find(p => p.type === 'hour')?.value ?? '00';
  const minute = parts.find(p => p.type === 'minute')?.value ?? '00';
  return [year, month, day, hour, minute];
}

// 내부 유틸: KST 기준 타임스탬프(ms) 계산
function getKSTTimestamp(date: Date): number {
  // Intl로 KST의 Y/M/D/H/m/s를 얻어 UTC로 다시 생성
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const y = Number(parts.find(p => p.type === 'year')?.value ?? '1970');
  const m = Number(parts.find(p => p.type === 'month')?.value ?? '01');
  const d = Number(parts.find(p => p.type === 'day')?.value ?? '01');
  const hh = Number(parts.find(p => p.type === 'hour')?.value ?? '00');
  const mm = Number(parts.find(p => p.type === 'minute')?.value ?? '00');
  const ss = Number(parts.find(p => p.type === 'second')?.value ?? '00');
  // UTC로 간주되는 Date.UTC 사용 (로컬 타임존 영향 제거)
  return Date.UTC(y, m - 1, d, hh, mm, ss);
}