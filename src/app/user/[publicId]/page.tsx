import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/domains/user/actions';
import { PublicProfileCard } from '@/domains/user/components';
import UserActivityTabs from './UserActivityTabs';

interface PageProps {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { publicId } = await params;
  const result = await getPublicProfile(publicId);

  if (!result.success || !result.data) {
    return {
      title: '프로필을 찾을 수 없습니다',
    };
  }

  return {
    title: `${result.data.nickname}님의 프로필`,
    description: `${result.data.nickname}님의 프로필 페이지입니다. 레벨 ${result.data.level}, 작성글 ${result.data.post_count}개, 댓글 ${result.data.comment_count}개`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { publicId } = await params;
  const result = await getPublicProfile(publicId);

  if (!result.success || !result.data) {
    notFound();
  }

  const profile = result.data;

  return (
    <main>
      {/* 프로필 헤더 */}
      <div className="bg-white dark:bg-[#1D1D1D] md:rounded-t-lg md:border md:border-black/7 md:dark:border-0 md:border-b-0 overflow-hidden">
        <PublicProfileCard profile={profile} />
      </div>

      {/* 탭 + 리스트 + 페이지네이션 */}
      <UserActivityTabs publicId={publicId} />
    </main>
  );
}
