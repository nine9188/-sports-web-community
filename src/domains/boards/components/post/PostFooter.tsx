'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListOrdered, PenLine, Edit, Trash } from 'lucide-react';
import { deletePost } from '@/domains/boards/actions/posts/index';
import ReportButton from '@/domains/reports/components/ReportButton';

interface PostFooterProps {
  boardSlug: string;
  postNumber?: string;
  isAuthor?: boolean;
  isLoggedIn?: boolean;
  postId?: string;
  userId?: string;
}

export default function PostFooter({ 
  boardSlug,
  postNumber,
  isAuthor = false,
  isLoggedIn = false,
  postId,
  userId
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
        console.error('게시글 삭제 중 오류:', response.error);
        alert(`게시글 삭제 중 오류가 발생했습니다: ${response.error}`);
        setIsDeleting(false);
        return;
      }
      
      alert('게시글이 삭제되었습니다.');
      router.push(`/boards/${response.boardSlug || boardSlug}`);
      router.refresh();
    } catch (error) {
      console.error('게시글 삭제 중 오류:', error);
      alert(`게시글 삭제 중 오류가 발생했습니다.`);
      setIsDeleting(false);
    }
  };

  // 작성자 여부에 따라 버튼 구성 결정
  const showWriteButton = isLoggedIn;
  const showEditButton = isAuthor && postNumber;
  const showDeleteButton = isAuthor && postNumber;
  const showReportButton = !isAuthor && isLoggedIn && postId;

  // 표시할 버튼들의 배열 생성
  const buttons = [
    // 목록 버튼 (항상 표시)
    {
      key: 'list',
      element: (
        <Link 
          href={`/boards/${boardSlug}`}
          className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ListOrdered className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">목록</span>
        </Link>
      )
    },
    // 글쓰기 버튼 (로그인 시에만)
    ...(showWriteButton ? [{
      key: 'write',
      element: (
        <Link 
          href={`/boards/${boardSlug}/create`}
          className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <PenLine className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">글쓰기</span>
        </Link>
      )
    }] : []),
    // 수정 버튼 (작성자만)
    ...(showEditButton ? [{
      key: 'edit',
      element: (
        <Link 
          href={`/boards/${boardSlug}/${postNumber}/edit`}
          className="inline-flex items-center justify-center py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Edit className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">수정</span>
        </Link>
      )
    }] : []),
    // 삭제 버튼 (작성자만)
    ...(showDeleteButton ? [{
      key: 'delete',
      element: (
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center py-2 px-3 text-sm text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
        >
          <Trash className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{isDeleting ? '삭제 중...' : '삭제'}</span>
        </button>
      )
    }] : []),
    // 신고 버튼 (작성자가 아니고 로그인한 경우)
    ...(showReportButton ? [{
      key: 'report',
      element: (
        <ReportButton
          targetType="post"
          targetId={postId!}
          variant="ghost"
          size="sm"
          showText={false}
          className="py-2 px-3"
        />
      )
    }] : [])
  ];

  return (
    <div className="bg-white rounded-lg border shadow-sm mb-4">
      <div className="flex flex-row items-center justify-between px-2 py-2">
        {buttons.map((button) => (
          <div key={button.key} className="flex-1 text-center">
            {button.element}
          </div>
        ))}
      </div>
    </div>
  );
} 