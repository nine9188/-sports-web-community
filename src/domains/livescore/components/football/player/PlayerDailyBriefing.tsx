'use client';

import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';

type PlayerDailyBriefingProps = {
  posts?: RelatedPost[];
};

type BriefingPost = {
  id: string;
  title: string;
  href: string;
  boardName?: string;
  createdAt?: string;
};

const newsBoardSlugs = new Set([
  'foreign-news',
  'domestic-news',
  'official',
  'premier',
  'laliga',
  'bundesliga',
  'serie-a',
  'ligue1',
]);

export default function PlayerDailyBriefing({ posts = [] }: PlayerDailyBriefingProps) {
  const linkPosts = posts
    .map(post => ({
      id: post.id,
      title: post.title,
      href: `/boards/${post.board_slug}/${post.post_number}`,
      boardName: post.board_name,
      createdAt: post.created_at,
      isNews: newsBoardSlugs.has(post.board_slug),
    }))
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

  const newsPosts = dedupePosts(linkPosts.filter(post => post.isNews));
  const newsPostHrefs = new Set(newsPosts.map(post => post.href));
  const relatedPosts = dedupePosts(
    linkPosts.filter(post => !newsPostHrefs.has(post.href))
  );

  if (newsPosts.length === 0 && relatedPosts.length === 0) return null;

  return (
    <div className="space-y-3">
      {newsPosts.length > 0 && (
        <PostLinkSection title="뉴스 바로가기" posts={newsPosts} />
      )}

      {relatedPosts.length > 0 && (
        <PostLinkSection title="관련 게시글" posts={relatedPosts} />
      )}
    </div>
  );
}

function dedupePosts(posts: Array<BriefingPost & { isNews?: boolean }>): BriefingPost[] {
  const seen = new Set<string>();
  const result: BriefingPost[] = [];

  for (const post of posts) {
    const key = post.href || post.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: post.id,
      title: post.title,
      href: post.href,
      boardName: post.boardName,
      createdAt: post.createdAt,
    });
  }

  return result;
}

function PostLinkSection({
  title,
  posts,
}: {
  title: string;
  posts: BriefingPost[];
}) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>

      <ul>
        {posts.slice(0, 6).map((post, index) => (
          <li
            key={post.id}
            className={index < Math.min(posts.length, 6) - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}
          >
            <Link
              href={post.href}
              className="block px-3 py-3 text-gray-900 transition-colors hover:bg-[#EAEAEA] dark:text-[#F0F0F0] dark:hover:bg-[#333333]"
              prefetch={false}
            >
              <span className="block truncate text-[13px]">{post.title}</span>
              {post.boardName && (
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{post.boardName}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
