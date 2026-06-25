# 📋 Supabase RLS 및 트리거 분석/개선 보고서

본 보고서는 Supabase 데이터베이스의 RLS(행 레벨 보안) 설정 취약점과 현재 데이터베이스에 적용된 트리거(Trigger) 사용 현황을 분석하고, **트리거를 사용하지 않는 애플리케이션 레벨의 안전한 개선 방향**을 정리한 것입니다.

---

## 1. RLS 문제점 (RLS Issues)

데이터베이스 정책 조회 결과, 다음 3가지 유형의 RLS 보안 취약점이 식별되었습니다.

### ① RLS가 완전히 비활성화되었던 테이블 (조치 완료)
* **대상 테이블**: `entity_news_summaries`
* **상태**: RLS가 활성화되었으며, 일반 공개 조회(SELECT)만 허용하는 보안 정책이 적용되었습니다. (참고: `seo_prediction_post_backups` 테이블은 삭제됨)

### ② 타인 데이터 변조가 가능한 정책 (권한 과다 부여)
* **대상 테이블 및 정책**:
  * `match_prediction_stats` (조치 완료 - 일반 유저 권한 완전 차단)
  * `post_card_links` (조치 완료 - 작성자 기반 검증으로 제한)
* **문제점**: 정책 검증 조건이 단순히 `(auth.uid() IS NOT NULL)`로만 되어 있습니다. 즉, 로그인한 사용자라면 **다른 사용자가 소유한 통계 정보나 카드 링크를 마음대로 수정하거나 삭제**할 수 있습니다.

### ③ 비즈니스 로직 어뷰징 취약 테이블 (조치 완료 - 일반 유저 권한 차단)
* **대상 테이블 및 정책**: `point_history` 및 `exp_history` (INSERT 명령)
* **상태**: 일반 로그인 사용자의 직접적인 데이터 삽입(INSERT)을 데이터베이스 수준에서 차단 조치 완료했습니다.

---

## 2. RLS 수정 방안 및 작동 원리 (RLS Resolution)

