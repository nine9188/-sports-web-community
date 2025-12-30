# Phase 2 구현 완료

> **상태**: ✅ 완료 (2025-12-30)

## 목차
1. [연속 출석 보너스 구현](#1-연속-출석-보너스-구현) ✅
2. [추천 받기 보상 확인](#2-추천-받기-보상-확인) ✅
3. [레벨업 알림 확인](#3-레벨업-알림-확인) ✅

---

## 1. 연속 출석 보너스 구현

### 상태: ✅ 완료 (2025-12-30)

#### 구현된 파일
- `src/shared/actions/attendance-actions.ts` - 출석 서버 액션
- `src/shared/components/AttendanceCalendar.tsx` - 출석 캘린더 컴포넌트
- `src/shared/constants/rewards.ts` - 연속 출석 보너스 상수
- `src/domains/auth/actions/auth.ts` - 로그인 시 출석 기록 연동
- `src/domains/settings/components/profile/ProfileForm.tsx` - PC full 캘린더
- `src/domains/sidebar/components/ProfileSidebar.tsx` - 모바일 mini 캘린더

#### DB 테이블
`login_history` 테이블 생성됨 (Supabase migration)

### 구현 계획

#### Step 1: 데이터베이스 테이블 생성

```sql
-- login_history 테이블
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 하루에 하나의 기록만
  UNIQUE(user_id, login_date)
);

-- 인덱스
CREATE INDEX idx_login_history_user_date ON login_history(user_id, login_date DESC);

-- RLS 정책
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own login history"
  ON login_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert login history"
  ON login_history FOR INSERT
  WITH CHECK (true);
```

#### Step 2: 로그인 시 출석 기록 추가

**수정 파일**: `src/domains/auth/actions/auth.ts`

```typescript
// signIn 함수 내, 로그인 성공 후 (line 88-97 사이에 추가)
import { recordDailyLogin } from '@/shared/actions/activity-actions';

// 5. 로그인 성공 처리
await clearAttempts(username);

// 일일 출석 기록 및 보상
await recordDailyLogin(data.user.id);
```

#### Step 3: 출석 기록 및 보상 로직 구현

**수정 파일**: `src/shared/actions/activity-actions.ts`

```typescript
/**
 * 일일 출석 기록 및 보상
 */
export async function recordDailyLogin(userId: string): Promise<{
  success: boolean;
  isFirstLogin: boolean;
  consecutiveDays: number;
  rewards?: { exp: number; points: number };
}> {
  const supabase = await getSupabaseServer();
  const today = new Date().toISOString().split('T')[0];

  // 1. 오늘 이미 로그인했는지 확인
  const { data: existingLogin } = await supabase
    .from('login_history')
    .select('id')
    .eq('user_id', userId)
    .eq('login_date', today)
    .single();

  if (existingLogin) {
    // 이미 오늘 로그인함
    return { success: true, isFirstLogin: false, consecutiveDays: 0 };
  }

  // 2. 오늘 로그인 기록 추가
  await supabase
    .from('login_history')
    .insert({ user_id: userId, login_date: today });

  // 3. 연속 출석 일수 계산
  const consecutiveDays = await calculateConsecutiveDays(userId);

  // 4. 일일 로그인 보상 지급
  const ActivityTypes = await getActivityTypeValues();
  await rewardUserActivity(userId, ActivityTypes.DAILY_LOGIN);

  // 5. 연속 출석 보너스 (7일, 14일, 21일, 30일)
  let bonusRewards = { exp: 0, points: 0 };
  if (consecutiveDays === 7) {
    bonusRewards = { exp: 100, points: 50 };
  } else if (consecutiveDays === 14) {
    bonusRewards = { exp: 200, points: 100 };
  } else if (consecutiveDays === 21) {
    bonusRewards = { exp: 300, points: 150 };
  } else if (consecutiveDays === 30) {
    bonusRewards = { exp: 500, points: 200 };
  }

  if (bonusRewards.exp > 0) {
    await grantBonusReward(userId, bonusRewards, `${consecutiveDays}일 연속 출석 보너스`);
  }

  return {
    success: true,
    isFirstLogin: true,
    consecutiveDays,
    rewards: bonusRewards.exp > 0 ? bonusRewards : undefined
  };
}

/**
 * 연속 출석 일수 계산
 */
async function calculateConsecutiveDays(userId: string): Promise<number> {
  const supabase = await getSupabaseServer();

  // 최근 60일간 로그인 기록 조회
  const { data: logins } = await supabase
    .from('login_history')
    .select('login_date')
    .eq('user_id', userId)
    .order('login_date', { ascending: false })
    .limit(60);

  if (!logins || logins.length === 0) return 1;

  let consecutive = 1;
  const today = new Date();

  for (let i = 1; i < logins.length; i++) {
    const currentDate = new Date(logins[i - 1].login_date);
    const prevDate = new Date(logins[i].login_date);

    // 하루 차이인지 확인
    const diffDays = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive;
}

/**
 * 보너스 보상 지급
 */
async function grantBonusReward(
  userId: string,
  rewards: { exp: number; points: number },
  reason: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  // 경험치 히스토리 기록
  await supabase.from('exp_history').insert({
    user_id: userId,
    exp: rewards.exp,
    reason
  });

  // 포인트 히스토리 기록
  await supabase.from('point_history').insert({
    user_id: userId,
    points: rewards.points,
    reason
  });

  // 프로필 업데이트
  const { data: profile } = await supabase
    .from('profiles')
    .select('exp, points, level')
    .eq('id', userId)
    .single();

  if (profile) {
    const newExp = (profile.exp || 0) + rewards.exp;
    const newPoints = (profile.points || 0) + rewards.points;
    const newLevel = calculateLevelFromExp(newExp);

    await supabase
      .from('profiles')
      .update({ exp: newExp, points: newPoints, level: newLevel })
      .eq('id', userId);

    // 레벨업 알림
    if (newLevel > profile.level) {
      await createLevelUpNotification({ userId, newLevel });
    }
  }
}
```

#### Step 4: 연속 출석 보너스 상수 추가

**수정 파일**: `src/shared/constants/rewards.ts`

```typescript
// 연속 출석 보너스
export const CONSECUTIVE_LOGIN_BONUSES = [
  { days: 7, exp: 100, points: 50, label: '1주 연속 출석' },
  { days: 14, exp: 200, points: 100, label: '2주 연속 출석' },
  { days: 21, exp: 300, points: 150, label: '3주 연속 출석' },
  { days: 30, exp: 500, points: 200, label: '월간 출석 완료' },
] as const;
```

#### Step 5: 출석 현황 UI

**새 파일**: `src/shared/components/AttendanceCalendar.tsx`

##### 디자인 컨셉
- **달력 형태**: 월별 캘린더에 출석 도장이 찍히는 형식
- **도장 표시**: 출석한 날짜에 체크/도장 아이콘 표시
- **연속 출석**: 연속 출석 일수 및 다음 보너스까지 남은 일수 표시

##### 배치 위치

**PC (데스크톱)**
```
프로필 설정 페이지 > 기본정보 섹션 > 계정 정보 아래
src/domains/settings/components/profile/ProfileForm.tsx (line 88 이후)
└── AttendanceCalendar (variant="full") 추가
```

**모바일**
```
1. 프로필 설정 페이지 - PC와 동일 (ProfileForm.tsx)

2. 프로필 사이드바 > 글쓰기 버튼 위
src/domains/sidebar/components/ProfileSidebar.tsx (line 176 이전)
└── AttendanceCalendar (variant="mini") 추가
```

##### 컴포넌트 구조

```typescript
// 공용 출석 캘린더 컴포넌트
interface AttendanceCalendarProps {
  userId: string;
  variant?: 'full' | 'mini';  // full: 프로필 페이지, mini: 모달용
}

// full 버전: 월별 달력 전체 표시
// mini 버전: 이번 주 출석 현황 + 연속 출석 일수만 표시
```

##### UI 요소
- 월 선택 (이전/다음 월)
- 날짜별 출석 도장 (체크 아이콘 또는 커스텀 도장)
- 연속 출석 일수 배지
- 다음 보너스 (7일/14일/21일/30일) 안내
- 오늘 출석 완료 여부 표시

##### 수정 파일 목록
```
src/shared/components/AttendanceCalendar.tsx           # 새 파일 - 출석 캘린더 (full/mini)
src/domains/settings/components/profile/ProfileForm.tsx # PC: 기본정보에 full 캘린더 추가
src/domains/sidebar/components/ProfileSidebar.tsx       # 모바일: 글쓰기 위에 mini 캘린더 추가
```

##### variant별 UI

**full (PC 프로필 페이지용)**
- 이번 달 전체 캘린더 표시
- 날짜별 출석 도장 (체크 아이콘)
- 이전/다음 월 네비게이션
- 연속 출석 일수 배지
- 다음 보너스까지 남은 일수

**mini (모바일 사이드바용)**
- 이번 주 (7일) 출석 현황만 표시
- 연속 출석 일수 + 오늘 출석 여부
- 다음 보너스 안내 (간략)

### 예상 작업량
- DB 마이그레이션: 30분
- 서버 액션 구현: 1시간
- 상수 업데이트: 30분
- 출석 캘린더 컴포넌트: 2시간
- PC 프로필 페이지 연동: 30분
- 모바일 프로필 모달 연동: 30분

---

## 2. 추천 받기 보상 확인

### 상태: ✅ 완료 (2025-12-30 확인)

#### 게시글 좋아요 보상
**파일**: `src/domains/boards/actions/posts/likes.ts`
```typescript
// line 220-221
const activityTypes = await getActivityTypeValues();
await rewardUserActivity(postOwnerId, activityTypes.RECEIVED_LIKE, postId);
```
**상태**: ✅ 구현됨

#### 댓글 좋아요 보상
**파일**: `src/domains/boards/actions/comments/likes.ts`
```typescript
// line 180-181 (handleCommentLikeNotification 함수 내)
const activityTypes = await getActivityTypeValues();
await rewardUserActivity(commentData.user_id, activityTypes.RECEIVED_LIKE, commentId);
```
**상태**: ✅ 구현됨

### 구현된 기능 요약

| 항목 | 파일 | 상태 |
|------|------|------|
| 게시글 좋아요 | `posts/likes.ts:220-221` | ✅ 구현됨 |
| 댓글 좋아요 | `comments/likes.ts:180-181` | ✅ 구현됨 |
| 본인 좋아요 방지 | 양쪽 모두 | ✅ 구현됨 |
| 일일 제한 (10회) | `activity-actions.ts` | ✅ 구현됨 |
| 좋아요 알림 | `createPostLikeNotification`, `createCommentLikeNotification` | ✅ 구현됨 |

### 추가 작업 필요 없음
모든 추천 받기 보상 로직이 이미 완전히 구현되어 있습니다.

---

## 3. 레벨업 알림 확인

### 상태: ✅ 완료 (2025-12-30 확인)

#### 레벨업 감지 및 알림 호출
**파일**: `src/shared/actions/activity-actions.ts`
```typescript
// line 200-211
if (newLevel > currentLevel) {
  try {
    await createLevelUpNotification({
      userId,
      newLevel
    });
  } catch (notificationError) {
    console.error('레벨업 알림 생성 오류:', notificationError);
  }
}
```
**상태**: ✅ 구현됨

#### 알림 생성 함수
**파일**: `src/domains/notifications/actions/create.ts`
```typescript
export async function createLevelUpNotification({
  userId,
  newLevel
}: {
  userId: string;
  newLevel: number;
}): Promise<NotificationActionResponse> {
  return createNotification({
    userId,
    actorId: undefined, // 시스템 알림
    type: 'level_up',
    title: `축하합니다! 레벨 ${newLevel}이 되었습니다! 🎉`,
    message: `계속해서 활동하고 경험치를 쌓아보세요!`,
    link: `/settings/profile`,
    metadata: {
      new_level: newLevel
    }
  });
}
```
**상태**: ✅ 구현됨

#### 알림 타입 정의
**파일**: `src/domains/notifications/types/notification.ts`
```typescript
// line 10
| 'level_up'       // 레벨업
```
**상태**: ✅ 구현됨

#### 알림 UI (아이콘 및 표시)
**파일**: `src/domains/notifications/components/NotificationItem.tsx`
```typescript
// line 56-61
case 'level_up':
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
```
**상태**: ✅ 구현됨 (트렌드 상승 아이콘)

### 구현된 기능 요약

| 항목 | 파일 | 상태 |
|------|------|------|
| 레벨업 감지 | `activity-actions.ts:200-211` | ✅ 구현됨 |
| 알림 생성 함수 | `notifications/actions/create.ts` | ✅ 구현됨 |
| 알림 타입 정의 | `notifications/types/notification.ts:10` | ✅ 구현됨 |
| 알림 UI 아이콘 | `NotificationItem.tsx:56-61` | ✅ 구현됨 |
| 프로필 페이지 링크 | `/settings/profile` | ✅ 구현됨 |

### 추가 작업 필요 없음
모든 레벨업 알림 로직이 이미 완전히 구현되어 있습니다.

---

## 구현 현황 요약

### 전체 상태 (2025-12-30 업데이트)

| 기능 | 상태 | 비고 |
|------|------|------|
| 추천 받기 보상 | ✅ 완료 | 게시글/댓글 모두 구현됨 |
| 레벨업 알림 | ✅ 완료 | 전체 플로우 구현됨 |
| 연속 출석 보너스 | ✅ 완료 | DB 테이블 + 서버 액션 + UI 캘린더 |

### 체크리스트

```
[✅] 추천 받기 보상 - 완료
    [✅] 게시글 좋아요 보상 (posts/likes.ts)
    [✅] 댓글 좋아요 보상 (comments/likes.ts)
    [✅] 본인 좋아요 방지
    [✅] 일일 제한 (10회)

[✅] 레벨업 알림 - 완료
    [✅] 알림 타입 정의 (notification.ts)
    [✅] 알림 생성 함수 (create.ts)
    [✅] activity-actions에서 호출
    [✅] 알림 UI 아이콘 (NotificationItem.tsx)

[✅] 연속 출석 보너스 - 완료
    [✅] login_history 테이블 생성 (Supabase)
    [✅] recordDailyLogin 함수 구현
    [✅] calculateConsecutiveDays 함수 구현
    [✅] grantConsecutiveBonus 함수 구현
    [✅] signIn에서 호출 추가
    [✅] 상수 파일 업데이트 (CONSECUTIVE_LOGIN_BONUSES)
    [✅] 출석 캘린더 컴포넌트 구현 (AttendanceCalendar.tsx)
    [✅] PC: 프로필 기본정보에 캘린더 추가
    [✅] 모바일: 프로필 사이드바 글쓰기 버튼 위에 미니 캘린더 추가
```

### 남은 작업

**모든 Phase 2 작업 완료!**

구현된 기능:
- 연속 출석 보너스 (7일/14일/21일/30일)
- 출석 캘린더 (PC: full, 모바일: mini)
- 로그인 시 자동 출석 기록
- 추천 받기 보상 (게시글/댓글)
- 레벨업 알림

---

## 참고: 관련 파일 목록

### 기존 파일 (수정 필요)

| 기능 | 파일 경로 | 수정 내용 |
|------|----------|----------|
| 로그인 | `src/domains/auth/actions/auth.ts` | `recordDailyLogin()` 호출 추가 |
| 보상 지급 | `src/shared/actions/activity-actions.ts` | 연속 출석 로직 구현 |
| 보상 상수 | `src/shared/constants/rewards.ts` | 연속 출석 보너스 상수 추가 |
| PC 프로필 | `src/domains/settings/components/profile/ProfileForm.tsx` | full 캘린더 추가 |
| 모바일 사이드바 | `src/domains/sidebar/components/ProfileSidebar.tsx` | mini 캘린더 추가 (글쓰기 위) |

### 신규 파일 (생성 필요)

| 기능 | 파일 경로 |
|------|----------|
| 출석 캘린더 | `src/shared/components/AttendanceCalendar.tsx` |
| 출석 조회 액션 | `src/shared/actions/attendance-actions.ts` |

### 참고 파일 (이미 완료)

| 기능 | 파일 경로 |
|------|----------|
| 게시글 좋아요 | `src/domains/boards/actions/posts/likes.ts` |
| 댓글 좋아요 | `src/domains/boards/actions/comments/likes.ts` |
| 알림 생성 | `src/domains/notifications/actions/create.ts` |
| 알림 UI | `src/domains/notifications/components/NotificationItem.tsx` |
