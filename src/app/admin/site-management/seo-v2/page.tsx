import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import SeoSettingsPage from './SeoSettingsPage';

export const metadata = {
  title: 'SEO 설정 | 사이트 관리',
};

export default async function Page() {
  const settings = await getSeoSettings();

  // 게시판 목록 가져오기
  const supabase = await getSupabaseServer();
  const { data: boards } = await supabase
    .from('boards')
    .select('id, name, slug, parent_id')
    .order('display_order', { ascending: true });

  if (!settings) {
    return (
      <div className="p-6">
        <div className="bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-lg p-4">
          <p className="text-gray-900 dark:text-[#F0F0F0]">SEO 설정을 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return <SeoSettingsPage initialSettings={settings} boards={boards || []} />;
}
