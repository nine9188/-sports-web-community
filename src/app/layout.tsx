import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
  robots: {
    index: false,
    follow: false,
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
      <head>
        {/* LCP 최적화: 로고 이미지 미리 로드 */}
        <link
          rel="preload"
          href="/logo/4590football-logo.svg"
          as="image"
          type="image/svg+xml"
          fetchPriority="high"
        />
      </head>
      <body className="w-full h-full overflow-x-hidden">
        <RootLayoutProvider>
          {children}
        </RootLayoutProvider>
      </body>
    </html>
  );
}
