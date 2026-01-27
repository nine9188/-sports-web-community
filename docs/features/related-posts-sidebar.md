# 관련 게시글 사이드바 시스템

## 개요

매치 상세 페이지 사이드바에 **관련 게시글**을 표시하는 기능.
게시글에 삽입된 매치/팀/선수 카드 정보를 별도 테이블에 저장하고, 매치 페이지에서 관련 글을 조회한다.

## 데이터 구조

### 새 테이블: `post_card_links`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK, default: gen_random_uuid()) | |
| post_id | uuid (FK → posts.id, ON DELETE CASCADE) | 게시글 ID |
| card_type | varchar | `match`, `team`, `player` |
| match_id | varchar (nullable) | 매치 번호 |
| team_id | integer (nullable) | 팀 번호 |
| player_id | integer (nullable) | 선수 번호 |
| created_at | timestamptz (default: now()) | |

인덱스:
- `idx_post_card_links_post_id` → post_id
- `idx_post_card_links_match_id` → match_id (WHERE match_id IS NOT NULL)
- `idx_post_card_links_team_id` → team_id (WHERE team_id IS NOT NULL)
- `idx_post_card_links_player_id` → player_id (WHERE player_id IS NOT NULL)

### 카드 타입별 저장 규칙

#### 매치카드 삽입 시 (3건 저장)

예: 매치 1379194 (맨유 vs 리버풀)

| card_type | match_id | team_id | player_id |
|---|---|---|---|
| match | 1379194 | NULL | NULL |
| team | 1379194 | 33 (맨유) | NULL |
| team | 1379194 | 40 (리버풀) | NULL |

#### 팀카드 삽입 시 (1건 저장)

| card_type | match_id | team_id | player_id |
|---|---|---|---|
| team | NULL | 33 | NULL |

#### 선수카드 삽입 시 (1건 저장)

| card_type | match_id | team_id | player_id |
|---|---|---|---|
| player | NULL | 33 (소속팀) | 882 (선수) |

## 저장 시점

게시글 **생성/수정** 시 content JSON을 파싱하여 카드 노드를 추출하고 `post_card_links`에 저장.

- 생성: content에서 카드 추출 → INSERT
- 수정: 기존 links DELETE → 새로 INSERT (전체 교체)
- 삭제: CASCADE로 자동 삭제

## 관련글 조회 로직

매치 상세 페이지에서 `match_id`와 양쪽 `team_id`를 기준으로 조회.

### 우선순위

1. **이 매치 관련**: `WHERE match_id = '{matchId}'`
2. **팀 관련**: `WHERE team_id IN (홈팀ID, 원정팀ID) AND match_id IS NULL`

### 조회 쿼리 (예시)

```sql
SELECT DISTINCT p.id, p.title, p.created_at, p.view_count,
       pcl.card_type, pcl.match_id, pcl.team_id
FROM post_card_links pcl
JOIN posts p ON p.id = pcl.post_id
WHERE (
  pcl.match_id = '1379194'
  OR pcl.team_id IN (33, 40)
)
AND p.is_deleted = false
ORDER BY
  CASE WHEN pcl.match_id = '1379194' THEN 0 ELSE 1 END,
  p.created_at DESC
LIMIT 10;
```

## 사이드바 UI

```
┌─────────────────────────┐
│  관련 게시글              │
├─────────────────────────┤
│  경기 프리뷰: 맨유 vs 리버풀  │ ← 매치 관련
│  오늘 경기 라인업 예상        │ ← 매치 관련
│  맨유 이적 루머 정리         │ ← 팀 관련
│  리버풀 시즌 분석           │ ← 팀 관련
├─────────────────────────┤
│  더보기 →                 │
└─────────────────────────┘
```

- 매치 관련 글 우선, 이후 팀 관련 글
- 최대 5~10건 표시
- 관련 글이 없으면 섹션 숨김
- 각 항목 클릭 시 해당 게시글로 이동

## 수정 대상 파일

### 1. 마이그레이션
- `post_card_links` 테이블 생성

### 2. 서버 액션 수정
- `src/domains/boards/actions/posts/create.ts` → 저장 시 카드 링크 추출/저장
- `src/domains/boards/actions/posts/update.ts` → 수정 시 카드 링크 갱신
- (삭제는 CASCADE 처리)

### 3. 카드 추출 유틸리티
- `src/domains/boards/utils/extractCardLinks.ts` (신규)
- content JSON에서 matchCard, teamCard, playerCard 노드를 파싱하여 링크 배열 반환

### 4. 관련글 조회 서버 액션
- `src/domains/livescore/actions/match/relatedPosts.ts` (신규)
- match_id, team_ids로 관련 게시글 조회

### 5. 사이드바 컴포넌트
- `src/domains/livescore/components/football/match/sidebar/RelatedPosts.tsx` (신규)
- 관련 게시글 목록 UI

### 6. 사이드바 통합
- `src/domains/livescore/components/football/match/sidebar/MatchSidebar.tsx` → RelatedPosts 추가
