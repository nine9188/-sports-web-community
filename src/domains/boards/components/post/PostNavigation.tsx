import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ListOrdered } from 'lucide-react';
import { Button, Container } from '@/shared/components/ui';

interface PostNavigationProps {
  boardSlug: string;
  prevPost: { id: string; title: string; post_number: number } | null;
  nextPost: { id: string; title: string; post_number: number } | null;
  isLoggedIn?: boolean;
}

export default function PostNavigation({ boardSlug, prevPost, nextPost }: PostNavigationProps) {
  // 표시할 버튼들의 배열 생성
  const buttons = [
    // 이전글 버튼 (항상 표시)
    {
      key: 'prev',
      element: prevPost ? (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs sm:text-sm gap-1"
        >
          <Link href={`/boards/${boardSlug}/${prevPost.post_number}`}>
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>이전글</span>
          </Link>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-xs sm:text-sm text-gray-400 dark:text-gray-600 gap-1"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>이전글</span>
        </Button>
      )
    },
    // 목록 버튼 (항상 표시)
    {
      key: 'list',
      element: (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs sm:text-sm gap-1"
        >
          <Link href={`/boards/${boardSlug}`}>
            <ListOrdered className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>목록</span>
          </Link>
        </Button>
      )
    },
    // 다음글 버튼 (항상 표시)
    {
      key: 'next',
      element: nextPost ? (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs sm:text-sm gap-1"
        >
          <Link href={`/boards/${boardSlug}/${nextPost.post_number}`}>
            <span>다음글</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-xs sm:text-sm text-gray-400 dark:text-gray-600 gap-1"
        >
          <span>다음글</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      )
    }
  ];

  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      <div className="h-12 px-4 flex flex-row items-center justify-around">
        {buttons.map((button) => (
          <div key={button.key} className="flex-1 text-center">
            {button.element}
          </div>
        ))}
      </div>
    </Container>
  );
} 