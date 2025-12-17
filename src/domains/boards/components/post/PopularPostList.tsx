'use client';

import React from 'react';
import Link from 'next/link';
import { ThumbsUp } from 'lucide-react';
import UserIcon from '@/shared/components/UserIcon';

interface Post {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  board_slug: string;
  post_number: number;
  created_at: string;
  formattedDate: string;
  views: number;
  likes: number;
  author_nickname: string;
  author_id?: string;
  author_icon_id?: number | null;
  author_icon_url?: string | null;
  author_level?: number;
  comment_count: number;
  content?: string;
  team_logo?: string | null;
  league_logo?: string | null;
}

interface PopularPostListProps {
  posts: Post[];
  loading?: boolean;
  emptyMessage?: string;
}

// 게시글 내용에서 첫 번째 이미지 추출
function extractFirstImage(content: string): string | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.content) {
      for (const node of parsed.content) {
        if (node.type === 'image' && node.attrs?.src) {
          return node.attrs.src;
        }
        // 중첩된 콘텐츠도 검색
        if (node.content) {
          for (const child of node.content) {
            if (child.type === 'image' && child.attrs?.src) {
              return child.attrs.src;
            }
          }
        }
      }
    }
  } catch {
    // JSON 파싱 실패 시 무시
  }
  return null;
}

export default function PopularPostList({
  posts,
  loading = false,
  emptyMessage = '게시글이 없습니다.'
}: PopularPostListProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden">
      {posts.map((post, index) => {
        const thumbnailUrl = extractFirstImage(post.content || '');
        const postUrl = `/boards/${post.board_slug}/${post.post_number}`;
        const isLast = index === posts.length - 1;

        return (
          <div
            key={post.id}
            className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2 bg-white dark:bg-[#1D1D1D] hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors ${
              !isLast ? 'border-b border-black/5 dark:border-white/10' : ''
            }`}
          >
            {/* 추천 수 - 데스크톱에서만 표시 */}
            <div className="hidden sm:flex flex-col items-center gap-1 min-w-[40px]">
              <span className="text-sm font-bold text-gray-900 dark:text-[#F0F0F0]">
                {post.likes}
              </span>
              <ThumbsUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>

            {/* 썸네일 이미지 - 반응형 크기 */}
            <Link href={postUrl} className="flex-shrink-0">
              <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden bg-[#F5F5F5] dark:bg-[#262626]">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/logo/4590 로고2 이미지크기 275X200 누끼제거 버전.png"
                    alt="사이트 로고"
                    className="w-full h-full object-contain p-2 dark:invert"
                  />
                )}
              </div>
            </Link>

            {/* 게시글 정보 */}
            <div className="flex-1 min-w-0">
              {/* 제목 + 댓글 수 */}
              <Link href={postUrl}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-[#F0F0F0] line-clamp-1 mb-2">
                  {post.title}
                  {post.comment_count > 0 && (
                    <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">
                      [{post.comment_count}]
                    </span>
                  )}
                </h3>
              </Link>

              {/* 메타 정보 - 모바일 3줄, 데스크톱 1줄 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
                {/* 줄 2 (모바일) / 그룹 1 (데스크톱): 카테고리 + 작성자 */}
                <div className="flex items-center gap-2">
                  <Link href={`/boards/${post.board_slug}`}>
                    <span className="px-2 py-0.5 rounded bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors">
                      {post.board_name}
                    </span>
                  </Link>

                  <div className="flex items-center gap-1">
                    <UserIcon
                      iconUrl={post.author_icon_url}
                      level={post.author_level || 1}
                      size={16}
                    />
                    <span>{post.author_nickname}</span>
                  </div>
                </div>

                {/* 데스크톱 구분선 */}
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>

                {/* 줄 3 (모바일) / 그룹 2 (데스크톱): 추천 + 조회 + 시간 */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 sm:hidden" />
                    <span className="sm:hidden">추천</span>
                    {post.likes}
                  </span>

                  <span className="text-gray-300 dark:text-gray-600">|</span>

                  <span>조회 {post.views}</span>

                  <span className="text-gray-300 dark:text-gray-600">|</span>

                  <span>{post.formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
