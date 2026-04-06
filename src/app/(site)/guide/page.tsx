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
    '@type': 'WebPage',
    name: '이용 가이드 - 4590 Football',
    description: '축구 커뮤니티 4590 Football 이용 가이드. 라이브스코어, 리그·팀 탐색, 선수 정보, 게시글 작성, 승부예측 등 사용법을 안내합니다.',
    url: `${siteConfig.url}/guide`,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntity: {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '리그·팀 페이지는 어떻게 이용하나요?',
          acceptedAnswer: { '@type': 'Answer', text: '상단 메뉴에서 리그·팀을 클릭하면 리그 선택 후 순위표, 팀 정보, 선수 정보를 확인할 수 있습니다.' },
        },
        {
          '@type': 'Question',
          name: '라이브스코어는 어떻게 확인하나요?',
          acceptedAnswer: { '@type': 'Answer', text: '라이브스코어 페이지에서 실시간 경기 스코어, 라인업, 통계를 확인할 수 있습니다.' },
        },
        {
          '@type': 'Question',
          name: '게시글에 카드를 삽입하려면 어떻게 하나요?',
          acceptedAnswer: { '@type': 'Answer', text: '게시글 작성 시 에디터 툴바에서 팀·선수·매치 카드를 검색하여 삽입할 수 있습니다.' },
        },
        {
          '@type': 'Question',
          name: '상점에서 무엇을 구매할 수 있나요?',
          acceptedAnswer: { '@type': 'Answer', text: '팀 아이콘, 이모티콘 팩, 닉네임 변경권 등을 포인트로 구매할 수 있습니다.' },
        },
        {
          '@type': 'Question',
          name: '고객센터에 문의하려면 어떻게 하나요?',
          acceptedAnswer: { '@type': 'Answer', text: '페이지 하단의 챗봇을 통해 이용 문의, 신고, 의견을 제출할 수 있습니다.' },
        },
      ],
    },
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
