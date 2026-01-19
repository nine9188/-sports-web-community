'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PenLine, Edit, Trash } from 'lucide-react';
import { deletePost } from '@/domains/boards/actions/posts/index';
import ReportButton from '@/domains/reports/components/ReportButton';
import { Button } from '@/shared/components/ui';

interface PostFooterProps {
  boardSlug: string;
  postNumber?: string;
  isAuthor?: boolean;
  isLoggedIn?: boolean;
  postId?: string;
  userId?: string;
  withMargin?: boolean;
}

export default function PostFooter({ 
  boardSlug,
  postNumber,
  isAuthor = false,
  isLoggedIn = false,
  postId,
  userId,
  withMargin = true
}: PostFooterProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!postId || !userId) {
      alert('게시글 정보를 찾을 수 없습니다.');
      return;
    }

    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // 서버 액션 호출로 변경
      const response = await deletePost(postId, userId);
      
      if (!response.success) {
        alert(`게시글 삭제 중 오류가 발생했습니다: ${response.error}`);
        setIsDeleting(false);
        return;
      }
      
      alert('게시글이 삭제되었습니다.');
      router.push(`/boards/${response.boardSlug || boardSlug}`);
      router.refresh();
    } catch {
      alert(`게시글 삭제 중 오류가 발생했습니다.`);
      setIsDeleting(false);
    }
  };

  // 작성자 여부에 따라 버튼 구성 결정
  const showWriteButton = isLoggedIn;
  const showReportButton = !isAuthor && isLoggedIn && postId;

  const buttonSlots = [];

  if (isAuthor) {
    // Author view: Write, Edit, Delete
    buttonSlots.push({
      key: 'write',
      element: (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs sm:text-sm gap-1"
        >
          <Link href={`/boards/${boardSlug}/create`}>
            <PenLine className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>글쓰기</span>
          </Link>
        </Button>
      )
    });
    buttonSlots.push({
      key: 'edit',
      element: (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs sm:text-sm gap-1"
        >
          <Link href={`/boards/${boardSlug}/${postNumber}/edit`}>
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>수정</span>
          </Link>
        </Button>
      )
    });
    buttonSlots.push({
      key: 'delete',
      element: (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs sm:text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1"
        >
          <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{isDeleting ? '삭제 중...' : '삭제'}</span>
        </Button>
      )
    });
  } else {
    // Non-author view: Write, Placeholder, Report
    buttonSlots.push(showWriteButton ? {
      key: 'write',
      element: (
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs sm:text-sm gap-1"
        >
          <Link href={`/boards/${boardSlug}/create`}>
            <PenLine className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>글쓰기</span>
          </Link>
        </Button>
      )
    } : { key: 'placeholder-1', element: <div /> });

    buttonSlots.push({ key: 'placeholder-2', element: <div /> });

    buttonSlots.push(showReportButton ? {
      key: 'report',
      element: (
        <ReportButton
          targetType="post"
          targetId={postId!}
          variant="ghost"
          size="sm"
          showText={true}
          className="inline-flex flex-row items-center justify-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] rounded-md transition-colors px-2 py-1 gap-1"
        />
      )
    } : { key: 'placeholder-3', element: <div /> });
  }

  const hasContent = buttonSlots.some(slot => slot.element.type !== 'div');

  if (!isLoggedIn || !hasContent) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 ${withMargin ? 'mb-4' : ''}`}>
      <div className="h-12 px-4 flex flex-row items-center justify-around">
        {buttonSlots.map((button) => (
          <div key={button.key} className="flex-1 text-center">
            {button.element}
          </div>
        ))}
      </div>
    </div>
  );
} 