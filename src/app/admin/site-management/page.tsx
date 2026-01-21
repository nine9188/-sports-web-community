import Link from 'next/link';
import {
  Settings,
  Search,
  Palette,
  BarChart3,
  ChevronRight
} from 'lucide-react';

export const metadata = {
  title: '사이트 관리 | 관리자',
  description: 'SEO, 브랜딩 통합 관리',
};

export default function SiteManagementDashboard() {
  const managementSections = [
    {
      title: 'SEO 설정',
      description: '사이트 전체 및 페이지별 메타데이터, OG 이미지, 키워드 관리',
      icon: Search,
      href: '/admin/site-management/seo-v2',
    },
    {
      title: '브랜딩 관리',
      description: '로고, 파비콘, OG 이미지 업로드',
      icon: Palette,
      href: '/admin/site-management/branding',
    },
    {
      title: 'UI 테마 설정',
      description: 'PC/모바일 테두리 스타일 등 전역 UI 설정',
      icon: Settings,
      href: '/admin/site-management/ui-theme',
    },
  ];

  const quickLinks = [
    { label: '사이트 바로가기', href: '/', icon: ChevronRight },
    { label: '통계 대시보드', href: '/admin', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#F0F0F0]">사이트 관리</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          SEO, 브랜딩을 한 곳에서 관리하세요
        </p>
      </div>

      {/* 빠른 링크 */}
      <div className="flex gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1D1D1D] border border-black/7 dark:border-white/10 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
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
            className="group relative bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6 hover:bg-[#F5F5F5] dark:hover:bg-[#262626] transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* 아이콘 */}
              <div className="p-3 rounded-lg bg-[#F5F5F5] dark:bg-[#262626]">
                <section.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>

              {/* 내용 */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0]">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </div>

              {/* 화살표 */}
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
          </Link>
        ))}
      </div>

      {/* 도움말 */}
      <div className="bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-[#F0F0F0] mb-2">사용 안내</h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• <strong>SEO 설정</strong>: 전역 SEO 설정 및 페이지별 메타데이터를 관리합니다 (제목, 설명, 키워드, OG 이미지)</li>
          <li>• <strong>브랜딩 관리</strong>: 로고, 파비콘 등 시각적 요소를 업로드하고 관리합니다</li>
        </ul>
      </div>

      {/* 최근 활동 (추후 구현 가능) */}
      <div className="bg-white dark:bg-[#1D1D1D] rounded-lg border border-black/7 dark:border-white/10 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#F0F0F0] mb-4">최근 활동</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">아직 활동 내역이 없습니다.</p>
      </div>
    </div>
  );
}
