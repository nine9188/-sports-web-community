'use client';

import React, { useState, useEffect, startTransition } from 'react';
import type { Post } from '@/domains/boards/types/post';
import { NoticeItem } from './NoticeItem';

interface NoticeListProps {
  notices: Post[];
  showBoardName?: boolean;
  emptyMessage?: string;
  standalone?: boolean; // true: 독립 컨테이너, false: 내용만
}

export function NoticeList({
  notices,
  showBoardName = false,
  emptyMessage = '공지사항이 없습니다.',
  standalone = true
}: NoticeListProps) {
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      startTransition(() => {
        setIsMobile(window.innerWidth < 640);
      });
    };

    checkMobile();

    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        startTransition(() => {
          setIsMobile(window.innerWidth < 640);
        });
      }, 150);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  if (notices.length === 0) {
    const emptyContent = (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );

    if (!standalone) {
      return emptyContent;
    }

    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-0 m-0">
        {emptyContent}
      </div>
    );
  }

  // 모바일 리스트 내용
  const mobileContent = (
    <>
      {notices.map((notice, index) => (
        <NoticeItem
          key={notice.id}
          notice={notice}
          showBoardName={showBoardName}
          isLast={index === notices.length - 1}
          isMobile={true}
        />
      ))}
    </>
  );

  // 데스크톱 테이블 내용
  const desktopContent = (
    <table className="w-full border-collapse [&_tbody_td:first-child]:text-center" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: showBoardName ? '130px' : '100px' }} />
        <col />
        <col style={{ width: '120px' }} />
        <col style={{ width: '70px' }} />
        <col style={{ width: '40px' }} />
        <col style={{ width: '40px' }} />
      </colgroup>
      <thead>
        <tr className="border-b border-black/5 dark:border-white/10 bg-[#F5F5F5] dark:bg-[#262626]">
          <th className="py-2 px-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {showBoardName ? '게시판' : '구분'}
          </th>
          <th className="py-2 px-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">제목</th>
          <th className="py-2 px-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">글쓴이</th>
          <th className="py-2 px-1 text-center text-sm font-medium text-gray-500 dark:text-gray-400">날짜</th>
          <th className="py-2 px-1 text-center text-sm font-medium text-gray-500 dark:text-gray-400">조회</th>
          <th className="py-2 px-1 text-center text-sm font-medium text-gray-500 dark:text-gray-400">추천</th>
        </tr>
      </thead>
      <tbody>
        {notices.map((notice, index) => (
          <NoticeItem
            key={notice.id}
            notice={notice}
            showBoardName={showBoardName}
            isLast={index === notices.length - 1}
            isMobile={false}
          />
        ))}
      </tbody>
    </table>
  );

  // standalone={false}일 때는 내용만 반환
  if (!standalone) {
    if (isMobile) {
      return (
        <div>
          {mobileContent}
        </div>
      );
    }
    return (
      <div>
        {desktopContent}
      </div>
    );
  }

  // standalone={true}일 때는 컨테이너 포함
  if (isMobile) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden p-0 m-0">
        {mobileContent}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden p-0 m-0">
      {desktopContent}
    </div>
  );
}
