# Supabase PostgREST Egress 로그 분석 및 추적 가이드

제공해주신 스크린샷과 로그 구성을 기반으로, 97.5%의 비중을 차지하는 **PostgREST Egress(데이터 전송량)**의 유발 근원지를 Supabase 로그에서 구체적으로 추적하는 방법입니다.

---

## 1. 스크린샷 상황 분석 (2026년 6월 24일 기준)
* **총 Egress 구성:**
  * **PostgREST Egress (97.5%): 465.246MB (압도적 1위)**
  * Auth Egress (2.2%): 10.611MB
  * Storage Egress (0.2%): 1.025MB
  * 기타 (Realtime, Functions): 0%에 가까움
* **진단:** Egress의 거의 대부분(97.5%)이 API를 통한 데이터 조회(`PostgREST`)에서 발생하고 있습니다. 이는 클라이언트(Next.js 서버 또는 사용자 브라우저)가 Supabase DB 테이블을 조회(`SELECT`)할 때 데이터 전송량이 누적되어 생긴 결과입니다.

---

## 2. Supabase 로그에서 추적하는 위치
Supabase 로그에는 여러 소스가 있지만, **PostgREST Egress**의 상세 원인은 다음 두 군데에서 확인할 수 있습니다.

1. **`api gateway` (최적의 분석 위치)**
   * **역할:** 외부에서 들어오는 모든 HTTP 요청(API 호출, 이미지 요청 등)을 받아서 PostgREST, Auth, Storage 등으로 라우팅해주는 Kong 게이트웨이의 로그입니다.
   * **로그 테이블명:** `edge_logs`
   * **확인 가능 정보:** 어떤 API 경로(예: `/rest/v1/posts`)로 요청이 들어왔는지, 응답 상태코드(200, 400 등), 그리고 **요청 빈도(Top Paths)**를 파악할 수 있어 Egress 추적의 핵심 지표가 됩니다.
2. **`postgrest`**
   * **역할:** API Gateway를 통과해 실제로 DB 데이터를 처리하고 응답을 만들어내는 PostgREST 엔진 자체의 로그입니다.
   * **확인 가능 정보:** PostgREST로 들어온 원본 SQL 변환 내용 및 파라미터를 확인할 수 있습니다.

---

## 3. Supabase 로그 익스플로러(Log Explorer) 실전 쿼리
Supabase 대시보드 내 **`Logs` -> `Explorer`** 메뉴로 이동한 뒤, 아래 SQL 쿼리들을 실행하여 Egress를 가장 많이 유발하는 API 호출 경로와 쿼리를 찾아낼 수 있습니다.

### 1) 가장 많이 호출된 PostgREST API 경로 확인 (Top Paths)
PostgREST API(`/rest/v1/...`) 요청 중 가장 빈번하게 호출되어 Egress를 유발한 테이블과 엔드포인트를 찾아냅니다.

```sql
SELECT
  t.request.method AS http_method,
  t.request.path AS api_path,
  COUNT(*) as request_count
FROM
  edge_logs
  CROSS JOIN UNNEST(metadata) AS t
WHERE
  -- PostgREST API 요청만 필터링
  t.request.path LIKE '/rest/v1/%'
  -- 필요한 경우 최근 24시간 등으로 시간 범위 지정 가능
  -- AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
GROUP BY
  1, 2
ORDER BY
  request_count DESC
LIMIT 50;
```
* **해석:** 위 결과에서 `request_count`가 비정상적으로 높게 나오는 `api_path`가 Egress 스파이크의 유력한 원인입니다. (예: `/rest/v1/comments` 또는 `/rest/v1/posts`)

### 2) 데이터 로우(Row)를 가장 많이 리턴한 무거운 쿼리 확인 (PostgreSQL 단)
PostgREST 응답 크기(Egress)는 결과 데이터의 **반환 로우 수(Rows)**와 직결됩니다. DB 성능 분석용 시스템 뷰를 통해 최근 가장 많은 로우를 반환해 전송량을 낭비한 SQL 쿼리 상위 10개를 조회합니다. (SQL Editor에서 실행 가능)

```sql
SELECT 
  query, 
  calls, 
  total_exec_time as total_time_ms, 
  rows as total_returned_rows,
  (rows / calls) as avg_returned_rows
FROM 
  pg_stat_statements
WHERE 
  query NOT LIKE '%pg_%' -- 시스템 쿼리 제외
ORDER BY 
  rows DESC
LIMIT 10;
```
* **해석:** `total_returned_rows`가 수만~수십만 개에 달하는 쿼리는 페이징 처리가 누락되었거나 `SELECT *`로 모든 데이터를 긁어가서 Egress를 고갈시킨 쿼리입니다.

---

## 4. 이미 패치된 핵심 Egress 유발점
프로젝트 히스토리를 확인해보면, 이번 Egress 트래픽 분석을 통해 이미 소스코드 상에서 조치된 3대 주범은 다음과 같습니다:

1. **게시판 댓글 수 집계 비효율성 (`fetchCommentCounts`):**
   * **기존 문제:** `SELECT post_id FROM comments WHERE ...`로 목록의 모든 댓글 ID 목록을 통째로 메모리로 들고 와 Egress가 낭비됨.
   * **조치 완료 (Commit `54c48af0`):** DB 내부에서 카운팅하여 딱 결과 숫자만 리턴하는 RPC 함수 `get_comment_counts`를 작성하여 Egress를 99% 감축시킴.
2. **RSS 피드 크롤러에 의한 Direct Hit (`rss.xml`):**
   * **기존 문제:** 검색엔진 봇이 긁어갈 때마다 세션 쿠키 의존성 때문에 Next.js 캐시가 무력화되어 수십 KB의 XML 데이터를 실시간 쿼리로 리턴해 Egress 폭증.
   * **조치 완료 (Commit `925f739d`):** 무쿠키 클라이언트를 적용하고 15분 단위 정적 캐싱(ISR)을 강제하여 DB Direct Hit를 하루 96회 수준으로 고정.
3. **선수 및 팀 관련 페이지 다이렉트 유입:**
   * **조치 완료 (Commit `d5fbf2a3`):** 선수/팀 캐싱 최적화를 진행하여 미들웨어 단계의 중복 DB 조회를 원천 차단.
