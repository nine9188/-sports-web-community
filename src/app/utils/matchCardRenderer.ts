/**
 * 축구 경기 데이터 인터페이스
 */
interface MatchData {
  teams?: {
    home?: {
      name: string;
      logo: string;
      winner?: boolean;
    };
    away?: {
      name: string;
      logo: string;
      winner?: boolean;
    };
  };
  goals?: {
    home?: number;
    away?: number;
  };
  league?: {
    name: string;
    logo: string;
  };
  status?: {
    code?: string;
    short?: string;
    elapsed?: number;
  };
}

/**
 * 경기 카드 HTML을 생성하는 유틸리티 함수
 * @param matchData 경기 데이터 객체
 * @param matchId 경기 ID
 * @param isEditable 수정 가능 여부 (기본값: false)
 * @returns 경기 카드 HTML 문자열
 */
export function generateMatchCardHTML(matchData: MatchData, matchId: string | number, isEditable: boolean = false): string {
  // 안전한 데이터 추출
  const { teams, goals, league, status } = matchData;
  const homeTeam = teams?.home || { name: '홈팀', logo: '/placeholder.png' };
  const awayTeam = teams?.away || { name: '원정팀', logo: '/placeholder.png' };
  const leagueData = league || { name: '알 수 없는 리그', logo: '/placeholder.png' };
  const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
  const awayScore = typeof goals?.away === 'number' ? goals.away : '-';
  
  // 경기 상태 텍스트 설정
  let statusText = '경기 결과';
  let statusClass = '';
  
  if (status) {
    // code와 short 모두 대응
    const statusCode = status.code || status.short || '';
    
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

  // 데이터 속성 설정 (PostEditForm에서 사용)
  const dataAttributes = isEditable 
    ? `` 
    : `data-type="match-card" data-match-id="${matchId}" data-match="${encodeURIComponent(JSON.stringify(matchData))}"`;
  
  // 링크 설정 (수정 가능 여부에 따라)
  const wrapperStart = isEditable 
    ? `<div class="cursor-default">` 
    : `<a href="/livescore/football/match/${matchId}" class="block" style="text-decoration: none; color: inherit;">`;
  
  const wrapperEnd = isEditable ? `</div>` : `</a>`;

  // 공통 HTML 템플릿 - MatchCard.tsx 현재 스타일 기반
  return `
    <div ${dataAttributes} style="width: 100%; max-width: 100%;">
      <div class="match-card border rounded-lg overflow-hidden shadow-sm my-3 w-full">
        ${wrapperStart}
          <!-- 리그 헤더 - 높이 및 로고 크기 증가 -->
          <div class="py-3 px-3 bg-gray-50 border-b flex items-center h-10">
            <img 
              src="${leagueData.logo}" 
              alt="${leagueData.name}" 
              class="w-7 h-7 object-contain mr-2.5"
              ${isEditable ? 'onError="(e) => { e.currentTarget.src = \'/placeholder.png\'; }"' : 'onerror="this.onerror=null;this.src=\'/placeholder.png\';"'}
            />
            <span class="text-sm font-medium text-gray-600 truncate">${leagueData.name}</span>
          </div>
          
          <!-- 경기 카드 메인 - 간격 줄임 -->
          <div class="py-1 px-1 flex items-center justify-between">
            <!-- 홈팀 - 너비 증가 및 패딩 조정 -->
            <div class="flex flex-col items-center pr-1 pl-1 w-[50%]">
              <img 
                src="${homeTeam.logo}" 
                alt="${homeTeam.name}" 
                class="w-14 h-14 object-contain mb-1"
                ${isEditable ? 'onError="(e) => { e.currentTarget.src = \'/placeholder.png\'; }"' : 'onerror="this.onerror=null;this.src=\'/placeholder.png\';"'}
              />
              <span class="text-sm font-medium text-center line-clamp-2 ${homeTeam.winner ? 'text-blue-600' : ''}">
                ${homeTeam.name}
              </span>
            </div>
            
            <!-- 스코어 - 너비 감소 -->
            <div class="text-center flex-shrink-0">
              <div class="flex items-center justify-center mb-1">
                <span class="text-2xl font-bold min-w-[1.5rem] text-center">${homeScore}</span>
                <span class="text-gray-400 mx-1">-</span>
                <span class="text-2xl font-bold min-w-[1.5rem] text-center">${awayScore}</span>
              </div>
              <div class="text-xs ${statusClass}">
                ${statusText}
              </div>
            </div>
            
            <!-- 원정팀 - 너비 증가 및 패딩 조정 -->
            <div class="flex flex-col items-center pl-1 pr-1 w-[50%]">
              <img 
                src="${awayTeam.logo}" 
                alt="${awayTeam.name}" 
                class="w-14 h-14 object-contain mb-1"
                ${isEditable ? 'onError="(e) => { e.currentTarget.src = \'/placeholder.png\'; }"' : 'onerror="this.onerror=null;this.src=\'/placeholder.png\';"'}
              />
              <span class="text-sm font-medium text-center line-clamp-2 ${awayTeam.winner ? 'text-blue-600' : ''}">
                ${awayTeam.name}
              </span>
            </div>
          </div>
          
          <!-- 푸터 -->
          <div class="py-2 px-3 bg-gray-50 border-t text-center h-8 flex items-center justify-center">
            <span class="text-xs text-blue-600 hover:underline">
              매치 상세 정보
            </span>
          </div>
        ${wrapperEnd}
      </div>
    </div>
  `;
} 