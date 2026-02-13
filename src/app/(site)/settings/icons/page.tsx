import { redirect } from 'next/navigation';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getIconSettingsData } from '@/domains/settings/actions/icons';
import { IconForm } from '@/domains/settings/components/icons';
import { getLevelIconUrl } from '@/shared/utils/level-icons-server';
import { Container, ContainerContent } from '@/shared/components/ui';
import { buildMetadata } from '@/shared/utils/metadataNew';

export async function generateMetadata() {
  return buildMetadata({
    title: '아이콘 설정',
    description: '프로필 아이콘을 변경하고 관리합니다.',
    path: '/settings/icons',
    noindex: true,
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 아이콘 설정 페이지
 *
 * 쿼리 최적화:
 * - 기존: auth + profiles(level) + user_items/shop_items + profiles(icon_id) + shop_items = 5쿼리
 * - 현재: auth + profiles(level, icon_id) + user_items/shop_items = 3쿼리
 */
export default async function IconSettingsPage() {
  const supabase = await getSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/settings/icons');
  }

  // level + icon_id를 한 번에 조회 (기존 2회 → 1회)
  const { data: profile } = await supabase
    .from('profiles')
    .select('level, icon_id')
    .eq('id', user.id)
    .single();

  const userLevel = profile?.level || 1;
  const iconId = profile?.icon_id || null;

  // 통합 함수로 보유 아이콘 + 현재 아이콘 한 번에 조회
  const { data: iconData } = await getIconSettingsData(user.id, iconId);
  const userIcons = iconData?.userIcons || [];
  const currentIcon = iconData?.currentIcon || null;

  const levelIconUrl = getLevelIconUrl(userLevel);
  const displayIconUrl = currentIcon?.image_url || levelIconUrl;
  const displayIconName = currentIcon?.name || `레벨 ${userLevel} 기본 아이콘`;

  return (
    <div className="space-y-4">
      <Container className="bg-white dark:bg-[#1D1D1D]">
        <ContainerContent>
          <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-[#F0F0F0]">아이콘 설정</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            프로필에 표시될 아이콘을 선택하고 관리합니다.
          </p>
        </ContainerContent>
      </Container>

      <IconForm
        userId={user.id}
        currentIconId={currentIcon?.id || null}
        userIcons={userIcons}
        levelIconUrl={levelIconUrl}
        userLevel={userLevel}
        displayIconUrl={displayIconUrl}
        displayIconName={displayIconName}
      />
    </div>
  );
}
