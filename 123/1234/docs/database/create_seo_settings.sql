-- SEO 설정 통합 테이블 (간단하고 명확하게)
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 전역 기본 설정
  site_name TEXT NOT NULL DEFAULT '4590 Football',
  site_url TEXT NOT NULL DEFAULT 'https://sports-web-community.vercel.app',
  default_title TEXT NOT NULL DEFAULT '4590 Football',
  default_description TEXT DEFAULT '실시간 축구 경기 일정과 스코어, 팬들의 소통 공간',
  default_keywords TEXT[] DEFAULT ARRAY['축구', '커뮤니티', '라이브스코어'],

  -- Social Media
  og_image TEXT DEFAULT '/og-image.png',
  twitter_handle TEXT DEFAULT '@4590football',

  -- 페이지별 오버라이드 (JSONB)
  -- 형식: { "/path": { "title": "...", "description": "...", "keywords": [...] } }
  page_overrides JSONB DEFAULT '{}'::jsonb,

  -- 메타
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),

  -- 단일 레코드만 허용
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- 기본 레코드 삽입
INSERT INTO seo_settings (id, site_name, site_url, default_title, default_description)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '4590 Football',
  'https://sports-web-community.vercel.app',
  '4590 Football',
  '실시간 축구 경기 일정과 스코어, 팀·선수 정보를 확인하고, 사랑하는 축구 팀의 팬들과 함께 소통할 수 있는 커뮤니티 플랫폼입니다.'
)
ON CONFLICT (id) DO NOTHING;

-- RLS 활성화
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "Anyone can read SEO settings"
  ON seo_settings FOR SELECT
  USING (true);

-- 관리자만 수정 가능
CREATE POLICY "Admins can update SEO settings"
  ON seo_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_seo_settings_page_overrides ON seo_settings USING gin(page_overrides);
