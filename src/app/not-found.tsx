import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto min-h-[60vh] flex items-center justify-center">
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-8 text-center max-w-md">
        <div className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
        <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-[#F0F0F0]">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-[#262626] dark:bg-[#3F3F3F] text-white hover:bg-[#3F3F3F] dark:hover:bg-[#4A4A4A] px-4 py-2 rounded text-sm transition-colors"
          >
            메인페이지로 이동
          </Link>
          <Link
            href="/boards/all"
            className="inline-block border border-black/7 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] px-4 py-2 rounded text-sm transition-colors"
          >
            전체글 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
