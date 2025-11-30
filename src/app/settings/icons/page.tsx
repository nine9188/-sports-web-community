import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getUserIcons, getCurrentUserIcon } from '@/domains/settings/actions/icons';
import { IconForm } from '@/domains/settings/components/icons';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '아이콘 설정 - 설정',
  description: '프로필 아이콘을 변경하고 관리합니다.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 로딩 컴포넌트
function IconSettingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-1/3 bg-[#F5F5F5] dark:bg-[#262626] rounded mb-3"></div>
      <div className="h-40 bg-[#F5F5F5] dark:bg-[#262626] rounded mb-4"></div>
    </div>
  );
}

/**
 * 아이콘 설정 페이지
 */
export default async function IconSettingsPage() {
  // Supabase 클라이언트 생성
  const supabase = await getSupabaseServer();
  
  // 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  
  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!user) {
    redirect('/auth/login?redirect=/settings/icons');
  }
  
  // 사용자 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', user.id)
    .single();
  
  // 사용자 레벨 정보
  const userLevel = profile?.level || 1;
  
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-0 overflow-hidden p-4">
        <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-[#F0F0F0]">아이콘 설정</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          프로필에 표시될 아이콘을 선택하고 관리합니다.
        </p>
      </div>

      <Suspense fallback={<IconSettingsLoading />}>
        <IconSettingsContent userId={user.id} userLevel={userLevel} />
      </Suspense>
    </div>
  );
}

// 콘텐츠 컴포넌트 (서스펜스 대응)
async function IconSettingsContent({ userId, userLevel }: { userId: string; userLevel: number }) {
  // 사용자 아이콘 목록 조회
  const { data: userIcons = [] } = await getUserIcons(userId);
  
  // 현재 사용 중인 아이콘 조회
  const { data: currentIcon } = await getCurrentUserIcon(userId);
  
  // 현재 아이콘 ID
  const currentIconId = currentIcon?.id || null;
  
  // 레벨 아이콘 URL (서버 컴포넌트용 함수 사용)
  const levelIconUrl = getLevelIconUrl(userLevel);
  
  // 표시할 아이콘 URL 및 이름
  const displayIconUrl = currentIcon?.image_url || levelIconUrl;
  const displayIconName = currentIcon?.name || `레벨 ${userLevel} 기본 아이콘`;
  
  return (
    <IconForm
      userId={userId}
      currentIconId={currentIconId}
      userIcons={userIcons}
      levelIconUrl={levelIconUrl}
      userLevel={userLevel}
      displayIconUrl={displayIconUrl}
      displayIconName={displayIconName}
    />
  );
} 