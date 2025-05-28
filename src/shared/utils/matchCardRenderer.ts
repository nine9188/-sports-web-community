import { MatchData } from '@/domains/livescore/actions/footballApi';

/**
 * 경기 카드 HTML을 생성하는 유틸리티 함수
 * @param matchData 경기 데이터 객체
 * @param matchId 경기 ID
 * @param isEditable 수정 가능 여부 (기본값: false)
 * @param forPostContent PostContent에서 사용하는지 여부 (기본값: false)
 * @returns 경기 카드 HTML 문자열
 */
export function generateMatchCardHTML(matchData: MatchData, matchId?: string | number, isEditable: boolean = false, forPostContent: boolean = false): string {
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
    // code 속성만 사용 (footballApi MatchData 타입에 맞춤)
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
      statusClass = 'text-green-600 font-medium';
    }
  }

  // PostContent에서 사용할 때는 data 속성 없이 단순한 구조 반환
  if (forPostContent) {
    const wrapperStart = `<a href="/livescore/football/match/${actualMatchId}" style="display: block; text-decoration: none; color: inherit;">`;
    const wrapperEnd = `</a>`;

    return `
      <div class="match-card processed-match-card" style="
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        width: 100%;
        max-width: 100%;
        margin: 12px 0;
        background: white;
      ">
        ${wrapperStart}
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
                src="${leagueData.logo}" 
                alt="${leagueData.name}" 
                style="
                  width: 24px;
                  height: 24px;
                  object-fit: contain;
                  margin-right: 8px;
                  flex-shrink: 0;
                "
                onerror="this.onerror=null;this.src='/placeholder.png';"
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
                src="${homeTeam.logo}" 
                alt="${homeTeam.name}" 
                style="
                  width: 48px;
                  height: 48px;
                  object-fit: contain;
                  margin-bottom: 8px;
                  flex-shrink: 0;
                "
                onerror="this.onerror=null;this.src='/placeholder.png';"
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
                ${statusClass ? 'color: #059669; font-weight: 500;' : ''}
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
                src="${awayTeam.logo}" 
                alt="${awayTeam.name}" 
                style="
                  width: 48px;
                  height: 48px;
                  object-fit: contain;
                  margin-bottom: 8px;
                  flex-shrink: 0;
                "
                onerror="this.onerror=null;this.src='/placeholder.png';"
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
        ${wrapperEnd}
      </div>
    `;
  }

  // 데이터 속성 설정 (PostEditForm에서 사용)
  const dataAttributes = isEditable 
    ? `data-match-id="${actualMatchId}"` 
    : `data-type="match-card" data-match-id="${actualMatchId}" data-match="${encodeURIComponent(JSON.stringify(matchData))}"`;
  
  // 링크 설정 (수정 가능 여부에 따라)
  const wrapperStart = isEditable 
    ? `<div style="cursor: default;">` 
    : `<a href="/livescore/football/match/${actualMatchId}" style="display: block; text-decoration: none; color: inherit;">`;
  
  const wrapperEnd = isEditable ? `</div>` : `</a>`;

  // 공통 HTML 템플릿 - 인라인 스타일과 Tailwind 클래스 병행 사용
  return `
    <div ${dataAttributes} style="width: 100%; max-width: 100%; margin: 12px 0;">
      <div class="match-card processed-match-card" style="
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        width: 100%;
        background: white;
      ">
        ${wrapperStart}
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
                src="${leagueData.logo}" 
                alt="${leagueData.name}" 
                style="
                  width: 24px;
                  height: 24px;
                  object-fit: contain;
                  margin-right: 8px;
                  flex-shrink: 0;
                "
                ${isEditable ? 'onError="(e) => { e.currentTarget.src = \'/placeholder.png\'; }"' : 'onerror="this.onerror=null;this.src=\'/placeholder.png\';"'}
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
                src="${homeTeam.logo}" 
                alt="${homeTeam.name}" 
                style="
                  width: 48px;
                  height: 48px;
                  object-fit: contain;
                  margin-bottom: 8px;
                  flex-shrink: 0;
                "
                ${isEditable ? 'onError="(e) => { e.currentTarget.src = \'/placeholder.png\'; }"' : 'onerror="this.onerror=null;this.src=\'/placeholder.png\';"'}
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
                ${statusClass ? 'color: #059669; font-weight: 500;' : ''}
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
                src="${awayTeam.logo}" 
                alt="${awayTeam.name}" 
                style="
                  width: 48px;
                  height: 48px;
                  object-fit: contain;
                  margin-bottom: 8px;
                  flex-shrink: 0;
                "
                ${isEditable ? 'onError="(e) => { e.currentTarget.src = \'/placeholder.png\'; }"' : 'onerror="this.onerror=null;this.src=\'/placeholder.png\';"'}
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
              ${!isEditable ? 'text-decoration: underline;' : ''}
            ">
              매치 상세 정보
            </span>
          </div>
        ${wrapperEnd}
      </div>
    </div>
  `;
} 