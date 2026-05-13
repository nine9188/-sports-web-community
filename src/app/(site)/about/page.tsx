import { Metadata } from 'next';
import { buildMetadata } from '@/shared/utils/metadataNew';
import StandalonePageHeader from '../_components/StandalonePageHeader';
import AboutPageClient from './AboutPageClient';
import { ABOUT_DEMO_IMAGES } from './demoAssets';
import { ABOUT_FAQ_ITEMS } from './faq';
import '@/styles/post-content.css';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: '소개',
    description: '축구 커뮤니티 4590 Football. 라이브스코어, 경기 분석, 축구 승부예측, 해외축구·국내축구 게시판을 제공하는 축구 커뮤니티입니다.',
    path: '/about',
    keywords: ['축구 커뮤니티', '4590', '4590football', '4590 Football', '라이브스코어', '축구 분석', '축구 승부예측'],
  });
}

export default function AboutPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://4590football.com/about#faq',
    name: '4590 Football About FAQ',
    mainEntity: ABOUT_FAQ_ITEMS.map((item) => ({
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
      <StandalonePageHeader priority />
      <AboutPageClient
        demoImages={ABOUT_DEMO_IMAGES}
        faqItems={ABOUT_FAQ_ITEMS}
      />
    </>
  );
}
