# 게시판 슬러그 사용처 전체 문서

## 개요

게시판 슬러그(slug)가 하드코딩되어 있는 모든 위치를 정리한 문서입니다.
슬러그 변경 시 반드시 이 문서의 모든 위치를 확인하고 수정해야 합니다.

---

## 1. 특수 게시판 슬러그 (변경 금지)

이 슬러그들은 특수 로직에 사용되므로 변경하면 안 됩니다.

### `notice` / `notices` - 공지사항 게시판

| 파일 | 라인 | 사용 방식 | 설명 |
|------|------|----------|------|
| `src/domains/boards/actions/getPosts.ts` | 109 | `boardData?.slug === 'notice'` | 공지 게시판 판별 |
| `src/app/boards/[slug]/page.tsx` | 132 | `slug === 'notice' \|\| slug === 'notices'` | 공지 게시판 체크 |
| `src/domains/boards/components/layout/BoardDetailLayout.tsx` | 231 | `slug === 'notice' \|\| slug === 'notices'` | NoticeList 렌더링 분기 |
| `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx` | 24 | `href: '/boards/notice'` | 퀵링크 URL |

### `data-analysis` - 분석 게시판 (모아보기)

| 파일 | 라인 | 사용 방식 | 설명 |
|------|------|----------|------|
| `src/domains/boards/actions/getPosts.ts` | 112 | `boardData?.slug === 'data-analysis'` | 분석글 모아보기 필터 활성화 |

---

## 2. 리그 게시판 슬러그 (통일 필요)

### 현재 DB 상태

| 리그 | 현재 슬러그 | league_id | 권장 슬러그 |
|------|------------|-----------|------------|
| 프리미어리그 | `premier` | 39 | `premier-league` |
| 라리가 | `laliga` | 140 | `la-liga` |
| 리그앙 | `LIGUE1` ⚠️ | 61 | `ligue-1` |
| 분데스리가 | `bundesliga` | 78 | `bundesliga` (유지) |
| 세리에A | `serie-a` | 135 | `serie-a` (유지) |
| K리그1 | `k-league-1` | 292 | `k-league-1` (유지) |
| K리그2 | `k-league-2` | 293 | `k-league-2` (유지) |

### 하드코딩 위치

#### `src/domains/prediction/actions.ts` (라인 348-356)

```typescript
const LEAGUE_BOARD_MAPPING: Record<number, string> = {
  39: 'premier',      // Premier League
  140: 'laliga',      // La Liga
  61: 'LIGUE1',       // Ligue 1  ⚠️ 대문자
  78: 'bundesliga',   // Bundesliga
  135: 'serie-a',     // Serie A
  292: 'k-league-1',  // K League 1
  98: 'j1-league',    // J1 League
}
```

**용도**: 예측 분석글 작성 시 리그별 게시판 매핑
**수정 방안**: `LEAGUE_BOARD_MAPPING` 제거하고 DB의 `boards.league_id`로 조회

---

#### `src/domains/sidebar/components/league/LeagueStandings.tsx` (라인 14-20)

```typescript
const LEAGUES: League[] = [
  { id: 'premier', name: 'EPL', fullName: '프리미어 리그', apiId: MAJOR_LEAGUE_IDS.PREMIER_LEAGUE },
  { id: 'laliga', name: '라리가', fullName: '라리가', apiId: MAJOR_LEAGUE_IDS.LA_LIGA },
  { id: 'bundesliga', name: '분데스', fullName: '분데스리가', apiId: MAJOR_LEAGUE_IDS.BUNDESLIGA },
  { id: 'serieA', name: '세리에A', fullName: '세리에 A', apiId: MAJOR_LEAGUE_IDS.SERIE_A },
  { id: 'ligue1', name: '리그앙', fullName: '리그 1', apiId: MAJOR_LEAGUE_IDS.LIGUE_1 },
];
```

**용도**: 사이드바 리그 순위 위젯 탭 ID
**참고**: 이 `id`는 게시판 슬러그가 아닌 위젯 내부 식별자로 사용됨
**수정 여부**: 게시판 슬러그와 무관 (변경 불필요)

---

#### `src/domains/sidebar/actions/football.ts` (라인 20)

```typescript
export const fetchStandingsData = cache(async (leagueId: string = 'premier'): Promise<StandingsData | null> => {
```

