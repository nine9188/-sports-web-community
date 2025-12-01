# 알림 시스템 구조 문서

## 📋 목차

1. [개요](#개요)
2. [알림 타입](#알림-타입)
3. [파일 구조](#파일-구조)
4. [핵심 컴포넌트](#핵심-컴포넌트)
5. [서버 액션](#서버-액션)
6. [사용 예시](#사용-예시)
7. [데이터베이스 스키마](#데이터베이스-스키마)

---

## 개요

이 프로젝트의 알림 시스템은 **Supabase Realtime**을 활용한 실시간 알림 기능을 제공합니다.

### 주요 기능

- ✅ 실시간 알림 푸시 (Supabase Postgres Changes 구독)
- ✅ 반응형 UI (PC 드롭다운 / 모바일 전체화면 모달)
- ✅ 8가지 알림 타입 지원
- ✅ 읽음/안읽음 상태 관리
- ✅ 자동 숨김 (2일 이상 된 읽은 알림)
- ✅ 일괄 작업 (선택, 삭제, 전체 읽음)
- ✅ 관리자 전체 공지 발송 기능
- ✅ 알림 발송 이력 로그

### 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (Realtime subscription)
- **State**: React hooks + Supabase client
- **UI**: Tailwind CSS + Framer Motion

---

## 알림 타입

총 **8가지** 알림 타입을 지원합니다:

| 타입 | 코드 | 설명 | 트리거 |
|-----|------|------|--------|
| 댓글 | `comment` | 내 게시글에 댓글이 달림 | 게시글 작성자에게 발송 |
| 답글 | `reply` | 내 댓글에 답글이 달림 | 댓글 작성자에게 발송 |
| 게시글 좋아요 | `post_like` | 내 게시글에 좋아요 | 게시글 작성자에게 발송 |
| 댓글 좋아요 | `comment_like` | 내 댓글에 좋아요 | 댓글 작성자에게 발송 |
| 레벨업 | `level_up` | 사용자 레벨 상승 | 시스템 자동 발송 |
| 신고 결과 | `report_result` | 신고 처리 완료 | 신고자에게 발송 |
| 관리자 공지 | `admin_notice` | 관리자가 특정 사용자에게 발송 | 관리자 패널에서 수동 발송 |
| 환영 알림 | `welcome` | 회원가입 환영 메시지 | 회원가입 시 자동 발송 |

---

## 파일 구조

```
src/domains/notifications/
├── types/
│   └── notification.ts              # 타입 정의
├── actions/
│   ├── index.ts                     # 액션 통합 export
│   ├── create.ts                    # 알림 생성 (8가지 타입별 함수)
│   ├── get.ts                       # 알림 조회 & 미읽음 개수
│   ├── read.ts                      # 읽음 처리 & 삭제
│   └── delete.ts                    # 일괄 삭제
├── utils/
│   └── filterNotifications.ts       # 오래된 알림 필터링
├── components/
│   ├── index.ts                     # 컴포넌트 export
│   ├── NotificationBell.tsx         # 🔔 벨 아이콘 (헤더)
│   ├── NotificationDropdown.tsx     # 💻 PC 드롭다운
│   ├── MobileNotificationModal.tsx  # 📱 모바일 모달
│   └── NotificationItem.tsx         # 📄 개별 알림 아이템
└── index.ts                         # 도메인 export

src/app/notifications/
├── layout.tsx                       # 인증 보호 레이아웃
└── page.tsx                         # 알림 센터 페이지

src/app/admin/notifications/
└── page.tsx                         # 관리자 공지 발송 패널
```

---

## 핵심 컴포넌트

### 1. `NotificationBell.tsx` 🔔

**위치**: 헤더에 배치되는 벨 아이콘

**주요 기능**:
- 실시간 알림 개수 업데이트 (Supabase Realtime 구독)
- 미읽음 알림 개수 배지 표시
- PC: 드롭다운 토글
- 모바일: 전체화면 모달 토글
- 클릭 시 자동 새로고침

**Props**:
```typescript
interface NotificationBellProps {
  userId: string;
}
```

**사용 예시**:
```tsx
import { NotificationBell } from '@/domains/notifications';

<NotificationBell userId={currentUser.id} />
```

---

### 2. `NotificationDropdown.tsx` 💻

**위치**: PC 화면에서 벨 아이콘 클릭 시 표시

**주요 기능**:
- 최근 알림 미리보기 (최대 제한)
- "모두 읽음으로 표시" 버튼
- "모두 보기" 링크 → `/notifications` 페이지로 이동
- 2일 이상 된 읽은 알림 자동 숨김
- 스크롤 가능한 목록

**Props**:
```typescript
interface NotificationDropdownProps {
  userId: string;
  onClose: () => void;
}
```

---

### 3. `MobileNotificationModal.tsx` 📱

**위치**: 모바일 화면에서 벨 아이콘 클릭 시 전체화면 표시

**주요 기능**:
- Portal 기반 렌더링 (SSR 안전)
- Body 스크롤 잠금
- 슬라이드 애니메이션
- PC 드롭다운과 동일한 기능

**Props**:
```typescript
interface MobileNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}
```

---

### 4. `NotificationItem.tsx` 📄

**위치**: 드롭다운, 모달, 알림 센터 페이지에서 사용

**주요 기능**:
- 타입별 아이콘 표시 (💬, 💙, ⭐, 🎉)
- 발신자 아바타 & 레벨 배지
- 메시지 미리보기 (50자 제한)
- 시간 표시 (상대 시간 또는 절대 시간)
- 읽음/안읽음 시각적 표시
- 체크박스 (일괄 선택용)
- 클릭 시 해당 게시글/댓글로 이동

**Props**:
```typescript
interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}
```

---

## 서버 액션

### 알림 생성 (`actions/create.ts`)

#### 1. `createNotification(params)`
기본 알림 생성 함수 (직접 호출보다는 아래 특화 함수 사용 권장)

```typescript
await createNotification({
  recipientId: 'user-uuid',
  actorId: 'actor-uuid',
  type: 'comment',
  message: '새로운 댓글이 달렸습니다.',
  metadata: { postId: 'post-uuid', commentId: 'comment-uuid' }
});
```

#### 2. `createCommentNotification()`
게시글에 댓글이 달렸을 때

```typescript
await createCommentNotification({
  postId: string,
  postTitle: string,
  commentContent: string,
  actorId: string,
  recipientId: string,
  boardSlug: string
});
```

#### 3. `createReplyNotification()`
댓글에 답글이 달렸을 때

```typescript
await createReplyNotification({
  postId: string,
  postTitle: string,
  replyContent: string,
  actorId: string,
  recipientId: string,
  boardSlug: string,
  parentCommentId: string
});
```

#### 4. `createPostLikeNotification()`
게시글에 좋아요가 눌렸을 때

```typescript
await createPostLikeNotification({
  postId: string,
  postTitle: string,
  actorId: string,
  recipientId: string,
  boardSlug: string
});
```

#### 5. `createCommentLikeNotification()`
댓글에 좋아요가 눌렸을 때

```typescript
await createCommentLikeNotification({
  postId: string,
  commentContent: string,
  actorId: string,
  recipientId: string,
  boardSlug: string,
  commentId: string
});
```

#### 6. `createLevelUpNotification()`
사용자 레벨 상승 시 (시스템 알림)

```typescript
await createLevelUpNotification({
  userId: string,
  newLevel: number
});
```

#### 7. `createReportResultNotification()`
신고 처리 완료 시

```typescript
await createReportResultNotification({
  reporterId: string,
  result: 'approved' | 'rejected',
  targetType: 'post' | 'comment',
  reason?: string
});
```

#### 8. `createAdminNoticeNotification()`
관리자가 특정 사용자에게 공지 발송

```typescript
await createAdminNoticeNotification({
  recipientId: string,
  title: string,
  message: string,
  link?: string,
  adminId: string
});
```

#### 9. `createBroadcastNotification()`
전체 사용자에게 공지 발송 (최근 활동 사용자 대상)

```typescript
await createBroadcastNotification({
  title: string,
  message: string,
  link?: string,
  adminId: string
});
```

#### 10. `createAdminNoticeWithLog()`
관리자 공지 + 로그 기록 (발송 이력 저장)

```typescript
const result = await createAdminNoticeWithLog({
  title: string,
  message: string,
  link?: string,
  adminId: string,
  recipientIds?: string[], // 없으면 전체 발송
  sendToAll?: boolean
});
```

#### 11. `createWelcomeNotification()`
회원가입 환영 알림 생성 (시스템 알림)

```typescript
await createWelcomeNotification({
  userId: string
});
```

**특징**:
- 읽을 때까지 유지 (자동 숨김 없음)
- 가이드 페이지 링크 포함
- 회원가입 성공 직후 자동 발송

---

### 알림 조회 (`actions/get.ts`)

#### 1. `getNotifications(userId, limit?)`
사용자의 알림 목록 조회

```typescript
const notifications = await getNotifications('user-uuid', 50);
```

**반환값**:
```typescript
{
  data: Notification[] | null;
  error: string | null;
}
```

#### 2. `getUnreadNotificationCount(userId)`
미읽음 알림 개수 조회

```typescript
const { count, error } = await getUnreadNotificationCount('user-uuid');
```

#### 3. `getNotificationLogs(adminId?)`
관리자 공지 발송 이력 조회

```typescript
const logs = await getNotificationLogs('admin-uuid');
```

---

### 알림 상태 관리 (`actions/read.ts`)

#### 1. `markNotificationAsRead(notificationId)`
개별 알림 읽음 처리

```typescript
await markNotificationAsRead('notification-uuid');
```

#### 2. `markAllNotificationsAsRead(userId)`
모든 미읽음 알림 읽음 처리

```typescript
await markAllNotificationsAsRead('user-uuid');
```

#### 3. `deleteNotification(notificationId)`
개별 알림 삭제

```typescript
await deleteNotification('notification-uuid');
```

---

### 알림 삭제 (`actions/delete.ts`)

#### 1. `deleteNotifications(notificationIds)`
여러 알림 일괄 삭제

```typescript
const result = await deleteNotifications(['uuid1', 'uuid2', 'uuid3']);
// result: { success: true, deletedCount: 3 }
```

---

### 필터링 유틸리티 (`utils/filterNotifications.ts`)

#### 1. `shouldShowNotification(notification)`
개별 알림이 표시되어야 하는지 판단

```typescript
const shouldShow = shouldShowNotification(notification);
// 읽은 알림 && 2일 이상 지난 경우 false 반환
```

#### 2. `filterOldReadNotifications(notifications)`
알림 배열에서 오래된 읽은 알림 제거

```typescript
const filtered = filterOldReadNotifications(allNotifications);
```

---

## 사용 예시

### 1. 댓글 작성 시 알림 발송

```typescript
// domains/boards/actions/comments.ts
'use server';

import { createCommentNotification } from '@/domains/notifications';

export async function createComment(postId: string, content: string) {
  // 1. 댓글 생성
  const comment = await supabase.from('comments').insert({
    post_id: postId,
    content,
    author_id: currentUserId
  });

  // 2. 게시글 작성자 조회
  const { data: post } = await supabase
    .from('posts')
    .select('author_id, title, board_slug')
    .eq('id', postId)
    .single();

  // 3. 알림 발송 (자기 자신에게는 발송 안 됨)
  if (post && post.author_id !== currentUserId) {
    await createCommentNotification({
      postId,
      postTitle: post.title,
      commentContent: content,
      actorId: currentUserId,
      recipientId: post.author_id,
      boardSlug: post.board_slug
    });
  }

  return comment;
}
```

---

### 2. 헤더에 알림 벨 추가

```tsx
// app/layout.tsx or components/Header.tsx
import { NotificationBell } from '@/domains/notifications';

export default function Header() {
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header>
      {/* ... other header content ... */}
      {user && <NotificationBell userId={user.id} />}
    </header>
  );
}
```

---

### 3. 관리자 전체 공지 발송

```tsx
// app/admin/notifications/page.tsx (already implemented)
'use client';

import { createAdminNoticeWithLog } from '@/domains/notifications';

async function sendNotice() {
  const result = await createAdminNoticeWithLog({
    title: '시스템 점검 안내',
    message: '오늘 밤 11시부터 새벽 1시까지 점검이 있습니다.',
    link: '/notices/123',
    adminId: currentAdmin.id,
    sendToAll: true
  });

  if (result.success) {
    alert(`${result.sentCount}명에게 발송 완료`);
  }
}
```

---

## 데이터베이스 스키마

### `notifications` 테이블

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'comment', 'reply', 'post_like', 'comment_like',
    'level_up', 'report_result', 'admin_notice', 'welcome'
  )),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),

  INDEX idx_recipient_created (recipient_id, created_at DESC),
  INDEX idx_recipient_read (recipient_id, is_read)
);
```

**필드 설명**:

| 필드 | 타입 | 설명 |
|-----|------|------|
| `id` | UUID | 알림 고유 ID |
| `recipient_id` | UUID | 수신자 (사용자 ID) |
| `actor_id` | UUID | 발신자 (행동 주체 사용자 ID, 시스템 알림은 NULL) |
| `type` | TEXT | 알림 타입 (8가지 중 하나) |
| `message` | TEXT | 알림 메시지 내용 |
| `metadata` | JSONB | 추가 정보 (postId, commentId, boardSlug, link 등) |
| `is_read` | BOOLEAN | 읽음 여부 |
| `created_at` | TIMESTAMPTZ | 생성 시간 |

**metadata 예시**:
```json
{
  "postId": "uuid",
  "commentId": "uuid",
  "boardSlug": "free",
  "postTitle": "게시글 제목",
  "link": "/boards/free/posts/uuid"
}
```

---

### `admin_notification_logs` 테이블

```sql
CREATE TABLE admin_notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  recipient_count INTEGER NOT NULL,
  send_to_all BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),

  INDEX idx_admin_created (admin_id, created_at DESC)
);
```

**필드 설명**:

| 필드 | 타입 | 설명 |
|-----|------|------|
| `id` | UUID | 로그 고유 ID |
| `admin_id` | UUID | 발송한 관리자 ID |
| `title` | TEXT | 공지 제목 |
| `message` | TEXT | 공지 내용 |
| `link` | TEXT | 연결 링크 (선택) |
| `recipient_count` | INTEGER | 발송된 사용자 수 |
| `send_to_all` | BOOLEAN | 전체 발송 여부 |
| `created_at` | TIMESTAMPTZ | 발송 시간 |

---

## 실시간 구독 설정

### Supabase Realtime 구독

`NotificationBell.tsx`에서 구현됨:

```typescript
useEffect(() => {
  const supabase = createClient();

  // 실시간 구독 시작
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`
      },
      () => {
        // 새 알림 도착 시 개수 업데이트
        fetchUnreadCount();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

**주의사항**:
- Supabase 프로젝트에서 Realtime이 활성화되어 있어야 함
- `notifications` 테이블에 대한 Realtime 권한 설정 필요

---

## 알림 흐름도

```
사용자 행동 (댓글, 좋아요 등)
    ↓
서버 액션 (domains/boards/actions/...)
    ↓
알림 생성 (createCommentNotification 등)
    ↓
Supabase INSERT
    ↓
Realtime 이벤트 발생
    ↓
NotificationBell 구독 감지
    ↓
미읽음 개수 업데이트
    ↓
사용자 UI 반영 (배지 숫자 증가)
```

---

## 커스터마이징 가이드

### 1. 새로운 알림 타입 추가

**Step 1**: `types/notification.ts`에 타입 추가
```typescript
export type NotificationType =
  | 'comment'
  | 'reply'
  // ...
  | 'new_type'; // 추가
```

**Step 2**: `actions/create.ts`에 생성 함수 추가
```typescript
export async function createNewTypeNotification(params: NewTypeParams) {
  return createNotification({
    recipientId: params.recipientId,
    actorId: params.actorId,
    type: 'new_type',
    message: params.message,
    metadata: params.metadata
  });
}
```

**Step 3**: `NotificationItem.tsx`에 아이콘/스타일 추가
```typescript
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    // ...
    case 'new_type':
      return '🆕';
  }
};
```

**Step 4**: 데이터베이스 `CHECK` 제약 조건 업데이트
```sql
ALTER TABLE notifications
DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('comment', 'reply', ..., 'new_type'));
```

---

### 2. 알림 메시지 커스터마이징

`actions/create.ts`의 각 함수에서 `message` 내용 수정:

```typescript
export async function createCommentNotification(params: CommentNotificationParams) {
  return createNotification({
    // ...
    message: `${params.postTitle}에 새로운 댓글이 달렸습니다: "${params.commentContent.slice(0, 50)}..."`,
    // 원하는 형식으로 변경 가능
  });
}
```

---

### 3. 알림 필터링 규칙 변경

`utils/filterNotifications.ts`에서 자동 숨김 기준 수정:

```typescript
export function shouldShowNotification(notification: Notification): boolean {
  if (!notification.is_read) return true;

  const now = new Date();
  const notificationDate = new Date(notification.created_at);
  const daysSince = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24);

  // 기본 2일 → 원하는 일수로 변경
  return daysSince < 7; // 7일로 변경 예시
}
```

---

## 트러블슈팅

### 1. 알림이 실시간으로 업데이트되지 않음

**원인**: Supabase Realtime이 비활성화됨

**해결**:
1. Supabase 대시보드 → Database → Replication
2. `notifications` 테이블 Realtime 활성화
3. RLS 정책 확인

---

### 2. 자기 자신에게 알림이 발송됨

**원인**: `createNotification` 함수의 자기 발송 방지 로직 누락

**해결**:
```typescript
// actions/create.ts의 createNotification 함수에 이미 구현됨
if (recipientId === actorId) {
  return { data: null, error: 'Cannot send notification to self' };
}
```

---

### 3. 알림 개수가 정확하지 않음

**원인**: 캐시된 개수가 업데이트되지 않음

**해결**:
```typescript
// NotificationBell.tsx에서 알림 드롭다운 열 때 강제 새로고침
const handleToggle = async () => {
  setIsOpen(!isOpen);
  if (!isOpen) {
    await fetchUnreadCount(); // 강제 새로고침
  }
};
```

---

## 성능 최적화

### 1. 알림 목록 페이지네이션

현재 최대 100개로 제한되어 있음. 더 많은 알림을 처리하려면:

```typescript
// actions/get.ts
export async function getNotifications(
  userId: string,
  limit = 50,
  offset = 0 // 추가
) {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (id, nickname, icon_url, level)
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1); // 페이지네이션

  return { data, error };
}
```

---

### 2. 데이터베이스 인덱스

이미 적용된 인덱스:
```sql
-- 알림 목록 조회 최적화
CREATE INDEX idx_recipient_created ON notifications (recipient_id, created_at DESC);

