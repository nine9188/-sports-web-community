import Link from 'next/link';
import {
  Container,
  ContainerHeader,
  ContainerTitle,
  ContainerContent,
} from '@/shared/components/ui';

export const metadata = {
  title: '404 - 페이지를 찾을 수 없습니다 | 4590',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPage() {
  return (
    <div className="p-4 space-y-4">
      {/* 메인 404 카드 */}
      <Container>
        <ContainerHeader>
          <ContainerTitle>페이지를 찾을 수 없습니다</ContainerTitle>
        </ContainerHeader>
        <ContainerContent className="py-12">
          <div className="text-center space-y-6">
            {/* 404 숫자 */}
            <div className="text-8xl font-bold text-gray-200 dark:text-gray-700">
              404
            </div>

            {/* 메시지 */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F0F0F0]">
                요청하신 페이지를 찾을 수 없습니다
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
              </p>
            </div>

            {/* 메인페이지 버튼 */}
            <div className="flex justify-center pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                메인페이지
              </Link>
            </div>
          </div>
        </ContainerContent>
      </Container>

      {/* 추가 도움말 카드 */}
      <Container>
        <ContainerHeader>
          <ContainerTitle>이런 페이지는 어떠세요?</ContainerTitle>
        </ContainerHeader>
        <ContainerContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. HOT 인기게시글 */}
            <Link
              href="/boards/all?sort=hot"
              className="group p-4 rounded-lg border border-black/5 dark:border-white/5 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0] mb-1">
                    HOT 인기게시글
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    지금 인기있는 게시글을 확인하세요
                  </p>
                </div>
              </div>
            </Link>

            {/* 2. 전체 게시판 */}
            <Link
              href="/boards/all"
              className="group p-4 rounded-lg border border-black/5 dark:border-white/5 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0] mb-1">
                    전체 게시판
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    모든 게시판의 최신 글을 확인하세요
                  </p>
                </div>
              </div>
            </Link>

            {/* 3. 라이브스코어 */}
            <Link
              href="/livescore/football"
              className="group p-4 rounded-lg border border-black/5 dark:border-white/5 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-900 dark:text-[#F0F0F0] mb-1">
                    라이브스코어
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    실시간 축구 경기 정보를 확인하세요
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </ContainerContent>
      </Container>
    </div>
  );
}
