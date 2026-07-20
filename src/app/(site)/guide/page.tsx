import { Metadata } from 'next';
import { buildMetadata } from '@/shared/utils/metadataNew';
import { siteConfig } from '@/shared/config';
import StandalonePageHeader from '../_components/StandalonePageHeader';
import GuidePageClient from './GuidePageClient';
import { GUIDE_DEMO_IMAGES } from './demoAssets';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: '이용 가이드',
    ogTitle: '4590 이용 가이드',
    description: '4590 커뮤니티 이용 규칙, 가이드 및 주요 기능 사용법 안내 페이지입니다.',
    path: '/guide',
    keywords: ['4590', '4590 이용가이드', '축구 커뮤니티', '4590football'],
  });
}

export default function GuidePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '4590 Football 이용 가이드',
    description: '축구 커뮤니티 4590 Football의 주요 기능과 사용법을 안내합니다.',
    url: `${siteConfig.url}/guide`,
    step: [
      { '@type': 'HowToStep', name: '리그·팀 탐색', text: '상단 메뉴에서 리그·팀을 클릭하여 순위표, 팀 정보, 선수 정보를 확인합니다.' },
      { '@type': 'HowToStep', name: '라이브스코어 확인', text: '라이브스코어 페이지에서 실시간 경기 스코어, 라인업, 통계를 확인합니다.' },
      { '@type': 'HowToStep', name: '이적시장 확인', text: '이적시장 페이지에서 리그와 팀을 선택하여 이적 소식을 확인합니다.' },
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
      <StandalonePageHeader priority />
      <GuidePageClient demoImages={GUIDE_DEMO_IMAGES} />
    </>
  );
}
