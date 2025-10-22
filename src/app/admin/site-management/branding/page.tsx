import { getSiteSettingsByType } from '@/domains/site-config/actions';
import BrandingSettingsForm from './BrandingSettingsForm';

export const metadata = {
  title: '브랜딩 관리 | 사이트 관리',
};

export default async function BrandingPage() {
  const settings = await getSiteSettingsByType('branding');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">브랜딩 관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          로고, 파비콘, 색상 등 브랜딩 요소를 관리합니다
        </p>
      </div>

      <BrandingSettingsForm initialSettings={settings} />

      {/* 브랜딩 가이드 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">🎨 브랜딩 가이드</h4>
        <ul className="space-y-1 text-sm text-purple-800">
          <li>• <strong>로고</strong>: SVG 또는 PNG 형식 권장 (투명 배경)</li>
          <li>• <strong>파비콘</strong>: 16x16, 32x32, 192x192 크기 준비</li>
          <li>• <strong>OG 이미지</strong>: 1200x630px (SNS 공유용)</li>
          <li>• <strong>Apple Touch Icon</strong>: 180x180px</li>
          <li>• <strong>테마 색상</strong>: HEX 코드 형식 (#1a73e8)</li>
        </ul>
      </div>

      {/* 파비콘 상태 확인 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">파비콘 상태</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <img src="/favicon.ico" alt="favicon" className="w-8 h-8" />
              <div>
                <p className="text-sm font-medium text-gray-900">favicon.ico</p>
                <p className="text-xs text-gray-500">/public/favicon.ico</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">✓ 적용됨</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <img src="/apple-icon.png" alt="apple-icon" className="w-8 h-8 rounded" />
              <div>
                <p className="text-sm font-medium text-gray-900">Apple Touch Icon</p>
                <p className="text-xs text-gray-500">/public/apple-icon.png</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">✓ 적용됨</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <img src="/icon-192.png" alt="icon-192" className="w-8 h-8 rounded" />
              <div>
                <p className="text-sm font-medium text-gray-900">Web App Icon (192x192)</p>
                <p className="text-xs text-gray-500">/public/icon-192.png</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">✓ 적용됨</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <img src="/icon-512.png" alt="icon-512" className="w-8 h-8 rounded" />
              <div>
                <p className="text-sm font-medium text-gray-900">Web App Icon (512x512)</p>
                <p className="text-xs text-gray-500">/public/icon-512.png</p>
              </div>
            </div>
            <span className="text-xs text-green-600 font-medium">✓ 적용됨</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Web App Manifest</p>
              <p className="text-xs text-gray-500">/public/site.webmanifest</p>
            </div>
            <a
              href="/site.webmanifest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              확인 →
            </a>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>💡 확인 방법:</strong> 브라우저 탭에서 파비콘이 표시되는지 확인하거나,
            <code className="mx-1 px-1 bg-blue-100 rounded">npx realfavicon check 3000</code>
            명령어로 검증할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 배포 환경 테스트 도구 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 배포 환경 테스트</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">파비콘 테스트</h4>
            <div className="space-y-2">
              <a
                href="https://realfavicongenerator.net/favicon_checker"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
              >
                🔍 RealFaviconGenerator Checker - 모든 플랫폼 파비콘 확인
              </a>
              <p className="text-xs text-gray-600 ml-4">
                • 배포 URL 입력하여 모든 기기/브라우저에서 파비콘 확인
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">OG 이미지 & 메타데이터 테스트</h4>
            <div className="space-y-2">
              <a
                href="https://www.opengraph.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors"
              >
                📱 OpenGraph.xyz - OG 이미지 미리보기
              </a>
              <a
                href="https://cards-dev.twitter.com/validator"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-200 transition-colors"
              >
                🐦 Twitter Card Validator - 트위터 카드 확인
              </a>
              <a
                href="https://developers.facebook.com/tools/debug/"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
              >
                📘 Facebook Debugger - 페이스북 공유 미리보기
              </a>
              <a
                href="https://www.linkedin.com/post-inspector/"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors"
              >
                💼 LinkedIn Post Inspector - 링크드인 공유 확인
              </a>
              <p className="text-xs text-gray-600 ml-4">
                • 배포 URL 입력하여 각 플랫폼에서 어떻게 보이는지 확인<br />
                • OG 이미지가 1200x630px인지, 제대로 로드되는지 확인
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h4>
            <ul className="space-y-1 text-xs text-yellow-800">
              <li>• <strong>캐시 문제:</strong> SNS는 OG 이미지를 캐싱하므로, 이미지 변경 시 위 도구에서 캐시를 강제로 갱신해야 합니다</li>
              <li>• <strong>절대 URL:</strong> OG 이미지는 반드시 절대 경로로 설정 (예: https://yourdomain.com/og-image.png)</li>
              <li>• <strong>HTTPS 필수:</strong> 대부분의 SNS는 HTTPS URL만 지원합니다</li>
              <li>• <strong>파일 크기:</strong> OG 이미지는 8MB 이하 권장 (일부 플랫폼 제한)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
