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

      {/* SEO 테스트 도구 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">🔍 SEO/메타데이터 테스트 도구</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="https://developers.facebook.com/tools/debug/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div>
              <div className="font-medium text-sm text-gray-900">Facebook 디버거</div>
              <div className="text-xs text-gray-500">OG 이미지/카카오톡 미리보기</div>
            </div>
            <span className="text-blue-600 text-xs">→</span>
          </a>

          <a
            href="https://cards-dev.twitter.com/validator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div>
              <div className="font-medium text-sm text-gray-900">Twitter 카드 검증</div>
              <div className="text-xs text-gray-500">Twitter 공유 미리보기</div>
            </div>
            <span className="text-blue-600 text-xs">→</span>
          </a>

          <a
            href="https://www.opengraph.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div>
              <div className="font-medium text-sm text-gray-900">OpenGraph 종합</div>
              <div className="text-xs text-gray-500">모든 SNS 미리보기</div>
            </div>
            <span className="text-blue-600 text-xs">→</span>
          </a>

          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div>
              <div className="font-medium text-sm text-gray-900">Google 검색 테스트</div>
              <div className="text-xs text-gray-500">구조화 데이터 검증</div>
            </div>
            <span className="text-blue-600 text-xs">→</span>
          </a>
        </div>
        <p className="text-xs text-blue-700 mt-3">
          💡 배포 후 위 도구에서 사이트 URL을 입력하여 테스트하세요. 캐시 문제가 있으면 "다시 스크랩" 버튼을 클릭하세요.
        </p>
      </div>

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
