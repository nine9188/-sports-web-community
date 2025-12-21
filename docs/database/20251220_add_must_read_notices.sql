-- 필독 공지사항 기능 추가
-- 작성일: 2025-12-20

-- posts 테이블에 is_must_read 컬럼 추가
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_must_read BOOLEAN DEFAULT false;

-- 기존 인덱스에 is_must_read 조건 추가를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_must_read_notice
ON posts(is_must_read, is_notice, notice_order, created_at DESC)
WHERE is_notice = true;

-- 코멘트 추가
COMMENT ON COLUMN posts.is_must_read IS '필독 공지 여부 (true일 경우 우선 표시)';
