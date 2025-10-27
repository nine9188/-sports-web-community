-- 게시판 모음 위젯 설정 테이블 생성
CREATE TABLE IF NOT EXISTS public.board_collection_widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_board_collection_active ON public.board_collection_widget_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_board_collection_order ON public.board_collection_widget_settings(display_order);

-- RLS 활성화
ALTER TABLE public.board_collection_widget_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기 허용
CREATE POLICY "Allow public read access"
  ON public.board_collection_widget_settings
  FOR SELECT
  USING (true);

-- 관리자만 수정 가능 (admin 역할 확인)
CREATE POLICY "Allow admin insert"
  ON public.board_collection_widget_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin update"
  ON public.board_collection_widget_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admin delete"
  ON public.board_collection_widget_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_board_collection_widget_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_board_collection_widget_settings_updated_at
  BEFORE UPDATE ON public.board_collection_widget_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_board_collection_widget_settings_updated_at();

-- 코멘트 추가
COMMENT ON TABLE public.board_collection_widget_settings IS '게시판 모음 위젯에 표시할 게시판 설정';
COMMENT ON COLUMN public.board_collection_widget_settings.board_id IS '표시할 게시판 ID';
COMMENT ON COLUMN public.board_collection_widget_settings.display_order IS '표시 순서 (낮을수록 먼저 표시)';
COMMENT ON COLUMN public.board_collection_widget_settings.is_active IS '활성화 여부';
