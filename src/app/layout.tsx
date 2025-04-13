import './globals.css';
import { Inter } from 'next/font/google';
import BoardNavigation from './components/sidebar/BoardNavigation';
import RootLayoutClient from './RootLayoutClient';

// Inter 폰트 정의를 전역 CSS 클래스로 사용
const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`w-full h-full ${inter.className}`} suppressHydrationWarning>
      <head />
      <body className="w-full h-full overflow-x-hidden">
        <RootLayoutClient boardNavigation={<BoardNavigation />}>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}