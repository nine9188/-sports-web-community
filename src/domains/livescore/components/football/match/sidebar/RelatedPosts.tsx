'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';
import { siteConfig } from '@/shared/config';
import { renderContentTypeIcons } from '@/domains/boards/components/post/postlist/components/shared/PostRenderers';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';

export default function RelatedPosts({
  posts
}: {
  posts: RelatedPost[];
}) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mb-4">
      <ContainerHeader>
        <ContainerTitle>관련 게시글</ContainerTitle>
      </ContainerHeader>

      {!posts || posts.length === 0 ? (
        <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
          관련 글이 없습니다.
        </div>
      ) : (
        <ul>
          {posts.map((post, index) => (
            <li key={post.id} className={index < posts.length - 1 ? "border-b border-black/5 dark:border-white/10" : ""}>
              <Link
                href={`/boards/${post.board_slug}/${post.post_number}`}
                className="block px-3 py-2 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0] overflow-hidden"
              >
                <div className="flex items-center text-xs gap-1">
                  {post.board_team_id || post.board_league_id ? (
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <UnifiedSportsImage
                        imageId={post.board_team_id || post.board_league_id || 0}
                        imageType={post.board_team_id ? ImageType.Teams : ImageType.Leagues}
                        alt={post.board_name}
                        width={20}
                        height={20}
                        className="object-contain w-5 h-5"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="relative w-5 h-5 flex-shrink-0">
                      <Image
                        src={siteConfig.logo}
                        alt={post.board_name}
                        width={20}
                        height={20}
                        className="object-contain w-5 h-5 dark:invert"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <span className="truncate">{post.title}</span>
                  {renderContentTypeIcons(post)}
                  {post.comment_count > 0 && (
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium flex-shrink-0 whitespace-nowrap">
                      [{post.comment_count}]
                    </span>
                  )}
                  <span className="text-gray-500 dark:text-gray-400 ml-1 shrink-0 flex items-center">
                    <Eye className="h-3 w-3 mr-0.5" />
                    {post.view_count}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
