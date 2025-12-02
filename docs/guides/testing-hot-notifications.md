# 테스트 스크립트 사용 가이드

## HOT 알림 테스트

### 사전 준비

1. **환경 변수 확인** (`.env.local`)
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **tsx 설치** (아직 안 했다면)
   ```bash
   npm install -D tsx
   ```

### 테스트 시나리오

#### 1️⃣ 전체 테스트 (프로덕션)

```bash
npx tsx scripts/test-hot-notifications.ts
```

**실행 내용**:
1. 테스트용 게시글 3개 생성 (다양한 HOT 점수)
2. Edge Function 실행하여 HOT 알림 발송
3. 발송된 알림 확인

**예상 출력**:
```
🚀 HOT 알림 시스템 테스트 시작

============================================================

📝 테스트용 게시글 생성 중...

✅ 게시판: free, 사용자: abc-123

✅ 게시글 1 생성 완료:
   제목: [테스트] HOT 1위 예상 게시글 - 높은 점수
   조회수: 150, 좋아요: 30, 댓글: 10
   HOT 점수: 645.50
   게시글 ID: xyz-789

🔥 HOT 알림 발송 테스트 시작...

📡 Edge Function 호출: https://your-project.supabase.co/functions/v1/check-hot-posts

✅ Edge Function 실행 완료:
   전체 HOT 게시글: 3개
   알림 발송 성공: 3개
   알림 발송 실패: 0개

📊 상위 5개 HOT 게시글:
   1위. [테스트] HOT 1위 예상 게시글 (점수: 645.50)
   2위. [테스트] HOT 2위 예상 게시글 (점수: 234.20)
   3위. [테스트] HOT 3위 예상 게시글 (점수: 89.30)

📬 발송된 알림 확인 중...

✅ 3개의 HOT 알림 발견:

1. 🔥 내 게시글이 HOT 게시글 1위에 진입했어요!
   메시지: [테스트] HOT 1위 예상 게시글 - 높은 점수
   수신자: abc-123
   HOT 순위: 1위
   HOT 점수: 645.50
   읽음 여부: 안읽음
   생성 시간: 2025-12-02 18:30:00

============================================================

✅ 테스트 완료!

💡 테스트 데이터를 정리하려면:
   npx tsx scripts/test-hot-notifications.ts --cleanup
```

---

#### 2️⃣ 로컬 Edge Function 테스트

```bash
# 터미널 1: Supabase 로컬 환경 시작
supabase start

# 터미널 2: Edge Function 실행
supabase functions serve check-hot-posts

# 터미널 3: 테스트 스크립트 실행 (로컬 모드)
npx tsx scripts/test-hot-notifications.ts --local
```

---

#### 3️⃣ 알림만 확인

```bash
npx tsx scripts/test-hot-notifications.ts --check-only
```

이미 발송된 HOT 알림을 확인만 합니다.

---

#### 4️⃣ 테스트 데이터 정리

```bash
npx tsx scripts/test-hot-notifications.ts --cleanup
```

`[테스트]`로 시작하는 모든 게시글과 알림을 삭제합니다.

---

### 수동 테스트 (SQL)

Supabase Dashboard → SQL Editor에서 직접 실행:

#### 1. 테스트 게시글 생성

```sql
-- 현재 로그인한 사용자 ID 확인
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 게시판 ID 확인
SELECT id, name, slug FROM boards;

-- 테스트 게시글 생성
INSERT INTO posts (
  board_id,
  user_id,
  title,
  content,
  views,
  likes,
  created_at
) VALUES (
  'YOUR_BOARD_ID',  -- 위에서 확인한 게시판 ID
  'YOUR_USER_ID',   -- 위에서 확인한 사용자 ID
  '[테스트] HOT 1위 게시글',
  '<p>테스트 내용</p>',
  100,  -- 조회수
  20,   -- 좋아요
  NOW() - INTERVAL '2 hours' -- 2시간 전 작성
);

-- 댓글 추가 (HOT 점수 높이기)
INSERT INTO comments (post_id, user_id, content)
SELECT
  id,
  'YOUR_USER_ID',
  '테스트 댓글입니다.'
FROM posts
WHERE title = '[테스트] HOT 1위 게시글'
CROSS JOIN generate_series(1, 10); -- 10개 댓글
```

#### 2. Edge Function 수동 실행

```bash
# 프로덕션 환경
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-hot-posts \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

#### 3. 알림 확인

```sql
-- 발송된 HOT 알림 확인
SELECT
  id,
  user_id,
  title,
  message,
  metadata->>'hot_rank' as rank,
  metadata->>'hot_score' as score,
  is_read,
  created_at
FROM notifications
WHERE type = 'hot_post'
ORDER BY created_at DESC
LIMIT 10;
```

#### 4. 데이터 정리

```sql
-- 테스트 게시글 삭제
DELETE FROM posts WHERE title LIKE '%[테스트]%';

-- 테스트 알림 삭제
DELETE FROM notifications
WHERE type = 'hot_post'
  AND message LIKE '%[테스트]%';
```

---

### 트러블슈팅

#### 문제 1: "Edge Function을 찾을 수 없습니다"

**원인**: Edge Function이 배포되지 않음

**해결**:
```bash
supabase functions deploy check-hot-posts
```

---

#### 문제 2: "알림이 발송되지 않습니다"

**원인**:
1. 게시글이 HOT 상위 10위 밖
2. 24시간 내 이미 알림 발송됨
3. user_id가 null

**해결**:
1. HOT 점수 확인:
   ```sql
   SELECT
     id,
     title,
     views,
     likes,
     (views * 1 + likes * 10) as raw_score
   FROM posts
   ORDER BY raw_score DESC
   LIMIT 20;
   ```

2. 기존 알림 확인:
   ```sql
   SELECT * FROM notifications
   WHERE type = 'hot_post'
     AND created_at > NOW() - INTERVAL '24 hours';
   ```

3. user_id 확인:
   ```sql
   SELECT id, title, user_id FROM posts WHERE user_id IS NULL;
   ```

---

#### 문제 3: "CHECK constraint 오류"

**원인**: 데이터베이스에 'hot_post' 타입이 허용되지 않음

**해결**:
```sql
-- Migration 실행
\i supabase/migrations/20251202094917_add_hot_post_notification_type.sql
```

또는:
```sql
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'comment', 'reply', 'post_like', 'comment_like',
  'level_up', 'report_result', 'admin_notice', 'welcome', 'hot_post'
));
```

---

### 실제 배포 전 체크리스트

- [ ] Edge Function 배포 완료
- [ ] Migration 실행 완료 ('hot_post' 타입 추가)
- [ ] 테스트 게시글로 알림 발송 확인
- [ ] 크론잡 설정 (매 시간 실행)
- [ ] 알림 UI에서 Flame 아이콘 확인
- [ ] 24시간 중복 발송 방지 동작 확인

---

## 관련 문서

- [엣지 함수 설정 가이드](../supabase/functions/check-hot-posts/README.md)
- [HOT 점수 계산 가이드](../src/domains/sidebar/HOT_SCORE_GUIDE.md)
- [인기글 시스템 문서](../src/domains/sidebar/SIDEBAR_POPULAR_POSTS.md)
- [알림 시스템 문서](../src/domains/notifications/NOTIFICATION_SYSTEM.md)
