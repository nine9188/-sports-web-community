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
    </div>
  );
}
