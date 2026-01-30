import './globals.css';
import { Inter } from 'next/font/google';
import RootLayoutProvider from './RootLayoutProvider';

// Inter 폰트 정의
const inter = Inter({ subsets: ['latin'] });

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
      <body className="w-full h-full overflow-x-hidden">
        <RootLayoutProvider>
          {children}
        </RootLayoutProvider>
      </body>
    </html>
  );
}
