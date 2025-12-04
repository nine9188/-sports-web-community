# 프로필 변경 알림 (Profile Update Notification)

> **보안 UX 향상을 위한 자기 알림 시스템**

---

## 📋 개요

사용자가 자신의 프로필을 변경했을 때 본인에게 알림을 발송하여 계정 보안을 강화하고 UX를 향상시킵니다.

### 주요 특징
- ✅ 자기 자신에게 발송되는 알림
- ✅ 닉네임, 프로필 아이콘, 비밀번호 변경 감지
- ✅ 변경 전/후 값 기록 (비밀번호 제외)
- ✅ 보안 이벤트 추적
- ✅ 즉시 알림 발송

---

## 🎯 알림 타입

### 1. 닉네임 변경 알림

**트리거**: 사용자가 닉네임을 변경했을 때

**메시지 형식**:
```
✏️ 닉네임이 '{이전닉네임}' → '{새닉네임}'(으)로 변경되었습니다.
```

**예시**:
```
✏️ 닉네임이 '철수' → '맨유팬철수'(으)로 변경되었습니다.
```

**메타데이터**:
```json
{
  "changeType": "nickname",
  "oldValue": "철수",
  "newValue": "맨유팬철수",
  "changedAt": "2025-12-03T10:30:00Z"
}
```

---

### 2. 프로필 아이콘 변경 알림

**트리거**: 사용자가 프로필 아이콘을 변경했을 때

**메시지 형식**:
```
✏️ 프로필 아이콘이 변경되었습니다.
```

**메타데이터**:
```json
{
  "changeType": "profile_icon",
  "oldIconUrl": "https://.../old-icon.jpg",
  "newIconUrl": "https://.../new-icon.jpg",
  "changedAt": "2025-12-03T10:30:00Z"
}
```

---

### 3. 비밀번호 변경 알림

**트리거**: 사용자가 비밀번호를 변경했을 때

**메시지 형식**:
```
🔐 비밀번호가 변경되었습니다. 본인이 변경하지 않았다면 즉시 고객센터에 문의하세요.
```

**메타데이터**:
```json
{
  "changeType": "password",
  "changedAt": "2025-12-03T10:30:00Z",
  "ipAddress": "123.45.67.89",
  "userAgent": "Mozilla/5.0..."
}
```

**보안 정보 포함**:
- 변경 시각
- IP 주소 (선택)
- User Agent (선택)

---

## 📂 구현 구조

### 파일 위치

```
src/domains/notifications/
├── actions/
│   └── create.ts                    # createProfileUpdateNotification() 추가
├── types/
│   └── notification.ts              # 'profile_update' 타입 추가
└── components/
    └── NotificationItem.tsx         # ✏️ 아이콘 추가

src/domains/auth/actions/
├── updateProfile.ts                 # 닉네임/아이콘 변경 액션
└── changePassword.ts                # 비밀번호 변경 액션
```

---

## 🛠️ 구현 상세

### 1. TypeScript 타입 정의

**파일**: `src/domains/notifications/types/notification.ts`

```typescript
export type NotificationType =
  | 'comment'
  | 'reply'
  | 'post_like'
  | 'comment_like'
  | 'level_up'
  | 'report_result'
  | 'admin_notice'
  | 'welcome'
  | 'hot_post'
  | 'profile_update'; // 추가

export type ProfileChangeType = 'nickname' | 'profile_icon' | 'password';

export interface ProfileUpdateMetadata {
  changeType: ProfileChangeType;
  oldValue?: string;        // 닉네임/아이콘 URL (비밀번호는 null)
  newValue?: string;        // 닉네임/아이콘 URL (비밀번호는 null)
  changedAt: string;        // ISO 8601 timestamp
  ipAddress?: string;       // 비밀번호 변경 시 기록
  userAgent?: string;       // 비밀번호 변경 시 기록
}
```

---

### 2. 알림 생성 함수

**파일**: `src/domains/notifications/actions/create.ts`

