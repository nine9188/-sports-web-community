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
                  logo: {
                    '@type': 'ImageObject',
                    url: `${siteConfig.url}/logo/4590football-logo.svg`,
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
