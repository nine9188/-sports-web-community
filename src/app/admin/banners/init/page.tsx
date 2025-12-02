import React from 'react';

export default function BannerInitPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">배너 시스템 초기화</h1>
        <p className="text-gray-600">
          배너 테이블을 수동으로 생성하려면 Supabase 대시보드에서 다음 SQL을 실행하세요.
        </p>
      </div>
      
      <div className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto">
        <pre className="text-sm whitespace-pre-wrap">
{`-- 배너 정보를 저장하는 테이블 생성
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position TEXT NOT NULL CHECK (position IN (
    'header', 'main_top', 'main_bottom', 'content_top', 'content_bottom',
    'sidebar_top', 'sidebar_bottom', 'left_margin', 'right_margin', 
    'popup', 'post_list', 'widget_post_list'
  )),
  type TEXT NOT NULL CHECK (type IN ('image', 'html', 'vote', 'empty')),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  html_content TEXT,
  background_color TEXT DEFAULT '#ffffff',
  text_color TEXT DEFAULT '#000000',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  display_type TEXT DEFAULT 'slide' CHECK (display_type IN ('basic', 'slide')),
  sort_type TEXT DEFAULT 'created' CHECK (sort_type IN ('created', 'random')),
  desktop_per_row INTEGER DEFAULT 2,
  mobile_per_row INTEGER DEFAULT 1,
  auto_slide_interval INTEGER DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_banners_position ON public.banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order);

-- 타임스탬프 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 컬럼 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_banners_updated_at ON public.banners;
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS(Row Level Security) 정책 설정
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성화된 배너 조회 가능
CREATE POLICY IF NOT EXISTS "banners_select_active" ON public.banners
  FOR SELECT
  USING (is_active = true);

-- 관리자만 모든 작업 가능
CREATE POLICY IF NOT EXISTS "banners_admin_all" ON public.banners
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- 기본 배너 데이터 삽입
INSERT INTO public.banners (position, type, title, subtitle, image_url, link_url, background_color, display_order, display_type, desktop_per_row, mobile_per_row) VALUES
('main_top', 'image', '리버풀 프리미어리그 우승', '챔피언스의 영광스러운 순간', '/213/리버풀 프리미어리그 우승.png', '/livescore/football', '#fef2f2', 1, 'slide', 2, 1),
('main_top', 'image', '팀 순위 & 통계', '최신 리그 순위와 선수 통계', '/213/리버풀 프리미어리그 우승1.png', '/livescore/football', '#fef2f2', 2, 'slide', 2, 1),
('main_top', 'empty', '새로운 배너를 추가해보세요', '관리자 페이지에서 배너를 관리할 수 있습니다', null, null, '#f8fafc', 3, 'slide', 2, 1);`}
        </pre>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-medium mb-2">📌 주의사항</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• 위 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요</li>
          <li>• 테이블 생성 후 <strong>/admin/banners</strong> 페이지에서 배너를 관리할 수 있습니다</li>
          <li>• RLS 정책으로 인해 관리자만 배너를 수정할 수 있습니다</li>
          <li>• 일반 사용자는 활성화된 배너만 볼 수 있습니다</li>
        </ul>
      </div>
      
      <div className="mt-6">
        <a
          href="/admin/banners"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          배너 관리 페이지로 이동
        </a>
      </div>
    </div>
  );
} 