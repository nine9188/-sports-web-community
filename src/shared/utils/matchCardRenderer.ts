import { MatchData } from '@/domains/livescore/actions/footballApi';

/**
 * Storage URL을 우선 시도하는 이미지 URL 생성 함수
 */
function getOptimizedImageUrl(originalUrl: string, type: 'teams' | 'leagues', id?: number): string {
  if (id && originalUrl.includes('api-sports.io')) {
    // Storage URL 우선 시도
    const storageUrl = `https://vnjjfhsuzoxcljqqwwvx.supabase.co/storage/v1/object/public/${type}/${id}.png`;
    return `${storageUrl}" onerror="this.onerror=null;this.src='${originalUrl}';this.onerror=function(){this.src='/placeholder.png';}`;
  }
  return `${originalUrl}" onerror="this.onerror=null;this.src='/placeholder.png';`;
}

/**
 * 경기 카드 HTML을 생성하는 유틸리티 함수
 * @param matchData 경기 데이터 객체
 * @param matchId 경기 ID (선택적)
 * @returns 경기 카드 HTML 문자열
 */
export function generateMatchCardHTML(matchData: MatchData, matchId?: string | number): string {
  // 안전한 데이터 추출
  const { teams, goals, league, status } = matchData;
  const homeTeam = teams?.home || { name: '홈팀', logo: '/placeholder.png' };
  const awayTeam = teams?.away || { name: '원정팀', logo: '/placeholder.png' };
  const leagueData = league || { name: '알 수 없는 리그', logo: '/placeholder.png' };
  const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
  const awayScore = typeof goals?.away === 'number' ? goals.away : '-';
  
  // 매치 ID 결정 - matchData에 id가 있으면 우선 사용
  const actualMatchId = matchData.id || matchId || 'unknown';
  
  // 경기 상태 텍스트 설정
  let statusText = '경기 결과';
  let statusClass = '';
  
  if (status) {
    const statusCode = status.code || '';
    
    if (statusCode === 'FT') {
      statusText = '경기 종료';
    } else if (statusCode === 'NS') {
      statusText = '경기 예정';
    } else if (['1H', '2H', 'HT', 'LIVE'].includes(statusCode)) {
      if (statusCode === '1H') {
        statusText = `전반전 진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
      } else if (statusCode === '2H') {
        statusText = `후반전 진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
      } else if (statusCode === 'HT') {
        statusText = '하프타임';
      } else {
        statusText = `진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
      }
      statusClass = 'color: #059669; font-weight: 500;';
    }
  }

  // 에디터에서 사용할 때는 data 속성과 함께 반환 (서버에서 처리하도록)
  return `
    <div data-type="match-card" data-match-id="${actualMatchId}" data-match="${encodeURIComponent(JSON.stringify(matchData))}" style="
      width: 100%; 
      max-width: 100%; 
      margin: 12px 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      background: white;
      display: block;
    ">
      <a href="/livescore/football/match/${actualMatchId}" style="display: block; text-decoration: none; color: inherit;">
        <!-- 리그 헤더 -->
        <div style="
          padding: 12px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          height: 40px;
        ">
          <div style="display: flex; align-items: center;">
            <img 
              src="${getOptimizedImageUrl(leagueData.logo, 'leagues', league?.id)}" 
              alt="${leagueData.name}" 
              style="
                width: 24px;
                height: 24px;
                object-fit: contain;
                margin-right: 8px;
                flex-shrink: 0;
              "
            />
            <span style="
              font-size: 14px;
              font-weight: 500;
              color: #4b5563;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            ">${leagueData.name}</span>
          </div>
        </div>
        
        <!-- 경기 카드 메인 -->
        <div style="
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <!-- 홈팀 -->
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 40%;
          ">
            <img 
              src="${getOptimizedImageUrl(homeTeam.logo, 'teams', teams?.home?.id)}" 
              alt="${homeTeam.name}" 
              style="
                width: 48px;
                height: 48px;
                object-fit: contain;
                margin-bottom: 8px;
                flex-shrink: 0;
              "
            />
            <span style="
              font-size: 14px;
              font-weight: 500;
              text-align: center;
              line-height: 1.2;
              color: ${homeTeam.winner ? '#2563eb' : '#000'};
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            ">
              ${homeTeam.name}
            </span>
          </div>
          
          <!-- 스코어 -->
          <div style="
            text-align: center;
            flex-shrink: 0;
            width: 20%;
          ">
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 8px;
            ">
              <span style="
                font-size: 24px;
                font-weight: bold;
                min-width: 24px;
                text-align: center;
              ">${homeScore}</span>
              <span style="
                color: #9ca3af;
                margin: 0 4px;
              ">-</span>
              <span style="
                font-size: 24px;
                font-weight: bold;
                min-width: 24px;
                text-align: center;
              ">${awayScore}</span>
            </div>
            <div style="
              font-size: 12px;
              ${statusClass}
            ">
              ${statusText}
            </div>
          </div>
          
          <!-- 원정팀 -->
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 40%;
          ">
            <img 
              src="${getOptimizedImageUrl(awayTeam.logo, 'teams', teams?.away?.id)}" 
              alt="${awayTeam.name}" 
              style="
                width: 48px;
                height: 48px;
                object-fit: contain;
                margin-bottom: 8px;
                flex-shrink: 0;
              "
            />
            <span style="
              font-size: 14px;
              font-weight: 500;
              text-align: center;
              line-height: 1.2;
              color: ${awayTeam.winner ? '#2563eb' : '#000'};
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            ">
              ${awayTeam.name}
            </span>
          </div>
        </div>
        
        <!-- 푸터 -->
        <div style="
          padding: 8px 12px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            font-size: 12px;
            color: #2563eb;
            text-decoration: underline;
          ">
            매치 상세 정보
          </span>
        </div>
      </a>
    </div>
  `;
} 