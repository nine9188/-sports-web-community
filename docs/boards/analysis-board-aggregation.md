# 분석게시판 모아보기 기능

## 개요

분석 게시글을 각 리그 게시판에 작성하고, 분석게시판(`/boards/data-analysis`)에서 모든 리그의 분석글을 모아서 볼 수 있도록 하는 기능.

## 배경

### 기존 방식
- 분석 게시글을 분석게시판에만 작성
- 리그 게시판에서는 해당 리그 분석글을 볼 수 없음

### 변경 방식
- 분석 게시글을 **각 리그 게시판에 작성** (예: 프리미어리그 분석글 → 프리미어리그 게시판)
- 분석게시판은 **모아보기 뷰**로 동작 (모든 리그의 분석글 집계)

## 장점

1. **리그 팬과 소통**: 프리미어리그 분석글은 프리미어리그 팬들이 있는 게시판에서 댓글/반응
2. **자연스러운 로고 표시**: 각 게시글에 원본 게시판(리그) 로고가 표시됨
3. **통합 뷰 유지**: 분석게시판에서 모든 분석글을 한눈에 볼 수 있음

## 기술 구현

### 분석글 식별 방법

분석 게시글은 `posts.meta` 필드에 다음 정보를 포함:

```json
{
  "prediction_type": "league_analysis",
  "league_id": 39,
  "league_name": "Premier League"
}
```

### 현재 데이터 구조

| 테이블 | 필드 | 설명 |
|--------|------|------|
| `posts` | `board_id` | 원본 게시판 (리그 게시판) |
| `posts` | `meta->>'prediction_type'` | `'league_analysis'` |
| `posts` | `meta->>'league_id'` | 리그 ID (예: 39 = 프리미어리그) |
| `boards` | `league_id` | 리그 게시판의 리그 ID |

### 분석게시판 정보

```
ID: e3e9e8b8-4d77-463d-ad0c-997b85cf2d05
Name: 경기 데이터 분석
Slug: data-analysis
URL: /boards/data-analysis
```

### 수정 대상 파일

```
src/domains/boards/actions/getPosts.ts
```

### 수정 내용

`fetchPosts` 함수에서 분석게시판 조회 시 특수 처리:

```typescript
// 기존: 공지게시판 특수 처리
if (isNoticeBoard && noticeBoardId) {
  postsQuery = postsQuery.or(`board_id.eq.${noticeBoardId},is_notice.eq.true`);
}

// 추가: 분석게시판 특수 처리
if (isAnalysisBoard) {
  // board_id 필터 대신 meta->>'prediction_type' 필터 사용
  postsQuery = postsQuery.eq('meta->>prediction_type', 'league_analysis');
}
```

### 쿼리 변경 상세

**Before (분석게시판 조회):**
```sql
SELECT * FROM posts
WHERE board_id = 'e3e9e8b8-4d77-463d-ad0c-997b85cf2d05'
ORDER BY created_at DESC;
```

**After (분석게시판 조회):**
```sql
SELECT * FROM posts
WHERE meta->>'prediction_type' = 'league_analysis'
ORDER BY created_at DESC;
```

## 결과 예시

### 분석게시판 목록

```
┌─────────────────────────────────────────────────┐
│ 경기 데이터 분석 (모아보기)                        │
├─────────────────────────────────────────────────┤
│ 🏴󠁧󠁢󠁥󠁮󠁧󠁿 1월 14일 프리미어리그 경기 분석 [12] │
│ 🇪🇸 1월 14일 라리가 경기 분석 [8]              │
│ 🇰🇷 1월 14일 K리그 경기 분석 [15]             │
│ 🇮🇹 1월 13일 세리에A 경기 분석 [5]            │
└─────────────────────────────────────────────────┘
         ↑ 각 리그 게시판 로고 표시
```

### 리그 게시판 목록

```
┌─────────────────────────────────────────────────┐
│ 프리미어리그                                      │
├─────────────────────────────────────────────────┤
│ 손흥민 오늘 경기 MVP [32]                        │
│ 🔥 1월 14일 프리미어리그 경기 분석 [12]          │  ← 분석글
│ 아스날 vs 첼시 프리뷰 [18]                       │
└─────────────────────────────────────────────────┘
```

## 체크리스트

- [x] `getPosts.ts`에서 분석게시판 slug 확인 로직 추가 (2025-01-14)
- [x] 분석게시판일 때 `meta->>'prediction_type'` 필터 적용 (2025-01-14)
- [x] 카운트 쿼리도 동일하게 수정 (2025-01-14)
- [x] `prediction/actions.ts` 게시판 선택 로직 수정 (2025-01-14)
  - 리그 게시판 우선, 없으면 해외축구 게시판 fallback
  - 해외축구 게시판 항상 추가 로직 제거 (계층 구조로 자동 노출됨)
  - `post_boards` 테이블 사용 제거, 단일 `board_id`만 사용
- [ ] 테스트: 분석게시판에서 여러 리그 분석글이 모아지는지 확인
- [ ] 테스트: 각 게시글에 원본 리그 로고가 표시되는지 확인

## 관련 문서

- [게시판 시스템 개요](../README.md)
