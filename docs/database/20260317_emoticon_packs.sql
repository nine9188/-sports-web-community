-- 이모티콘 팩 테이블
-- shop_items와 연동: 팩 하나 = shop_items 하나 (구매 단위)
-- 팩 안의 개별 이모티콘들은 이 테이블에 저장

CREATE TABLE IF NOT EXISTS emoticon_packs (
  id SERIAL PRIMARY KEY,
  -- shop_items.id 와 연결 (NULL이면 무료 기본 팩)
  shop_item_id INTEGER REFERENCES shop_items(id) ON DELETE SET NULL,
  -- 팩 식별자 (기본 팩: 'basic', 'sports', 'star' / 유료 팩: 'animal', 'food' 등)
  pack_id TEXT NOT NULL,
  -- 팩 메타 정보
  pack_name TEXT NOT NULL,
  pack_thumbnail TEXT NOT NULL,
  -- 개별 이모티콘 정보
  code TEXT NOT NULL UNIQUE,        -- ~ani1, ~food3 등
  name TEXT NOT NULL,               -- 강아지, 피자 등
  url TEXT NOT NULL,                -- 이미지 URL
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_emoticon_packs_pack_id ON emoticon_packs(pack_id);
CREATE INDEX idx_emoticon_packs_shop_item_id ON emoticon_packs(shop_item_id);
CREATE INDEX idx_emoticon_packs_code ON emoticon_packs(code);

-- 기본 팩 데이터 삽입 (shop_item_id = NULL → 무료)
-- 기본 팩, 스포츠 팩, 인기 팩은 무료이므로 shop_item_id 없음
-- 유료 팩은 admin에서 shop_items 생성 후 shop_item_id 연결

COMMENT ON TABLE emoticon_packs IS '이모티콘 팩 - shop_items와 연동하여 구매 가능';
COMMENT ON COLUMN emoticon_packs.shop_item_id IS 'NULL이면 무료 팩, shop_items.id가 있으면 구매 필요';
COMMENT ON COLUMN emoticon_packs.pack_id IS '팩 그룹 식별자 (같은 pack_id = 같은 팩)';
