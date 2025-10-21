import { getSiteSettingsByType } from '@/domains/site-config/actions';
import GeneralSettingsForm from './GeneralSettingsForm';

export const metadata = {
  title: '일반 설정 | 사이트 관리',
};

export default async function GeneralSettingsPage() {
  const settings = await getSiteSettingsByType('general');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">일반 설정</h1>
        <p className="mt-1 text-sm text-gray-600">
          사이트의 기본 정보를 관리합니다
        </p>
      </div>

      <GeneralSettingsForm initialSettings={settings} />
    </div>
  );
}
