import { Suspense } from 'react';
import NoticeManagement from './NoticeManagement';

export const metadata = {
  title: '공지사항 관리 - 관리자',
  description: '공지사항을 관리합니다'
};

export default function AdminNoticesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          공지사항 관리
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          전체 공지와 게시판별 공지를 설정하고 관리할 수 있습니다.
        </p>
      </div>

      <Suspense fallback={<div>로딩 중...</div>}>
        <NoticeManagement />
      </Suspense>
    </div>
  );
}
