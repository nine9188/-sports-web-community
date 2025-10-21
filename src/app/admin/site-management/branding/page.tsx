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

      {/* 미리보기 (추후 구현) */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">미리보기</h3>
        <p className="text-sm text-gray-500">브랜딩 미리보기 기능은 곧 추가됩니다.</p>
      </div>
    </div>
  );
}
