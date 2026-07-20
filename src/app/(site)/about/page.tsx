import { Metadata } from 'next';
import { buildMetadata } from '@/shared/utils/metadataNew';
import StandalonePageHeader from '../_components/StandalonePageHeader';
import AboutPageClient from './AboutPageClient';
import { ABOUT_DEMO_IMAGES } from './demoAssets';
import { ABOUT_FAQ_ITEMS } from './faq';
import { siteConfig } from '@/shared/config';
import '@/styles/post-content.css';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: '사이트 소개',
    ogTitle: '4590 축구 커뮤니티 소개',
    description: '4590 Football 플랫폼 소개, 서비스 안내 및 자주 묻는 질문(FAQ)을 확인하세요.',
    path: '/about',
    keywords: ['4590', '4590 소개', '축구 커뮤니티', '4590football'],
  });
}

export default function AboutPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteConfig.url}/about#faq`,
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
