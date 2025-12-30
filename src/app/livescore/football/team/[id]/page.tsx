import { Metadata } from 'next';
import { TabContent, TabNavigation, TeamHeader } from '@/domains/livescore/components/football/team';
import { fetchTeamFullData } from '@/domains/livescore/actions/teams/team';
import { ErrorState } from '@/domains/livescore/components/common/CommonComponents';
import { notFound } from 'next/navigation';
import { TeamDataProvider } from '@/domains/livescore/components/football/team/context/TeamDataContext';
import { Suspense } from 'react';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

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

    const siteUrl = seoSettings?.site_url || 'https://4590.co.kr';
    const siteName = seoSettings?.site_name || '4590 Football';

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
    const venue = teamData.teamData.team.venue;

    const title = `${team.name} | 팀 정보 - ${siteName}`;
    const description = `${team.name}의 경기 일정, 순위, 선수단, 통계 정보를 확인하세요.${team.country ? ` ${team.country}` : ''}${team.founded ? ` (창단: ${team.founded}년)` : ''}`;
    const url = `${siteUrl}/livescore/football/team/${id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        images: team.logo ? [
          {
            url: team.logo,
            width: 120,
            height: 120,
            alt: team.name,
          },
        ] : undefined,
        siteName,
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[TeamPage generateMetadata] 오류:', error);
    return {
      title: '팀 정보 - 4590 Football',
      description: '축구 팀 정보, 경기 일정, 선수단을 확인하세요.',
    };
  }
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  
  try {
    // 탭에 따라 필요한 데이터만 가져오기 위한 옵션 설정
    const options = {
      fetchMatches: tab === 'overview',
      fetchSquad: tab === 'squad',
      fetchPlayerStats: tab === 'squad',
      fetchStandings: tab === 'overview' || tab === 'standings'
    };

    // 필요한 모든 데이터를 한 번에 가져오기
    const teamFullData = await fetchTeamFullData(id, options);
    
    if (!teamFullData.success || !teamFullData.teamData?.team) {
      notFound();
    }
    
    // 컨텍스트에 제공할 초기 데이터
    const initialData = {
      teamData: teamFullData.teamData,
      matchesData: teamFullData.matches,
      squadData: teamFullData.squad,
      playerStats: teamFullData.playerStats,
      standingsData: teamFullData.standings
    };
    
    return (
      <div className="container mx-auto w-full">
        <TeamDataProvider initialTeamId={id} initialTab={tab} initialData={initialData}>
          <Suspense fallback={
            <div className="mb-4 bg-white rounded-lg border p-4">
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <span className="ml-3 text-gray-600">팀 정보를 불러오는 중...</span>
              </div>
            </div>
          }>
            <TeamHeader />
          </Suspense>
          <TabNavigation teamId={id} activeTab={tab} />
          <TabContent teamId={id} tab={tab} />
        </TeamDataProvider>
      </div>
    );
  } catch (error) {
    console.error('팀 페이지 로딩 오류:', error);
    return <ErrorState message="팀 정보를 불러오는데 실패했습니다. API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다." />;
  }
} 