import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicProfile, getUserCommentedPosts, getUserPosts } from '@/domains/user/actions';
import { PublicProfileCard } from '@/domains/user/components';
import UserActivityTabs from './UserActivityTabs';
import { buildMetadata } from '@/shared/utils/metadataNew';

const ITEMS_PER_PAGE = 20;

type ActivityTab = 'posts' | 'comments';
type UserPageSearchParams = {
  tab?: string | string[];
  page?: string | string[];
};

interface PageProps {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<UserPageSearchParams>;
}

function readQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseActivityTab(value: string | string[] | undefined): ActivityTab {
  return readQueryValue(value) === 'comments' ? 'comments' : 'posts';
}

function parsePage(value: string | string[] | undefined): number {
  const parsed = parseInt(readQueryValue(value) || '1', 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { publicId } = await params;
  const result = await getPublicProfile(publicId);

  if (!result.success || !result.data) {
    return buildMetadata({
      title: '프로필을 찾을 수 없습니다',
      description: '요청하신 사용자의 프로필을 찾을 수 없습니다.',
      path: `/user/${publicId}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: `${result.data.nickname}님의 프로필`,
    description: `${result.data.nickname}님의 프로필 페이지입니다. 레벨 ${result.data.level}, 작성글 ${result.data.post_count}개, 댓글 ${result.data.comment_count}개`,
    path: `/user/${publicId}`,
    noindex: true,
  });
}

export default async function UserProfilePage({ params, searchParams }: PageProps) {
  const [{ publicId }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as UserPageSearchParams),
  ]);
  const activeTab = parseActivityTab(query.tab);
  const currentPage = parsePage(query.page);
  const result = await getPublicProfile(publicId);

  if (!result.success || !result.data) {
    notFound();
  }

  const profile = result.data;
  const activityResult = activeTab === 'comments'
    ? await getUserCommentedPosts(publicId, { page: currentPage, limit: ITEMS_PER_PAGE })
    : await getUserPosts(publicId, { page: currentPage, limit: ITEMS_PER_PAGE });
  const activityPosts = activityResult.success ? activityResult.data ?? [] : [];
  const activityTotalCount = activityResult.success ? activityResult.totalCount ?? 0 : 0;

  return (
    <main>
      {/* 프로필 헤더 */}
      <div className="bg-white dark:bg-[#1D1D1D] md:rounded-t-lg md:border md:border-black/7 md:dark:border-0 md:border-b-0 overflow-hidden">
        <PublicProfileCard profile={profile} />
      </div>

      {/* 탭 + 리스트 + 페이지네이션 */}
      <UserActivityTabs
        publicId={publicId}
        activeTab={activeTab}
        currentPage={currentPage}
        posts={activityPosts}
        totalCount={activityTotalCount}
        initialPostCount={profile.post_count}
        initialCommentCount={profile.comment_count}
      />
    </main>
  );
}
