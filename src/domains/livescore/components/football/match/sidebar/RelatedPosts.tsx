'use client';

import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';

export default function RelatedPosts({
  posts
}: {
  posts: RelatedPost[];
}) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mt-4">
      <ContainerHeader>
        <ContainerTitle>관련 게시글</ContainerTitle>
      </ContainerHeader>

      {!posts || posts.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          관련 글이 없습니다.
        </div>
      ) : (
        <ul>
          {posts.map((post, index) => (
            <li key={post.id} className={index < posts.length - 1 ? "border-b border-black/5 dark:border-white/10" : ""}>
              <Link
                href={`/boards/${post.board_slug}/${post.post_number}`}
                className="block px-1.5 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
              >
                <span className="text-sm truncate block">{post.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
