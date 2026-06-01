'use client';

import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import type { TeamDailyBriefingData } from '@/domains/livescore/actions/teams/dailyBriefing';

type TeamDailyBriefingProps = {
  data?: TeamDailyBriefingData | null;
};

const newsBoardSlugs = new Set(['foreign-news', 'domestic-news', 'official', 'premier', 'laliga', 'bundesliga', 'serie-a', 'ligue1']);

type BriefingLinkPost = {
  id: string;
  title: string;
  href: string;
  boardName?: string;
};

export default function TeamDailyBriefing({ data }: TeamDailyBriefingProps) {
  const linkedPosts = data?.relatedPosts ?? [];
  const extraNewsPosts = linkedPosts
    .filter(post => newsBoardSlugs.has(post.board_slug))
    .map(post => ({
      id: post.id,
      title: post.title,
      href: `/boards/${post.board_slug}/${post.post_number}`,
      boardName: post.board_name,
    }));
  const cardNewsPosts = (data?.newsPosts ?? []).map(post => ({
    id: post.id,
    title: post.title,
    href: post.href,
    boardName: post.boardName,
  }));
  const newsPosts = dedupeLinkPosts([...cardNewsPosts, ...extraNewsPosts]);
  const newsPostHrefs = new Set(newsPosts.map(post => post.href));
  const relatedPosts = [...linkedPosts]
    .sort((a, b) => {
      const aHref = `/boards/${a.board_slug}/${a.post_number}`;
      const bHref = `/boards/${b.board_slug}/${b.post_number}`;
      const aIsNews = newsBoardSlugs.has(a.board_slug);
      const bIsNews = newsBoardSlugs.has(b.board_slug);
      const aShownInNews = newsPostHrefs.has(aHref);
      const bShownInNews = newsPostHrefs.has(bHref);

      if (aIsNews !== bIsNews) return aIsNews ? 1 : -1;
      if (aShownInNews !== bShownInNews) return aShownInNews ? 1 : -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .map(post => ({
      id: post.id,
      title: post.title,
      href: `/boards/${post.board_slug}/${post.post_number}`,
      boardName: post.board_name,
    }));

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

function dedupeLinkPosts(posts: BriefingLinkPost[]) {
  const seen = new Set<string>();
  return posts.filter(post => {
    const key = post.href || post.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function PostLinkSection({
  title,
  posts,
}: {
  title: string;
  posts: BriefingLinkPost[];
}) {
  return (
    <Container className="bg-white dark:bg-[#1D1D1D]">
      <ContainerHeader>
        <ContainerTitle>{title}</ContainerTitle>
      </ContainerHeader>

      <ul>
        {posts.slice(0, 5).map((post, index) => (
          <li
            key={post.id}
            className={index < Math.min(posts.length, 5) - 1 ? 'border-b border-black/5 dark:border-white/10' : ''}
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
