import { Metadata } from 'next';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { getTeamLogoUrls, getLeagueLogoUrls, getPlayerPhotoUrls } from '@/domains/livescore/actions/images';
import GuidePageClient from './GuidePageClient';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: '이용 가이드',
    description: '4590 Football 이용 가이드 — 리그·팀 탐색, 선수 정보, 라이브스코어, 게시글 카드 삽입 등 사이트 사용법을 안내합니다.',
    path: '/guide',
  });
}

// 데모용 ID
const DEMO_TEAM_IDS = [42, 49, 50, 40, 47, 33, 541, 529]; // Arsenal, Chelsea, Man City, Liverpool, Tottenham, Man Utd, Real Madrid, Barcelona
const DEMO_LEAGUE_IDS = [39, 140, 135, 2, 78, 61, 292]; // EPL, LaLiga, Serie A, UCL, Bundesliga, Ligue1, K-League
const DEMO_PLAYER_IDS = [1100, 306, 1460, 19533, 284324, 37127, 152982, 5996, 116117]; // Haaland, Salah, Saka, Partey, Rice, Odegaard, Palmer, Enzo, Caicedo

export default async function GuidePage() {
  const [teamLogos, leagueLogos, leagueLogosDark, playerPhotos] = await Promise.all([
    getTeamLogoUrls(DEMO_TEAM_IDS, 'sm'),
    getLeagueLogoUrls(DEMO_LEAGUE_IDS, false, 'sm'),
    getLeagueLogoUrls(DEMO_LEAGUE_IDS, true, 'sm'),
    getPlayerPhotoUrls(DEMO_PLAYER_IDS, 'sm'),
  ]);

  return (
    <GuidePageClient
      demoImages={{ teamLogos, leagueLogos, leagueLogosDark, playerPhotos }}
    />
  );
}
