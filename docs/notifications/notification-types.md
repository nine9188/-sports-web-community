# 알림 타입 목록

## 개요

프로젝트에서 사용하는 모든 알림 타입과 발송 조건을 정리한 문서입니다.

**DB 제약조건**: `notifications_type_check`
**파일 위치**: `src/domains/notifications/actions/create.ts`

---

## 알림 타입 (12종)

| 타입 | 설명 | 발송 대상 | 링크 |
|------|------|----------|------|
| `comment` | 댓글 알림 | 게시글 작성자 | 해당 게시글 |
| `reply` | 대댓글 알림 | 부모 댓글 작성자 | 해당 게시글 |
| `post_like` | 게시글 좋아요 | 게시글 작성자 | 해당 게시글 |
| `comment_like` | 댓글 좋아요 | 댓글 작성자 | 해당 게시글 |
| `level_up` | 레벨업 | 본인 | /settings/profile |
| `report_result` | 신고 처리 결과 | 신고자 | 없음 |
| `admin_notice` | 관리자 공지 | 선택/전체 사용자 | 지정 링크 |
| `welcome` | 회원가입 환영 | 신규 가입자 | /boards/popular |
| `hot_post` | HOT 게시글 진입 | 게시글 작성자 | 해당 게시글 |
| `profile_update` | 프로필 변경 | 본인 | /settings/profile |
| `suspension` | 계정 정지/해제 | 해당 사용자 | /settings/profile |
| `phone_verified` | 전화번호 인증 완료 | 본인 | /settings/profile |

---

## 상세 설명

### 1. `comment` - 댓글 알림

내 게시글에 새 댓글이 달렸을 때 발송

```typescript
createCommentNotification({
  postOwnerId,      // 게시글 작성자 ID
  actorId,          // 댓글 작성자 ID
  actorNickname,    // 댓글 작성자 닉네임
  postId,
  postTitle,
  postNumber,
  boardSlug,
  commentContent
})
```

**제목**: `{닉네임}님이 댓글을 남겼습니다`
**본문**: 댓글 내용 (50자 초과 시 말줄임)

---

### 2. `reply` - 대댓글 알림

내 댓글에 답글이 달렸을 때 발송

```typescript
createReplyNotification({
  parentCommentOwnerId,  // 부모 댓글 작성자 ID
  actorId,
  actorNickname,
  postId,
  postNumber,
  boardSlug,
  commentContent
})
```

**제목**: `{닉네임}님이 답글을 남겼습니다`
**본문**: 답글 내용 (50자 초과 시 말줄임)

---

### 3. `post_like` - 게시글 좋아요

내 게시글이 좋아요를 받았을 때 발송

```typescript
createPostLikeNotification({
  postOwnerId,
  actorId,
  actorNickname,
  postId,
  postTitle,
  postNumber,
  boardSlug
})
```

**제목**: `{닉네임}님이 게시글을 좋아합니다`
**본문**: 게시글 제목

---

### 4. `comment_like` - 댓글 좋아요

내 댓글이 좋아요를 받았을 때 발송

```typescript
createCommentLikeNotification({
  commentOwnerId,
  actorId,
  actorNickname,
  commentId,
  commentContent,
  postNumber,
  boardSlug
})
```

**제목**: `{닉네임}님이 댓글을 좋아합니다`
**본문**: 댓글 내용 (50자 초과 시 말줄임)

---

### 5. `level_up` - 레벨업 알림

경험치 획득으로 레벨업 시 발송

```typescript
createLevelUpNotification({
  userId,
  newLevel
})
```

**제목**: `축하합니다! 레벨 {N}이 되었습니다! 🎉`
**본문**: `계속해서 활동하고 경험치를 쌓아보세요!`

---

### 6. `report_result` - 신고 처리 결과

신고한 내용이 처리되었을 때 발송

```typescript
createReportResultNotification({
  reporterId,
  targetType,   // 'post' | 'comment' | 'user' | 'match_comment'
  targetId,
  result,       // 'resolved' | 'dismissed'
  reason?
})
```

**제목 (처리됨)**: `신고하신 내용이 처리되었습니다`
**제목 (기각됨)**: `신고하신 내용이 기각되었습니다`

---

### 7. `admin_notice` - 관리자 공지

관리자가 발송하는 공지 알림

```typescript
// 선택 사용자
createAdminNoticeNotification({
  userIds,
  title,
  message,
  link?
})

// 전체 사용자
createBroadcastNotification({
  title,
  message,
  link?,
  adminId?
})
```

---

### 8. `welcome` - 회원가입 환영

회원가입 완료 시 자동 발송

```typescript
createWelcomeNotification({
  userId
})
```

**제목**: `환영합니다! 4590 Football에 오신 것을 환영합니다! 👋`
**본문**: `커뮤니티 가이드와 인기 게시판을 둘러보세요!`

---

### 9. `hot_post` - HOT 게시글 진입

내 게시글이 HOT 게시글에 진입했을 때 발송

```typescript
createHotPostNotification({
  userId,
  postId,
  postTitle,
  boardSlug,
  postNumber,
  hotRank,
  hotScore
})
```

**제목**: `🔥 내 게시글이 HOT 게시글 {N}위에 진입했어요!`
**본문**: 게시글 제목

---

### 10. `profile_update` - 프로필 변경

프로필 정보가 변경되었을 때 발송 (보안 목적)

```typescript
createProfileUpdateNotification({
  userId,
  changeType,   // 'nickname' | 'profile_icon' | 'password'
  oldValue?,
  newValue?,
  ipAddress?,
  userAgent?
})
```

**닉네임 변경**: `닉네임이 변경되었습니다` / `"기존" → "신규"`
**아이콘 변경**: `프로필 아이콘이 변경되었습니다`
**비밀번호 변경**: `비밀번호가 변경되었습니다` / `본인이 아닌 경우 즉시 비밀번호를 재변경하세요.`

---

### 11. `suspension` - 계정 정지/해제

계정이 정지되거나 해제되었을 때 발송

```typescript
// 정지
createSuspensionNotification({
  userId,
  reason,
  suspendedUntil,
  days
})

// 해제
createUnsuspensionNotification({
  userId
})
```

**정지 제목**: `⚠️ 계정이 {N}일간 정지되었습니다`
**해제 제목**: `✅ 계정 정지가 해제되었습니다`

---

### 12. `phone_verified` - 전화번호 인증 완료

전화번호 인증 성공 시 발송

```typescript
createNotification({
  userId,
  type: 'phone_verified',
  title: '전화번호 인증이 완료되었습니다! 📱',
  message: '보상으로 500P와 100EXP가 지급되었습니다.',
  link: '/settings/profile'
})
```

---

## 알림 생성 공통 파라미터

```typescript
interface CreateNotificationParams {
  userId: string;       // 받는 사람
  actorId?: string;     // 행위자 (시스템 알림은 undefined)
  type: string;         // 알림 타입
  title: string;        // 제목
  message?: string;     // 본문
  link?: string;        // 클릭 시 이동할 링크
  metadata?: object;    // 추가 데이터 (JSON)
}
```

---

## 참고

- 자기 자신에게는 알림이 발송되지 않음 (actorId === userId인 경우)
- 시스템 알림은 `actorId`가 `undefined`
- 알림 타입 추가 시 DB 제약조건 업데이트 필요:
  ```sql
  ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

  ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY[...새 타입 추가...]));
  ```
