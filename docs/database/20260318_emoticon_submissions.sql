-- 이모티콘 등록 신청 테이블
-- 유저가 이모티콘 팩을 신청하고 관리자가 검토하는 시스템

CREATE TABLE IF NOT EXISTS emoticon_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 팩 정보
  pack_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[],

  -- 이미지
  thumbnail_path TEXT NOT NULL,
  emoticon_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  emoticon_count INTEGER NOT NULL DEFAULT 0,

  -- 가격
  requested_price INTEGER DEFAULT 0,

  -- 상태: pending(검토중), approved(승인), rejected(거절), suspended(판매중지)
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  reject_reason TEXT,
  suspend_reason TEXT,

  -- 승인 후 연결
  approved_pack_id TEXT,
  approved_shop_item_id INTEGER,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_emoticon_submissions_user_id ON emoticon_submissions(user_id);
CREATE INDEX idx_emoticon_submissions_status ON emoticon_submissions(status);
CREATE INDEX idx_emoticon_submissions_created_at ON emoticon_submissions(created_at DESC);
