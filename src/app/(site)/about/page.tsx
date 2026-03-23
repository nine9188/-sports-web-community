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

export default async function AboutPage() {
  const [teamLogos, leagueLogos, leagueLogosDark, playerPhoto, playerPhotos] = await Promise.all([
    getTeamLogoUrls(DEMO_TEAM_IDS, 'sm'),
    getLeagueLogoUrls(DEMO_LEAGUE_IDS, false, 'sm'),
    getLeagueLogoUrls(DEMO_LEAGUE_IDS, true, 'sm'),
    getPlayerPhotoUrl(306, 'md'), // 살라
    getPlayerPhotoUrls(DEMO_PLAYER_IDS, 'sm'),
  ]);

  return (
    <AboutPageClient
      demoImages={{ teamLogos, leagueLogos, leagueLogosDark, playerPhoto, playerPhotos }}
    />
  );
}
