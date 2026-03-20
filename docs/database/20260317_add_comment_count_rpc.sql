-- 댓글 좋아요/싫어요 원자적 증감 RPC 함수
-- Race Condition 방지를 위해 read-modify-write 대신 atomic increment/decrement 사용

-- 댓글 카운트 증가 함수
CREATE OR REPLACE FUNCTION increment_comment_count(row_id UUID, column_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF column_name = 'likes' THEN
    UPDATE comments SET likes = COALESCE(likes, 0) + 1 WHERE id = row_id;
  ELSIF column_name = 'dislikes' THEN
    UPDATE comments SET dislikes = COALESCE(dislikes, 0) + 1 WHERE id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 카운트 감소 함수 (0 미만 방지)
CREATE OR REPLACE FUNCTION decrement_comment_count(row_id UUID, column_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF column_name = 'likes' THEN
    UPDATE comments SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE id = row_id;
  ELSIF column_name = 'dislikes' THEN
    UPDATE comments SET dislikes = GREATEST(COALESCE(dislikes, 0) - 1, 0) WHERE id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
