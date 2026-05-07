'use client';

import Link from 'next/link';
import { Container, ContainerHeader, ContainerTitle } from '@/shared/components/ui';
import type { RelatedPost } from '@/domains/livescore/actions/match/relatedPosts';

interface TeamInfo {
  id: number;
  name: string;
  boardSlug?: string | null;
}

export default function RelatedPosts({
  posts,
  boardSlug,
  teams,
  isLoading = false,
}: {
  posts: RelatedPost[];
  boardSlug?: string;
  teams?: { home?: TeamInfo; away?: TeamInfo };
  isLoading?: boolean;
}) {
  // 팀 그룹핑 모드 (매치 페이지)
  if (teams) {
    const isHome = (p: RelatedPost) =>
      p.board_team_id === teams.home?.id ||
      (!p.board_team_id && teams.home?.id && p.card_team_ids?.includes(teams.home.id));
    const isAway = (p: RelatedPost) =>
      p.board_team_id === teams.away?.id ||
      (!p.board_team_id && teams.away?.id && p.card_team_ids?.includes(teams.away.id));

    const homePosts = posts.filter(p => isHome(p));
    const awayPosts = posts.filter(p => !isHome(p) && isAway(p));
    const otherPosts = posts.filter(p => !isHome(p) && !isAway(p));

    return (
      <Container className="bg-white dark:bg-[#1D1D1D] mt-4">
        <ContainerHeader>
          <ContainerTitle>관련 게시글</ContainerTitle>
        </ContainerHeader>

        <div>
          <TeamSection
            team={teams.home}
            posts={homePosts}
            label="홈"
            isLoading={isLoading}
          />
          <TeamSection
            team={teams.away}
            posts={awayPosts}
            label="원정"
            isLoading={isLoading}
          />
          {otherPosts.length > 0 && (
            <PostList posts={otherPosts} />
          )}
        </div>
      </Container>
    );
  }

  // 단일 리스트 모드 (팀/선수 페이지)
  return (
    <Container className="bg-white dark:bg-[#1D1D1D] mt-4">
      <ContainerHeader className={boardSlug ? "justify-between" : ""}>
        <ContainerTitle>관련 게시글</ContainerTitle>
        {boardSlug && (
          <Link
            href={`/boards/${boardSlug}`}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            게시판 이동 →
          </Link>
        )}
      </ContainerHeader>

      {isLoading ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-[13px]">
          불러오는 중...
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-[13px]">
          관련 게시글 데이터가 없습니다.
        </div>
      ) : (
        <PostList posts={posts} />
      )}
    </Container>
  );
}

function TeamSection({
  team,
  posts,
  label,
  isLoading = false,
}: {
  team?: TeamInfo;
  posts: RelatedPost[];
  label: string;
  isLoading?: boolean;
}) {
  if (!team) return null;

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/10 bg-gray-50 dark:bg-[#262626]">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {label} · {team.name}
        </span>
        {team.boardSlug && (
          <Link
            href={`/boards/${team.boardSlug}`}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            게시판 이동 →
          </Link>
        )}
      </div>
      {isLoading ? (
        <div className="px-3 py-3 text-[13px] text-gray-400 dark:text-gray-500">
          불러오는 중...
        </div>
      ) : posts.length > 0 ? (
        <PostList posts={posts} />
      ) : (
        <div className="px-3 py-3 text-[13px] text-gray-400 dark:text-gray-500">
          관련 게시글 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}

function PostList({ posts }: { posts: RelatedPost[] }) {
  return (
    <ul>
      {posts.map((post, index) => (
        <li key={post.id} className={index < posts.length - 1 ? "border-b border-black/5 dark:border-white/10" : ""}>
          <Link
            href={`/boards/${post.board_slug}/${post.post_number}`}
            className="block px-3 py-3 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors text-gray-900 dark:text-[#F0F0F0]"
          >
            <span className="text-[13px] truncate block">{post.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
