-- 공지사항 시스템 구축
-- Phase 1: 데이터베이스 스키마 추가

-- 1. posts 테이블에 공지사항 관련 컬럼 추가
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_notice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notice_type TEXT CHECK (notice_type IN ('global', 'board')),
ADD COLUMN IF NOT EXISTS notice_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notice_created_at TIMESTAMP WITH TIME ZONE;

-- 2. 공지사항 조회 성능을 위한 인덱스 추가
-- 공지사항 전체 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_notice
ON posts(is_notice, notice_type, notice_order DESC, created_at DESC)
WHERE is_notice = true;

-- 게시판별 공지사항 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_board_notice
ON posts(board_id, is_notice, notice_order DESC, created_at DESC)
WHERE is_notice = true;

-- 3. 공지사항 전용 게시판 생성
INSERT INTO boards (name, slug, description, type, is_active, display_order)
VALUES (
  '공지사항',
  'notices',
  '전체 공지사항과 게시판별 공지를 확인할 수 있습니다',
  'notice',
  true,
  0
)
ON CONFLICT (slug) DO NOTHING;

-- 4. 공지사항 설정 시 자동으로 notice_created_at 업데이트하는 트리거 함수
CREATE OR REPLACE FUNCTION update_notice_created_at()
RETURNS TRIGGER AS $$
BEGIN
  -- 공지로 설정될 때만 notice_created_at 설정
  IF NEW.is_notice = true AND OLD.is_notice = false THEN
    NEW.notice_created_at = NOW();
  -- 공지 해제 시 notice_created_at 초기화
  ELSIF NEW.is_notice = false AND OLD.is_notice = true THEN
    NEW.notice_created_at = NULL;
    NEW.notice_type = NULL;
    NEW.notice_order = 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_notice_created_at ON posts;
CREATE TRIGGER trigger_update_notice_created_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  WHEN (OLD.is_notice IS DISTINCT FROM NEW.is_notice)
  EXECUTE FUNCTION update_notice_created_at();

-- 6. 공지사항 관련 코멘트 추가 (문서화)
COMMENT ON COLUMN posts.is_notice IS '공지사항 여부';
COMMENT ON COLUMN posts.notice_type IS '공지 타입: global(전체공지), board(게시판공지)';
COMMENT ON COLUMN posts.notice_order IS '공지 노출 순서 (낮은 숫자가 먼저 노출, 0이 기본값)';
COMMENT ON COLUMN posts.notice_created_at IS '공지로 설정된 시각';
