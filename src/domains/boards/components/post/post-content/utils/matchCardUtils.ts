import { normalizeMatchCardData, generateMatchCardHtml, DARK_MODE_LEAGUE_IDS } from '@/shared/utils/matchCard';
const SUPABASE_URL = 'https://vnjjfhsuzoxcljqqwwvx.supabase.co';

/**
 * HTML로 저장된 빈 매치카드 div를 실제 콘텐츠로 채우기
 *
 * TipTap 에디터에서 HTML로 저장된 경우 <div data-type="match-card" data-match="..."></div>
 * 형태로 빈 div만 저장되므로, data-match 속성을 파싱해서 내용을 채워넣습니다.
 */
export function populateEmptyMatchCards(container: HTMLElement): void {
  const emptyMatchCards = container.querySelectorAll('div[data-type="match-card"]:not(.match-card):not(.processed-match-card)');

  emptyMatchCards.forEach((card) => {
    const dataMatch = card.getAttribute('data-match');
    if (!dataMatch) return;

    // 이미 처리된 카드는 건너뛰기
    if (card.querySelector('.match-main')) return;

    try {
      const matchData = JSON.parse(decodeURIComponent(dataMatch));
      const normalized = normalizeMatchCardData(matchData);

      // matchId 설정
      const matchIdAttr = card.getAttribute('data-match-id');
      if (matchIdAttr) {
        normalized.id = matchIdAttr;
      } else if (matchData.id) {
        normalized.id = matchData.id;
      }

      // HTML 생성 (CSS 클래스 버전)
      const html = generateMatchCardHtml(normalized, {
        useInlineStyles: false,
        includeDataAttr: false,
        markAsProcessed: true,
      });

      // 빈 div를 새 HTML로 교체
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const newCard = wrapper.firstElementChild;

      if (newCard && card.parentNode) {
        card.parentNode.replaceChild(newCard, card);
      }
    } catch (e) {
      console.error('매치카드 데이터 파싱 오류:', e);
    }
  });
}

/**
 * 매치 카드 호버 효과를 위한 전역 함수 등록
 */
export function registerMatchCardHoverHandler(): void {
  if (typeof window === 'undefined') return;

  window.handleMatchCardHover = function(element: HTMLElement, isEnter: boolean) {
    // CSS로 호버 효과 처리 - JS는 빈 함수로 유지 (호환성)
    void element;
    void isEnter;
  };
}

/**
 * 다크모드 감지 및 카드 이미지 URL 교체
 * 매치카드, 팀카드, 선수카드 모두 지원
 */
export function updateMatchCardImages(container: HTMLElement): void {
  const isDark = document.documentElement.classList.contains('dark');
  const matchCards = container.querySelectorAll('.match-card, .processed-match-card, .team-card, .player-card');

  matchCards.forEach((card) => {
    // 리그 로고 업데이트
    const leagueImg = card.querySelector('.league-logo-box img') as HTMLImageElement;
    if (leagueImg) {
      updateLeagueImage(leagueImg, isDark);
    }

    // 팀 로고 업데이트
    const teamLogos = card.querySelectorAll('.team-logo-box img');
    teamLogos.forEach((teamImg) => {
      updateTeamImage(teamImg as HTMLImageElement, isDark);
    });
  });
}

function updateLeagueImage(img: HTMLImageElement, isDark: boolean): void {
  let lightSrc = img.getAttribute('data-light-src');
  let darkSrc = img.getAttribute('data-dark-src');

  // Fallback: data 속성이 없으면 현재 src에서 생성
  if (!lightSrc || !darkSrc) {
    const currentSrc = img.src;
    const leagueIdMatch = currentSrc.match(/\/leagues\/(\d+)\.png$/);

    if (leagueIdMatch) {
      const leagueId = parseInt(leagueIdMatch[1]);
      lightSrc = `${SUPABASE_URL}/storage/v1/object/public/leagues/${leagueId}.png`;

      if (DARK_MODE_LEAGUE_IDS.includes(leagueId)) {
        darkSrc = `${SUPABASE_URL}/storage/v1/object/public/leagues/${leagueId}-1.png`;
      } else {
        darkSrc = lightSrc;
      }

      img.setAttribute('data-light-src', lightSrc);
      img.setAttribute('data-dark-src', darkSrc);
    }
  }

  if (lightSrc && darkSrc) {
    img.src = isDark ? darkSrc : lightSrc;
  }
}

function updateTeamImage(img: HTMLImageElement, isDark: boolean): void {
  let lightSrc = img.getAttribute('data-light-src');
  let darkSrc = img.getAttribute('data-dark-src');

  // Fallback: data 속성이 없으면 현재 src에서 생성
  if (!lightSrc || !darkSrc) {
    const currentSrc = img.src;
    const teamIdMatch = currentSrc.match(/\/teams\/(\d+)\.png$/);

    if (teamIdMatch) {
      const teamId = parseInt(teamIdMatch[1]);
      lightSrc = `${SUPABASE_URL}/storage/v1/object/public/teams/${teamId}.png`;
      darkSrc = lightSrc; // 팀 로고는 다크모드 이미지 없음

      img.setAttribute('data-light-src', lightSrc);
      img.setAttribute('data-dark-src', darkSrc);
    }
  }

  if (lightSrc && darkSrc) {
    img.src = isDark ? darkSrc : lightSrc;
  }
}

/**
 * 매치 카드 호버 효과 적용
 */
export function setupMatchCardHover(container: HTMLElement): MutationObserver | undefined {
  // CSS로 호버 효과 처리 - JS 핸들러 불필요
  // MutationObserver는 다크모드 이미지 업데이트 등 다른 용도로 유지
  const observer = new MutationObserver(() => {
    updateMatchCardImages(container);
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });

  return observer;
}

/**
 * 매치카드 호버 이벤트 리스너 정리 (호환성 유지용)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function cleanupMatchCardHover(container: HTMLElement): void {
  // CSS로 호버 효과 처리 - JS 이벤트 리스너 정리 불필요
}