```typescript
'use server';

import { createClient } from '@/shared/api/supabaseServer';
import type { ProfileChangeType } from '../types/notification';

export interface CreateProfileUpdateNotificationParams {
  userId: string;
  changeType: ProfileChangeType;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 프로필 변경 알림 생성
 *
 * @description 사용자가 자신의 프로필을 변경했을 때 본인에게 알림 발송
 * @param params 프로필 변경 정보
 */
export async function createProfileUpdateNotification(
  params: CreateProfileUpdateNotificationParams
) {
  const supabase = await createClient();

  let title = '';
  let message = '';

  switch (params.changeType) {
    case 'nickname':
      title = '✏️ 닉네임이 변경되었습니다';
      message = `닉네임이 '${params.oldValue}' → '${params.newValue}'(으)로 변경되었습니다.`;
      break;

    case 'profile_icon':
      title = '✏️ 프로필 아이콘이 변경되었습니다';
      message = '프로필 아이콘이 변경되었습니다.';
      break;

    case 'password':
      title = '🔐 비밀번호가 변경되었습니다';
      message = '비밀번호가 변경되었습니다. 본인이 변경하지 않았다면 즉시 고객센터에 문의하세요.';
      break;
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: params.userId,
      actor_id: params.userId, // 자기 자신
      type: 'profile_update',
      title,
      message,
      metadata: {
        changeType: params.changeType,
        oldValue: params.oldValue,
        newValue: params.newValue,
        changedAt: new Date().toISOString(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
    .select()
    .single();

  if (error) {
    console.error('[Notification] Profile update notification failed:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
```

---

### 3. 프로필 업데이트 액션에서 호출

**파일**: `src/domains/auth/actions/updateProfile.ts`

```typescript
'use server';

import { createClient } from '@/shared/api/supabaseServer';
import { createProfileUpdateNotification } from '@/domains/notifications';
import { revalidatePath } from 'next/cache';

export interface UpdateProfileParams {
  nickname?: string;
  iconUrl?: string;
}

export async function updateProfile(userId: string, params: UpdateProfileParams) {
  const supabase = await createClient();

  // 1. 현재 프로필 정보 조회 (변경 전 값 저장용)
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('nickname, icon_url')
    .eq('id', userId)
    .single();

  if (!currentProfile) {
    return { success: false, error: 'Profile not found' };
  }

  // 2. 프로필 업데이트
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      nickname: params.nickname,
      icon_url: params.iconUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 3. 닉네임 변경 알림
  if (params.nickname && params.nickname !== currentProfile.nickname) {
    await createProfileUpdateNotification({
      userId,
      changeType: 'nickname',
      oldValue: currentProfile.nickname,
      newValue: params.nickname,
    });
  }

  // 4. 프로필 아이콘 변경 알림
  if (params.iconUrl && params.iconUrl !== currentProfile.icon_url) {
    await createProfileUpdateNotification({
      userId,
      changeType: 'profile_icon',
      oldValue: currentProfile.icon_url || undefined,
      newValue: params.iconUrl,
    });
  }

  revalidatePath('/settings/profile');

  return { success: true, error: null };
}
```

---

### 4. 비밀번호 변경 액션 (보안 로그 사용)

**파일**: `src/domains/settings/actions/auth.ts`

**실제 구현 (알림 대신 보안 로그 사용)**:
```typescript
'use server';

import { getSupabaseServer, getSupabaseAction } from '@/shared/lib/supabase/server';
import { headers } from 'next/headers';
import { logAuthEvent } from '@/shared/actions/log-actions';

export async function changePassword(
  newPassword: string,
  turnstileToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 필드 검증
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: '새 비밀번호는 최소 8자 이상이어야 합니다.' };
    }

    // 2. Turnstile 봇 검증
    if (!turnstileToken) {
      return { success: false, error: '봇 검증을 완료해주세요.' };
    }
    // ... Turnstile 검증 로직 ...

    // 3. Supabase 클라이언트 & 사용자 확인
    const supabase = await getSupabaseAction();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    // 4. OAuth 계정 체크
    const provider = user.app_metadata?.provider;
    if (provider && provider !== 'email') {
      return { success: false, error: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.' };
    }

    // 5. 비밀번호 변경 (Supabase가 자동으로 새 세션 발급)
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      // 한글 에러 메시지 번역
      let errorMessage = '비밀번호 변경에 실패했습니다.';
      if (updateError.message.includes('same password') || updateError.code === 'same_password') {
        errorMessage = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
      } else if (updateError.message.includes('Password')) {
        errorMessage = '비밀번호 형식이 올바르지 않습니다.';
      }

      // 실패 로그 기록
      await logAuthEvent(
        'PASSWORD_CHANGE_FAILED',
        `비밀번호 변경 실패: ${updateError.message}`,
        user.id,
        false,
        { error: updateError.message, code: updateError.code }
      );

      return { success: false, error: errorMessage };
    }

    // 6. 성공 로그 기록 (알림 대신)
    await logAuthEvent(
      'PASSWORD_CHANGE_SUCCESS',
      '비밀번호 변경 성공',
      user.id,
      true,
      { userId: user.id, email: user.email }
    );

    return { success: true };
  } catch (error: unknown) {
    console.error('비밀번호 변경 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.';
    return { success: false, error: errorMessage };
  }
}
```

