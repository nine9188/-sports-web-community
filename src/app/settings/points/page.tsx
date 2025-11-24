import { redirect } from 'next/navigation';
import { checkUserAuth } from '@/domains/settings/actions/auth';
import { getUserPointInfo, getUserPointHistory } from '@/domains/settings/actions/points';
import { PointsForm, PointHistory } from '@/domains/settings/components/points';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PointsPage() {
  try {
    // 사용자 인증 확인 (서버 액션 사용)
    const user = await checkUserAuth('/auth/signin?callbackUrl=/settings/points');
    const userId = user.id;
    
    // 사용자 포인트 정보 가져오기
    const pointInfoResult = await getUserPointInfo(userId);
    const userPoints = pointInfoResult.success ? pointInfoResult.data?.points || 0 : 0;
    
    // 사용자의 포인트 내역 가져오기 (최근 10개)
    const pointHistoryResult = await getUserPointHistory(userId, 10);
    const pointHistory = pointHistoryResult.success ? pointHistoryResult.data || [] : [];
    
    return (
      <div className="space-y-4">
        <div className="mb-4 bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden p-4">
          <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-[#F0F0F0]">포인트 관리</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            보유한 포인트와 사용 내역을 확인합니다.
          </p>
          {/* 포인트 정보 컴포넌트 */}
          <PointsForm userPoints={userPoints} />
        </div>

        {/* 포인트 내역 컴포넌트 */}
        <PointHistory pointHistory={pointHistory} />

        {/* 디버깅 정보 (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === 'development' && pointHistoryResult.error && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">디버깅 정보</h3>
            <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-300">{pointHistoryResult.error}</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('포인트 페이지 로드 오류:', error);
    redirect('/auth/signin?callbackUrl=/settings/points');
  }
} 