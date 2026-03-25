import { Metadata } from 'next';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { getTeamLogoUrls, getLeagueLogoUrls, getPlayerPhotoUrl, getPlayerPhotoUrls } from '@/domains/livescore/actions/images';
import AboutPageClient from './AboutPageClient';
import '@/styles/post-content.css';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: '소개',
    description: '4590 Football — 실시간 축구 스코어, AI 경기 예측, 데이터 분석, 축구 팬 커뮤니티. 데이터와 커뮤니티가 하나로 연결된 축구 플랫폼.',
    path: '/about',
  });
}

// 데모에 사용할 팀/리그 ID
const DEMO_TEAM_IDS = [
  49,   // Chelsea
  42,   // Arsenal
  50,   // Manchester City
  40,   // Liverpool
  47,   // Tottenham
  34,   // Newcastle
  529,  // Barcelona
  541,  // Real Madrid
  530,  // Atletico Madrid
  533,  // Villarreal
];

const DEMO_LEAGUE_IDS = [39, 140, 2]; // EPL, LaLiga, UCL

// 라인업 데모용 선수 ID (맨시티 + 아스널)
const DEMO_PLAYER_IDS = [
  // 맨시티 4-3-3
  617,   // Ederson (GK, #31)
  627,   // Walker (#2)
  626,   // Dias (#3)
  747,   // Akanji (#25)
  631,   // João Cancelo → Gvardiol (#7 슬롯)
  641,   // Rodri (#16)
  629,   // De Bruyne (#17)
  643,   // Bernardo Silva (#20)
  19465, // Foden (#47)
  1100,  // Haaland (#9)
  633,   // Grealish (#10)
  // 아스널 4-2-3-1
  665,   // Raya (GK, #1)
  22224, // Timber (#35→12)
  1161,  // Gabriel (#6)
  664,   // Saliba (#2)
  15799, // Ben White (#4)
  1460,  // Thomas Partey (#5)
  284324,// Rice (#41)
  19533, // Saka (#7)
  1468,  // Ødegaard (#8)
  288,   // Martinelli (#11)
  20552, // Havertz (#14)
];

// FAQPage JSON-LD 데이터
const FAQ_ITEMS = [
  { q: '4590이 무슨 뜻인가요?', a: '축구 경기는 전반 45분, 후반 45분으로 이루어집니다. 4590은 그 90분의 모든 순간을 함께한다는 의미입니다.' },
  { q: '무료인가요?', a: '네. 모든 기능을 무료로 이용할 수 있습니다. 가입하면 다른 팬들과 바로 소통할 수 있습니다.' },
  { q: 'AI 예측은 어떻게 작동하나요?', a: '과거 경기 데이터, 팀 폼, 맞대결 기록 등을 AI 모델이 분석하여 승률과 예상 스코어를 제공합니다.' },
  { q: '모바일에서도 사용 가능한가요?', a: '네. 반응형 웹으로 제작되어 모바일, 태블릿, PC 어디서든 최적화된 화면으로 이용할 수 있습니다.' },
  { q: '어떤 리그를 지원하나요?', a: '유럽 5대 리그, 챔피언스리그, K리그, J리그, MLS 등 40개 이상의 리그와 국제 대회를 지원합니다.' },
  { q: '포인트는 어떻게 사용하나요?', a: '게시글 작성, 댓글, 좋아요 등 활동으로 획득한 포인트로 프로필 아이콘, 이모티콘 등 아이템을 구매할 수 있습니다. 포인트로 교환할 수 있는 아이템과 보상은 꾸준히 추가될 예정입니다.' },
];

export default async function AboutPage() {
  const [teamLogos, leagueLogos, leagueLogosDark, playerPhoto, playerPhotos] = await Promise.all([
    getTeamLogoUrls(DEMO_TEAM_IDS, 'sm'),
    getLeagueLogoUrls(DEMO_LEAGUE_IDS, false, 'sm'),
    getLeagueLogoUrls(DEMO_LEAGUE_IDS, true, 'sm'),
    getPlayerPhotoUrl(306, 'md'), // 살라
    getPlayerPhotoUrls(DEMO_PLAYER_IDS, 'sm'),
  ]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <AboutPageClient
        demoImages={{ teamLogos, leagueLogos, leagueLogosDark, playerPhoto, playerPhotos }}
      />
    </>
  );
}