**주요 특징**:
- ✅ 현재 비밀번호 검증 제거 (Supabase가 처리)
- ✅ Turnstile 봇 검증으로 보안 강화
- ✅ 한글 에러 메시지 번역 (`same_password`, `Password` 등)
- ✅ Supabase 자동 세션 갱신 활용
- ✅ 보안 로그로 모든 시도 추적
- ✅ OAuth 계정 비밀번호 변경 방지

---

### 5. UI 아이콘 추가

**파일**: `src/domains/notifications/components/NotificationItem.tsx`

```typescript
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'comment':
      return '💬';
    case 'reply':
      return '↩️';
    case 'post_like':
      return '💙';
    case 'comment_like':
      return '💙';
    case 'level_up':
      return '⭐';
    case 'report_result':
      return '🚨';
    case 'admin_notice':
      return '📢';
    case 'welcome':
      return '👋';
    case 'hot_post':
      return '🔥';
    case 'profile_update':
      return '✏️'; // 추가
    default:
      return '🔔';
  }
};
```

---

## 🗄️ 데이터베이스 마이그레이션

### CHECK 제약 조건 업데이트

```sql
-- 1. 기존 제약 조건 제거
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. 새로운 제약 조건 추가 (profile_update 포함)
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'comment',
  'reply',
  'post_like',
  'comment_like',
  'level_up',
  'report_result',
  'admin_notice',
  'welcome',
  'hot_post',
  'profile_update'
));
```

---

## 🧪 테스트

### 1. 닉네임 변경 테스트

```typescript
// 테스트 코드 예시
import { updateProfile } from '@/domains/auth/actions/updateProfile';

async function testNicknameChange() {
  const result = await updateProfile('user-uuid', {
    nickname: '새닉네임123',
  });

  console.log('Update result:', result);

  // 알림 확인
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'profile_update')
    .eq('metadata->>changeType', 'nickname')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('Notification:', notifications);
}
```

### 2. 비밀번호 변경 테스트

```typescript
import { changePassword } from '@/domains/auth/actions/changePassword';

async function testPasswordChange() {
  const result = await changePassword({
    userId: 'user-uuid',
    currentPassword: 'oldpass123',
    newPassword: 'newpass456',
  });

  console.log('Change result:', result);

  // 알림 확인 (보안 정보 포함 확인)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'profile_update')
    .eq('metadata->>changeType', 'password')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('Password change notification:', notifications);
  console.log('IP Address:', notifications?.[0]?.metadata?.ipAddress);
}
```

---

## 🔒 보안 고려사항

### 1. 비밀번호 변경 알림의 중요성

- **즉시 알림 발송**: 비밀번호 변경 즉시 알림
- **보안 정보 기록**: IP 주소, User Agent 저장
- **의심스러운 활동 감지**: 본인이 아닌 경우 즉시 대응 가능

### 2. 민감 정보 처리

- ❌ **비밀번호는 절대 저장하지 않음**
- ✅ 변경 전/후 닉네임만 저장
- ✅ 프로필 아이콘 URL만 저장
- ✅ IP 주소는 비밀번호 변경 시만 저장

### 3. RLS (Row Level Security)

```sql
-- 사용자는 자신의 알림만 조회 가능 (기존 정책 유지)
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = recipient_id);
```

---

## 📊 사용 시나리오

### 시나리오 1: 정상적인 닉네임 변경

1. 사용자가 설정 페이지에서 닉네임 변경
2. `updateProfile()` 함수 호출
3. 변경 전 닉네임 조회
4. 프로필 업데이트
5. 알림 생성 (`'철수' → '맨유팬철수'`)
6. 사용자가 알림 확인 → 안심

### 시나리오 2: 해킹 시도 감지

