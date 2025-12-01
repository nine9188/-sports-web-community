# 알림 시스템 확장 로드맵

## 📊 우선순위 분석

### 🔥 즉시 구현 가능 (High Priority + Low Effort)

현재 인프라로 **바로 추가 가능**하고 **효과가 큰** 기능들

#### 1. ✅ 회원가입 웰컴 알림 (완료)
**구현 완료일**: 2025-12-01
**구현 내용**:
- ✅ `createWelcomeNotification()` 함수 구현 완료
- ✅ `auth/actions/signup.ts`에서 회원가입 후 자동 호출
- ✅ 읽을 때까지 유지 (자동 숨김 없음으로 변경)
- ✅ `NotificationItem.tsx`에 스마일 이모지 아이콘 추가
- ✅ 데이터베이스 CHECK 제약조건에 'welcome' 타입 추가
- ✅ TypeScript 타입 정의 추가

**구현 위치**:
- [create.ts:397-415](c:\Users\USER\Desktop\web2\123\1234\src\domains\notifications\actions\create.ts#L397-L415) - 생성 함수
- [signup.ts:149-156](c:\Users\USER\Desktop\web2\123\1234\src\domains\auth\actions\signup.ts#L149-L156) - 트리거
- [NotificationItem.tsx:63-68](c:\Users\USER\Desktop\web2\123\1234\src\domains\notifications\components\NotificationItem.tsx#L63-L68) - UI 아이콘
- [notification.ts:11](c:\Users\USER\Desktop\web2\123\1234\src\domains\notifications\types\notification.ts#L11) - 타입 정의

**실제 메시지**:
```
환영합니다! 4590 Football에 오신 것을 환영합니다! 👋
커뮤니티 가이드와 인기 게시판을 둘러보세요!
```

**링크**: `/guide/beginner`

---

#### 2. 내 게시글 HOT 이슈 알림 ⭐⭐⭐⭐⭐
**구현 난이도**: ⚡⚡ 보통 (3-4시간)
**효과**: 🎯 유저가 가장 좋아하는 기능, 재방문율 증가
**필요 작업**:
- `createHotPostNotification()` 함수 추가
- 좋아요/댓글 수 트리거 로직 (Supabase Function 또는 Server Action)
- 중복 발송 방지 (이미 HOT 알림 받았으면 다시 안 보냄)

```typescript
// domains/notifications/actions/create.ts
export async function createHotPostNotification(params: {
  postId: string;
  postTitle: string;
  authorId: string;
  boardSlug: string;
  trigger: 'likes' | 'comments' | 'views' | 'trending';
  count?: number;
}) {
  // 중복 발송 방지: 이미 HOT 알림 받았는지 확인
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('recipient_id', params.authorId)
    .eq('type', 'hot_post')
    .eq('metadata->>postId', params.postId)
    .single();

  if (existing) return { data: null, error: 'Already notified' };

  let message = '';
  switch (params.trigger) {
    case 'likes':
      message = `🔥 당신의 게시글이 좋아요 ${params.count}개를 돌파했습니다!`;
      break;
    case 'comments':
      message = `🔥 당신의 게시글에 댓글 ${params.count}개가 달렸습니다!`;
      break;
    case 'views':
      message = `🔥 당신의 게시글이 조회수 ${params.count}회를 돌파했습니다!`;
      break;
    case 'trending':
      message = `🔥 당신의 게시글이 실시간 인기글에 올랐습니다!`;
      break;
  }

  return createNotification({
    recipientId: params.authorId,
    actorId: null,
    type: 'hot_post',
    message,
    metadata: {
      postId: params.postId,
      postTitle: params.postTitle,
      boardSlug: params.boardSlug,
      trigger: params.trigger,
      count: params.count
    }
  });
}
```

**트리거 위치**:
- `domains/boards/actions/likes.ts` - 좋아요 20개 도달 시
- `domains/boards/actions/comments.ts` - 댓글 15개 도달 시
- Supabase Function (배치) - 1시간마다 조회수 체크

---

#### 3. 프로필 변경 알림 (자기 알림) ⭐⭐⭐⭐
**구현 난이도**: ⚡ 쉬움 (1시간)
**효과**: 🔒 보안 + UX 향상
**필요 작업**:
- `createProfileUpdateNotification()` 함수 추가
- 닉네임/프로필 이미지 변경 액션에서 호출

```typescript
// domains/notifications/actions/create.ts
export async function createProfileUpdateNotification(params: {
  userId: string;
  changeType: 'nickname' | 'profile_image' | 'password';
  oldValue?: string;
  newValue?: string;
}) {
  let message = '';
  switch (params.changeType) {
    case 'nickname':
      message = `닉네임이 '${params.oldValue}' → '${params.newValue}'로 변경되었습니다.`;
      break;
    case 'profile_image':
      message = '프로필 이미지 변경이 완료되었습니다.';
      break;
    case 'password':
      message = '비밀번호가 변경되었습니다.';
      break;
  }

  return createNotification({
    recipientId: params.userId,
    actorId: params.userId, // 자기 자신
    type: 'profile_update',
    message,
    metadata: {
      changeType: params.changeType,
      timestamp: new Date().toISOString()
    }
  });
}
```

**트리거 위치**: `domains/auth/actions/updateProfile.ts`

---

#### 4. 포인트 획득 알림 강화 ⭐⭐⭐⭐
**구현 난이도**: ⚡ 쉬움 (1시간)
**효과**: 🎮 게임화 요소 강화, 참여도 증가
**필요 작업**:
- `createPointEarnedNotification()` 함수 추가
- 포인트 지급 액션에서 호출

```typescript
// domains/notifications/actions/create.ts
export async function createPointEarnedNotification(params: {
  userId: string;
  points: number;
  reason: string;
  action?: string;
}) {
  return createNotification({
    recipientId: params.userId,
    actorId: null,
    type: 'point_earned',
    message: `🎉 포인트 ${params.points}점 획득! ${params.reason}`,
    metadata: {
      points: params.points,
      reason: params.reason,
      action: params.action
    }
  });
}
```

**트리거 위치**:
- `domains/points/actions/` - 출석체크, 게시글 작성, 댓글 작성 등

---

### 🎯 단기 구현 추천 (Medium Priority + Medium Effort)

1-2주 내 구현하면 좋은 기능들

#### 5. 댓글 멘션(@) 알림 ⭐⭐⭐⭐⭐
**구현 난이도**: ⚡⚡⚡ 중간-어려움 (1일)
**효과**: 🎯 실시간 상호작용 극대화
**필요 작업**:
- 댓글 입력 시 `@username` 파싱 로직 추가
- 멘션된 사용자 조회
- `createMentionNotification()` 함수 추가

```typescript
// domains/boards/utils/parseMentions.ts
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.matchAll(mentionRegex);
  return Array.from(matches).map(match => match[1]);
}

// domains/notifications/actions/create.ts
export async function createMentionNotification(params: {
  mentionedUsername: string;
  actorId: string;
  postId: string;
  commentId: string;
  commentContent: string;
  boardSlug: string;
}) {
  // 1. 멘션된 사용자 ID 찾기
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', params.mentionedUsername)
    .single();

  if (!user) return { data: null, error: 'User not found' };

  // 2. 알림 생성
  return createNotification({
    recipientId: user.id,
    actorId: params.actorId,
    type: 'mention',
    message: `@${params.mentionedUsername}님을 언급했습니다: "${params.commentContent.slice(0, 50)}..."`,
    metadata: {
      postId: params.postId,
      commentId: params.commentId,
      boardSlug: params.boardSlug
    }
  });
}
```

**트리거 위치**: `domains/boards/actions/comments.ts` 댓글 생성 시

**추가 고려사항**:
- 한 댓글에서 여러 명 멘션 가능
- 존재하지 않는 사용자 멘션 시 무시
- 자기 자신 멘션 시 알림 안 보냄

---

#### 6. 게시판/팀 팔로우 새 글 알림 ⭐⭐⭐⭐
**구현 난이도**: ⚡⚡⚡ 중간 (1일)
**효과**: 🎯 커뮤니티 활성도 대폭 증가
**필요 작업**:
- `board_follows` 테이블 생성 (user_id, board_slug, created_at)
- 게시글 작성 시 팔로워 조회 후 알림 발송
- `createNewPostInFollowedBoardNotification()` 함수 추가

```typescript
// 데이터베이스 마이그레이션 필요
// CREATE TABLE board_follows (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   board_slug TEXT NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT now(),
//   UNIQUE(user_id, board_slug)
// );

// domains/notifications/actions/create.ts
export async function notifyFollowersOfNewPost(params: {
  boardSlug: string;
  postId: string;
  postTitle: string;
  authorId: string;
}) {
  // 1. 해당 게시판 팔로워 조회
  const { data: followers } = await supabase
    .from('board_follows')
    .select('user_id')
    .eq('board_slug', params.boardSlug);

  if (!followers || followers.length === 0) return;

  // 2. 작성자 제외
  const recipientIds = followers
    .map(f => f.user_id)
    .filter(id => id !== params.authorId);

  // 3. 일괄 알림 생성 (최대 100명까지만)
  const notifications = recipientIds.slice(0, 100).map(recipientId => ({
    recipient_id: recipientId,
    actor_id: params.authorId,
    type: 'followed_board_new_post',
    message: `🔥 ${getBoardName(params.boardSlug)} 게시판에 새 글이 올라왔습니다: "${params.postTitle}"`,
    metadata: {
      postId: params.postId,
      boardSlug: params.boardSlug
    }
  }));

  await supabase.from('notifications').insert(notifications);
}
```

**트리거 위치**: `domains/boards/actions/posts.ts` 게시글 생성 시

**주의사항**:
- 팔로워가 많으면 성능 이슈 → 배치 처리 또는 큐 시스템 고려
- 스팸 방지: 같은 게시판에 짧은 시간 여러 글 작성 시 알림 throttle

---

### 🔮 중장기 구현 추천 (Low Priority 또는 High Effort)

인프라 확장 또는 기능 추가 후 구현 권장

#### 7. 경기 시작/스코어 변경 알림 ⭐⭐⭐⭐⭐
**구현 난이도**: ⚡⚡⚡⚡ 어려움 (3-5일)
**효과**: 🎯 킬러 피처! 앱 재방문율 극대화
**필요 작업**:
- `match_subscriptions` 테이블 생성
- 라이브스코어 데이터 변경 감지 (Webhook 또는 폴링)
- 푸시 알림 인프라 (Firebase Cloud Messaging 등)

**왜 나중에?**:
- 라이브스코어 API 실시간 webhook 필요
- 푸시 알림 서버 구축 필요
- 대량 알림 발송 인프라 필요

**구현 순서**:
1. 먼저 웹 알림으로 시작 (현재 시스템)
2. 이메일 알림 추가 (Supabase Email)
3. 푸시 알림 추가 (FCM)

---

#### 8. DM(쪽지) 알림 ⭐⭐⭐
**구현 난이도**: ⚡⚡⚡⚡ 어려움 (1주)
**효과**: 🎯 SNS 기능 확장
**필요 작업**:
- `direct_messages` 테이블 생성
- 채팅 UI 구현
- 실시간 메시지 전송 (Supabase Realtime)

**왜 나중에?**:
- DM 기능 자체가 아직 없음
- 별도 기능 구현 후 알림은 쉽게 추가 가능

---

#### 9. 친구/팔로우 알림 ⭐⭐
**구현 난이도**: ⚡⚡⚡ 중간 (2-3일)
**효과**: 🎯 SNS 기능 확장
**필요 작업**:
- `user_follows` 테이블 생성
- 팔로우 기능 UI
- `createFollowNotification()` 함수

**왜 나중에?**:
- 현재 커뮤니티 중심, SNS 기능은 우선순위 낮음
- 게시판 팔로우가 더 중요

---

#### 10. 계정 보안 알림 ⭐⭐⭐⭐⭐
**구현 난이도**: ⚡⚡⚡⚡ 어려움 (3일)
**효과**: 🔒 보안 사고 방지
**필요 작업**:
- IP/기기 추적 로직
- Supabase Auth Hooks 활용
- 비정상 로그인 감지

```typescript
// domains/notifications/actions/create.ts
export async function createSecurityAlertNotification(params: {
  userId: string;
  alertType: 'new_device' | 'password_change' | 'suspicious_login';
  deviceInfo?: string;
  location?: string;
}) {
  let message = '';
  switch (params.alertType) {
    case 'new_device':
      message = `🔐 새로운 기기에서 로그인했습니다. (${params.deviceInfo})`;
      break;
    case 'password_change':
      message = '🔐 비밀번호가 변경되었습니다.';
      break;
    case 'suspicious_login':
      message = `⚠️ 의심스러운 로그인 시도가 감지되었습니다. (${params.location})`;
      break;
  }

  return createNotification({
    recipientId: params.userId,
    actorId: null,
    type: 'security_alert',
    message,
    metadata: {
      alertType: params.alertType,
      deviceInfo: params.deviceInfo,
      location: params.location,
      timestamp: new Date().toISOString()
    }
  });
}
```

**왜 나중에?**:
- Supabase Auth 커스터마이징 필요
- 보안 로직 복잡도 높음
- 실서비스 론칭 후 추가 권장

---

### ❌ 굳이 안 해도 되는 기능

#### 11. 신고 누적 경고 알림
**이유**:
- 이미 `report_result` 알림 있음
- 경고 시스템은 관리자 패널에서 직접 처리하는 게 나음
- 자동 경고는 악용 가능성 있음

**대안**:
- 관리자가 직접 `createAdminNoticeNotification()`으로 경고 발송

---

#### 12. 관리자 직접 멘션 알림
**이유**:
- 이미 `createAdminNoticeNotification()` 함수 있음
- 별도 타입 만들 필요 없음

**대안**:
- 현재 관리자 공지로 충분

---

#### 13. 게시판 운영 자동 알림 (모더레이터용)
**이유**:
- 아직 모더레이터 권한 시스템 없음
- 관리자 대시보드로 충분

**대안**:
- 관리자 대시보드에 신고 리스트 표시
- 나중에 모더레이터 기능 추가 시 고려

---

## 📅 구현 로드맵

### Phase 1: 즉시 구현 (1주 이내)
```
✅ 1. 회원가입 웰컴 알림 (완료 - 2025-12-01)
🔄 2. HOT 이슈 알림 (3-4시간)
🔄 3. 프로필 변경 알림 (1시간)
🔄 4. 포인트 획득 알림 (1시간)
```
**진행 상황**: 1/4 완료 (25%)
**남은 예상 시간**: 5-6시간

---

### Phase 2: 단기 구현 (2-4주)
```
🔄 5. 댓글 멘션(@) 알림 (1일)
🔄 6. 게시판/팀 팔로우 새 글 알림 (1일)
```
**예상 소요 시간**: 2일

---

### Phase 3: 중장기 구현 (1-3개월)
```
🔮 7. 경기 스코어 알림 + 푸시 (1-2주)
🔮 10. 계정 보안 알림 (3일)
```
**예상 소요 시간**: 2-3주

---

### Phase 4: 확장 기능 (필요 시)
```
💤 8. DM 알림 (DM 기능 구현 후)
💤 9. 친구 팔로우 알림 (SNS 확장 시)
```

---

## 🛠️ 구현 시 필요한 작업

### 1. 타입 확장

`domains/notifications/types/notification.ts`:
```typescript
export type NotificationType =
  | 'comment'
  | 'reply'
  | 'post_like'
  | 'comment_like'
  | 'level_up'
  | 'report_result'
  | 'admin_notice'
  // Phase 1
  | 'welcome'              // ✅ 구현 완료 (2025-12-01)
  | 'hot_post'             // 🔄 구현 예정
  | 'profile_update'       // 🔄 구현 예정
  | 'point_earned'         // 🔄 구현 예정
  // Phase 2
  | 'mention'
  | 'followed_board_new_post'
  // Phase 3
  | 'match_start'
  | 'match_goal'
  | 'security_alert';
```

---

### 2. 데이터베이스 마이그레이션

Phase 2부터 필요:
```sql
-- 게시판 팔로우 테이블
CREATE TABLE board_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, board_slug)
);

CREATE INDEX idx_board_follows_user ON board_follows(user_id);
CREATE INDEX idx_board_follows_board ON board_follows(board_slug);
```

---

### 3. 알림 타입별 아이콘 추가

`domains/notifications/components/NotificationItem.tsx`:
```typescript
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    // 기존
    case 'comment': return '💬';
    case 'reply': return '↩️';
    // Phase 1
    case 'welcome': return '👋';
    case 'hot_post': return '🔥';
    case 'profile_update': return '✏️';
    case 'point_earned': return '🎉';
    // Phase 2
    case 'mention': return '@';
    case 'followed_board_new_post': return '📢';
    // Phase 3
    case 'match_start': return '⚽';
    case 'match_goal': return '🎯';
    case 'security_alert': return '🔐';
  }
};
```

---

## 🎯 최종 추천

### 이번 주에 구현하세요 (ROI 최고):
1. ✅ **회원가입 웰컴 알림** - ✅ 완료 (2025-12-01)
2. 🔄 **HOT 이슈 알림** - 3-4시간, 유저 만족도 최고
3. 🔄 **프로필 변경 알림** - 1시간, 보안 UX 향상
4. 🔄 **포인트 알림** - 1시간, 게임화 강화

**진행 상황**: 1/4 완료
**남은 소요 시간**: 5-6시간

---

### 다음 스프린트 (2주 내):
5. 🔄 **댓글 멘션 알림** - 실시간 상호작용 극대화
6. 🔄 **게시판 팔로우 알림** - 커뮤니티 활성화

---

### 미래 확장 (여유 있을 때):
7. 🔮 **경기 스코어 알림** - 킬러 피처지만 인프라 필요
10. 🔮 **계정 보안 알림** - 실서비스 필수

---

### 안 해도 됨:
- ❌ 신고 누적 경고 (관리자가 직접 처리)
- ❌ 관리자 직접 멘션 (이미 있는 기능으로 충분)
- ❌ 모더레이터 알림 (아직 기능 없음)

---

**문서 작성일**: 2025-12-01
**마지막 업데이트**: 2025-12-01
**버전**: 1.1.0

---

## 📝 구현 이력

| 날짜 | 구현 항목 | 상태 | 비고 |
|-----|----------|------|------|
| 2025-12-01 | 회원가입 웰컴 알림 | ✅ 완료 | 읽을 때까지 유지, 자동 숨김 없음 |
