-- 공지사항 시스템 업데이트: 다중 게시판 선택 지원
-- Phase 1: 데이터베이스 스키마 수정

-- 1. posts 테이블에 notice_boards 컬럼 추가 (여러 게시판 ID 배열)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS notice_boards TEXT[] DEFAULT NULL;

-- 2. 배열 검색 최적화를 위한 GIN 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_notice_boards
ON posts USING GIN(notice_boards)
WHERE is_notice = true AND notice_type = 'board';

-- 3. 공지사항 게시판(slug='notices') 자동 공지 처리 트리거 함수
CREATE OR REPLACE FUNCTION auto_set_notice_for_notice_board()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  board_slug TEXT;
BEGIN
  -- 게시판의 slug 조회
  SELECT slug INTO board_slug
  FROM boards
  WHERE id = NEW.board_id;

  -- 공지사항 게시판(slug='notices')에 작성된 글은 자동으로 공지 처리
  IF board_slug = 'notices' THEN
    NEW.is_notice := true;
    NEW.notice_created_at := NOW();
    -- 기본값으로 전체 공지 설정 (사용자가 직접 변경 가능)
    IF NEW.notice_type IS NULL THEN
      NEW.notice_type := 'global';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. INSERT 시 자동 공지 처리 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_notice_for_notice_board ON posts;
CREATE TRIGGER trigger_auto_notice_for_notice_board
  BEFORE INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_notice_for_notice_board();

-- 5. 컬럼 코멘트 추가 (문서화)
COMMENT ON COLUMN posts.notice_boards IS '공지를 표시할 게시판 ID 배열 (notice_type=board일 때 사용, 다중 선택 가능)';

-- 6. 기존 데이터 마이그레이션
-- 기존 board 타입 공지사항의 경우, 해당 게시판 ID를 notice_boards 배열에 추가
UPDATE posts
SET notice_boards = ARRAY[board_id::TEXT]
WHERE is_notice = true
  AND notice_type = 'board'
  AND notice_boards IS NULL
  AND board_id IS NOT NULL;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '공지사항 시스템 업데이트 완료';
  RAISE NOTICE '- notice_boards 컬럼 추가됨';
  RAISE NOTICE '- GIN 인덱스 생성됨';
  RAISE NOTICE '- 공지사항 게시판 자동 공지 처리 트리거 생성됨';
  RAISE NOTICE '- 기존 데이터 마이그레이션 완료';
END $$;