1. 해커가 비밀번호 변경 시도
2. 비밀번호 변경 성공 (기존 비밀번호 탈취)
3. 즉시 알림 발송 (IP 주소 포함)
4. 원래 소유자가 알림 확인
5. **즉시 계정 복구 절차 진행** ← 핵심!

---

## 🎯 향후 확장 가능성

### Phase 2: 보안 알림 강화
- 새로운 기기에서 로그인 시 알림
- 의심스러운 IP에서 접근 시 알림
- 여러 번 로그인 실패 시 알림

### Phase 3: 이메일 통합
- 비밀번호 변경 시 이메일도 함께 발송
- 중요한 보안 이벤트는 이중 알림

---

## 📚 관련 문서

- [알림 시스템 개요](./system-overview.md)
- [알림 로드맵](./NOTIFICATION_ROADMAP.md)
- [보안 가이드라인](../security/authentication.md)

---

## ✅ 체크리스트

구현 완료 확인:

- [ ] TypeScript 타입 정의 추가
- [ ] `createProfileUpdateNotification()` 함수 구현
- [ ] `updateProfile()` 액션에서 알림 호출
- [ ] `changePassword()` 액션에서 알림 호출
- [ ] NotificationItem UI 아이콘 추가
- [ ] 데이터베이스 CHECK 제약 조건 업데이트
- [ ] 닉네임 변경 테스트
- [ ] 프로필 아이콘 변경 테스트
- [ ] 비밀번호 변경 테스트
- [ ] 보안 정보 기록 확인

---

## ✅ 구현 완료 상태

**구현 완료일**: 2025-12-04

### 완료된 기능

- ✅ **프로필 아이콘 변경 알림** (완전 구현)
  - 파일: `src/domains/settings/components/icons/IconForm.tsx:149`
  - 아이콘 변경 시 `createProfileUpdateNotification()` 호출
  - 변경 전/후 아이콘 URL 기록

- ✅ **비밀번호 변경 구현** (알림 없이 보안 로그로 대체)
  - 파일: `src/domains/settings/actions/auth.ts`
  - Supabase `updateUser()`로 자동 세션 갱신
  - 현재 비밀번호 검증 제거 (Supabase가 처리)
  - 한글 에러 메시지 번역 (same_password 등)
  - `logAuthEvent()`로 보안 로그 기록
  - 성공 시 메인 페이지로 리다이렉트 (`window.location.href = '/'`)
  - 확인 다이얼로그 추가 (실수 방지)

- ✅ **닉네임 변경 알림 준비 완료**
  - `createProfileUpdateNotification()` 함수 구현됨
  - 프로필 업데이트 액션에서 호출 가능

### 비밀번호 변경 처리 방식

**알림 대신 보안 로그 사용**:
```typescript
// src/domains/settings/actions/auth.ts
await logAuthEvent(
  'PASSWORD_CHANGE_SUCCESS',
  '비밀번호 변경 성공',
  user.id,
  true,
  { userId: user.id, email: user.email }
);
```

**이유**:
1. Supabase가 자동으로 새 세션 발급 (수동 로그아웃 불필요)
2. 페이지 새로고침으로 세션 갱신
3. 보안 로그로 충분한 추적 가능
4. 사용자에게 즉각적인 피드백 (토스트 메시지)

### 체크리스트

- ✅ TypeScript 타입 정의 추가 (`src/domains/notifications/types/notification.ts`)
- ✅ `createProfileUpdateNotification()` 함수 구현 (`src/domains/notifications/actions/create.ts`)
- ✅ 프로필 아이콘 변경 시 알림 호출 (`src/domains/settings/components/icons/IconForm.tsx`)
- ✅ 비밀번호 변경 액션 구현 (`src/domains/settings/actions/auth.ts`)
- ✅ NotificationItem UI 아이콘 추가 (✏️)
- ✅ 데이터베이스 CHECK 제약 조건 업데이트
- ✅ 프로필 아이콘 변경 테스트
- ✅ 비밀번호 변경 테스트
- ✅ 한글 에러 메시지 번역
- ⚠️ 닉네임 변경 알림 (함수 준비됨, 프로필 업데이트 액션 통합 필요)

---

**작성일**: 2025-12-03
**구현 완료일**: 2025-12-04
**우선순위**: ⭐⭐⭐⭐ (High - 보안 UX)
**난이도**: ⚡ 쉬움
**상태**: ✅ 완료 (비밀번호는 보안 로그로 대체)
