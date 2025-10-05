import { Metadata } from 'next';
import { 
  checkUserAuth
} from '@/domains/settings/actions/auth';
import { 
  getUserExpHistory, 
  getUserExpLevel 
} from '@/domains/settings/actions/exp';
import ExpForm from '@/domains/settings/components/exp/ExpForm';
import ExpHistory from '@/domains/settings/components/exp/ExpHistory';
import LevelList from '@/domains/settings/components/exp/LevelList';

export const metadata: Metadata = {
  title: '경험치 및 레벨 - 설정',
  description: '경험치 획득 내역 및 레벨 정보를 확인합니다.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ExpPage() {
  // 사용자 인증 확인 (자동 리다이렉트)
  const user = await checkUserAuth('/auth/signin');
  const userId = user.id;
  
  // 사용자의 경험치 및 레벨 정보 가져오기
  const expLevelResult = await getUserExpLevel(userId);
  const userExp = expLevelResult.success ? expLevelResult.data?.exp || 0 : 0;
  const userLevel = expLevelResult.success ? expLevelResult.data?.level || 1 : 1;
  
  // 사용자의 경험치 내역 가져오기 (최근 10개)
  const expHistoryResult = await getUserExpHistory(userId, 10);
  const expHistory = expHistoryResult.success ? expHistoryResult.data || [] : [];
  
  return (
    <div className="space-y-4">
      <div className="mb-4 bg-white rounded-lg border overflow-hidden p-4">
        <h2 className="text-xl font-semibold mb-1">경험치 및 레벨</h2>
        <p className="text-gray-500 text-sm mb-4">
          현재 레벨과 경험치 획득 내역을 확인합니다.
        </p>
        {/* 경험치 정보 컴포넌트 */}
        <ExpForm 
          userId={userId}
          userExp={userExp}
          userLevel={userLevel}
        />
      </div>
    
      {/* 레벨 목록 컴포넌트 */}
      <LevelList currentLevel={userLevel} />
      
      {/* 경험치 내역 컴포넌트 */}
      <ExpHistory 
        expHistory={expHistory}
        isLoading={false}
        error={expHistoryResult.error || null}
      />
      
      {/* 디버깅 정보 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' && expHistoryResult.error && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800">디버깅 정보</h3>
          <p className="text-sm mt-1 text-yellow-700">{expHistoryResult.error}</p>
        </div>
      )}
    </div>
  );
} 