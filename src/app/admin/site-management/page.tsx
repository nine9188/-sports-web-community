import Link from 'next/link';
import {
  Settings,
  Search,
  FileText,
  Palette,
  BarChart3,
  ExternalLink
} from 'lucide-react';

export const metadata = {
  title: '사이트 관리 | 관리자',
  description: 'SEO, 브랜딩, 메타데이터 통합 관리',
};

export default function SiteManagementDashboard() {
  const managementSections = [
    {
      title: '일반 설정',
      description: '사이트명, 연락처, 공지사항 등 기본 설정',
      icon: Settings,
      href: '/admin/site-management/general',
      color: 'bg-blue-500',
    },
    {
      title: 'SEO 설정',
      description: '메타데이터, OG 이미지, 키워드 관리',
      icon: Search,
      href: '/admin/site-management/seo',
      color: 'bg-green-500',
    },
    {
      title: '페이지별 메타데이터',
      description: '개별 페이지 SEO 및 메타데이터 설정',
      icon: FileText,
      href: '/admin/site-management/pages',
      color: 'bg-purple-500',
    },
    {
      title: '브랜딩 관리',
      description: '로고, 파비콘, OG 이미지 업로드',
      icon: Palette,
      href: '/admin/site-management/branding',
      color: 'bg-pink-500',
    },
  ];

  const quickLinks = [
    { label: '사이트 바로가기', href: '/', icon: ExternalLink },
    { label: '통계 대시보드', href: '/admin', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">사이트 관리</h1>
        <p className="mt-2 text-gray-600">
          SEO, 브랜딩, 메타데이터를 한 곳에서 관리하세요
        </p>
      </div>

      {/* 빠른 링크 */}
      <div className="flex gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </div>

      {/* 관리 섹션 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {managementSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              {/* 아이콘 */}
              <div className={`${section.color} p-3 rounded-lg text-white`}>
                <section.icon className="w-6 h-6" />
              </div>

              {/* 내용 */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {section.description}
                </p>
              </div>

              {/* 화살표 */}
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* 도움말 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 사용 안내</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• <strong>일반 설정</strong>: 사이트 전반의 기본 정보를 관리합니다</li>
          <li>• <strong>SEO 설정</strong>: 검색 엔진 최적화를 위한 기본 메타데이터를 설정합니다</li>
          <li>• <strong>페이지별 메타데이터</strong>: 각 페이지마다 다른 SEO 설정을 적용할 수 있습니다</li>
          <li>• <strong>브랜딩 관리</strong>: 로고, 파비콘 등 시각적 요소를 업로드하고 관리합니다</li>
        </ul>
      </div>

      {/* 최근 활동 (추후 구현 가능) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h3>
        <p className="text-sm text-gray-500">아직 활동 내역이 없습니다.</p>
      </div>
    </div>
  );
}
