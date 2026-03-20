# 이모티콘 상점 시스템 구현 계획

## 목차

1. [개요](#1-개요)
2. [현재 상태 분석](#2-현재-상태-분석)
3. [전체 구조 설계](#3-전체-구조-설계)
4. [DB 스키마](#4-db-스키마)
5. [Phase 1: 이모티콘 피커 리팩토링 (메인 뷰)](#5-phase-1-이모티콘-피커-리팩토링)
6. [Phase 2: 상점 뷰](#6-phase-2-상점-뷰)
7. [Phase 3: 팩 상세/미리보기 페이지 (구매 페이지)](#7-phase-3-팩-상세미리보기-페이지)
8. [Phase 4: 설정 뷰 (팩 순서 관리)](#8-phase-4-설정-뷰)
9. [Phase 5: 상점 페이지 연동](#9-phase-5-상점-페이지-연동)
10. [서버 액션 명세](#10-서버-액션-명세)
11. [컴포넌트 명세](#11-컴포넌트-명세)
12. [레이아웃 규격](#12-레이아웃-규격)
13. [구현 순서 및 체크리스트](#13-구현-순서-및-체크리스트)

---

## 1. 개요

게시글 상세 페이지의 이모티콘 모달(바텀시트)에 **상점**, **팩 상세(미리보기/구매)**, **설정(팩 순서)** 기능을 추가한다.

### 핵심 요구사항

| 기능 | 설명 |
|------|------|
| **메인 (리스트)** | 기존 이모티콘 피커. 탭에 상점/설정 버튼 포함 |
| **상점** | 판매 중인 이모티콘 팩 목록. 검색 가능. 상점 페이지 이동 버튼 |
| **팩 상세** | 썸네일, 제작자, 설명, 팩 내 이모티콘 미리보기, 구매 버튼 |
| **설정** | 보유 팩 순서 드래그로 변경 (피커 탭 순서에 반영) |

### 제약 조건

- **트리거 사용 금지** — 모든 DB 작업은 RPC 함수 또는 직접 쿼리로 처리
- **레이아웃 고정** — 모달/바텀시트 크기가 콘텐츠에 따라 변하면 안 됨
- **기존 상점 시스템 재활용** — `purchase_item` RPC, `user_items` 테이블 활용

---

## 2. 현재 상태 분석

### 2-1. 이모티콘 시스템

| 항목 | 현재 상태 |
|------|-----------|
| 이모티콘 데이터 | `emoticons.ts` 상수 파일 (하드코딩) |
| DB 테이블 | `emoticon_packs` 생성 완료 (98개 데이터 삽입) |
| 피커 컴포넌트 | `EmoticonPicker.tsx` — picker/shop 2개 뷰 |
| 서버 액션 | `actions/emoticons.ts` — 팩 조회, 유저 보유 확인 |
| 렌더링 | `EMOTICON_REGEX` + `EMOTICON_MAP`으로 댓글 내 치환 |

### 2-2. 상점 시스템

| 항목 | 현재 상태 |
|------|-----------|
| 구매 RPC | `purchase_item(p_user_id, p_item_id)` — 포인트 차감 + user_items 삽입 |
| 카테고리 | `shop_categories` — 이모티콘 카테고리 추가됨 (id=25, slug=`emoticon-packs`) |
| 상점 페이지 | `/shop` — CategoryFilter + ItemGrid 구조 |
| 구매 모달 | `PurchaseModal.tsx` — Dialog bottomSheet variant |

### 2-3. DB 현황

```
emoticon_packs (생성 완료)
├── id SERIAL PK
├── shop_item_id INTEGER → shop_items(id)  -- NULL이면 무료
├── pack_id TEXT NOT NULL                   -- 팩 그룹 식별자
├── pack_name TEXT NOT NULL
├── pack_thumbnail TEXT NOT NULL
├── code TEXT NOT NULL UNIQUE               -- ~emo1, ~ani5 등
├── name TEXT NOT NULL
├── url TEXT NOT NULL
├── display_order INTEGER DEFAULT 0
├── is_active BOOLEAN DEFAULT true
└── created_at TIMESTAMPTZ

shop_items (기존)
├── id SERIAL PK
├── category_id → shop_categories(id)
├── name, description, image_url, price
├── tier (common/rare/epic/legendary/mythic)
├── is_consumable, consumable_type
└── is_active, is_default

user_items (기존)
├── id UUID PK
├── user_id UUID → auth.users(id)
├── item_id INTEGER → shop_items(id)
└── purchased_at TIMESTAMPTZ
```

### 2-4. 누락 항목

| 항목 | 상태 | 필요 조치 |
|------|------|-----------|
| `emoticon_packs`에 제작자/설명 컬럼 | 없음 | ALTER TABLE 추가 |
| 유저별 팩 순서 테이블 | 없음 | `user_emoticon_settings` 생성 |
| 상점용 이모티콘 팩 shop_items 데이터 | 없음 | 유료 팩 등록 시 admin에서 생성 |
| `emoticons.ts` → DB 전환 | 미완료 | Phase 1에서 처리 |

---

## 3. 전체 구조 설계

### 3-1. ViewMode 흐름도

```
EmoticonPicker (모달/바텀시트)
├── [picker]    메인 이모티콘 리스트 (기본)
│   ├── PackageTabs (팩 탭 + 상점/설정 버튼)
│   ├── EmoticonGrid (6x4 그리드)
│   └── Pagination 푸터
│
├── [shop]      이모티콘 상점
│   ├── ShopToolbar (돌아가기 + 포인트 + 검색)
│   ├── PackCardGrid (팩 카드 그리드, 스크롤)
│   └── ShopFooter (상점 페이지 이동 버튼)
│
├── [detail]    팩 상세/미리보기 (구매 페이지)
│   ├── DetailToolbar (돌아가기 + 팩 이름)
│   ├── PackDetailContent (썸네일 + 제작자 + 설명 + 이모티콘 목록)
│   └── DetailFooter (구매 버튼 또는 보유중 표시)
│
├── [purchase]  구매 확인
│   ├── PurchaseToolbar (돌아가기)
│   ├── PurchaseContent (팩 정보 + 포인트 계산)
│   └── PurchaseFooter (취소 + 구매하기)
│
└── [settings]  설정 (팩 순서)
    ├── SettingsToolbar (돌아가기 + 저장)
    ├── DraggablePackList (@dnd-kit 정렬)
    └── SettingsFooter (저장 버튼)
```

### 3-2. ViewMode 타입

```typescript
type ViewMode = 'picker' | 'shop' | 'detail' | 'purchase' | 'settings';
```

### 3-3. 뷰 전환 흐름

```
picker ──[상점 버튼]──→ shop
picker ──[설정 버튼]──→ settings

shop ──[팩 카드 클릭]──→ detail
shop ──[돌아가기]──→ picker

detail ──[구매하기]──→ purchase
detail ──[돌아가기]──→ shop

purchase ──[취소]──→ detail
purchase ──[구매 완료]──→ detail (보유중 상태로)

settings ──[돌아가기/저장]──→ picker (탭 순서 반영)
```

---

## 4. DB 스키마

### 4-1. emoticon_packs 컬럼 추가

```sql
-- 팩 메타데이터 확장 (제작자, 설명)
ALTER TABLE emoticon_packs
  ADD COLUMN IF NOT EXISTS pack_creator TEXT,
  ADD COLUMN IF NOT EXISTS pack_description TEXT;

COMMENT ON COLUMN emoticon_packs.pack_creator IS '이모티콘 팩 제작자 이름';
COMMENT ON COLUMN emoticon_packs.pack_description IS '이모티콘 팩 설명';
```

### 4-2. user_emoticon_settings 테이블 (신규)

```sql
-- 유저별 이모티콘 팩 순서 설정
CREATE TABLE IF NOT EXISTS user_emoticon_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 팩 순서: JSON 배열 ["basic", "sports", "star", "animal"]
  pack_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX idx_user_emoticon_settings_user_id ON user_emoticon_settings(user_id);

-- RLS
ALTER TABLE user_emoticon_settings ENABLE ROW LEVEL SECURITY;

-- 본인만 조회/수정 가능
CREATE POLICY "user_emoticon_settings_select_own"
  ON user_emoticon_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_emoticon_settings_insert_own"
  ON user_emoticon_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_emoticon_settings_update_own"
  ON user_emoticon_settings FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE user_emoticon_settings IS '유저별 이모티콘 팩 순서 설정';
COMMENT ON COLUMN user_emoticon_settings.pack_order IS '팩 순서 배열 (pack_id 문자열). 빈 배열이면 기본 순서';
```

### 4-3. 데이터 모델 관계

```
shop_categories (slug=emoticon-packs)
  └─ shop_items (이모티콘 팩 상품)
       └─ emoticon_packs (팩 내 개별 이모티콘들, shop_item_id로 연결)
            └─ user_items (유저가 구매한 shop_item → 팩 보유)

user_emoticon_settings (유저별 팩 순서)
  └─ pack_order: ["basic", "sports", "star", "animal", ...]
```

### 4-4. 트리거 미사용 원칙

모든 데이터 변경은 아래 방식으로 처리:

| 작업 | 방식 |
|------|------|
| 팩 구매 | 기존 `purchase_item` RPC 재활용 (shop_item_id로 구매) |
| 팩 순서 저장 | 서버 액션에서 직접 UPSERT |
| 팩 데이터 조회 | 서버 액션에서 직접 SELECT + JOIN |
| 보유 확인 | `user_items` 테이블 직접 조회 |

---

## 5. Phase 1: 이모티콘 피커 리팩토링

### 목표

- 기존 `emoticons.ts` 하드코딩 데이터를 DB 기반으로 전환
- PackageTabs가 DB에서 팩 목록을 동적으로 로드
- 유저별 팩 순서 반영

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `EmoticonPicker.tsx` | ViewMode 확장, DB 기반 팩/이모티콘 로드 |
| `actions/emoticons.ts` | 유저 팩 순서 조회 액션 추가 |
| `constants/emoticons.ts` | 유지 (EMOTICON_MAP, EMOTICON_REGEX는 댓글 렌더링에 필요) |

### 피커 데이터 로딩 흐름

```
1. EmoticonPicker 마운트
2. getPickerData() 서버 액션 호출
   → emoticon_packs에서 유저가 사용 가능한 팩 조회
     (무료 팩 + user_items에서 구매한 팩)
   → user_emoticon_settings에서 팩 순서 조회
   → 순서대로 정렬하여 반환
3. 첫 번째 팩 자동 선택
4. 해당 팩의 이모티콘 표시
```

### EMOTICON_MAP 동기화

댓글 렌더링을 위해 `EMOTICON_MAP`과 `EMOTICON_REGEX`는 유지해야 한다.
유료 팩 추가 시 이 상수들도 업데이트 필요 → **별도 이슈로 관리** (Phase 5 이후).
현재는 기본 3팩(basic, sports, star)만 렌더링 지원.

---

## 6. Phase 2: 상점 뷰

### 목표

- 판매 중인 이모티콘 팩 목록을 **스크롤 없이** 고정 영역 안에 표시
- 인기/신규/무료 탭 필터
- 상점 페이지(`/shop`) 이동 링크

### 핵심 원칙: 스크롤 불가

상점 뷰는 **절대 스크롤되지 않는다**. 모든 콘텐츠가 고정된 콘텐츠 영역 안에 딱 맞아야 한다.
→ 표시할 팩 수를 제한하고, 나머지는 상점 페이지로 유도한다.

### 가용 공간 계산 (데스크톱)

```
콘텐츠 영역 h-[462px]
─ py-4 패딩:              -32px
─ 필터 탭 바 h-9:          -36px
─ gap:                    -12px
─ 섹션 제목 h-6:           -24px
─ gap:                    -8px
= 팩 카드 영역:            350px
```

카드 높이 ≈ 115px (썸네일 64px + 이름 20px + 상태 16px + 패딩) → **3행** 가능
데스크톱 6열 × 3행 = **최대 18개** 표시 가능 (여유 있게 5열 × 3행 = 15개도 가능)

### 가용 공간 계산 (모바일 60vh)

```
60vh ≈ 480px (일반 모바일)
─ 핸들+헤더:               -56px
─ 툴바 h-11:              -44px
─ 푸터 h-[64px]:           -64px
= 콘텐츠 영역:             316px
─ py-3 패딩:              -24px
─ 필터 탭 h-9:            -36px
─ gap + 제목:             -32px
= 팩 카드 영역:            224px
```

카드 높이 ≈ 100px (모바일) → **2행** 가능
모바일 3열 × 2행 = **최대 6개** 표시

### 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│ ← 돌아가기                                보유 1,234 P     │ ← 툴바 h-11
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [인기]  [신규]  [무료]                                      │ ← 필터 탭 h-9
│                                                             │
│  추천 이모티콘 팩                                            │ ← 섹션 제목
│                                                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │     │  │     │  │     │  │     │  │     │  │     │   │  ← 1행
│  │[썸네일]│ │[썸네일]│ │[썸네일]│ │[썸네일]│ │[썸네일]│ │[썸네일]│   │
│  │     │  │     │  │     │  │     │  │     │  │     │   │
│  │기본  │  │스포츠│  │인기  │  │동물  │  │음식  │  │시즌  │   │
│  │무료  │  │무료  │  │무료  │  │500P │  │300P │  │200P │   │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘   │
│                                                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │     │  │     │  │     │  │     │  │     │  │     │   │  ← 2행
│  │[썸네일]│ │[썸네일]│ │[썸네일]│ │[썸네일]│ │[썸네일]│ │[썸네일]│   │
│  │     │  │     │  │     │  │     │  │     │  │     │   │
│  │직장  │  │학교  │  │커플  │  │     │  │     │  │     │   │
│  │400P │  │250P │  │350P │  │     │  │     │  │     │   │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘   │
│                                                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│  │     │  │     │  │     │  │     │  │     │  │     │   │  ← 3행
│  │     │  │     │  │     │  │     │  │     │  │     │   │
│  │     │  │     │  │     │  │     │  │     │  │     │   │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              [이모티콘 상점 바로가기 →]                       │ ← 푸터 h-[64px]
└─────────────────────────────────────────────────────────────┘
```

### 필터 탭

| 탭 | 조건 | 설명 |
|----|------|------|
| 인기 | 기본 정렬 | 구매 수 또는 display_order 기준 |
| 신규 | `created_at DESC` | 최근 등록순 |
| 무료 | `shop_item_id IS NULL` | 무료 팩만 |

```typescript
type ShopFilter = 'popular' | 'new' | 'free';
```

탭 UI: 작은 pill 버튼, 선택 시 `bg-[#262626] dark:bg-[#F0F0F0] text-white dark:text-[#1D1D1D]`

### 팩 카드 UI

```
┌────────────────┐
│                │
│   [썸네일 64px] │  ← 중앙 정렬, object-contain
│                │
│   팩이름        │  ← text-xs font-medium, truncate, 중앙
│   500 P        │  ← text-[10px] tabular-nums (유료)
│   무료 ✓       │  ← text-green-600 (무료)
│   보유중 ✓      │  ← text-blue-500 (구매 완료)
└────────────────┘
```

- 카드 전체가 클릭 가능 (→ detail 뷰)
- hover: `bg-[#F5F5F5] dark:bg-[#262626]`, `border-black/5`
- 빈 슬롯도 렌더링하여 그리드 레이아웃 유지 (피커와 동일 패턴)

### 팩 수 제한

| 디바이스 | 열 수 | 행 수 | 최대 표시 |
|---------|------|------|----------|
| 데스크톱 | 6 | 3 | 18개 |
| 모바일 | 3 | 2 | 6개 |

팩이 최대 수보다 적으면 빈 슬롯으로 채워서 레이아웃 고정.
팩이 최대 수보다 많으면 잘라서 표시, 나머지는 상점 페이지에서 확인.

```typescript
// 데스크톱
const SHOP_COLS_DESKTOP = 6;
const SHOP_ROWS_DESKTOP = 3;
const SHOP_MAX_DESKTOP = SHOP_COLS_DESKTOP * SHOP_ROWS_DESKTOP; // 18

// 모바일
const SHOP_COLS_MOBILE = 3;
const SHOP_ROWS_MOBILE = 2;
const SHOP_MAX_MOBILE = SHOP_COLS_MOBILE * SHOP_ROWS_MOBILE; // 6

const maxItems = isMobile ? SHOP_MAX_MOBILE : SHOP_MAX_DESKTOP;
const displayPacks = filteredPacks.slice(0, maxItems);
```

### 팩 카드 클릭 동작

모든 팩 (무료/유료/보유) 클릭 시 → **detail 뷰**로 이동
detail 뷰에서 상태에 따라 구매 버튼 또는 보유중 표시

### 상점 페이지 연동

푸터 "이모티콘 상점 바로가기" 버튼:

```typescript
<Link
  href="/shop?category=emoticon-packs"
  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 ..."
>
  이모티콘 상점 바로가기 →
</Link>
```

### overflow 처리

**중요**: 콘텐츠 영역에 `overflow-hidden` 적용하여 어떤 상황에서도 스크롤바가 나타나지 않도록 한다.

```typescript
// 데스크톱
className={`${DESKTOP_CONTENT_HEIGHT} overflow-hidden px-4 py-4`}

// 모바일
className="flex-1 min-h-0 overflow-hidden px-3 py-3"
```

---

## 7. Phase 3: 팩 상세/미리보기 페이지

### 목표

- 이모티콘 팩의 상세 정보 표시
- 팩 내 모든 이모티콘 미리보기
- 구매/보유 상태 표시

### 레이아웃 (참고: DC인사이드 디시콘 상세 스크린샷)

```
┌─────────────────────────────────────────────┐
│ ← 돌아가기              팩이름              │ ← 툴바 h-11
├─────────────────────────────────────────────┤
│                                             │
│ ┌──────────────────────────────────────┐    │
│ │ [대형 썸네일]    팩이름               │    │ ← 팩 헤더 카드
│ │                 제작자: OOO          │    │
│ │                 24개 이모티콘         │    │
│ │                 팩 설명 텍스트...     │    │
│ └──────────────────────────────────────┘    │
│                                             │
│  이모티콘 미리보기                           │ ← 섹션 제목
│ ┌────┬────┬────┬────┬────┬────┐            │
│ │ 😀 │ 😉 │ 😍 │ 😂 │ 😎 │ 😜 │            │ ← 6열 그리드
│ ├────┼────┼────┼────┼────┼────┤            │    (피커와 동일 레이아웃)
│ │ 😊 │ 🥳 │ 😭 │ 😢 │ 😡 │ 😱 │            │
│ ├────┼────┼────┼────┼────┼────┤            │
│ │ ... │ ... │ ... │ ... │ ... │ ... │       │ ← 스크롤
│ └────┴────┴────┴────┴────┴────┘            │
│                                             │
├─────────────────────────────────────────────┤
│  500 P          [구매하기]                   │ ← 푸터 h-[64px]
│                 [보유중 ✓]  (구매 완료 시)   │
│                 [무료 ✓]    (무료 팩일 때)   │
└─────────────────────────────────────────────┘
```

### 팩 헤더 카드 정보

| 항목 | 소스 | 설명 |
|------|------|------|
| 썸네일 | `pack_thumbnail` | 대형 48x48 또는 64x64 |
| 팩 이름 | `pack_name` | 볼드 텍스트 |
| 제작자 | `pack_creator` (신규 컬럼) | 없으면 숨김 |
| 설명 | `pack_description` (신규 컬럼) | 없으면 숨김 |
| 이모티콘 수 | `emoticon_count` | "24개 이모티콘" |
| 가격 | `price` | "500 P" 또는 "무료" |

### 이모티콘 미리보기 그리드

- 피커와 동일한 6열 그리드
- 이미지만 표시 (클릭 불가, 미리보기 전용)
- 스크롤로 모든 이모티콘 확인 가능

### 구매 버튼 동작

```
[구매하기] 클릭
  → purchase 뷰로 전환
  → 포인트 계산 표시
  → 확인 시 purchaseItem(shop_item_id) 호출
  → 성공 시 detail 뷰로 복귀 (보유중 상태)
```

---

## 8. Phase 4: 설정 뷰

### 목표

- 보유 중인 이모티콘 팩 순서를 드래그로 변경
- 변경된 순서를 DB에 저장
- 피커 탭 순서에 반영

### 레이아웃

```
┌─────────────────────────────────────────────┐
│ ← 돌아가기                                  │ ← 툴바 h-11
├─────────────────────────────────────────────┤
│                                             │
│  이모티콘 순서 설정                          │ ← 섹션 제목
│  드래그하여 순서를 변경하세요                 │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ≡  😀 기본          24개            │    │ ← 드래그 가능 아이템
│  ├─────────────────────────────────────┤    │
│  │ ≡  ⚽ 스포츠        24개            │    │
│  ├─────────────────────────────────────┤    │
│  │ ≡  👍 인기          26개            │    │
│  ├─────────────────────────────────────┤    │
│  │ ≡  🐶 동물          20개            │    │ ← 구매한 팩도 표시
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│            [순서 저장]                       │ ← 푸터 h-[64px]
└─────────────────────────────────────────────┘
```

### 드래그 앤 드롭

기존 프로젝트에 설치된 `@dnd-kit` 라이브러리 활용:

```typescript
// 이미 설치됨
"@dnd-kit/core": "^6.3.1",
"@dnd-kit/sortable": "^10.0.0",
"@dnd-kit/utilities": "^3.2.2"
```

기존 사용 패턴 (admin 위젯 보드 컬렉션):

```typescript
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/sortable';
```

### 드래그 아이템 컴포넌트

```typescript
function SortablePackItem({ pack }: { pack: EmoticonPackInfo }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: pack.pack_id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 ...">
      <button type="button" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
      </button>
      <Image src={pack.pack_thumbnail} ... />
      <span>{pack.pack_name}</span>
      <span className="text-xs text-gray-400">{pack.emoticon_count}개</span>
    </div>
  );
}
```

### 순서 저장 로직

```typescript
// 서버 액션
export async function saveEmoticonPackOrder(packOrder: string[]) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  // UPSERT: 있으면 업데이트, 없으면 삽입
  const { error } = await supabase
    .from('user_emoticon_settings')
    .upsert(
      { user_id: user.id, pack_order: packOrder, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) throw new Error('순서 저장 실패');
}
```

---

## 9. Phase 5: 상점 페이지 연동

### 목표

- `/shop` 페이지에서 이모티콘 카테고리 필터 시 이모티콘 팩 표시
- 이모티콘 상점 모달의 "상점에서 더 보기" 클릭 시 해당 카테고리로 이동

### 연동 방식

이모티콘 팩은 `shop_items`에 등록되므로 기존 상점 시스템과 자연스럽게 연동:

1. **shop_categories** → `emoticon-packs` (id=25) 카테고리 이미 존재
2. **shop_items** → 유료 팩 등록 시 `category_id = 25`로 생성
3. **상점 페이지** → CategoryFilter에서 이모티콘 카테고리 선택 시 팩 목록 표시

### 상점 페이지 이모티콘 아이템 카드 커스텀

이모티콘 팩은 일반 아이템과 다르게 표시해야 할 수 있음:
- 썸네일: 팩 대표 이모티콘 이미지
- 클릭 시: 팩 상세 모달 또는 별도 페이지

→ **Phase 5에서 상세 설계** (우선순위 낮음)

---

## 10. 서버 액션 명세

### 파일: `src/domains/boards/actions/emoticons.ts`

#### 기존 액션 (유지)

```typescript
// 모든 팩 목록 (상점용)
getEmoticonPacks(): Promise<EmoticonPackInfo[]>

// 특정 팩 이모티콘 조회
getEmoticonsByPackId(packId: string): Promise<EmoticonFromDB[]>

// 유저 보유 팩 shop_item_id 목록
getUserOwnedEmoticonPacks(): Promise<number[]>

// 상점 뷰 통합 데이터
getEmoticonShopData(): Promise<{ packs, ownedItemIds, userPoints, isLoggedIn, userId }>
```

#### 신규 액션

```typescript
// 피커용: 유저가 사용 가능한 팩 + 이모티콘 (순서 반영)
export async function getPickerData(): Promise<{
  packages: Array<{
    pack_id: string;
    pack_name: string;
    pack_thumbnail: string;
    emoticons: EmoticonFromDB[];
  }>;
}>

// 팩 상세 정보 (제작자, 설명 포함)
export async function getPackDetail(packId: string): Promise<{
  pack_id: string;
  pack_name: string;
  pack_thumbnail: string;
  pack_creator: string | null;
  pack_description: string | null;
  shop_item_id: number | null;
  price: number | null;
  emoticon_count: number;
  emoticons: EmoticonFromDB[];
  isOwned: boolean;
  isFree: boolean;
}>

// 유저 팩 순서 조회
export async function getUserPackOrder(): Promise<string[]>

// 유저 팩 순서 저장
export async function saveEmoticonPackOrder(packOrder: string[]): Promise<void>
```

### 구매는 기존 액션 재활용

```typescript
// src/domains/shop/actions/actions.ts
purchaseItem(itemId: number)  // shop_item_id 전달
```

---

## 11. 컴포넌트 명세

### 파일 구조

```
src/domains/boards/components/post/
├── EmoticonPicker.tsx          ← 메인 컨테이너 (ViewMode 관리)
├── emoticon/
│   ├── PickerView.tsx          ← 메인 이모티콘 리스트 뷰
│   ├── ShopView.tsx            ← 상점 뷰
│   ├── DetailView.tsx          ← 팩 상세/미리보기 뷰
│   ├── PurchaseView.tsx        ← 구매 확인 뷰
│   ├── SettingsView.tsx        ← 설정 (팩 순서) 뷰
│   ├── PackageTabs.tsx         ← 팩 탭 바
│   ├── EmoticonButton.tsx      ← 개별 이모티콘 버튼
│   └── SortablePackItem.tsx    ← 드래그 가능한 팩 아이템
```

### EmoticonPicker.tsx (메인 컨테이너)

**역할**: ViewMode에 따라 적절한 뷰를 렌더링. 레이아웃 프레임(헤더, 바텀시트, 팝업 컨테이너) 관리.

```typescript
interface EmoticonPickerProps {
  onSelect: (code: string) => void;
  onClose: () => void;
}

// 상태
type ViewMode = 'picker' | 'shop' | 'detail' | 'purchase' | 'settings';

const [viewMode, setViewMode] = useState<ViewMode>('picker');
const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
```

### 각 뷰 Props

```typescript
// 공통
interface ViewProps {
  isMobile: boolean;
}

// ShopView
interface ShopViewProps extends ViewProps {
  onBack: () => void;
  onPackClick: (packId: string) => void;  // → detail 뷰
}

// DetailView
interface DetailViewProps extends ViewProps {
  packId: string;
  onBack: () => void;
  onPurchase: (pack: EmoticonPackInfo) => void;  // → purchase 뷰
}

// PurchaseView
interface PurchaseViewProps extends ViewProps {
  pack: EmoticonPackInfo;
  onBack: () => void;
  onComplete: () => void;  // → detail 뷰 (보유중)
}

// SettingsView
interface SettingsViewProps extends ViewProps {
  onBack: () => void;
  onSave: () => void;  // → picker 뷰 (순서 반영)
}
```

---

## 12. 레이아웃 규격

### 절대 변하면 안 되는 고정값

| 요소 | 데스크톱 | 모바일 |
|------|---------|--------|
| **전체 컨테이너** | `w-[min(692px,calc(100vw-2rem))]`, 높이=자동(내부 고정) | `height: 60vh`, `rounded-t-2xl` |
| **헤더** | `px-4 py-2.5` | `pt-2 pb-1` + 핸들바 |
| **툴바** | `h-11` (44px) | `h-11` (44px) |
| **콘텐츠 영역** | `h-[462px] overflow-y-auto` | `flex-1 min-h-0 overflow-y-auto` |
| **푸터** | `h-[64px]` | `h-[64px]` + safe-area |

### 모든 뷰가 반드시 따라야 할 3단 구조

```
[툴바  h-11 ] ← bg-[#F5F5F5] dark:bg-[#262626], border-b
[콘텐츠     ] ← 데스크톱: h-[462px] overflow-y-auto / 모바일: flex-1
[푸터  h-64 ] ← border-t, flex items-center justify-center
```

### 데스크톱 콘텐츠 높이 계산 근거

```
피커 그리드 = 4행 × 100px + 3갭 × 10px + py-4(32px) = 462px
→ DESKTOP_CONTENT_HEIGHT = 'h-[462px]'
→ 상점/상세/구매/설정 모두 이 높이 사용
```

### 상점 뷰 규격 (스크롤 불가)

| 요소 | 데스크톱 | 모바일 |
|------|---------|--------|
| 콘텐츠 overflow | `overflow-hidden` | `overflow-hidden` |
| 그리드 열 수 | 6열 (`grid-cols-6`) | 3열 (`grid-cols-3`) |
| 그리드 행 수 | 3행 고정 | 2행 고정 |
| 최대 표시 팩 수 | 18개 | 6개 |
| 간격 | `gap-2` | `gap-1.5` |
| 카드 패딩 | `p-2` | `p-1.5` |
| 썸네일 크기 | `w-16 h-16` (64px) | `w-12 h-12` (48px) |
| 빈 슬롯 | 렌더링 (레이아웃 유지) | 렌더링 (레이아웃 유지) |
| 필터 탭 | `h-9`, pill 버튼 | `h-9`, pill 버튼 |

### 상세 뷰 이모티콘 미리보기 그리드

| 요소 | 데스크톱 | 모바일 |
|------|---------|--------|
| 그리드 열 수 | 6열 (`grid-cols-6`) | 6열 (`grid-cols-6`) |
| 간격 | `gap-2` | `gap-1.5` |
| 아이템 크기 | `w-[90px] h-[90px]` | `w-full aspect-square` |
| 이미지 크기 | 75% of container | 75% of container |

---

## 13. 구현 순서 및 체크리스트

### Phase 1: DB 확장 + 서버 액션

- [ ] `emoticon_packs`에 `pack_creator`, `pack_description` 컬럼 추가
- [ ] `user_emoticon_settings` 테이블 생성 + RLS
- [ ] `getPickerData()` 서버 액션 구현
- [ ] `getPackDetail()` 서버 액션 구현
- [ ] `getUserPackOrder()` 서버 액션 구현
- [ ] `saveEmoticonPackOrder()` 서버 액션 구현

### Phase 2: EmoticonPicker 리팩토링

- [ ] ViewMode를 5개로 확장 (`picker | shop | detail | purchase | settings`)
- [ ] 컴포넌트 파일 분리 (`emoticon/` 디렉토리)
- [ ] `selectedPackId` 상태 추가
- [ ] PackageTabs에 설정 버튼 복원 (현재 제거됨)

### Phase 3: 상점 뷰 (ShopView)

- [ ] 검색 input 추가 (h-10, 툴바 아래)
- [ ] 팩 카드 그리드 (5열/3열)
- [ ] 카드 클릭 → detail 뷰 전환
- [ ] 푸터에 "상점에서 더 보기" Link
- [ ] 로딩/에러 상태 (고정 높이 유지)

### Phase 4: 팩 상세 뷰 (DetailView)

- [ ] 팩 헤더 카드 (썸네일 + 이름 + 제작자 + 설명 + 이모티콘 수)
- [ ] 이모티콘 미리보기 6열 그리드 (클릭 불가)
- [ ] 푸터: 무료/보유중/구매하기 버튼
- [ ] 구매하기 클릭 → purchase 뷰 전환

### Phase 5: 구매 확인 뷰 (PurchaseView)

- [ ] 기존 구매 확인 UI 유지 (팩 정보 + 포인트 계산)
- [ ] `purchaseItem(shop_item_id)` 호출
- [ ] 성공 시 detail 뷰로 복귀

### Phase 6: 설정 뷰 (SettingsView)

- [ ] @dnd-kit SortableContext 구현
- [ ] SortablePackItem 컴포넌트
- [ ] 저장 버튼 → `saveEmoticonPackOrder()` 호출
- [ ] 저장 후 picker 뷰로 복귀 (탭 순서 반영)

### Phase 7: 상점 페이지 연동

- [ ] `/shop?category=emoticon-packs` 라우트 동작 확인
- [ ] 이모티콘 팩 아이템 표시 커스텀 (필요 시)
- [ ] 관리자 이모티콘 팩 등록 기능 (admin)

---

## 부록: 색상/스타일 참조

### 표준 색상 (프로젝트 공통)

```
배경 1: bg-white dark:bg-[#1D1D1D]
배경 2: bg-[#F5F5F5] dark:bg-[#262626]
배경 3: bg-[#EAEAEA] dark:bg-[#333333]
텍스트 1: text-gray-900 dark:text-[#F0F0F0]
텍스트 2: text-gray-500 dark:text-gray-400
보더: border-black/5 dark:border-white/10
호버: hover:bg-[#EAEAEA] dark:hover:bg-[#333333]
```

### 상태 색상

```
무료:   text-green-600 dark:text-green-400
보유중: text-blue-500 dark:text-blue-400
가격:   text-gray-700 dark:text-gray-300 (tabular-nums)
부족:   text-red-600 dark:text-red-400
```

### 버튼 스타일

```
주 버튼:  bg-[#262626] dark:bg-[#F0F0F0] text-white dark:text-[#1D1D1D]
보조 버튼: bg-[#F5F5F5] dark:bg-[#262626] text-gray-700 dark:text-gray-300
비활성:   disabled:opacity-50 disabled:cursor-not-allowed
```
