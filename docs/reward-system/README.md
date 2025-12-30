# 보상 시스템 문서

## 목차
1. [시스템 개요](#시스템-개요)
2. [현재 구현 상태](#현재-구현-상태)
3. [관련 파일 목록](#관련-파일-목록)
4. [경험치 및 레벨 시스템](#경험치-및-레벨-시스템)
5. [포인트 시스템](#포인트-시스템)
6. [상점 시스템](#상점-시스템)
7. [문제점 및 개선 방안](#문제점-및-개선-방안)
8. [밸런싱 제안](#밸런싱-제안)

---

## 시스템 개요

사용자 활동에 대한 보상으로 **경험치(XP)**와 **포인트(P)**를 지급합니다.
- **경험치**: 레벨업에 사용 (레벨에 따른 기본 아이콘 변경)
- **포인트**: 상점에서 아이템 구매에 사용

---

## 현재 구현 상태

### 활동별 보상 (Phase 3 적용)

| 활동 | 경험치 | 포인트 | 일일 제한 | 일일 최대 XP | 일일 최대 P |
|------|--------|--------|----------|-------------|------------|
| 게시글 작성 | 50 XP | 10 P | 5회 | 250 XP | 50 P |
| 댓글 작성 | 15 XP | 3 P | 5회 | 75 XP | 15 P |
| 추천 받기 | 10 XP | 2 P | 10회 | 100 XP | 20 P |
| 추천하기 | 3 XP | 0 P | 20회 | 60 XP | 0 P |
| 최초 로그인 | 50 XP | 10 P | 1회 | 50 XP | 10 P |
| 오늘의 첫 게시글 | 20 XP | 5 P | 1회 | 20 XP | 5 P |
| 오늘의 첫 댓글 | 10 XP | 2 P | 1회 | 10 XP | 2 P |
| 연속 출석 | 30 XP | 5 P | 1회 | 30 XP | 5 P |

**일일 최대 획득량**: 595 XP, 107 P

### 현재 문제점
1. ~~**연속 출석 보너스 미구현**~~: ✅ 구현됨 (2025-12-30)
2. ~~**추천 받기 보상 미확인**~~: ✅ 확인됨 - 게시글/댓글 좋아요 모두 보상 지급
3. ~~**상수 중복 정의**~~: ✅ 해결됨 - `rewards.ts`로 통합

---

## 관련 파일 목록

### 공용 상수 및 컴포넌트 (통합됨)
```
src/shared/constants/rewards.ts           # 보상 상수 단일 소스 ⭐
├── ActivityTypes                         # 활동 유형 상수
├── ACTIVITY_REWARDS                      # 활동별 보상 정의
├── DAILY_LIMITS                          # 일일 제한
├── REWARD_DISPLAY_LIST                   # UI 표시용 목록
├── DAILY_MAX_EXP                         # 일일 최대 경험치
├── DAILY_MAX_POINTS                      # 일일 최대 포인트
└── CONSECUTIVE_LOGIN_BONUSES             # 연속 출석 보너스 ⭐

src/shared/components/RewardGuide.tsx     # 보상 안내 공용 컴포넌트 ⭐
src/shared/components/AttendanceCalendar.tsx # 출석 캘린더 컴포넌트 ⭐
src/shared/actions/attendance-actions.ts  # 출석 서버 액션 ⭐
src/shared/utils/activity-rewards-client.ts # 클라이언트용 래퍼
```

### 핵심 서버 액션
```
src/shared/actions/activity-actions.ts    # 보상 지급 핵심 로직
├── rewardUserActivity()                  # 활동 보상 지급
├── getActivityRewards()                  # 보상 정보 (rewards.ts 사용)
└── getDailyLimits()                      # 일일 제한 (rewards.ts 사용)

src/shared/actions/attendance-actions.ts  # 출석 관련 액션 ⭐
├── recordDailyLogin()                    # 일일 출석 기록 및 보상
├── getAttendanceData()                   # 출석 데이터 조회 (캘린더용)
└── calculateConsecutiveDays()            # 연속 출석 일수 계산
```

### 보상 호출 위치
```
src/domains/boards/actions/posts/create.ts     # 게시글 작성 시 보상
src/domains/boards/actions/comments/create.ts  # 댓글 작성 시 보상
```

### 경험치/레벨 관련
```
src/shared/utils/level-icons.ts           # 레벨 계산, 아이콘 URL (클라이언트)
├── LEVEL_EXP_REQUIREMENTS[]              # 레벨별 필요 경험치 테이블
├── calculateLevelFromExp()               # 경험치→레벨 계산
├── getLevelIconUrl()                     # 레벨별 아이콘 URL
├── calculateLevelProgress()              # 레벨 진행률
└── getExpToNextLevel()                   # 다음 레벨까지 필요 경험치

src/shared/utils/level-icons-server.ts    # 서버용 레벨 계산
```

### 설정 페이지 컴포넌트
```
src/domains/settings/components/
├── exp/
│   ├── ExpForm.tsx                       # 경험치 정보 (RewardGuide 사용)
│   ├── ExpHistory.tsx                    # 경험치 내역
│   └── LevelList.tsx                     # 레벨별 아이콘 목록 (공용)
├── points/
│   ├── PointsForm.tsx                    # 포인트 정보 (RewardGuide 사용)
│   └── PointHistory.tsx                  # 포인트 내역
└── icons/
    └── IconForm.tsx                      # 아이콘 선택 (LevelList 사용)
```

### 상점 관련
```
src/domains/shop/
├── actions/actions.ts                    # 상점 서버 액션
│   ├── purchaseItem()                    # 아이템 구매
│   ├── getUserPoints()                   # 포인트 조회
│   └── getUserItems()                    # 보유 아이템 조회
├── components/
│   ├── ItemCard.tsx                      # 아이템 카드
│   ├── ItemGrid.tsx                      # 아이템 그리드
│   └── PurchaseModal.tsx                 # 구매 모달
└── types/index.ts                        # 타입 정의
```

### 데이터베이스 테이블
```
profiles          # 사용자 프로필 (exp, points, level, icon_id)
exp_history       # 경험치 내역
point_history     # 포인트 내역
login_history     # 출석 기록 (user_id, login_date) ⭐
shop_items        # 상점 아이템
shop_categories   # 상점 카테고리
user_items        # 사용자 보유 아이템
```

---

## 경험치 및 레벨 시스템

### 현재 레벨 테이블 (1~49레벨)

| 레벨 | 필요 XP | 이전 대비 증가 | 레벨 | 필요 XP | 이전 대비 증가 |
|------|---------|---------------|------|---------|---------------|
| 1 | 0 | - | 26 | 279,000 | +48,000 |
| 2 | 50 | +50 | 27 | 327,000 | +48,000 |
| 3 | 500 | +450 | 28 | 375,000 | +48,000 |
| 4 | 1,000 | +500 | 29 | 471,000 | +96,000 |
| 5 | 1,500 | +500 | 30 | 567,000 | +96,000 |
| 6 | 2,000 | +500 | 31 | 663,000 | +96,000 |
| 7 | 2,500 | +500 | 32 | 759,000 | +96,000 |
| 8 | 3,000 | +500 | 33 | 855,000 | +96,000 |
| 9 | 6,000 | +3,000 | 34 | 951,000 | +96,000 |
| 10 | 9,000 | +3,000 | 35 | 1,047,000 | +96,000 |
| 11 | 12,000 | +3,000 | 36 | 1,143,000 | +96,000 |
| 12 | 15,000 | +3,000 | 37 | 1,239,000 | +96,000 |
| 13 | 21,000 | +6,000 | 38 | 1,335,000 | +96,000 |
| 14 | 27,000 | +6,000 | 39 | 1,431,000 | +96,000 |
| 15 | 33,000 | +6,000 | 40 | 1,527,000 | +96,000 |
| 16 | 39,000 | +6,000 | 41 | 1,623,000 | +96,000 |
| 17 | 51,000 | +12,000 | 42 | 1,719,000 | +96,000 |
| 18 | 63,000 | +12,000 | 43 | 1,815,000 | +96,000 |
| 19 | 75,000 | +12,000 | 44 | 1,911,000 | +96,000 |
| 20 | 87,000 | +12,000 | 45 | 2,007,000 | +96,000 |
| 21 | 111,000 | +24,000 | 46 | 2,103,000 | +96,000 |
| 22 | 135,000 | +24,000 | 47 | 2,199,000 | +96,000 |
| 23 | 159,000 | +24,000 | 48 | 2,295,000 | +96,000 |
| 24 | 183,000 | +24,000 | 49 | 2,391,000 | +96,000 |
| 25 | 231,000 | +48,000 | | | |

### 레벨별 아이콘 규칙
- **1~40레벨**: 4레벨당 1개 아이콘 (총 10개)
- **41레벨 이상**: 레벨당 1개 아이콘
- **최대 아이콘**: 19개

### 레벨업 소요 시간 분석 (일일 최대 260 XP 기준)

| 레벨 구간 | 필요 XP | 소요 일수 |
|----------|---------|----------|
| 1 → 10 | 9,000 | ~35일 |
| 10 → 20 | 78,000 | ~300일 |
| 20 → 30 | 480,000 | ~1,846일 (5년) |
| 30 → 40 | 960,000 | ~3,692일 (10년) |

**문제점**: 현재 밸런스로는 고레벨 달성이 사실상 불가능

---

## 포인트 시스템

### 현재 상태
- **일일 최대 획득**: 50 P
- **상점 아이템 가격**: 모두 150 P (314개 아이템)
- **아이템 1개 구매 소요**: 최소 3일

### 상점 카테고리별 아이템 수
| 카테고리 | 아이템 수 | 가격 |
|----------|----------|------|
| 프리미어리그 팀 | 20 | 150 P |
| 라리가 팀 | 20 | 150 P |
| 분데스리가 팀 | 18 | 150 P |
| 세리에 A 팀 | 20 | 150 P |
| 리그 1 팀 | 18 | 150 P |
| K리그 팀 | 12 | 150 P |
| J1 리그 팀 | 20 | 150 P |
| MLS 팀 | 30 | 150 P |
| 기타 | 156 | 150 P |

---

## 문제점 및 개선 방안

### 1. 코드 중복 문제 ✅ 해결됨

**이전**: ACTIVITY_REWARDS가 3곳에 정의됨

**현재**: 공용 상수 파일로 통합됨
```
src/shared/constants/rewards.ts  # 단일 소스
```

**사용 방법**:
```typescript
// 서버에서
import { ACTIVITY_REWARDS, ActivityTypes } from '@/shared/constants/rewards';

// 클라이언트에서
import { ACTIVITY_REWARDS } from '@/shared/utils/activity-rewards-client';
```

### 2. UI 컴포넌트 중복 ✅ 해결됨

**이전**: ExpForm과 PointsForm에서 비슷한 보상 목록 표시

**현재**: 공용 RewardGuide 컴포넌트 사용
```typescript
// src/shared/components/RewardGuide.tsx
import RewardGuide from '@/shared/components/RewardGuide';

<RewardGuide type="exp" />    // 경험치 페이지
<RewardGuide type="points" /> // 포인트 페이지
```

### 3. 구현 완료 (2025-12-30)

- [x] 연속 출석 보너스 ✅ 구현됨 (`attendance-actions.ts`, `AttendanceCalendar.tsx`)
- [x] 추천 받기 보상 연동 ✅ 확인됨 (게시글: `posts/likes.ts:220-221`, 댓글: `comments/likes.ts:180-181`)
- [x] 레벨업 알림 ✅ 확인됨 (알림 생성: `activity-actions.ts:200-211`, UI: `NotificationItem.tsx:56-61`)

#### 출석 캘린더 UI
- **PC (full 버전)**: 프로필 설정 > 기본정보 섹션에 월별 캘린더
- **모바일 (mini 버전)**: 프로필 사이드바 > 글쓰기 버튼 위에 주간 캘린더
- **색상**: UI_GUIDELINES.md 준수 (`bg-[#EAEAEA]`, `bg-[#F5F5F5]` 등)
- **오늘 표시**: 진한 배경색 (`bg-[#EAEAEA] dark:bg-[#333333]`) - 링 대신 배경색 사용
- **오늘+출석**: 녹색 배경 + 녹색 테두리 (`border-2 border-green-500`)
- **출석 표시**: 녹색 배경 + 체크마크 아이콘 (`bg-green-100 dark:bg-green-900/30`)

#### 출석 캘린더 Full 버전 기능
1. **월별 캘린더**: 월 네비게이션으로 이전 달 조회 가능
2. **일일 출석 보상 안내**: 매일 접속 시 50 XP + 10 P 표시
3. **연속 출석 보너스 목록**: 4단계 보너스 진행 상황 표시
   - 7일 (1주): 100 XP + 50 P
   - 14일 (2주): 200 XP + 100 P
   - 21일 (3주): 300 XP + 150 P
   - 30일 (월간): 500 XP + 200 P
4. **진행률 표시**: 현재 목표까지 진행률 바 표시
5. **다음 보너스까지 남은 일수 표시**

---

## 밸런싱 제안

### A. 경험치 밸런스 조정안

#### 옵션 1: 보상 증가
| 활동 | 현재 XP | 제안 XP | 변화 |
|------|---------|---------|------|
| 게시글 작성 | 25 | 50 | +100% |
| 댓글 작성 | 5 | 15 | +200% |
| 추천 받기 | 5 | 10 | +100% |
| 최초 로그인 | 30 | 50 | +67% |
| 연속 출석 | 30 | 100 | +233% |

**일일 최대**: 260 XP → 575 XP

#### 옵션 2: 레벨 요구치 감소
- 전체 경험치 요구량 50% 감소
- 고레벨 달성 시간 절반으로 단축

#### 옵션 3: 추가 보상 활동
| 신규 활동 | 경험치 | 포인트 | 일일 제한 |
|----------|--------|--------|----------|
| 게시글 추천하기 | 3 XP | 0 P | 20회 |
| 프로필 방문 | 1 XP | 0 P | 10회 |
| 첫 댓글 작성 | 10 XP | 2 P | 1회 |
| 주간 출석 완료 | 200 XP | 50 P | 1회/주 |
| 월간 출석 완료 | 1000 XP | 200 P | 1회/월 |

### B. 포인트 밸런스 조정안

#### 옵션 1: 가격 차등화
| 등급 | 가격 | 설명 |
|------|------|------|
| 일반 | 100 P | 비인기 리그 팀 |
| 희귀 | 200 P | 인기 리그 팀 |
| 레어 | 500 P | 빅클럽 |
| 에픽 | 1000 P | 특별 에디션 |
| 레전드 | 2500 P | 한정판 |

#### 옵션 2: 포인트 보상 증가
| 활동 | 현재 P | 제안 P |
|------|--------|--------|
| 게시글 작성 | 5 | 10 |
| 댓글 작성 | 1 | 3 |
| 추천 받기 | 1 | 2 |

### C. 연속 출석 보너스 ✅ 구현 완료

**일일 출석 보상** (매일 지급):
- 50 XP + 10 P

**연속 출석 마일스톤 보너스** (해당 일차에 추가 지급):

| 연속 일수 | 보너스 | 설명 |
|----------|--------|------|
| 7일 | +100 XP, +50 P | 1주 연속 출석 |
| 14일 | +200 XP, +100 P | 2주 연속 출석 |
| 21일 | +300 XP, +150 P | 3주 연속 출석 |
| 30일 | +500 XP, +200 P | 월간 출석 완료 |

**30일 이후**: 30일 주기로 월간 보너스 반복

### D. 레벨 혜택 추가 제안

| 레벨 | 혜택 |
|------|------|
| 5 | 닉네임 색상 변경 |
| 10 | 댓글 이모지 사용 |
| 15 | 프로필 배경 |
| 20 | 특별 배지 |
| 30 | 게시글 강조 기능 |
| 40 | VIP 채팅방 접근 |
| 50 | 레전드 칭호 |

---

## 구현 우선순위

### Phase 1 (즉시) ✅ 완료
1. [x] 공용 상수 파일 생성 (`rewards.ts`)
2. [x] 중복 코드 통합 (activity-actions.ts)
3. [x] 공용 RewardGuide 컴포넌트 생성
4. [x] ExpForm, PointsForm 리팩토링
5. [x] activity-rewards-client.ts 정리

### Phase 2 (단기) ✅ 완료
6. [x] 연속 출석 보너스 구현 ✅ 완료
7. [x] 추천 받기 보상 연동 ✅ 완료
8. [x] 레벨업 알림 확인 ✅ 완료

### Phase 3 (중기) ✅ 완료
9. [x] 경험치 밸런스 조정 ✅ 완료 (보상량 +67%~200% 증가)
10. [ ] 아이템 가격 차등화 (보류)
11. [x] 추가 보상 활동 구현 ✅ 완료 (추천하기, 첫 게시글/댓글 보너스)
12. [x] 출석 캘린더 연속 출석 보너스 UI ✅ 완료

### Phase 4 (장기)
12. [ ] 레벨 혜택 시스템
13. [ ] 시즌 이벤트 보상
14. [ ] 업적 시스템

---

## 참고

### 데이터베이스 스키마

```sql
-- profiles 테이블 (사용자 정보)
profiles (
  id UUID PRIMARY KEY,
  exp INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  icon_id INTEGER REFERENCES shop_items(id)
)

-- exp_history 테이블 (경험치 내역)
exp_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  exp INTEGER,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- point_history 테이블 (포인트 내역)
point_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  points INTEGER,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- login_history 테이블 (출석 기록) ⭐
login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, login_date)  -- 하루에 하나의 기록만
)
```

### 관련 RPC 함수
- `purchase_item(p_user_id, p_item_id)`: 아이템 구매 트랜잭션
