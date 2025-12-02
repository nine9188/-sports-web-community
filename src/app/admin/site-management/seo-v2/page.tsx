import { getSeoSettings } from '@/domains/seo/actions/seoSettings';
import SeoSettingsPage from './SeoSettingsPage';

export const metadata = {
  title: 'SEO 설정 | 사이트 관리',
};

export default async function Page() {
  const settings = await getSeoSettings();

  if (!settings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">SEO 설정을 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return <SeoSettingsPage initialSettings={settings} />;
}
