import { Metadata } from 'next';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import { getTeamLogoUrls, getLeagueLogoUrls, getPlayerPhotoUrls } from '@/domains/livescore/actions/images';
import GuidePageClient from './GuidePageClient';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: '이용 가이드',
    description: '축구 커뮤니티 4590 Football 이용 가이드. 라이브스코어, 리그·팀 탐색, 선수 정보, 게시글 작성, 승부예측 등 사용법을 안내합니다.',
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '4590 Football 이용 가이드',
    description: '축구 커뮤니티 4590 Football의 주요 기능과 사용법을 안내합니다.',
    url: `${siteConfig.url}/guide`,
    step: [
      { '@type': 'HowToStep', name: '리그·팀 탐색', text: '상단 메뉴에서 리그·팀을 클릭하여 순위표, 팀 정보, 선수 정보를 확인합니다.' },
      { '@type': 'HowToStep', name: '라이브스코어 확인', text: '라이브스코어 페이지에서 실시간 경기 스코어, 라인업, 통계를 확인합니다.' },
      { '@type': 'HowToStep', name: '이적시장 확인', text: '이적시장 페이지에서 최신 이적 소식을 확인합니다.' },
      { '@type': 'HowToStep', name: '게시글 작성', text: '에디터 툴바에서 팀·선수·매치 카드를 검색하여 게시글에 삽입합니다.' },
      { '@type': 'HowToStep', name: '상점 이용', text: '상점에서 팀 아이콘, 이모티콘 팩, 닉네임 변경권 등을 포인트로 구매합니다.' },
      { '@type': 'HowToStep', name: '고객센터 문의', text: '페이지 하단의 챗봇을 통해 이용 문의, 신고, 의견을 제출합니다.' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GuidePageClient
        demoImages={{ teamLogos, leagueLogos, leagueLogosDark, playerPhotos }}
      />
    </>
  );
}
