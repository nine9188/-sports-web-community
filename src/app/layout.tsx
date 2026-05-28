import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import RootLayoutProvider from './RootLayoutProvider';
import { brandColors, siteConfig } from '@/shared/config';

// Inter font with display swap to avoid FOIT.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

// Global metadata.
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
    title: siteConfig.ogTitle,
    description: siteConfig.description,
    images: [
      siteConfig.getDefaultOgImageObject(),
      {
        url: siteConfig.defaultOgImageSquare,
        width: 1200,
        height: 1200,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.defaultOgImage],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
  },
  other: {
    'msapplication-TileColor': brandColors.primary,
    'application-name': '4590 Football',
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
 * Site root layout.
 * - No database query
 * - No external API call
 * Runs for every page, including 404 and error pages, but does not create API cost.
 *
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={inter.className} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-title" content="4590" />
        <meta name="p:domain_verify" content="093222e7675c8f952acbd872377e3c2b" />
        <link rel="shortcut icon" href={`${siteConfig.url}/favicon.ico`} type="image/x-icon" />
        <link rel="icon" href={`${siteConfig.url}/favicon.ico`} type="image/x-icon" />
        <link rel="icon" href={`${siteConfig.url}/icon.png`} type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href={`${siteConfig.url}/apple-icon.png`} type="image/png" sizes="180x180" />
        <link rel="manifest" href={`${siteConfig.url}/site.webmanifest`} />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MESEGFZZPF" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
window.gtag('config', 'G-MESEGFZZPF');
`,
          }}
        />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </head>

      <body className="w-full h-full overflow-x-hidden">
        {/* Organization + WebSite JSON-LD shared across the site. */}
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
                    url: `${siteConfig.url}/logo/4590football-logo.png`,
                  },
                  sameAs: [
                    'https://www.instagram.com/4590_football',
                    'https://www.youtube.com/@4590football',
                  ],
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
        <RootLayoutProvider>
          {children}
        </RootLayoutProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
