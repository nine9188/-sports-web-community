# 유튜브 크롤러 설정 가이드

이 문서는 유튜브 크롤러 기능을 설정하는 방법을 안내합니다.

## 1. Supabase 설정

유튜브 크롤러 기능을 사용하기 위해서는 먼저 Supabase에 필요한 테이블을 생성해야 합니다. 관리자 권한이 있는 계정으로 다음 API를 호출하여 필요한 테이블을 생성합니다:

```
GET /api/migration/youtube-channels
```

또는 Supabase 대시보드에서 다음 SQL을 실행하여 테이블을 생성할 수도 있습니다:

```sql
CREATE TABLE IF NOT EXISTS public.youtube_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  auto_publish BOOLEAN NOT NULL DEFAULT TRUE,
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id, board_id)
);

-- RLS 정책 설정 (관리자만 테이블 접근 가능)
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "youtube_channels_select_admin_only" 
  ON public.youtube_channels 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

CREATE POLICY "youtube_channels_insert_admin_only" 
  ON public.youtube_channels 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

CREATE POLICY "youtube_channels_update_admin_only" 
  ON public.youtube_channels 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

CREATE POLICY "youtube_channels_delete_admin_only" 
  ON public.youtube_channels 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.is_admin = true
  ));

-- 필요한 경우 posts 테이블에 소스 정보 컬럼 추가
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- 트리거 함수 생성 (updated_at 필드 자동 업데이트)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS youtube_channels_updated_at ON public.youtube_channels;
CREATE TRIGGER youtube_channels_updated_at
BEFORE UPDATE ON public.youtube_channels
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
```

## 2. YouTube Data API v3 키 발급

유튜브 API를 사용하기 위해서는 Google Cloud Console에서 API 키를 발급받아야 합니다.

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인합니다.
2. 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
3. 좌측 메뉴에서 'API 및 서비스' > 'API 라이브러리'를 선택합니다.
4. 검색창에 'YouTube Data API v3'를 검색합니다.
5. API를 선택하고 '사용 설정'을 클릭합니다.
6. '사용자 인증 정보 만들기' > 'API 키'를 클릭하여 API 키를 생성합니다.
7. (선택사항) API 키 제한 기능을 사용하여 YouTube Data API v3만 사용하도록 제한합니다.

## 3. 유튜브 채널 ID 찾기

유튜브 채널을 크롤링하기 위해서는 채널 ID가 필요합니다.

1. 크롤링하려는 유튜브 채널 페이지로 이동합니다.
2. 채널 홈페이지의 URL에서 마지막 부분이 '@사용자명'의 형태라면 추가 단계가 필요합니다.
3. 채널 소개 페이지로 이동한 다음 '공유' 버튼을 클릭합니다.
4. '채널 ID 복사'를 클릭하여 채널 ID를 복사합니다.

## 4. 관리자 페이지에서 설정

1. 관리자 페이지에서 '유튜브 크롤러' 메뉴로 이동합니다.
2. '채널 추가' 버튼을 클릭합니다.
3. 채널 ID, 채널명, API 키, 게시판을 선택합니다.
4. '자동 발행' 옵션을 사용하면 크롤링된 비디오가 자동으로 게시됩니다.
5. '추가' 버튼을 클릭하여 채널을 등록합니다.

## 5. 자동화된 크롤링 설정 (선택 사항)

정기적인 크롤링을 위해 다음과 같은 방법으로 자동화할 수 있습니다:

1. Cron 작업을 설정하여 주기적으로 크롤링 API를 호출합니다.
2. Vercel Cron Jobs 또는 GitHub Actions를 사용하여 자동화합니다.

## 주의사항

- API 키 하나당 하루 약 100회 정도의 크롤링이 가능합니다 (YouTube API 할당량 제한).
- 여러 구글 계정에서 다수의 API 키를 발급받아 사용하시면 더 많은 채널을 효과적으로 크롤링할 수 있습니다.
- 크롤링된 콘텐츠의 저작권에 주의하세요. 개인 사이트에서의 사용은 문제가 없으나 상업적 이용 시 법적 문제가 발생할 수 있습니다. 