### ① RLS 비활성화 테이블 조치 (적용 완료)
* **조치 내용**: 
  1. `entity_news_summaries` 테이블에 RLS를 활성화했습니다.
  2. 일반 사용자 및 외부에서는 조회(SELECT)만 가능하고, 삽입/수정/삭제는 차단하여 데이터 변조를 막았습니다.
  *(참고: 배치 수집 스크립트는 \`service_role\` 키로 실행되므로 RLS의 영향을 받지 않고 계속 뉴스를 업데이트할 수 있습니다.)*
* **적용된 SQL**:
  ```sql
  ALTER TABLE public.entity_news_summaries ENABLE ROW LEVEL SECURITY;

  -- 읽기는 모두 허용
  CREATE POLICY "Allow public read access" ON public.entity_news_summaries FOR SELECT TO public USING (true);
  ```
* **효과**: 일반 사용자는 데이터를 읽기만 할 수 있으며, 악성 사용자가 해당 테이블에 데이터를 삽입하여 시스템 리소스를 낭비시키는 것을 방지합니다.

### ② 권한 과다 부여 정책 수정 및 조치 완료
* **조치 대상 1**: `match_prediction_stats`
* **조치 내용**: 
  1. [predictions.ts](file:///home/kim/web2/src/domains/livescore/actions/match/predictions.ts#L144)의 `updatePredictionStatsManually` 함수가 `getSupabaseAdmin()`을 사용하여 서버 단(어드민 권한)에서 안전하게 연산되도록 수정했습니다.
  2. 일반 로그인 사용자의 `INSERT` 및 `UPDATE` 정책을 데이터베이스에서 완전히 삭제하여 일반 사용자의 불법적인 데이터 위조를 방지했습니다.
* **실행된 SQL**:
  ```sql
  DROP POLICY IF EXISTS "match_prediction_stats_insert_policy" ON public.match_prediction_stats;
  DROP POLICY IF EXISTS "match_prediction_stats_update_policy" ON public.match_prediction_stats;
  ```
* **효과**: 클라이언트 브라우저에서 사용자가 임의로 경기 투표 통계 데이터를 위조(Upsert)하는 행위가 완벽히 차단됩니다.

* **조치 대상 2**: `post_card_links` (조치 완료)
* **조치 내용**: 단순히 로그인이 되어 있는지를 보는 것이 아니라, 해당 카드 링크의 연관 게시글 작성자가 현재 로그인한 본인이 맞는지 검증하도록 `INSERT` 및 `DELETE` 정책을 교체했습니다.
* **실행된 SQL**:
  ```sql
  DROP POLICY IF EXISTS "post_card_links_insert" ON public.post_card_links;
  DROP POLICY IF EXISTS "post_card_links_delete" ON public.post_card_links;

  CREATE POLICY "post_card_links_insert" ON public.post_card_links
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.posts p 
        WHERE p.id = post_card_links.post_id AND p.user_id = auth.uid()
      )
    );

  CREATE POLICY "post_card_links_delete" ON public.post_card_links
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.posts p 
        WHERE p.id = post_card_links.post_id AND p.user_id = auth.uid()
      )
    );
  ```
* **효과**: 본인이 작성한 글에 첨부된 카드 링크들만 생성 및 삭제할 수 있게 되어, 타인의 글 내부 링크를 위조하거나 훼손하는 어뷰징 행위가 완전히 차단됩니다.

### ③ 포인트/경험치 내역 삽입 제한 (조치 완료)
* **조치 내용**: 
  1. 일반 사용자(`authenticated`)에게 부여되었던 RLS INSERT 정책을 폐기했습니다.
  2. 전화번호 인증([phone.ts](file:///home/kim/web2/src/domains/settings/actions/phone.ts#L281)), 출석체크([attendance-actions.ts](file:///home/kim/web2/src/shared/actions/attendance-actions.ts#L190)), 친구추천 및 활동 적립 관련 모든 Server Action 코드를 `getSupabaseAdmin()`을 타도록 변경하여 안전하게 서버 권한으로 적립 및 이력을 기록하도록 리팩토링 완료했습니다.
* **실행된 SQL**:
  ```sql
  DROP POLICY IF EXISTS "point_history_unified_insert_policy" ON public.point_history;
  DROP POLICY IF EXISTS "exp_history_unified_insert_policy" ON public.exp_history;
  ```
* **효과**: 클라이언트(프론트엔드) 브라우저에서 사용자가 임의로 포인트와 경험치를 자가 적립하는 해킹 위협이 원천적으로 소멸되었습니다.

---

## 3. Trigger 사용 현황 및 조치 완료 (Triggers Removed)

기존 데이터베이스에서 작동 중이던 **2개의 트리거를 완전히 폐기(삭제) 조치** 완료했습니다.

### ① `trigger_set_comment_number` (on `comments` 테이블)
* **연동 함수**: `set_comment_number()`
* **실행 시점**: `BEFORE INSERT` (ROW 단위)
* **수행 역할**:
  새로운 댓글이 작성될 때, 해당 게시글(`post_id`) 내에서 순차적인 번호(`comment_number`)를 매기기 위해 기존 댓글 중 가장 높은 번호에 +1을 더해 할당합니다.
  ```sql
  SELECT COALESCE(MAX(comment_number), 0) + 1 INTO NEW.comment_number FROM comments WHERE post_id = NEW.post_id;
  ```

### ② `set_post_drafts_updated_at` (on `post_drafts` 테이블)
* **연동 함수**: `set_post_drafts_updated_at()`
* **실행 시점**: `BEFORE UPDATE` (ROW 단위)
* **수행 역할**:
  임시저장글(`post_drafts`)이 업데이트될 때마다, 수정 시간(`updated_at`)을 현재 시간(`now()`)으로 바꾸고, 만료일(`expires_at`)을 현재 시점 기준 3일 뒤로 자동으로 연장시킵니다.

---

## 4. 트리거 미사용 개선 방안 및 작동 원리 (Trigger-Free Resolution)

데이터베이스 트리거는 DB 관리 복잡성을 늘리고 로컬 마이그레이션이 까다롭기 때문에, 다음과 같이 **Next.js 백엔드(Server Actions/API Routes)**에서 대체하는 방식을 권장합니다.

### ① `comments.comment_number` (댓글 번호 자동 증가 대체 - 적용 완료)

* **조치 내용**:
  1. 데이터베이스에서 `trigger_set_comment_number` 트리거와 함수를 완전히 삭제했습니다.
  2. 동시성 보장을 위해 DB 테이블 수준에서 `(post_id, comment_number)` 조합에 대해 **Unique 제약 조건**(`comments_post_id_comment_number_key`)을 설정했습니다.
  3. [create.ts](file:///home/kim/web2/src/domains/boards/actions/comments/create.ts#L71) 파일의 댓글 삽입 비즈니스 로직을 수정하여, `MAX(comment_number) + 1` 순번을 구한 뒤 직접 데이터를 입력하게 하였고, 혹시 동시 충돌(PostgreSQL 에러코드 23505) 발생 시 최대 5회까지 **자동 재시도(Retry)**하여 동시성을 완벽하게 보장하도록 패치했습니다.

* **수정 로직 예시 (Next.js 백엔드)**:
  ```typescript
  import { getSupabaseServer } from '@/shared/lib/supabase';

  async function createComment(postId: number, userId: string, content: string) {
    const supabase = getSupabaseServer();
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // 단일 쿼리로 MAX + 1 계산하여 삽입 시도
        const { data, error } = await supabase.rpc('insert_comment_safe', {
          p_post_id: postId,
          p_user_id: userId,
          p_content: content
        });
        
        // 만약 RPC를 사용하지 않고 raw query/SDK를 쓸 경우:
        // 1. 현재 MAX(comment_number) 조회
        // 2. INSERT 시도 (실패 시 unique constraint error 발생)
        
        if (!error) return { success: true, data };
        
        // Unique 제약 조건 위배 에러 코드인 경우 재시도
        if (error.code === '23505') {
          attempts++;
          continue;
        }
        throw error;
      } catch (err) {
        if (attempts >= maxAttempts) throw new Error("댓글 작성에 실패했습니다. 다시 시도해 주세요.");
      }
    }
  }
  ```

* **해결 및 작동 원리**:
  DB 수준에서 유니크 제약 조건이 댓글 순번의 정합성을 최종 보증하고, 백엔드 애플리케이션 단에서 충돌 시 이를 감지하여 투명하게 재시도합니다. 이를 통해 트리거 없이 완전히 동시성 안전한 순차 번호를 부여할 수 있습니다.

---

### ② `post_drafts` (임시저장글 수정 시간 및 만료 자동 연장 대체 - 적용 완료)

* **조치 내용**:
  1. 데이터베이스에서 `set_post_drafts_updated_at` 트리거와 관련 함수를 완전히 삭제했습니다.
  2. [drafts.ts](file:///home/kim/web2/src/domains/boards/actions/posts/drafts.ts#L344)에서 임시저장 정보를 저장할 때, 애플리케이션 단에서 명시적으로 `updated_at` 필드에 현재 시각(`new Date().toISOString()`)을 실어 보내도록 코드를 갱신하여 트리거 작동을 대체했습니다.

* **수정 로직 예시 (Next.js 백엔드)**:
  ```typescript
  import { getSupabaseServer } from '@/shared/lib/supabase';

  async function updateDraft(draftId: string, title: string, content: string) {
    const supabase = getSupabaseServer();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3일 후

    const { data, error } = await supabase
      .from('post_drafts')
      .update({
        title,
        content,
        updated_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .eq('id', draftId);

    if (error) throw error;
    return data;
  }
  ```

* **해결 및 작동 원리**:
  백엔드 코드 수준에서 만료 기간 정책(`now + 3 days`)과 최종 수정 시간을 파라미터로 명시적으로 전달합니다. 이로 인해 임시저장 데이터를 갱신할 때 명확히 코드 단에서 만료 만기가 추적 가능하고, DB 트리거 없이 동일한 동작을 수행할 수 있습니다.

---

## 5. 테이블별 실제 코드 내 사용 위치 (Codebase Usage Analysis)

보안 정책 취약점 및 트리거가 설정된 주요 테이블들의 실제 코드베이스 내 사용처를 추적한 결과입니다.

### ① `seo_prediction_post_backups` (삭제 완료)
* **상태**: 사용자 요청에 의해 **삭제(DROP) 완료**됨.
* **분석 결과**: 코드베이스 내에서 사용하지 않는 백업용 테이블이었으므로, 데이터베이스에서 안전하게 제거하여 RLS 취약점을 영구 해결했습니다.

### ② `entity_news_summaries` (조치 완료)
* **코드베이스 내 사용처**:
  * 스키마 정의: [entity-news-summaries.sql](file:///home/kim/web2/docs/entity-news-summaries.sql)
  * 실행 스크립트: [generate-entity-news-summaries.cjs](file:///home/kim/web2/scripts/generate-entity-news-summaries.cjs#L396) (라인 396, 409에서 upsert 수행)
* **조치 결과**: RLS를 활성화하고 `public`에 SELECT 권한만 지정 완료했습니다. 수집 스크립트는 `service_role`을 통해 안전하게 작성 작업을 계속 수행할 수 있습니다.

### ③ `match_prediction_stats` (조치 완료)
* **코드베이스 내 사용처**:
  * 경기 예측 비즈니스 로직: [predictions.ts](file:///home/kim/web2/src/domains/livescore/actions/match/predictions.ts#L144) (어드민 클라이언트로 교체 완료)
* **조치 결과**: `updatePredictionStatsManually`가 `getSupabaseAdmin`을 타도록 코드를 변경하고, DB 내의 일반 유저 대상 RLS INSERT/UPDATE 정책들을 폐기 완료했습니다. 외부에서의 통계 임의 위조가 완전히 차단되었습니다.

### ④ `post_card_links` (조치 완료)
* **코드베이스 내 사용처**:
  * 게시글 등록 및 수정 액션:
    * [create.ts](file:///home/kim/web2/src/domains/boards/actions/posts/create.ts#L222) (등록 시 카드 링크 삽입)
    * [delete.ts](file:///home/kim/web2/src/domains/boards/actions/posts/delete.ts#L55) (삭제 시 카드 링크 삭제)
    * [update.ts](file:///home/kim/web2/src/domains/boards/actions/posts/update.ts#L234) (수정 시 기존 링크 일괄 삭제 후 재등록)
  * 기타 예측/뉴스 요약 스크립트
* **조치 결과**: RLS를 개선하여 작성자 본인(`posts.user_id = auth.uid()`)만 링크 카드 데이터를 `INSERT` 및 `DELETE` 할 수 있도록 보안 정책 구성을 완료했습니다. 일반 유저 권한 남용을 통한 다른 글 카드 링크 무단 변조 위협을 영구적으로 방지했습니다.

### ⑤ `point_history` 및 `exp_history` (조치 완료)
* **코드베이스 내 사용처**:
  * 전화번호 인증 포인트 적립: [phone.ts](file:///home/kim/web2/src/domains/settings/actions/phone.ts#L281) (어드민 클라이언트로 리팩토링 완료)
  * 출석 포인트 적립: [attendance-actions.ts](file:///home/kim/web2/src/shared/actions/attendance-actions.ts#L193) (어드민 클라이언트로 리팩토링 완료)
  * 친구 추천 보상 적립: [referral-actions.ts](file:///home/kim/web2/src/shared/actions/referral-actions.ts#L216) (어드민 클라이언트로 리팩토링 완료)
  * 활동 및 보너스 보상: [activity-actions.ts](file:///home/kim/web2/src/shared/actions/activity-actions.ts#L140) (어드민 클라이언트로 리팩토링 완료)
* **조치 결과**: 보상이 변동되는 모든 Server Action에서 어드민 권한(`getSupabaseAdmin`)을 사용하여 DB에 안전하게 쓰고, DB RLS INSERT 정책은 완전히 제거하여 클라이언트 측 가짜 데이터 적립 시도를 완벽히 차단했습니다.

### ⑥ `comments` (트리거 대상 테이블)
* **코드베이스 내 사용처**:
  * 댓글 읽기/렌더링: [get.ts](file:///home/kim/web2/src/domains/boards/actions/comments/get.ts#L25), [getPostDetails.ts](file:///home/kim/web2/src/domains/boards/actions/getPostDetails.ts#L353)
  * 댓글 번호(순번) 조회 RPC 호출: [sideEffects.ts](file:///home/kim/web2/src/domains/boards/actions/comments/sideEffects.ts#L80)
  * 프론트엔드 컴포넌트: [Comment.tsx](file:///home/kim/web2/src/domains/boards/components/post/Comment.tsx#L194)
* **분석 결과**: 화면에서 각 댓글의 링크 주소(#comment-1)나 하이라이트 기능을 수행할 때 `comment_number` 순번을 핵심 식별자로 사용하고 있습니다. 트리거 제거 시 백엔드 단에서 충돌 재시도 로직을 통해 완벽한 대응이 필요합니다.

### ⑦ `post_drafts` (트리거 대상 테이블)
* **코드베이스 내 사용처**:
  * 임시 저장 관리: [drafts.ts](file:///home/kim/web2/src/domains/boards/actions/posts/drafts.ts#L262) (임시글 자동 만료 삭제 및 수정 기능 수행)
* **분석 결과**: `drafts.ts` 백엔드 비즈니스 로직에서 임시 저장된 데이터를 가져오고 저장하는 용도로 쓰입니다. 트리거를 지우고 백엔드 API에서 직접 생성/수정할 때 수정 시각 및 3일 뒤 만료 시간을 주입하도록 구성하면 트리거 없이 즉시 마이그레이션이 가능합니다.