-- 미읽음 개수 조회 최적화
CREATE INDEX idx_recipient_read ON notifications (recipient_id, is_read);
```

---

### 3. 오래된 알림 자동 삭제

Supabase에서 cron job 설정:

```sql
-- 30일 이상 된 읽은 알림 삭제 (매일 자정 실행)
SELECT cron.schedule(
  'delete-old-notifications',
  '0 0 * * *', -- 매일 자정
  $$
  DELETE FROM notifications
  WHERE is_read = true
    AND created_at < now() - INTERVAL '30 days';
  $$
);
```

---

## 보안 고려사항

### Row Level Security (RLS) 정책

```sql
-- 사용자는 자신의 알림만 조회 가능
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = recipient_id);

-- 사용자는 자신의 알림만 수정 가능 (읽음 처리)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- 사용자는 자신의 알림만 삭제 가능
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = recipient_id);

-- 인증된 사용자는 알림 생성 가능 (서버 액션에서만)
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

---

## 관련 문서

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|-----|----------|--------|
| 2025-12-01 | 초기 문서 작성 | Claude Code |
| 2025-12-01 | 환영 알림 (welcome) 타입 추가 | Claude Code |

---

**문서 작성일**: 2025-12-01
**마지막 업데이트**: 2025-12-01
**버전**: 1.1.0
