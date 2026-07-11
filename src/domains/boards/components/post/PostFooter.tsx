'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PenLine, Edit, Trash, List } from 'lucide-react';
import { deletePost } from '@/domains/boards/actions/posts/index';
import ReportButton from '@/domains/reports/components/ReportButton';
import ShareButton from '@/shared/components/ShareButton';
import { Button } from '@/shared/components/ui';
import { toast } from 'sonner';

interface PostFooterProps {
  boardSlug: string;
  postNumber?: string;
  isAuthor?: boolean;
  isLoggedIn?: boolean;
  postId?: string;
  userId?: string;
  returnHref?: string;
  withMargin?: boolean;
  variant?: 'middle' | 'bottom';
}

export default function PostFooter({ 
  boardSlug,
  postNumber,
  isAuthor = false,
  isLoggedIn = false,
  postId,
  userId,
  returnHref,
  withMargin = true,
  variant = 'middle',
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
      const response = await deletePost(postId, userId);
      
      if (!response.success) {
        toast.error(response.error || '게시글 삭제 중 오류가 발생했습니다.');
        setIsDeleting(false);
        return;
      }

      const targetUrl = returnHref || `/boards/${response.boardSlug || boardSlug}`;
      toast.success('게시글이 삭제되었습니다.');
      router.replace(targetUrl);
    } catch {
      toast.error('게시글 삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };



  const shareButton = {
    key: 'share',
    element: <ShareButton />,
  };

  const writeButton = {
    key: 'write',
    element: (
      <Button variant="ghost" size="sm" asChild className="text-xs sm:text-[13px] gap-1">
        <Link href={`/boards/${boardSlug}/create`} prefetch={false}>
          <PenLine className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>글쓰기</span>
        </Link>
      </Button>
    ),
  };

  const editButton = {
    key: 'edit',
    element: (
      <Button variant="ghost" size="sm" asChild className="text-xs sm:text-[13px] gap-1">
        <Link href={`/boards/${boardSlug}/${postNumber}/edit`} prefetch={false}>
          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>수정</span>
        </Link>
      </Button>
    ),
  };

  const deleteButton = {
    key: 'delete',
    element: (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-xs sm:text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1"
      >
        <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
        <span>{isDeleting ? '삭제 중...' : '삭제'}</span>
      </Button>
    ),
  };

  const listButton = {
    key: 'list',
    element: (
      <Button variant="ghost" size="sm" asChild className="text-xs sm:text-[13px] gap-1">
        <Link href={returnHref || `/boards/${boardSlug}`} prefetch={false}>
          <List className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>목록</span>
        </Link>
      </Button>
    ),
  };

  const reportButton = postId ? {
    key: 'report',
    element: (
      <ReportButton
        targetType="post"
        targetId={postId}
        variant="ghost"
        size="sm"
        showText={true}
        className="inline-flex flex-row items-center justify-center text-xs sm:text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors px-2 py-1 gap-1"
      />
    ),
  } : null;

  // 중간 (본문 직후)
  // 작성자: 공유 글쓰기 수정 삭제
  // 타인:   공유 글쓰기 신고
  // 하단 (댓글 끝)
  // 작성자: 공유 목록 수정 삭제
  // 타인:   공유 목록 신고

  let buttonSlots: { key: string; element: React.ReactNode }[] = [];

  if (variant === 'middle') {
    if (isAuthor) {
      buttonSlots = [shareButton, writeButton, editButton, deleteButton];
    } else {
      buttonSlots = [
        shareButton,
        writeButton,
        ...(reportButton && isLoggedIn ? [reportButton] : []),
      ];
    }
  } else {
    // bottom
    if (isAuthor) {
      buttonSlots = [shareButton, listButton, editButton, deleteButton];
    } else {
      buttonSlots = [
        shareButton,
        listButton,
        ...(reportButton && isLoggedIn ? [reportButton] : []),
      ];
    }
  }

  if (buttonSlots.length === 0) return null;

  return (
    <div className={`bg-white dark:bg-[#1D1D1D] md:rounded-lg border border-black/7 dark:border-0 ${withMargin ? 'mb-4' : ''}`}>
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
