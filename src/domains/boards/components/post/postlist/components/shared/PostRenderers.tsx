/**
 * PostList 공통 렌더러
 *
 * 콘텐츠 타입 아이콘, 작성자 정보, 게시판 로고 등을 렌더링하는 함수들
 */

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Image as ImageIcon,
  Link as LinkIcon,
  Video as VideoIcon,
  Youtube as YoutubeIcon,
  Trophy as MatchCardIcon,
  Shield as TeamCardIcon,
  User as PlayerCardIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Linkedin as LinkedinIcon,
  Music2 as TiktokIcon,
} from 'lucide-react';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { AuthorLink } from '@/domains/user/components';
import { Post } from '../../types';
import { checkContentType } from '../../utils';
import { siteConfig } from '@/shared/config';

/**
 * 콘텐츠 타입 아이콘 렌더링
 *
 * 게시글 콘텐츠에 포함된 미디어 타입에 따라 아이콘 표시
 * - 이미지: 초록색 ImageIcon
 * - 비디오: 보라색 VideoIcon
 * - YouTube: 빨간색 YoutubeIcon
 * - 링크: 회색 LinkIcon
 *
 * @param post - 게시글 데이터
 * @returns 아이콘 JSX 또는 null
 */
type ContentTypeSource = Pick<Post, 'content'>;

export function renderContentTypeIcons(post: ContentTypeSource): React.ReactNode {
  if (!post.content) return null;

  const {
    hasImage,
    hasVideo,
    hasYoutube,
    hasLink,
    hasMatchCard,
    hasTeamCard,
    hasPlayerCard,
    hasTwitter,
    hasInstagram,
    hasFacebook,
    hasTiktok,
    hasLinkedin,
  } = checkContentType(post.content);

  // 아이콘이 하나도 없으면 null 반환
  if (!hasImage && !hasVideo && !hasYoutube && !hasLink && !hasMatchCard &&
      !hasTeamCard && !hasPlayerCard &&
      !hasTwitter && !hasInstagram && !hasFacebook && !hasTiktok && !hasLinkedin) {
    return null;
  }

  return (
    <div className="inline-flex items-center space-x-1 flex-shrink-0">
      {hasMatchCard && (
        <div title="경기 카드 포함">
          <MatchCardIcon className="h-3 w-3 text-blue-500 flex-shrink-0" />
        </div>
      )}
      {hasTeamCard && (
        <div title="팀 카드 포함">
          <TeamCardIcon className="h-3 w-3 text-indigo-500 flex-shrink-0" />
        </div>
      )}
      {hasPlayerCard && (
        <div title="선수 카드 포함">
          <PlayerCardIcon className="h-3 w-3 text-orange-500 flex-shrink-0" />
        </div>
      )}
      {hasImage && (
        <div title="이미지 포함">
          <ImageIcon className="h-3 w-3 text-green-500 flex-shrink-0" />
        </div>
      )}
      {hasVideo && (
        <div title="동영상 포함">
          <VideoIcon className="h-3 w-3 text-purple-500 flex-shrink-0" />
        </div>
      )}
      {hasYoutube && (
        <div title="YouTube 동영상">
          <YoutubeIcon className="h-3 w-3 text-red-500 flex-shrink-0" />
        </div>
      )}
      {hasTwitter && (
        <div title="트위터(X)">
          <TwitterIcon className="h-3 w-3 text-sky-500 flex-shrink-0" />
        </div>
      )}
      {hasInstagram && (
        <div title="인스타그램">
          <InstagramIcon className="h-3 w-3 text-pink-500 flex-shrink-0" />
        </div>
      )}
      {hasFacebook && (
        <div title="페이스북">
          <FacebookIcon className="h-3 w-3 text-blue-600 flex-shrink-0" />
        </div>
      )}
      {hasTiktok && (
        <div title="틱톡">
          <TiktokIcon className="h-3 w-3 text-black dark:text-white flex-shrink-0" />
        </div>
      )}
      {hasLinkedin && (
        <div title="링크드인">
          <LinkedinIcon className="h-3 w-3 text-blue-700 flex-shrink-0" />
        </div>
      )}
      {hasLink && !hasMatchCard && (
        <div title="링크 포함">
          <LinkIcon className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

/**
 * 사용자 아이콘 + 닉네임 렌더링
 *
 * @param post - 게시글 데이터
 * @param size - 아이콘 크기 (px)
 * @param containerClass - 컨테이너 CSS 클래스
 * @returns 사용자 정보 JSX
 */
export function renderAuthor(
  post: Post,
  size: number,
  containerClass: string = 'justify-start'
): React.ReactNode {
  return (
    <AuthorLink
      nickname={post.author_nickname || '익명'}
      publicId={post.author_public_id}
      oddsUserId={post.author_id}
      iconUrl={post.author_icon_url}
      level={post.author_level || 1}
      iconSize={size}
      className={containerClass}
    />
  );
}

/**
 * 게시판 로고 + 이름 렌더링
 *
 * - 팀/리그 게시판: API Sports 이미지 사용
 * - 일반 게시판: 사이트 기본 로고 사용
 *
 * @param post - 게시글 데이터
 * @returns 게시판 로고 JSX
 */
export function renderBoardLogo(post: Post): React.ReactNode {
  const boardLink = `/boards/${post.board_slug}`;

  if (post.team_id || post.league_id) {
    return (
      <Link href={boardLink} className="flex items-center hover:underline">
        <div className="relative w-5 h-5 mr-1">
          <UnifiedSportsImage
            imageId={post.team_id || post.league_id || 0}
            imageType={post.team_id ? ImageType.Teams : ImageType.Leagues}
            alt={post.board_name}
            width={20}
            height={20}
            className="object-contain w-5 h-5"
            loading="lazy"
            priority={false}
          />
        </div>
        <span
          className="text-xs text-gray-700 dark:text-gray-300 truncate"
          title={post.board_name}
          style={{ maxWidth: '85px' }}
        >
          {post.board_name}
        </span>
      </Link>
    );
  } else {
    return (
      <Link href={boardLink} className="flex items-center hover:underline">
        <div className="relative w-5 h-5 mr-1">
          <Image
            src={siteConfig.logo}
            alt={post.board_name}
            width={20}
            height={20}
            className="object-contain w-5 h-5 dark:invert"
            loading="lazy"
          />
        </div>
        <span
          className="text-xs text-gray-700 dark:text-gray-300 truncate"
          title={post.board_name}
          style={{ maxWidth: '85px' }}
        >
          {post.board_name}
        </span>
      </Link>
    );
  }
}
