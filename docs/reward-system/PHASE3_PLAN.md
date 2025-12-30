# Phase 3 구현 계획

> **상태**: ✅ 구현 완료
> **완료일**: 2025-12-30

## 목차
1. [경험치 밸런스 조정](#1-경험치-밸런스-조정)
2. [아이템 가격 차등화](#2-아이템-가격-차등화)
3. [추가 보상 활동 구현](#3-추가-보상-활동-구현)

---

## 1. 경험치 밸런스 조정

### 현재 문제점

현재 레벨업 시스템의 밸런스 문제:

| 레벨 구간 | 필요 XP | 소요 일수 (260 XP/일 기준) |
|----------|---------|--------------------------|
| 1 → 10 | 9,000 | ~35일 |
| 10 → 20 | 78,000 | ~300일 (약 10개월) |
| 20 → 30 | 480,000 | ~1,846일 (약 5년) |
| 30 → 40 | 960,000 | ~3,692일 (약 10년) |

**결론**: 고레벨 달성이 사실상 불가능

### 조정 방안 비교

#### 방안 A: 보상량 증가 (권장)

| 활동 | 현재 | 조정 후 | 변화율 |
|------|------|---------|--------|
| 게시글 작성 | 25 XP / 5 P | 50 XP / 10 P | +100% |
| 댓글 작성 | 5 XP / 1 P | 15 XP / 3 P | +200% |
| 추천 받기 | 5 XP / 1 P | 10 XP / 2 P | +100% |
| 일일 로그인 | 30 XP / 5 P | 50 XP / 10 P | +67% |

**일일 최대**: 260 XP → 575 XP (+121%)

#### 방안 B: 레벨 요구치 감소

- 전체 경험치 요구량 50% 감소
- 기존 사용자 경험치는 유지 (상대적 이득)

#### 방안 C: 혼합 (보상 50% 증가 + 요구치 30% 감소)

**권장**: 방안 A (보상량 증가)
- 기존 데이터 수정 불필요
- 사용자 체감 만족도 높음
- 구현 복잡도 낮음

### 구현 상세

#### Step 1: 보상 상수 수정

**파일**: `src/shared/constants/rewards.ts`

```typescript
// 현재
export const ACTIVITY_REWARDS: Record<string, ActivityReward> = {
  WRITE_POST: { exp: 25, points: 5 },
  WRITE_COMMENT: { exp: 5, points: 1 },
  RECEIVED_LIKE: { exp: 5, points: 1 },
  DAILY_LOGIN: { exp: 30, points: 5 },
};

// 조정 후
export const ACTIVITY_REWARDS: Record<string, ActivityReward> = {
  WRITE_POST: { exp: 50, points: 10 },
  WRITE_COMMENT: { exp: 15, points: 3 },
  RECEIVED_LIKE: { exp: 10, points: 2 },
  DAILY_LOGIN: { exp: 50, points: 10 },
};
```

#### Step 2: 일일 제한 조정 (선택)

```typescript
// 현재
export const DAILY_LIMITS: Record<string, number> = {
  WRITE_POST: 5,
  WRITE_COMMENT: 5,
  RECEIVED_LIKE: 10,
  DAILY_LOGIN: 1,
};

// 조정 후 (선택적)
export const DAILY_LIMITS: Record<string, number> = {
  WRITE_POST: 10,      // 5 → 10
  WRITE_COMMENT: 10,   // 5 → 10
  RECEIVED_LIKE: 20,   // 10 → 20
  DAILY_LOGIN: 1,
};
```

#### Step 3: UI 업데이트

- `RewardGuide.tsx`: 새로운 보상값 표시
- `ExpForm.tsx`, `PointsForm.tsx`: 일일 최대 획득량 업데이트

### 영향 분석

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 일일 최대 XP | 260 | 575 |
| 일일 최대 P | 50 | 110 |
| 레벨 10 달성 | 35일 | 16일 |
| 레벨 20 달성 | 335일 | 152일 |

### 수정 파일

```
src/shared/constants/rewards.ts          # 보상 상수 수정
src/shared/components/RewardGuide.tsx    # UI 표시 (자동 반영)
```

---

## 2. 아이템 가격 차등화

### 현재 상태

- 모든 아이템: 150 P 균일 가격
- 총 아이템 수: 314개
- 아이템 1개 구매 소요: 최소 3일

### 문제점

1. 인기 아이템과 비인기 아이템 가치 동일
2. 희소성/수집 욕구 자극 부족
3. 포인트 사용 동기 부족

### 등급 시스템 설계

#### 등급별 가격 체계

| 등급 | 가격 | 색상 | 설명 | 예시 |
|------|------|------|------|------|
| 일반 (Common) | 100 P | 회색 | 비인기/하위 리그 팀 | J리그, MLS 일부 |
| 희귀 (Rare) | 200 P | 파랑 | 중위권 리그 팀 | K리그, 분데스 중하위 |
| 레어 (Epic) | 500 P | 보라 | 인기 리그 주요 팀 | EPL 중위권, 라리가 |
| 에픽 (Legendary) | 1000 P | 금색 | 빅클럽 | 레알, 바르사, 맨유 등 |
| 레전드 (Mythic) | 2500 P | 빨강 | 한정판/특별 에디션 | 시즌 한정, 우승 기념 |

#### 리그별 기본 등급

| 리그 | 기본 등급 | 빅클럽 등급 |
|------|----------|------------|
| 프리미어리그 | 레어 (500P) | 에픽 (1000P) |
| 라리가 | 레어 (500P) | 에픽 (1000P) |
| 분데스리가 | 희귀 (200P) | 레어 (500P) |
| 세리에A | 희귀 (200P) | 레어 (500P) |
| 리그1 | 희귀 (200P) | 레어 (500P) |
| K리그 | 희귀 (200P) | 레어 (500P) |
| J리그 | 일반 (100P) | 희귀 (200P) |
| MLS | 일반 (100P) | 희귀 (200P) |

#### 빅클럽 목록 (에픽 등급)

```
프리미어리그: 맨유, 맨시티, 리버풀, 아스날, 첼시, 토트넘
라리가: 레알 마드리드, 바르셀로나, AT 마드리드
분데스리가: 바이에른 뮌헨, 도르트문트
세리에A: 유벤투스, AC밀란, 인터밀란
리그1: PSG
```

### 구현 상세

#### Step 1: 데이터베이스 스키마 수정

```sql
-- shop_items 테이블에 등급 컬럼 추가
ALTER TABLE shop_items
ADD COLUMN tier VARCHAR(20) DEFAULT 'common';

-- 등급 ENUM 또는 체크 제약
ALTER TABLE shop_items
ADD CONSTRAINT check_tier
CHECK (tier IN ('common', 'rare', 'epic', 'legendary', 'mythic'));

-- 기존 데이터 마이그레이션 (리그별 기본 등급 설정)
UPDATE shop_items SET tier = 'rare', price = 500
WHERE category_id IN (SELECT id FROM shop_categories WHERE name LIKE '%프리미어%');

UPDATE shop_items SET tier = 'epic', price = 1000
WHERE name IN ('맨체스터 유나이티드', '맨체스터 시티', '리버풀', '아스날', '첼시', '토트넘');
-- ... 기타 팀들
```

#### Step 2: 타입 정의 수정

**파일**: `src/domains/shop/types/index.ts`

```typescript
export type ItemTier = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  tier: ItemTier;  // 추가
  image_url: string;
  category_id: number;
  // ...
}

// 등급별 색상 매핑
export const TIER_COLORS: Record<ItemTier, string> = {
  common: 'text-gray-500',
  rare: 'text-blue-500',
  epic: 'text-purple-500',
  legendary: 'text-yellow-500',
  mythic: 'text-red-500',
};

// 등급별 배경 색상
export const TIER_BG_COLORS: Record<ItemTier, string> = {
  common: 'bg-gray-100 dark:bg-gray-800',
  rare: 'bg-blue-100 dark:bg-blue-900/30',
  epic: 'bg-purple-100 dark:bg-purple-900/30',
  legendary: 'bg-yellow-100 dark:bg-yellow-900/30',
  mythic: 'bg-red-100 dark:bg-red-900/30',
};
```

#### Step 3: UI 컴포넌트 수정

**파일**: `src/domains/shop/components/ItemCard.tsx`

```typescript
// 등급 배지 추가
<span className={`px-2 py-0.5 text-xs font-medium rounded ${TIER_COLORS[item.tier]}`}>
  {TIER_LABELS[item.tier]}
</span>

// 카드 테두리 색상
<div className={`border-2 ${TIER_BORDER_COLORS[item.tier]}`}>
```

#### Step 4: 필터 기능 추가

**파일**: `src/domains/shop/components/ItemFilter.tsx`

```typescript
// 등급별 필터 UI
<div className="flex gap-2">
  {(['all', 'common', 'rare', 'epic', 'legendary', 'mythic'] as const).map(tier => (
    <button
      key={tier}
      onClick={() => setSelectedTier(tier)}
      className={selectedTier === tier ? 'bg-slate-800 text-white' : 'bg-gray-100'}
    >
      {tier === 'all' ? '전체' : TIER_LABELS[tier]}
    </button>
  ))}
</div>
```

### 수정 파일

```
supabase/migrations/YYYYMMDD_add_item_tier.sql  # 마이그레이션
src/domains/shop/types/index.ts                  # 타입 정의
src/domains/shop/components/ItemCard.tsx         # 아이템 카드 UI
src/domains/shop/components/ItemFilter.tsx       # 필터 (신규)
src/domains/shop/components/ItemGrid.tsx         # 그리드 필터 연동
src/app/shop/page.tsx                            # 페이지 연동
```

---

## 3. 추가 보상 활동 구현

### 신규 활동 목록

| 활동 | 경험치 | 포인트 | 일일 제한 | 구현 난이도 |
|------|--------|--------|----------|------------|
| 게시글 추천하기 | 3 XP | 0 P | 20회 | 쉬움 |
| 첫 댓글 보너스 | 10 XP | 2 P | 1회 | 쉬움 |
| 첫 게시글 보너스 | 20 XP | 5 P | 1회 | 쉬움 |
| 프로필 방문 | 1 XP | 0 P | 10회 | 중간 |
| 게시글 공유 | 5 XP | 1 P | 5회 | 중간 |

### 구현 상세

#### 3-1. 게시글 추천하기 보상

**목적**: 추천 활동 장려, 커뮤니티 활성화

**파일**: `src/domains/boards/actions/posts/likes.ts`

```typescript
// togglePostLike 함수 내, 좋아요 추가 시
if (!existingLike) {
  // ... 기존 좋아요 추가 로직

  // 추천하는 사람에게도 보상 (신규)
  const activityTypes = await getActivityTypeValues();
  await rewardUserActivity(userId, activityTypes.GIVE_LIKE, postId);
}
```

**상수 추가**: `src/shared/constants/rewards.ts`

```typescript
export const ACTIVITY_REWARDS = {
  // ... 기존
  GIVE_LIKE: { exp: 3, points: 0 },  // 추천하기
};

export const DAILY_LIMITS = {
  // ... 기존
  GIVE_LIKE: 20,  // 일일 20회
};
```

#### 3-2. 첫 활동 보너스

**목적**: 일일 첫 활동에 추가 보상으로 접속 유도

**구현 방식**:
1. 오늘 첫 게시글/댓글인지 확인
2. 첫 활동이면 추가 보상 지급

**파일**: `src/shared/actions/activity-actions.ts`

```typescript
export async function rewardUserActivity(
  userId: string,
  activityType: string,
  referenceId?: string
): Promise<RewardResult> {
  // ... 기존 로직

  // 첫 활동 보너스 체크
  if (activityType === 'WRITE_POST' || activityType === 'WRITE_COMMENT') {
    const isFirstToday = await checkFirstActivityToday(userId, activityType);
    if (isFirstToday) {
      const bonusType = activityType === 'WRITE_POST' ? 'FIRST_POST_BONUS' : 'FIRST_COMMENT_BONUS';
      await grantBonusReward(userId, ACTIVITY_REWARDS[bonusType], `오늘의 첫 ${activityType === 'WRITE_POST' ? '게시글' : '댓글'} 보너스`);
    }
  }
}
```

**상수 추가**:

```typescript
export const ACTIVITY_REWARDS = {
  // ... 기존
  FIRST_POST_BONUS: { exp: 20, points: 5 },
  FIRST_COMMENT_BONUS: { exp: 10, points: 2 },
};
```

#### 3-3. 활동 타입 DB 업데이트

```sql
-- activity_types 테이블에 신규 타입 추가
INSERT INTO activity_types (name, exp_reward, point_reward, daily_limit) VALUES
('GIVE_LIKE', 3, 0, 20),
('FIRST_POST_BONUS', 20, 5, 1),
('FIRST_COMMENT_BONUS', 10, 2, 1);
```

### UI 업데이트

#### RewardGuide 컴포넌트 업데이트

```typescript
// 신규 보상 활동 표시
export const REWARD_DISPLAY_LIST = [
  // ... 기존
  { label: '추천하기', exp: 3, points: 0, limit: 20, description: '게시글/댓글 추천' },
  { label: '첫 게시글 보너스', exp: 20, points: 5, limit: 1, description: '오늘의 첫 게시글' },
  { label: '첫 댓글 보너스', exp: 10, points: 2, limit: 1, description: '오늘의 첫 댓글' },
];
```

### 수정 파일

```
src/shared/constants/rewards.ts                    # 신규 활동 상수
src/shared/actions/activity-actions.ts             # 보상 로직 확장
src/domains/boards/actions/posts/likes.ts          # 추천하기 보상
src/domains/boards/actions/comments/likes.ts       # 댓글 추천 보상
src/shared/components/RewardGuide.tsx              # UI 업데이트
supabase/migrations/YYYYMMDD_add_activity_types.sql # DB 마이그레이션
```

---

## 구현 순서 및 우선순위

### 권장 구현 순서

```
1단계: 경험치 밸런스 조정 (1일)
├── rewards.ts 상수 수정
├── RewardGuide.tsx 확인 (자동 반영)
└── 테스트

2단계: 추가 보상 활동 - 추천하기 (1일)
├── GIVE_LIKE 상수 추가
├── likes.ts에 보상 로직 추가
└── 테스트

3단계: 추가 보상 활동 - 첫 활동 보너스 (1일)
├── FIRST_POST_BONUS, FIRST_COMMENT_BONUS 상수 추가
├── activity-actions.ts 로직 추가
└── 테스트

4단계: 아이템 가격 차등화 (2-3일)
├── DB 마이그레이션 (tier 컬럼 추가)
├── 기존 데이터 등급 분류
├── 타입 정의 수정
├── ItemCard UI 수정
├── 필터 기능 추가
└── 테스트
```

### 체크리스트

```
[x] 1. 경험치 밸런스 조정 ✅
    [x] rewards.ts 보상 상수 수정
    [x] DAILY_LIMITS 조정
    [x] RewardGuide.tsx 확인 (자동 반영)
    [x] 테스트

[x] 2. 아이템 가격 차등화 ✅
    [x] DB 마이그레이션 (tier 컬럼)
    [x] 팀별 등급 데이터 정리 (리그별 자동 분류)
    [x] 기존 데이터 마이그레이션
    [x] 타입 정의 수정 (ItemTier, TIER_LABELS, TIER_COLORS 등)
    [x] ItemCard 등급 배지 UI
    [ ] ItemFilter 등급 필터 (Phase 4로 연기)
    [x] 테스트

[x] 3. 추가 보상 활동 ✅
    [x] 추천하기 보상 (GIVE_LIKE) - posts/likes.ts, comments/likes.ts
    [x] 첫 게시글 보너스 (FIRST_POST_BONUS) - activity-actions.ts
    [x] 첫 댓글 보너스 (FIRST_COMMENT_BONUS) - activity-actions.ts
    [x] activity_types 상수 업데이트 (rewards.ts)
    [x] RewardGuide UI 업데이트 (REWARD_DISPLAY_LIST 자동 반영)
    [x] 테스트
```

---

## 참고: 밸런스 시뮬레이션

### 조정 후 레벨업 소요 시간

**가정**: 일일 575 XP 획득 (조정 후 최대치)

| 레벨 | 필요 XP | 소요 일수 (조정 전) | 소요 일수 (조정 후) |
|------|---------|-------------------|-------------------|
| 1 → 10 | 9,000 | 35일 | 16일 |
| 10 → 20 | 78,000 | 300일 | 136일 |
| 20 → 30 | 480,000 | 1,846일 | 835일 |
| 30 → 40 | 960,000 | 3,692일 | 1,670일 |

**개선 효과**: 약 55% 단축

### 포인트 획득량 변화

| 활동 | 조정 전 (P) | 조정 후 (P) |
|------|------------|------------|
| 게시글 5개 | 25 | 50 |
| 댓글 5개 | 5 | 15 |
| 추천 10개 | 10 | 20 |
| 일일 로그인 | 5 | 10 |
| **일일 최대** | **50** | **110** |

**아이템 구매 소요 (에픽 1000P 기준)**: 약 9일

---

## 구현 완료 요약 (2025-12-30)

### 변경된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/shared/constants/rewards.ts` | 경험치/포인트 보상 증가, 신규 활동 타입 추가 |
| `src/domains/boards/actions/posts/likes.ts` | GIVE_LIKE 보상 추가 |
| `src/domains/boards/actions/comments/likes.ts` | GIVE_LIKE 보상 추가 |
| `src/shared/actions/activity-actions.ts` | 첫 활동 보너스 로직 추가 |
| `src/domains/shop/types/index.ts` | ItemTier 타입 및 색상 상수 추가 |
| `src/domains/shop/components/ItemCard.tsx` | 티어 배지 UI 추가 |
| `src/shared/components/AttendanceCalendar.tsx` | 연속 출석 보너스 목록 UI, 오늘 표시 개선 |
| DB 마이그레이션 | shop_items에 tier 컬럼 추가 |

### 보상 밸런스 변화

| 활동 | Before | After | 변화 |
|------|--------|-------|------|
| 게시글 작성 | 25 XP / 5 P | 50 XP / 10 P | +100% |
| 댓글 작성 | 5 XP / 1 P | 15 XP / 3 P | +200% |
| 추천 받기 | 5 XP / 1 P | 10 XP / 2 P | +100% |
| 일일 로그인 | 30 XP / 5 P | 50 XP / 10 P | +67% |
| 추천하기 (신규) | - | 3 XP / 0 P | NEW |
| 첫 게시글 보너스 (신규) | - | 20 XP / 5 P | NEW |
| 첫 댓글 보너스 (신규) | - | 10 XP / 2 P | NEW |

### 아이템 티어 분포

| 티어 | 가격 | 개수 |
|------|------|------|
| Common (일반) | 100 P | 206개 |
| Rare (희귀) | 200 P | 61개 |
| Epic (에픽) | 500 P | 38개 |
| Legendary (레전드) | 1000 P | 9개 |
| **총계** | - | **314개** |

### 출석 캘린더 UI 개선

| 항목 | 변경 내용 |
|------|----------|
| 오늘 표시 | `ring-2` → `bg-[#EAEAEA] dark:bg-[#333333]` (배경색 변화) |
| 오늘+출석 | 녹색 배경 + `border-2 border-green-500` (테두리 강조) |
| 일일 보상 안내 | 매일 접속 시 50 XP + 10 P 표시 |
| 연속 출석 보너스 | 4단계 마일스톤 목록 표시 (7일/14일/21일/30일) |
| 진행률 표시 | 현재 목표까지 노란색 진행률 바 |
| 다음 보너스 | 남은 일수 표시 |

**연속 출석 마일스톤:**
- 7일 (1주): +100 XP, +50 P
- 14일 (2주): +200 XP, +100 P
- 21일 (3주): +300 XP, +150 P
- 30일 (월간): +500 XP, +200 P

### 다음 단계 (Phase 4 후보)

- [ ] 아이템 등급 필터 UI
- [ ] 프로필 방문 보상
- [ ] 게시글 공유 보상
- [ ] 레전드 등급 한정판 이벤트
- [ ] 경험치 부스트 아이템
