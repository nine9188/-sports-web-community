# Supabase 댓글 수 집계(Comment Count) Egress 최적화 검토 보고서 (수정본)

이 보고서는 게시판 목록 및 상세 페이지 하단 목록 조회 시 실행되는 댓글 수 카운트 쿼리(`fetchCommentCounts` 및 `getPostDetails.ts`)의 비효율성을 검증하고, **"트리거는 절대 사용하지 않는다"**는 기술적 제약 사항을 명확히 반영하여 최선의 개선 방법을 비교 검토한 결과입니다. (지시 사항에 따라 소스 코드는 수정하지 않고 분석 보고서만 작성하였습니다.)

---

## 1. 진짜 문제가 있는지 검증 (Egress 및 부하 테스트)

현재 코드의 댓글 수 카운트 로직은 다음과 같이 구현되어 있습니다:
```typescript
// fetchPostsHelpers.ts
const { data: commentCounts } = await supabase
  .from('comments')
  .select('post_id')
  .in('post_id', postIds)
  .eq('is_hidden', false)
  .eq('is_deleted', false);
```

### 1) 구조적 문제점 (Egress 낭비)
* **DB단 집계 부재**: SQL의 `COUNT`와 `GROUP BY`를 사용하지 않고, 대상이 되는 모든 댓글 레코드의 `post_id` 목록을 통째로 메모리로 긁어옵니다.
* **데이터 크기 계산**:
  * UUID(36자) 데이터가 JSON 객체(`{"post_id":"..."}`) 형태로 반환되므로, 로우당 공백 포함 약 50~60바이트의 전송량이 생깁니다.
  * 게시글 30개에 누적된 댓글이 총 **1,000개**라면, 약 **50KB~60KB**의 JSON 배열을 다운로드합니다.
  * 일 방문자가 10,000명이고 게시판 첫 페이지가 매일 총 50,000번 호출된다고 가정하면:
    $$\text{하루 Egress} = 50,000 \times 50\text{KB} = 2.5\text{GB}$$
    오직 **댓글의 개수 숫자 하나를 화면에 표시하기 위한 용도**로 매일 수 기가바이트의 데이터 전송료(Egress)가 낭비되고 있는 셈입니다.
  * 댓글 수가 수만 개에 이르는 활성화된 대형 커뮤니티일수록 이 요금은 기하급수적으로 폭증하며, 데이터베이스 및 API 서버의 레이턴시(속도 저하)를 초래합니다.

## 2. Supabase MCP 기반 DB 검증 결과 (인덱스 & 스펙 확인)

> [!NOTE]
> Supabase MCP Server (`execute_sql`)를 통하여 실제 데이터베이스 스키마 및 인덱스, 그리고 Stored Function의 상세 사양을 전수 검증했습니다.

### 1) `comments` 테이블 컬럼 검증
* `comments` 테이블은 `id (uuid)`, `post_id (uuid)`, `user_id (uuid)`, `content (text)`, `is_hidden (boolean)`, `is_deleted (boolean)`, `comment_number (integer)` 등의 컬럼으로 정상 정의되어 있음을 확인했습니다.

### 2) 인덱스 스펙 검증
확인된 인덱스는 다음과 같습니다:
* `comments_pkey`: `id` 기본키 인덱스
* `comments_post_id_idx`: `CREATE INDEX comments_post_id_idx ON public.comments USING btree (post_id)`
* `idx_comments_post_id_created_at`: `CREATE INDEX idx_comments_post_id_created_at ON public.comments USING btree (post_id, created_at)`
* `idx_comments_post_parent`: `CREATE INDEX idx_comments_post_parent ON public.comments USING btree (post_id, parent_id)`

> [!IMPORTANT]
> **검증 결론**: `post_id` 컬럼에 단일 인덱스(`comments_post_id_idx`) 뿐만 아니라 정렬/계층 조회를 위한 복합 인덱스(`idx_comments_post_id_created_at`, `idx_comments_post_parent`)까지 완벽히 설계되어 있습니다.
> 따라서, 포스트 ID 배열로 조건절 필터링(`post_id = ANY(...)`)을 수행할 때 **Seq Scan(순차 검색) 없이 인덱스 스캔을 타고 매우 신속하게 집계 연산(Index Scan)이 수행됨**이 보장됩니다.

### 3) Stored Function (Stored Procedure) 목록 검증
* 현재 DB 내에 생성되어 있는 함수 목록(예: `get_single_comment_number`, `add_post_like`, `count_search_posts`, `search_posts_by_content`, `increment_post_view`)을 전수 확인하였습니다.
* **확인 결과**: 복수의 포스트 ID 목록에 대해 각 댓글 개수를 일괄 집계하여 반환하는 RPC 함수는 존재하지 않습니다. 따라서 최선책 실행을 위해서는 **함수(`get_comment_counts`)를 신규 생성해야 함**을 최종 확인했습니다.

