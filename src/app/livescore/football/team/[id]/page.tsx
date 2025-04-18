import { headers } from 'next/headers';
import TeamClient from './TeamClient';

// 동적 렌더링 강제 설정 추가
export const dynamic = 'force-dynamic';

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // 동적으로 호스트와 프로토콜 가져오기
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // 팀 기본 정보만 SSR로 가져오기
    const teamRes = await fetch(`${baseUrl}/api/livescore/football/teams/${id}`, { cache: 'no-store' });

    // 응답 확인
    if (!teamRes.ok) {
      throw new Error('팀 정보를 불러오는데 실패했습니다.');
    }

    // 데이터 파싱
    const teamData = await teamRes.json();

    // 클라이언트 컴포넌트에 기본 데이터 전달
    return (
      <TeamClient 
        teamId={id}
        team={teamData}
        stats={teamData.stats}
      />
    );
  } catch (error) {
    console.error('Team page error:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">오류 발생</h2>
          <p className="text-gray-700 mb-4">팀 정보를 불러오는데 실패했습니다.</p>
          <p className="text-gray-600">API 서버에 연결할 수 없거나 요청한 데이터가 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }
} 