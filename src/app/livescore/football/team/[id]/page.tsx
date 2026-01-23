import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TeamPageClient, { TeamTabType } from '@/domains/livescore/components/football/team/TeamPageClient';
import { fetchTeamFullData } from '@/domains/livescore/actions/teams/team';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { siteConfig } from '@/shared/config';

interface TeamPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// 팀 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const seoSettings = await getSeoSettings();

    const siteName = seoSettings?.site_name || siteConfig.name;

    // 팀 데이터 조회 (최소한의 옵션으로)
    const teamData = await fetchTeamFullData(id, {
      fetchMatches: false,
      fetchSquad: false,
      fetchPlayerStats: false,
      fetchStandings: false,
    });

    if (!teamData.success || !teamData.teamData?.team?.team) {
      return {
        title: '팀 정보를 찾을 수 없습니다',
        description: '요청하신 팀 정보가 존재하지 않습니다.',
      };
    }

    const team = teamData.teamData.team.team;

    const title = `${team.name} | 팀 정보 - ${siteName}`;
    const description = `${team.name}의 경기 일정, 순위, 선수단, 통계 정보를 확인하세요.${team.country ? ` ${team.country}` : ''}${team.founded ? ` (창단: ${team.founded}년)` : ''}`;
    const url = siteConfig.getCanonical(`/livescore/football/team/${id}`);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        images: [siteConfig.getDefaultOgImageObject(title)],
        siteName,
        locale: siteConfig.locale,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [siteConfig.defaultOgImage],
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[TeamPage generateMetadata] 오류:', error);
    return {
      title: `팀 정보 - ${siteConfig.name}`,
      description: '축구 팀 정보, 경기 일정, 선수단을 확인하세요.',
    };
  }
}

// 유효한 탭 목록
const VALID_TABS: TeamTabType[] = ['overview', 'fixtures', 'standings', 'squad', 'stats'];

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;

  try {
    // 유효한 탭인지 확인
    const initialTab = VALID_TABS.includes(tab as TeamTabType)
      ? (tab as TeamTabType)
      : 'overview';

    // 모든 탭 데이터를 서버에서 미리 로드 (빠른 탭 전환을 위해)
    const initialData = await fetchTeamFullData(id, {
      fetchMatches: true,      // overview, fixtures 탭용
      fetchSquad: true,        // squad 탭용
      fetchPlayerStats: true,  // squad, stats 탭용
      fetchStandings: true     // overview, standings 탭용
    });

    if (!initialData.success || !initialData.teamData?.team) {
      notFound();
    }

    // 클라이언트 컴포넌트에 데이터 전달
    return (
      <TeamPageClient
        teamId={id}
        initialTab={initialTab}
        initialData={initialData}
      />
    );
  } catch (error) {
    console.error('팀 페이지 로딩 오류:', error);
    notFound();
  }
} 