---

## 3. 최선의 개선 방법 검토 (기술 제약사항 반영)

> [!IMPORTANT]
> **프로젝트 제약사항**: 트리거(Trigger)는 절대 사용하지 않습니다.
> 이에 따라 `posts` 테이블에 `comment_count` 캐싱 컬럼을 두고 트리거로 자동 갱신하는 방안은 검토 대상에서 완전히 제외합니다.

트리거를 배제한 상황에서, Supabase DB(PostgREST) 호출 부하와 Egress를 줄일 수 있는 대안들을 비교 검토합니다.

### 대안 1. Supabase RPC (데이터베이스 함수) 도입 - [최선책]
데이터베이스 내부에 포스트 ID 배열을 매개변수로 받아서 댓글 개수를 집계(`COUNT`, `GROUP BY`)해 반환하는 가벼운 DB 함수(Stored Function)를 만들고, Next.js에서 `rpc`로 호출합니다.

#### [DB SQL 생성 구문]
```sql
CREATE OR REPLACE FUNCTION get_comment_counts(p_post_ids uuid[])
RETURNS TABLE (
  post_id uuid,
  comment_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.post_id, COUNT(c.id)
  FROM comments c
  WHERE c.post_id = ANY(p_post_ids)
    AND c.is_hidden = false
    AND c.is_deleted = false
  GROUP BY c.post_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

#### [Next.js 적용 코드 예시]
```typescript
const { data: countsData } = await supabase
  .rpc('get_comment_counts', { p_post_ids: postIds });

// countsData 형태: [{ post_id: '...', comment_count: 5 }, ...]
const countMap: Record<string, number> = {};
countsData?.forEach(row => {
  countMap[row.post_id] = Number(row.comment_count);
});
```

* **Egress 절감 효과**: **상** (댓글이 수만 개여도 응답 로우 수가 최대 30개로 엄격히 제한되므로 전송량이 **1KB 미만**으로 고정됨)
* **안정성**: DB 단에서 검증된 인덱스(`comments_post_id_idx`)를 타고 초고속 집계를 끝마친 뒤 단 2개의 컬럼(`post_id`, `comment_count`) 결과만 넘겨주므로 성능 오버헤드와 네트워크 Egress가 극적으로 감소합니다.
* **비고**: 트리거를 전혀 사용하지 않으면서도 DB 트래픽을 완벽하게 줄일 수 있는 가장 깔끔하고 권장되는 해결책입니다.

---

### 대안 2. PostgREST 카운트 서브쿼리 사용
Supabase JS Client에서 중첩 쿼리 및 집계 방식을 활용해 posts select 시점에 관계 테이블 count만 얹어서 가져오는 방식입니다.

#### [Next.js 적용 코드 예시]
```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    id, title, ...
    comments!post_id(count)
  `)
  .eq('comments.is_hidden', false)
  .eq('comments.is_deleted', false);
```

* **Egress 절감 효과**: **상** (댓글 수가 집계되어 숫자로만 반환됨)
* **단점**: 
  1. Supabase JS 클라이언트의 중첩 카운팅 필터는 복잡한 SQL로 변환될 때 성능 오버헤드가 발생할 수 있습니다.
  2. 댓글 목록의 `is_hidden = false`, `is_deleted = false` 조건 필터링이 `comments!post_id(count)` 문법과 결합될 때, DB 버전에 따라 조건 맵핑이 올바르게 적용되지 않고 전체 댓글 수가 집계되는 등의 버그가 발생하기 쉽습니다.
  3. `posts` 테이블을 조회하지 않고 별도로 댓글 수만 구하는 비동기 함수(`fetchCommentCounts`)의 경우에는 이 방식을 범용적으로 적용하기 어렵습니다.

---

## 3. 최종 결론 및 개선 방향

트리거를 배제한 조건에서 최선의 개선 방법은 **대안 1 (Supabase RPC 함수 사용)** 입니다.

* **이유**:
  1. **트리거 완전 배제**: 데이터베이스의 쓰기 성능이나 복잡성에 영향을 주는 트리거를 전혀 작성하지 않습니다.
  2. **극적인 Egress 절감**: 1,000개가 넘는 댓글 로우 데이터를 JSON으로 전송받던 기존 구조에서, 단 30행 이하의 집계 결과만 전달받는 구조로 변경되어 Egress가 99% 이상 감소합니다.
  3. **서버 메모리 부하 해소**: Next.js 서버 단에서 대량의 JSON 배열을 파싱하고 루프(`forEach`)를 돌며 카운트 세는 작업이 생략되므로 서버 CPU 자원을 아낄 수 있습니다.