**용도**: 기본 리그 순위 데이터 조회
**참고**: `LeagueStandings.tsx`의 내부 ID와 연결 (게시판 슬러그 아님)

---

#### `src/app/layout.tsx` (라인 73, 79)

```typescript
const standingsData = await fetchStandingsData('premier').catch(...)
const leagueStandingsComponent = <LeagueStandings initialLeague="premier" initialStandings={standingsData} />;
```

**용도**: 초기 리그 순위 데이터 로드
**참고**: 위젯 내부 ID (게시판 슬러그 아님)

---

## 3. 기타 게시판 슬러그

### `soccer` - 해외축구 게시판

| 파일 | 라인 | 사용 방식 |
|------|------|----------|
| `src/domains/widgets/components/board-collection-widget/actions/getBoardSettings.ts` | 7 | `DEFAULT_BOARD_SLUGS = ['sports-news', 'soccer']` |

**용도**: 게시판 컬렉션 위젯 기본값

---

## 4. 팀 게시판 슬러그

### 현재 DB 상태 (일관성 없음)

| 형식 | 예시 | 개수 |
|------|------|------|
| Title Case | `Liverpool`, `Arsenal`, `Chelsea`, `Barcelona` | 6개 |
| lowercase | `bournemouth`, `wolves`, `fulham`, `brighton`, `everton`, `leicester`, `tottenham` | 7개 |
| kebab-case | `Manchester-City`, `Manchester-United`, `Nottingham-Forest`, `Aston-Villa`, `west-ham`, `crystal-palace`, `ipswic-town` | 7개 |
| PascalCase (붙여쓰기) | `RealMadrid` | 1개 |

### 하드코딩 위치

**없음** ✅ - 팀 슬러그는 코드에 하드코딩되어 있지 않습니다.
(팀 데이터 스크립트 `scripts/teams-data.ts`에만 존재)

---

## 5. 슬러그 변경 시 체크리스트

### 리그 슬러그 변경 시

- [ ] `src/domains/prediction/actions.ts` - `LEAGUE_BOARD_MAPPING` 업데이트
- [ ] DB `boards` 테이블 슬러그 업데이트
- [ ] 기존 URL 리다이렉트 설정 (SEO)

### 팀 슬러그 변경 시

- [ ] DB `boards` 테이블 슬러그 업데이트
- [ ] 기존 URL 리다이렉트 설정 (SEO)

### 특수 게시판 슬러그 변경 시 (비추천)

- [ ] `notice` / `data-analysis`는 로직에 직접 사용되므로 변경 시 코드 수정 필수

---

## 6. 권장 마이그레이션 전략

### 1단계: 코드 개선 (하드코딩 제거)

`prediction/actions.ts`의 `LEAGUE_BOARD_MAPPING`을 DB 조회 방식으로 변경:

```typescript
// Before
const LEAGUE_BOARD_MAPPING: Record<number, string> = {
  39: 'premier',
  ...
}

// After
async function getBoardByLeagueId(leagueId: number) {
  const { data } = await supabase
    .from('boards')
    .select('id, slug')
    .eq('league_id', leagueId)
    .single()
  return data
}
```

### 2단계: DB 슬러그 통일

```sql
-- 리그 슬러그 통일 (kebab-case)
UPDATE boards SET slug = 'ligue-1' WHERE slug = 'LIGUE1';

-- 팀 슬러그 통일 (kebab-case)
UPDATE boards SET slug = 'liverpool' WHERE slug = 'Liverpool';
UPDATE boards SET slug = 'arsenal' WHERE slug = 'Arsenal';
UPDATE boards SET slug = 'real-madrid' WHERE slug = 'RealMadrid';
-- ... 기타 팀들
```

### 3단계: URL 리다이렉트

`next.config.js` 또는 미들웨어에서 기존 URL 리다이렉트:

```javascript
// next.config.js
redirects: async () => [
  { source: '/boards/Liverpool', destination: '/boards/liverpool', permanent: true },
  { source: '/boards/LIGUE1', destination: '/boards/ligue-1', permanent: true },
  // ...
]
```

---

## 7. 관련 문서

- [분석게시판 모아보기](./analysis-board-aggregation.md)
- [게시판 시스템 개요](../README.md)

---

*마지막 업데이트: 2025-01-14*
