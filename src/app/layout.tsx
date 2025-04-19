import './globals.css';
import { Inter } from 'next/font/google';
import BoardNavigation from './components/sidebar/BoardNavigation';
import RightSidebar from './components/RightSidebar';
import RootLayoutClient from './RootLayoutClient';

// 동적 렌더링 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Inter 폰트 정의를 전역 CSS 클래스로 사용
const inter = Inter({ subsets: ['latin'] });

// 메타데이터 설정
export const metadata = {
  title: 'SPORTS 커뮤니티',
  description: '스포츠 팬들을 위한 커뮤니티 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버 컴포넌트에서 BoardNavigation 생성
  const boardNav = <BoardNavigation />;

  return (
    <html lang="ko" className={`w-full h-full ${inter.className}`} suppressHydrationWarning>
      <head />
      <body className="w-full h-full overflow-x-hidden">
        <RootLayoutClient 
          boardNavigation={boardNav}
          rightSidebar={<RightSidebar />}
        >
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}