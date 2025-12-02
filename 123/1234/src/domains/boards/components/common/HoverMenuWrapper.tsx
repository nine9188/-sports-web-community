// 이 파일은 서버 컴포넌트입니다 - 'use client' 지시어 없음
import React from 'react';
import ServerHoverMenu from './ServerHoverMenu';

interface HoverMenuWrapperProps {
  currentBoardId: string;
  rootBoardId?: string;
  rootBoardSlug?: string;
  currentBoardSlug?: string;
  fromParam?: string;
}

// 이 컴포넌트는 서버 컴포넌트인 ServerHoverMenu를 호출하고 있습니다.
// 클라이언트 컴포넌트인 BoardDetailLayout에서는 ServerHoverMenu를 직접 호출할 수 없고,
// 이 래퍼를 통해 호출해야 합니다.
export default function HoverMenuWrapper(props: HoverMenuWrapperProps) {
  return <ServerHoverMenu {...props} />;
} 