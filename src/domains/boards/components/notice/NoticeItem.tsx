'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/domains/boards/types/post';
import { NoticeBadge } from './NoticeBadge';
import UserIconComponent from '@/shared/components/UserIcon';
import ApiSportsImage from '@/shared/components/ApiSportsImage';
import { ImageType } from '@/shared/types/image';

interface NoticeItemProps {
  notice: Post;
  showBoardName?: boolean;
  isLast?: boolean;
  isMobile?: boolean;
}

export function NoticeItem({ notice, showBoardName = false, isLast = false, isMobile = false }: NoticeItemProps) {
  const boardSlug = notice.board_slug || notice.board?.slug || notice.board_id || '';
  const postUrl = `/boards/${boardSlug}/${notice.post_number}`;

  // 안전한 날짜 포맷팅 - formattedDate 사용
  const formattedDate = useMemo(() => {
    return notice.formattedDate || '-';
  }, [notice.formattedDate]);

  // 게시판 로고 렌더링 함수 (PostList와 동일) - hooks는 항상 같은 순서로 호출되어야 함
  const renderBoardLogo = useMemo(() => {
    if (!showBoardName) {
      // 공지 배지 표시
      return notice.notice_type && (
        <NoticeBadge type={notice.notice_type} isMustRead={notice.is_must_read} />
      );
    }

    // 게시판 이름 표시 (로고 포함)
    const teamId = typeof notice.team_id === 'string' ? parseInt(notice.team_id, 10) : notice.team_id;
    const leagueId = typeof notice.league_id === 'string' ? parseInt(notice.league_id, 10) : notice.league_id;

    if (teamId || leagueId) {
      return (
        <div className="flex items-center">
          <div className="relative w-5 h-5 mr-1">
            <ApiSportsImage
              imageId={teamId || leagueId || 0}
              imageType={teamId ? ImageType.Teams : ImageType.Leagues}
              alt={notice.board?.name || notice.board_name || ''}
              width={20}
              height={20}
              className="object-contain w-5 h-5"
              loading="lazy"
              priority={false}
            />
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300 truncate"
                title={notice.board?.name || notice.board_name || ''}
                style={{maxWidth: '85px'}}>
            {notice.board?.name || notice.board_name || '-'}
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <div className="relative w-5 h-5 mr-1">
            <Image
              src="/logo/4590 로고2 이미지크기 275X200 누끼제거 버전.png"
              alt={notice.board?.name || notice.board_name || ''}
              width={20}
              height={20}
              className="object-contain w-5 h-5 dark:invert"
              loading="lazy"
            />
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300 truncate"
                title={notice.board?.name || notice.board_name || ''}
                style={{maxWidth: '85px'}}>
            {notice.board?.name || notice.board_name || '-'}
          </span>
        </div>
      );
    }
  }, [showBoardName, notice.notice_type, notice.is_must_read, notice.team_id, notice.league_id, notice.board?.name, notice.board_name]);

  // 모바일 뷰
  if (isMobile) {
    return (
      <div className={`py-2 px-3 ${!isLast ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
        <Link href={postUrl} prefetch={false}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {notice.notice_type && (
                <NoticeBadge type={notice.notice_type} isMustRead={notice.is_must_read} />
              )}
              <span className="text-xs line-clamp-1 text-gray-900 dark:text-[#F0F0F0]">
                {notice.title}
              </span>
            </div>
            <div className="flex text-[11px] text-gray-500 dark:text-gray-400 justify-between">
              <div className="flex items-center gap-1">
                <UserIconComponent
                  iconUrl={notice.author_icon_url}
                  level={notice.author_level || 1}
                  size={20}
                  alt={notice.author_nickname || '익명'}
                />
                <span>{notice.author_nickname || '익명'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{formattedDate}</span>
                <span>조회 {notice.views || 0}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // 데스크톱 테이블 행
  return (
    <tr className={`${!isLast ? 'border-b border-black/5 dark:border-white/10' : ''} hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors`}>
      {/* 첫 번째 컬럼: showBoardName이 true면 게시판 이름, false면 공지 배지 */}
      <td className="py-2 px-3 align-middle">
        <div className="h-5 flex items-center">
          {renderBoardLogo}
        </div>
      </td>

      {/* 제목 */}
      <td className="py-2 px-4 align-middle">
        <Link href={postUrl} className="block w-full" prefetch={false}>
          <div className="flex items-center">
            <span className="text-xs line-clamp-1 text-gray-900 dark:text-[#F0F0F0]">
              {notice.title}
              {notice.comment_count && notice.comment_count > 0 && (
                <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">
                  [{notice.comment_count}]
                </span>
              )}
            </span>
          </div>
        </Link>
      </td>

      {/* 작성자 (아이콘 + 닉네임) */}
      <td className="py-2 px-3 text-left text-xs text-gray-500 dark:text-gray-400 align-middle">
        <div className="flex items-center justify-start">
          <div className="mr-0.5 flex items-center justify-center overflow-hidden">
            <UserIconComponent
              iconUrl={notice.author_icon_url}
              level={notice.author_level || 1}
              size={20}
              alt={notice.author_nickname || '익명'}
            />
          </div>
          <span className="truncate text-xs text-gray-600 dark:text-gray-400" title={notice.author_nickname || '익명'} style={{maxWidth: '100px'}}>
            {notice.author_nickname || notice.profiles?.nickname || '익명'}
          </span>
        </div>
      </td>

      {/* 작성일 */}
      <td className="py-2 px-1 text-center text-xs text-gray-500 dark:text-gray-400 align-middle">
        {formattedDate}
      </td>

      {/* 조회수 */}
      <td className="py-2 px-1 text-center text-xs text-gray-500 dark:text-gray-400 align-middle">
        {notice.views || 0}
      </td>

      {/* 추천 */}
      <td className="py-2 px-1 text-center text-xs text-gray-500 dark:text-gray-400 align-middle">
        {notice.likes || 0}
      </td>
    </tr>
  );
}
