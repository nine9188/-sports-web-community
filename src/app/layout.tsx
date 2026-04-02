import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import RootLayoutProvider from './RootLayoutProvider';
import { siteConfig } from '@/shared/config';

// Inter 폰트 정의 - display: swap으로 FOIT 방지
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

// 전역 메타데이터
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.getDefaultOgImageObject()],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    other: {
      'naver-site-verification': '2b10354399e2b85e4e7aad7ba1aabfcb23eca1e3',
      'google-adsense-account': 'ca-pub-8892057636180546',
    },
  },
};

/**
 * Root Layout (Server Component)
 *
 * 완전히 무해한 레이아웃입니다.
 * - DB 쿼리 없음
 * - 외부 API 호출 없음
 *
 * 404, 에러 페이지를 포함한 모든 페이지에서 실행되지만,
 * API 호출을 하지 않으므로 비용이 발생하지 않습니다.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={inter.className} suppressHydrationWarning>
      <head />

      <body className="w-full h-full overflow-x-hidden">
        {/* Organization + WebSite JSON-LD (사이트 전체 공통) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `${siteConfig.url}#organization`,
                  name: siteConfig.name,
                  url: siteConfig.url,
                  description: siteConfig.description,
                  foundingDate: '2026-03-15',
                  logo: {
                    '@type': 'ImageObject',
                    url: `${siteConfig.url}/logo/4590football-logo.svg`,
                  },
                  email: 'support@4590football.com',
                  contactPoint: {
                    '@type': 'ContactPoint',
                    contactType: 'Customer Support',
                    url: `${siteConfig.url}/contact`,
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': `${siteConfig.url}#website`,
                  name: siteConfig.name,
                  url: siteConfig.url,
                  description: siteConfig.description,
                  publisher: {
                    '@id': `${siteConfig.url}#organization`,
                  },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
        {/* FAQPage JSON-LD (AEO 확장 요소) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                { '@type': 'Question', name: '4590이 무슨 뜻인가요?', acceptedAnswer: { '@type': 'Answer', text: '축구 경기는 전반 45분, 후반 45분으로 이루어집니다. 4590은 그 90분의 모든 순간을 함께한다는 의미입니다.' } },
                { '@type': 'Question', name: '무료인가요?', acceptedAnswer: { '@type': 'Answer', text: '네. 모든 기능을 무료로 이용할 수 있습니다. 가입하면 다른 팬들과 바로 소통할 수 있습니다.' } },
                { '@type': 'Question', name: 'AI 예측은 어떻게 작동하나요?', acceptedAnswer: { '@type': 'Answer', text: '과거 경기 데이터, 팀 폼, 맞대결 기록 등을 AI 모델이 분석하여 승률과 예상 스코어를 제공합니다.' } },
                { '@type': 'Question', name: '어떤 리그를 지원하나요?', acceptedAnswer: { '@type': 'Answer', text: '유럽 5대 리그, 챔피언스리그, K리그, J리그, MLS 등 40개 이상의 리그와 국제 대회를 지원합니다.' } },
                { '@type': 'Question', name: '다른 축구 커뮤니티와 뭐가 다른가요?', acceptedAnswer: { '@type': 'Answer', text: '4590 Football은 실시간 라이브스코어, AI 경기 분석, 팀·선수 데이터를 커뮤니티와 통합한 플랫폼입니다. 프리미어리그, 라리가, 세리에A, 분데스리가, K리그 등 100개 이상의 팀별 전용 게시판이 있고, 경기 데이터 기반 분석 게시판도 운영합니다.' } },
              ],
            }),
          }}
        />
        <RootLayoutProvider>
          {children}
        </RootLayoutProvider>
        <Analytics />
        <SpeedInsights />
        {/* Google tag (gtag.js) - next/script로 hydration mismatch 방지 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MESEGFZZPF"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-MESEGFZZPF');`}
        </Script>
        {/* Google AdSense */}
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
