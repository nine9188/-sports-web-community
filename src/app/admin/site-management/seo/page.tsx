import { getSiteSettingsByType } from '@/domains/site-config/actions';
import SEOSettingsForm from './SEOSettingsForm';

export const metadata = {
  title: 'SEO 설정 | 사이트 관리',
};

export default async function SEOSettingsPage() {
  const settings = await getSiteSettingsByType('seo');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SEO 설정</h1>
        <p className="mt-1 text-sm text-gray-600">
          검색 엔진 최적화를 위한 메타데이터를 설정합니다
        </p>
      </div>

      <SEOSettingsForm initialSettings={settings} />

      {/* SEO 도움말 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">📌 SEO 최적화 팁</h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• <strong>제목</strong>: 50-60자 이내로 작성하세요</li>
          <li>• <strong>설명</strong>: 150-160자 이내, 핵심 키워드를 포함하세요</li>
          <li>• <strong>키워드</strong>: 관련성 높은 5-10개의 키워드를 선정하세요</li>
          <li>• <strong>OG 이미지</strong>: 1200x630px 크기를 권장합니다</li>
        </ul>
      </div>
    </div>
  );
}
