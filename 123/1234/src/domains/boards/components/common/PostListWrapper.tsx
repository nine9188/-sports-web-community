// 이 파일은 서버 컴포넌트입니다 - 'use client' 지시어 없음
import React from 'react';
import ServerPostList from '@/domains/boards/components/post/ServerPostList';

// ServerPostList에 필요한 props 정의
interface PostListWrapperProps {
  boardId?: string;
  boardIds?: string[];
  currentBoardId: string;
  limit?: number;
  showBoard?: boolean;
  currentPostId?: string;
  emptyMessage?: string;
  maxHeight?: string;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  fromParam?: string;
  className?: string;
  boardNameMaxWidth?: string;
  initialPage?: number;
}

// ServerPostList를 위한 래퍼 컴포넌트
// 클라이언트 컴포넌트에서는 이 컴포넌트를 통해 ServerPostList를 사용합니다
export default function PostListWrapper(props: PostListWrapperProps) {
  return <ServerPostList {...props} />;
} 