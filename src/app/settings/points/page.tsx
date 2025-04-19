import { createClient } from '@/app/lib/supabase.server';
import { redirect } from 'next/navigation';
import { getUserPointHistory } from './actions';
import PointsForm from './components/PointsForm';
import PointHistory from './components/PointHistory';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PointsPage() {
  // Supabase 클라이언트 생성
  const supabase = await createClient();
  
  // 사용자 인증 정보 확인 (getUser 메서드 사용)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!user || error) {
    redirect('/auth/signin?callbackUrl=/settings/points');
  }
  
  const userId = user.id;
  
  // 사용자 포인트 정보 가져오기
  const { data: profileData } = await supabase
    .from('profiles')
    .select('points, level')
    .eq('id', userId)
    .single();
    
  const userPoints = profileData?.points || 0;
  const userLevel = profileData?.level || 1;
  
  // 사용자의 포인트 내역 가져오기 (최근 10개)
  const pointHistoryResult = await getUserPointHistory(userId, 10);
  const pointHistory = pointHistoryResult.success ? pointHistoryResult.data || [] : [];
  
  return (
    <div className="space-y-4">
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
        <h2 className="text-xl font-semibold mb-1">포인트 관리</h2>
        <p className="text-gray-500 text-sm mb-6">
          보유한 포인트와 사용 내역을 확인합니다.
        </p>
              {/* 포인트 정보 컴포넌트 */}
      <PointsForm 
        userId={userId}
        userPoints={userPoints}
        userLevel={userLevel}
      />
      </div>
      

      {/* 포인트 내역 컴포넌트 */}
      <PointHistory pointHistory={pointHistory} />
      
      {/* 디버깅 정보 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' && pointHistoryResult.error && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800">디버깅 정보</h3>
          <p className="text-sm mt-1 text-yellow-700">{pointHistoryResult.error}</p>
        </div>
      )}
    </div>
  );
} 