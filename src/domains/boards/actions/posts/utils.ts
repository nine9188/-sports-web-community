/**
 * 경기 카드 데이터를 완전한 HTML로 변환하는 유틸리티 함수
 */
export function processMatchCardsInContent(content: string): string {
  try {
    // 더 유연한 정규식 - 내용이 있는 div 태그 처리
    const matchCardRegex = /<div[^>]*data-type="match-card"[^>]*data-match="([^"]*)"[^>]*>([\s\S]*?)<\/div>/g;
    
    const result = content.replace(matchCardRegex, (match, encodedData) => {
      try {
        // URL 디코딩 후 JSON 파싱
        const decodedData = decodeURIComponent(encodedData);
        const matchData = JSON.parse(decodedData);
        
        // 경기 카드 내용 생성
        const { teams, goals, league, status } = matchData;
        const homeTeam = teams?.home || { name: '홈팀', logo: '/placeholder.png' };
        const awayTeam = teams?.away || { name: '원정팀', logo: '/placeholder.png' };
        const leagueData = league || { name: '알 수 없는 리그', logo: '/placeholder.png' };
        const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
        const awayScore = typeof goals?.away === 'number' ? goals.away : '-';
        const actualMatchId = matchData.id || 'unknown';
        
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
        
        const processedHTML = `
          <div class="match-card processed-match-card" data-processed="true">
            <a href="/livescore/football/match/${actualMatchId}">
              <!-- 리그 헤더 -->
              <div class="league-header">
                <div style="display: flex; align-items: center;">
                  <img 
                    src="${leagueData.logo}" 
                    alt="${leagueData.name}" 
                    class="league-logo"
                    onerror="this.onerror=null;this.src='/placeholder.png';"
                  />
                  <span class="league-name">${leagueData.name}</span>
                </div>
              </div>
              
              <!-- 경기 카드 메인 -->
              <div class="match-main">
                <!-- 홈팀 -->
                <div class="team-info">
                  <img 
                    src="${homeTeam.logo}" 
                    alt="${homeTeam.name}" 
                    class="team-logo"
                    onerror="this.onerror=null;this.src='/placeholder.png';"
                  />
                  <span class="team-name${homeTeam.winner ? ' winner' : ''}">
                    ${homeTeam.name}
                  </span>
                </div>
                
                <!-- 스코어 -->
                <div class="score-area">
                  <div class="score">
                    <span class="score-number">${homeScore}</span>
                    <span class="score-separator">-</span>
                    <span class="score-number">${awayScore}</span>
                  </div>
                  <div class="match-status${statusClass.includes('color: #059669') ? ' live' : ''}">
                    ${statusText}
                  </div>
                </div>
                
                <!-- 원정팀 -->
                <div class="team-info">
                  <img 
                    src="${awayTeam.logo}" 
                    alt="${awayTeam.name}" 
                    class="team-logo"
                    onerror="this.onerror=null;this.src='/placeholder.png';"
                  />
                  <span class="team-name${awayTeam.winner ? ' winner' : ''}">
                    ${awayTeam.name}
                  </span>
                </div>
              </div>
              
              <!-- 푸터 -->
              <div class="match-footer">
                <span class="footer-link">
                  매치 상세 정보
                </span>
              </div>
            </a>
          </div>
        `;
        
        return processedHTML;
      } catch {
        // 파싱 실패 시 기본 경기 카드 반환
        return `
          <div class="match-card processed-match-card" data-processed="true" style="
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            margin: 12px 0;
            background: white;
            width: 100%;
            max-width: 100%;
            padding: 12px;
            text-align: center;
          ">
            <div style="color: #ef4444; font-weight: 500;">
              ⚠️ 경기 카드 오류
            </div>
            <div style="margin-top: 8px; font-size: 14px; color: #666;">
              경기 정보를 불러올 수 없습니다.
            </div>
          </div>
        `;
      }
    });
    
    return result;
  } catch (error) {
    console.error('경기 카드 처리 중 오류:', error);
    return content; // 오류 시 원본 content 반환
  }
}

// 기본 응답 인터페이스
export interface PostActionResponse {
  success: boolean;
  error?: string;
  postId?: string;
  postNumber?: number;
  boardSlug?: string;
}

export interface LikeActionResponse {
  success: boolean;
  likes?: number;
  dislikes?: number;
  userAction?: 'like' | 'dislike' | null;
  error?: string;
} 