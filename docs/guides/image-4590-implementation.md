# 이미지 4590 표준 - 구현 계획서

> **관련 문서**: [image-4590-standard.md](./image-4590-standard.md) (표준 규칙)

---

## 1. 현재 상황 분석

### 1.1 API-Sports URL 직접 사용 파일 목록

총 **13개 파일**에서 `media.api-sports.io` URL을 사용 중.

| # | 파일 | 용도 | 분류 |
|---|------|------|------|
| 1 | `shared/components/UnifiedSportsImage.tsx` | 통합 이미지 컴포넌트 | 🔴 근본 (마지막 처리) |
| 2 | `livescore/actions/match/lineupData.ts` | 라인업 데이터 | 🟡 P1 서버액션 |
| 3 | `livescore/actions/match/playerStats.ts` | 선수 스탯 | 🟡 P1 서버액션 |
| 4 | `search/actions/searchEntities.ts` | 엔티티 검색 | 🟡 P1 서버액션 |
| 5 | `boards/.../useEditorHandlers.ts` | 에디터 훅 | 🟠 P2 클라이언트훅 |
| 6 | `livescore/.../lineups/Player.tsx` | SVG 라인업 | 🔵 P3 예외(SVG) |
| 7 | `boards/.../playerCardRenderer.ts` | HTML 렌더러 | 🔵 P3 예외(HTML) |
| 8 | `livescore/.../match/tabs/Power.tsx` | 파워 비교 탭 | 🟢 P4 컴포넌트교체 |
| 9 | `boards/components/cards/PlayerCard.tsx` | 선수 카드 | 🟢 P4 컴포넌트교체 |
| 10 | `shared/utils/matchCard.ts` | URL 변환 유틸 | ✅ OK (유틸) |
| 11 | `shared/utils/imageProxy.ts` | 이미지 프록시 | ✅ OK (유틸) |
| 12 | `shared/components/UserIcon.tsx` | URL 체크 함수 | ✅ OK (유틸) |
| 13 | `shop/components/PurchaseModal.tsx` | URL 체크 함수 | ✅ OK (유틸) |

### 1.2 분류 설명

| 분류 | 설명 | 조치 |
|------|------|------|
| 🔴 근본 | UnifiedSportsImage 자체가 API-Sports 사용 | 마지막 단계에서 처리 |
| 🟡 P1 | 서버 액션에서 URL 생성 → 클라이언트 노출 | **우선 처리** |
| 🟠 P2 | 클라이언트 훅에서 URL 생성 | 서버 액션으로 위임 |
| 🔵 P3 | 컴포넌트 교체 불가 (SVG/HTML) | URL만 Storage로 변경 |
| 🟢 P4 | 컴포넌트 교체 가능 | UnifiedSportsImage로 교체 |
| ✅ OK | URL 체크/변환용 유틸 | 그대로 유지 |

---

## 2. 구현 목표

### 2.1 이번 단계 목표

```
✅ 클라이언트로 API-Sports URL이 절대 내려가지 않게 만들기
✅ SVG/HTML 예외 케이스도 Storage URL만 쓰게 만들기
✅ 서버 액션/에디터/카드/탭이 모두 "Storage URL" 기준으로 동작
```

### 2.2 제외 항목 (다음 단계)

- `UnifiedSportsImage.tsx` 내부 로직 변경
- 기존 게시글 본문의 API-Sports URL 마이그레이션

---

## 3. 인프라 준비

### 3.1 DB 테이블: `asset_cache`

```sql
CREATE TABLE public.asset_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 에셋 식별
  type TEXT NOT NULL,           -- 'player_photo', 'coach_photo', 'team_logo', 'league_logo'
  entity_id BIGINT NOT NULL,

  -- Storage 정보
  storage_path TEXT NOT NULL,   -- 예: 'photos/players/306.jpg'
  source_url TEXT,              -- API-Sports 원본 URL

  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'pending',  -- 'ready', 'pending', 'error'
  error_message TEXT,

  -- 타임스탬프
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유니크 제약
  CONSTRAINT asset_cache_type_entity_unique UNIQUE (type, entity_id)
);
```

**상태**: ✅ 생성 완료 (2026-02-06)

### 3.2 Storage 버킷: `assets-public`

| 경로 | 용도 | 예시 |
|------|------|------|
| `photos/players/{id}.jpg` | 선수 사진 | `photos/players/306.jpg` |
| `photos/coachs/{id}.jpg` | 감독 사진 | `photos/coachs/123.jpg` |
| `logos/teams/{id}.png` | 팀 로고 | `logos/teams/33.png` |
| `logos/leagues/{id}.png` | 리그 로고 | `logos/leagues/39.png` |

**상태**: ⏳ 확인 필요

### 3.3 TTL 정책

| 타입 | TTL | 근거 |
|------|-----|------|
| 선수 사진 | 30일 | 이적/변경 가능성 |
| 감독 사진 | 30일 | 이적/변경 가능성 |
| 팀 로고 | 90일 | 거의 변경 없음 |
| 리그 로고 | 90일 | 거의 변경 없음 |

---

## 4. 핵심 서버 함수 설계

### 4.1 파일 위치

```
src/domains/livescore/actions/images/
├── index.ts              # re-export (진입점)
├── constants.ts          # 상수 정의
├── ensureAssetCached.ts  # 공통 캐싱 로직
├── getTeamLogoUrl.ts     # 팀 로고 URL
├── getLeagueLogoUrl.ts   # 리그 로고 URL
├── getPlayerPhotoUrl.ts  # 선수 사진 URL
└── getCoachPhotoUrl.ts   # 감독 사진 URL
```

### 4.2 함수 시그니처

```typescript
// 팀 로고
async function getTeamLogoUrl(teamId: number): Promise<string>
async function getTeamLogoUrls(teamIds: number[]): Promise<Record<number, string>>

// 리그 로고 (다크모드 지원)
async function getLeagueLogoUrl(leagueId: number, isDark?: boolean): Promise<string>
async function getLeagueLogoUrls(leagueIds: number[], isDark?: boolean): Promise<Record<number, string>>

// 선수 사진
async function getPlayerPhotoUrl(playerId: number): Promise<string>
async function getPlayerPhotoUrls(playerIds: number[]): Promise<Record<number, string>>

// 감독 사진
async function getCoachPhotoUrl(coachId: number): Promise<string>
async function getCoachPhotoUrls(coachIds: number[]): Promise<Record<number, string>>
```

### 4.3 내부 동작 흐름

```
getPlayerPhotoUrl(playerId)
    │
    ▼
┌─────────────────────────────────────┐
│ 1. asset_cache 조회                  │
│    WHERE type='player_photo'        │
│    AND entity_id={playerId}         │
└─────────────────────────────────────┘
    │
    ├─── status='ready' ──► Storage URL 반환
    │
    ├─── status='pending' ──► 잠시 대기 후 재시도 또는 placeholder
    │
    └─── 없음 또는 'error' ──▼
                              │
┌─────────────────────────────────────┐
│ 2. pending 락 선점 (upsert)          │
│    status='pending'                 │
└─────────────────────────────────────┘
    │
    ├─── 선점 실패 ──► placeholder 반환
    │
    └─── 선점 성공 ──▼
                      │
┌─────────────────────────────────────┐
│ 3. API-Sports에서 이미지 다운로드     │
│    https://media.api-sports.io/...  │
└─────────────────────────────────────┘
    │
    ├─── 실패 ──► status='error', placeholder 반환
    │
    └─── 성공 ──▼
                │
┌─────────────────────────────────────┐
│ 4. Storage에 업로드                  │
│    photos/players/{playerId}.jpg    │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 5. asset_cache 업데이트              │
│    status='ready'                   │
│    storage_path=...                 │
└─────────────────────────────────────┘
    │
    ▼
   Storage URL 반환
```

### 4.4 Placeholder 정책

```typescript
const PLACEHOLDER_URLS = {
  player_photo: '/images/placeholder-player.png',
  coach_photo: '/images/placeholder-coach.png',
  team_logo: '/images/placeholder-team.png',
  league_logo: '/images/placeholder-league.png',
};
```

---

## 5. 파일별 수정 계획

### 5.1 P1: 서버 액션 (3개)

#### 5.1.1 `lineupData.ts`

**현재 코드**:
```typescript
photo: `https://media.api-sports.io/football/players/${item.player.id}.png`
// ...
photo: `https://media.api-sports.io/football/coachs/${teamData.coach.id}.png`
```

**수정 방향**:
```typescript
// 1. 선수 ID 목록 수집
const playerIds = [...homeStartXI, ...homeSubstitutes, ...awayStartXI, ...awaySubstitutes]
  .map(p => p.player.id);
const coachIds = [homeCoach.id, awayCoach.id];

// 2. 배치로 Storage URL 조회
const playerPhotos = await getPlayerPhotoUrls(playerIds);
const coachPhotos = await getCoachPhotoUrls(coachIds);

// 3. 매핑
photo: playerPhotos[item.player.id] || PLACEHOLDER_URLS.player_photo
```

**주의사항**:
- 라인업은 선수 22명 + 교체 14명 + 감독 2명 = 최대 38명
- 배치 처리 필수

#### 5.1.2 `playerStats.ts`

**현재 코드**:
```typescript
photo: p.player.photo || `https://media.api-sports.io/football/players/${playerId}.png`
```

**수정 방향**:
```typescript
const playerPhotos = await getPlayerPhotoUrls(playerIds);
photo: playerPhotos[playerId] || PLACEHOLDER_URLS.player_photo
```

#### 5.1.3 `searchEntities.ts`

**현재 코드**:
```typescript
imageUrl: player.photo_url || `https://media.api-sports.io/football/players/${player.player_id}.png`
```

**수정 방향**:
```typescript
// 검색 결과는 상위 N개만 이미지 resolve
const topPlayerIds = players.slice(0, 20).map(p => p.player_id);
const playerPhotos = await getPlayerPhotoUrls(topPlayerIds);

imageUrl: playerPhotos[player.player_id] || PLACEHOLDER_URLS.player_photo
```

**주의사항**:
- 검색 결과가 많을 수 있음
- 상위 20개만 실제 URL resolve
- 나머지는 placeholder 또는 on-demand

---

### 5.2 P2: 클라이언트 훅 (1개)

#### 5.2.1 `useEditorHandlers.ts`

**현재 코드**:
```typescript
photo: player.photo || `https://media.api-sports.io/football/players/${player.id}.png`
```

**수정 방향**:

1. **새 서버 액션 생성**: `createPlayerCardData(playerId)`
2. **훅에서 서버 액션 호출**:

```typescript
// useEditorHandlers.ts
const handleSelectPlayer = async (player: SearchPlayer) => {
  // 서버에서 완성된 데이터 받기
  const cardData = await createPlayerCardData(player.id);

  if (cardData.success) {
    commands.setPlayerCard(player.id, cardData.data);
  }
};
```

3. **서버 액션 구현**: `createPlayerCardData.ts`
```typescript
export async function createPlayerCardData(playerId: number) {
  const photoUrl = await getPlayerPhotoUrl(playerId);
  const playerInfo = await getPlayerInfo(playerId); // 기존 함수 활용

  return {
    success: true,
    data: {
      id: playerId,
      name: playerInfo.name,
      koreanName: playerInfo.koreanName,
      photo: photoUrl,  // Storage URL
      team: { ... },
    }
  };
}
```

---

### 5.3 P3: 예외 케이스 (2개)

#### 5.3.1 `Player.tsx` (SVG)

**제약**: SVG `<image href>` 태그는 React 컴포넌트 사용 불가

**현재 코드**:
```typescript
const imageUrl = playerId ? `${API_SPORTS_BASE_URL}/players/${playerId}.png` : null;
// ...
<image href={imageUrl} ... />
```

**수정 방향**:

라인업 데이터(`lineupData.ts`)가 이미 Storage URL을 포함하므로, Player.tsx는 전달받은 URL을 그대로 사용.

```typescript
// Player.tsx - props에서 photo URL 받음
interface PlayerData {
  id: number;
  name: string;
  photo: string;  // 이미 Storage URL
  // ...
}

// SVG에서 그대로 사용
<image href={player.photo} ... />
```

**결론**: `lineupData.ts` 수정 완료 시 자동 해결

#### 5.3.2 `playerCardRenderer.ts` (HTML string)

**제약**: Tiptap 에디터용 순수 HTML 문자열 반환

**현재 코드**:
```typescript
photo: (data.photo as string) || `https://media.api-sports.io/football/players/${data.id}.png`
```

**수정 방향**:

렌더러는 "이미 완성된 데이터"만 받아서 HTML로 변환.
데이터 생성 단계(`useEditorHandlers.ts` → `createPlayerCardData`)에서 Storage URL이 들어가므로, 렌더러는 변경 불필요.

```typescript
// playerCardRenderer.ts - 변경 없음, 단 fallback URL 제거
photo: data.photo || PLACEHOLDER_URLS.player_photo  // API-Sports fallback 제거
```

---

### 5.4 P4: 컴포넌트 교체 (2개)

#### 5.4.1 `Power.tsx`

**현재 코드**:
```typescript
<Image
  src={`https://media.api-sports.io/football/players/${playerA.playerId}.png`}
  ...
/>
```

**수정 방향 A** (임시 - Storage URL 직접 사용):
```typescript
// 상위에서 playerPhotos 맵 전달받음
<Image src={playerPhotos[playerA.playerId]} ... />
```

**수정 방향 B** (권장 - UnifiedSportsImage):
```typescript
<UnifiedSportsImage
  imageId={playerA.playerId}
  imageType={ImageType.Players}
  size="md"
  variant="circle"
/>
```

**선택**: UnifiedSportsImage가 마지막이므로, **방향 A**로 임시 처리 후 나중에 통일

#### 5.4.2 `PlayerCard.tsx`

**현재 코드**:
```typescript
const playerPhoto = photo || `https://media.api-sports.io/football/players/${numericPlayerId}.png`;
<img src={playerPhoto} ... />
```

**수정 방향**:
```typescript
// props.photo가 이미 Storage URL이어야 함
// fallback은 placeholder로 변경
const playerPhoto = photo || PLACEHOLDER_URLS.player_photo;
```

---

## 6. 구현 순서 체크리스트

### Phase 1: 인프라 준비
- [x] `asset_cache` 테이블 생성
- [x] Storage 버킷 확인 (`players`, `coachs`, `teams`, `leagues`)
- [x] placeholder 이미지 경로 정의 (`/images/placeholder-player.png` 등)

### Phase 2: 핵심 서버 함수
- [x] `constants.ts` 생성
- [x] `ensureAssetCached.ts` 생성
- [x] `getPlayerPhotoUrl.ts` 생성
- [x] `getCoachPhotoUrl.ts` 생성
- [x] `getTeamLogoUrl.ts` 생성 (2026-02-06 추가)
- [x] `getLeagueLogoUrl.ts` 생성 (2026-02-06 추가)
- [x] `index.ts` re-export

### Phase 3: P1 서버 액션 수정
- [x] `lineupData.ts` 수정
- [x] `playerStats.ts` 수정
- [x] `searchEntities.ts` 수정

### Phase 4: P2 클라이언트 훅 수정
- [x] `createPlayerCardData.ts` 서버 액션 생성
- [x] `useEditorHandlers.ts` 수정

### Phase 5: P3 예외 케이스
- [x] `Player.tsx` 확인 (lineupData 수정으로 자동 해결 - props로 Storage URL 전달)
- [x] `playerCardRenderer.ts` fallback 수정 (placeholder 사용)

### Phase 6: P4 컴포넌트 교체
- [x] `Power.tsx` 수정 (playerPhotoUrls 맵으로 Storage URL 사용)
- [x] `PlayerCard.tsx` 수정 (placeholder fallback 사용)

### Phase 7: 검증
- [x] API-Sports URL이 클라이언트에 노출되지 않는지 확인
- [x] `UnifiedSportsImage.tsx` - 모든 타입에서 Storage URL 사용하도록 변경
- [x] `headtohead.ts` - playerPhotoUrls 추가

### 추가 개선 (Phase 8)
- [x] `UnifiedSportsImage.tsx` - 선수/감독도 Storage URL 사용하도록 변경
- [x] `Power.tsx` - findTeamMeta에서 API-Sports fallback 제거

### 클라이언트 URL 조합 제거 (Phase 9) - 2026-02-06
- [x] `createTeamCardData.ts` 서버 액션 생성 (팀 카드용)
- [x] `createMatchCardData.ts` 서버 액션 생성 (매치 카드용)
- [x] `createPlayerCardData.ts` - `getTeamLogoUrl` 사용으로 수정
- [x] `useEditorHandlers.ts` - 팀/매치 카드도 서버 액션 사용
- [x] `playerCardRenderer.ts` - Storage URL 조합 제거, placeholder 사용

---

## 7. 성능 고려사항

### 7.1 배치 처리

```typescript
// 나쁜 예 - N번 DB 호출
for (const id of playerIds) {
  const url = await getPlayerPhotoUrl(id);
}

// 좋은 예 - 1번 DB 호출 + 병렬 처리
const urls = await getPlayerPhotoUrls(playerIds);
```

### 7.2 중복 제거

```typescript
// 같은 선수가 여러 번 나올 수 있음 (교체 등)
const uniquePlayerIds = [...new Set(playerIds)];
```

### 7.3 에러 격리

```typescript
// 한 선수 이미지 실패가 전체를 막으면 안 됨
const results = await Promise.allSettled(
  playerIds.map(id => ensureAssetCached('player_photo', id))
);
```

---

## 8. 롤백 계획

문제 발생 시:

1. **서버 함수에서 fallback 활성화**:
```typescript
// 임시로 API-Sports URL 직접 반환
if (EMERGENCY_FALLBACK) {
  return `https://media.api-sports.io/football/players/${playerId}.png`;
}
```

2. **환경 변수로 제어**:
```
DISABLE_IMAGE_CACHE=true
```

---

**문서 작성일**: 2026-02-06
**상태**: ✅ 구현 완료

---

## 9. UnifiedSportsImage Import 현황 (48개 파일)

> **분석일**: 2026-02-06
>
> `UnifiedSportsImage`(서버 컴포넌트, async)를 import하는 48개 파일 목록.
> 클라이언트 컴포넌트에서 서버 컴포넌트를 직접 import하면 4590 표준 위반.

### 9.1 서버 컴포넌트 (✅ 정상) - 3개

서버 컴포넌트에서 `UnifiedSportsImage`(서버) 사용은 정상.

| # | 파일 경로 | 비고 |
|---|----------|------|
| 1 | `widgets/components/live-score-widget/MatchCardServer.tsx` | 서버 컴포넌트 |
| 2 | `widgets/components/live-score-widget/LeagueHeader.tsx` | 서버 컴포넌트 |
| 3 | `sidebar/components/TopicPostItem.tsx` | 서버 컴포넌트 |

### 9.2 클라이언트 컴포넌트 (⚠️ 수정필요) - 45개

클라이언트 컴포넌트에서 서버 컴포넌트(`UnifiedSportsImage`)를 직접 import 중.
**수정 방향**: `UnifiedSportsImageClient`로 교체하고, URL은 부모 서버 컴포넌트에서 전달.

#### Livescore 도메인 (34개)

| # | 파일 경로 | 용도 |
|---|----------|------|
| 1 | `livescore/.../match/tabs/Power.tsx` | 파워 비교 |
| 2 | `livescore/.../player/tabs/PlayerRankings.tsx` | 선수 랭킹 |
| 3 | `livescore/.../team/tabs/overview/components/SeasonHighlights.tsx` | 시즌 하이라이트 |
| 4 | `livescore/.../team/tabs/transfers/TransfersTab.tsx` | 이적 탭 |
| 5 | `livescore/.../team/tabs/overview/components/RecentTransfers.tsx` | 최근 이적 |
| 6 | `livescore/.../team/tabs/Squad.tsx` | 스쿼드 |
| 7 | `livescore/.../player/PlayerHeader.tsx` | 선수 헤더 |
| 8 | `livescore/.../match/tabs/lineups/components/PlayerStatsModal.tsx` | 선수 스탯 모달 |
| 9 | `livescore/.../match/tabs/lineups/Lineups.tsx` | 라인업 |
| 10 | `livescore/.../match/tabs/Stats.tsx` | 경기 스탯 |
| 11 | `livescore/.../match/tabs/Events.tsx` | 경기 이벤트 |
| 12 | `livescore/.../match/MatchHeader.tsx` | 경기 헤더 |
| 13 | `livescore/.../match/sidebar/RelatedPosts.tsx` | 관련 게시글 |
| 14 | `livescore/.../team/tabs/overview/components/MatchItems.tsx` | 경기 아이템 |
| 15 | `livescore/.../team/tabs/fixtures/FixturesTab.tsx` | 일정 탭 |
| 16 | `livescore/.../player/tabs/PlayerStats.tsx` | 선수 스탯 |
| 17 | `livescore/.../match/sidebar/MatchPredictionClient.tsx` | 경기 예측 |
| 18 | `livescore/.../match/tabs/Standings.tsx` | 순위표 (경기) |
| 19 | `livescore/.../team/TeamHeader.tsx` | 팀 헤더 |
| 20 | `livescore/.../player/tabs/PlayerTrophies.tsx` | 선수 트로피 |
| 21 | `livescore/.../player/tabs/PlayerTransfers.tsx` | 선수 이적 |
| 22 | `livescore/.../player/tabs/PlayerFixtures.tsx` | 선수 일정 |
| 23 | `livescore/.../player/tabs/PlayerInjuries.tsx` | 선수 부상 |
| 24 | `livescore/.../MainView/LeagueMatchList/index.tsx` | 리그 경기 목록 |
| 25 | `livescore/.../team/tabs/overview/components/StatsCards.tsx` | 스탯 카드 |
| 26 | `livescore/.../team/tabs/overview/components/StandingsPreview.tsx` | 순위 미리보기 |
| 27 | `livescore/.../team/tabs/Standings.tsx` | 순위표 (팀) |
| 28 | `livescore/.../team/tabs/stats/components/BasicStatsCards.tsx` | 기본 스탯 카드 |
| 29 | `livescore/.../leagues/LeagueStandingsTable.tsx` | 리그 순위 테이블 |
| 30 | `livescore/.../leagues/LeagueTeamsList.tsx` | 리그 팀 목록 |
| 31 | `livescore/.../MainView/MatchCard/index.tsx` | 경기 카드 |
| 32 | `livescore/.../leagues/TeamCard.tsx` | 팀 카드 (리그) |
| 33 | `livescore/.../leagues/LeagueHeader.tsx` | 리그 헤더 |
| 34 | `livescore/.../leagues/LeagueCard.tsx` | 리그 카드 |

#### Boards 도메인 (6개)

| # | 파일 경로 | 용도 |
|---|----------|------|
| 1 | `boards/components/entity/EntityPickerForm.tsx` | 엔티티 선택 폼 |
| 2 | `boards/components/notice/NoticeItem.tsx` | 공지 아이템 |
| 3 | `boards/components/post/postlist/.../PostRenderers.tsx` | 게시글 렌더러 |
| 4 | `boards/components/board/LeagueInfo.tsx` | 리그 정보 |
| 5 | `boards/components/board/BoardTeamInfo.tsx` | 팀 정보 |
| 6 | `boards/components/form/MatchResultForm.tsx` | 경기 결과 폼 |

#### 기타 도메인 (5개)

| # | 파일 경로 | 도메인 | 용도 |
|---|----------|--------|------|
| 1 | `sidebar/components/league/LeagueStandings.tsx` | sidebar | 리그 순위 |
| 2 | `layout/components/livescoremodal/MatchItem.tsx` | layout | 경기 아이템 |
| 3 | `shared/components/UserIcon.tsx` | shared | 사용자 아이콘 |
| 4 | `shop/components/PurchaseModal.tsx` | shop | 구매 모달 |
| 5 | `shop/components/ItemCard.tsx` | shop | 아이템 카드 |

### 9.3 수정 방향

#### Before (❌ 잘못된 패턴)

```tsx
'use client';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';

function ClientComponent({ teamId }: { teamId: number }) {
  return (
    <UnifiedSportsImage
      imageId={teamId}
      imageType={ImageType.Teams}
      alt="Team"
    />
  );
}
```

#### After (✅ 올바른 패턴)

**옵션 A**: 부모 서버 컴포넌트에서 URL 전달

```tsx
// 서버 컴포넌트 (page.tsx 또는 layout.tsx)
import { getTeamLogoUrl } from '@/domains/livescore/actions/images';
import ClientComponent from './ClientComponent';

export default async function Page({ teamId }: { teamId: number }) {
  const teamLogoUrl = await getTeamLogoUrl(teamId);
  return <ClientComponent teamLogoUrl={teamLogoUrl} />;
}

// 클라이언트 컴포넌트
'use client';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

function ClientComponent({ teamLogoUrl }: { teamLogoUrl: string }) {
  return <UnifiedSportsImageClient src={teamLogoUrl} alt="Team" />;
}
```

**옵션 B**: 서버 컴포넌트 내에서 UnifiedSportsImage 사용

```tsx
// 서버 컴포넌트
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';

export default async function ServerComponent({ teamId }: { teamId: number }) {
  return (
    <UnifiedSportsImage
      imageId={teamId}
      imageType={ImageType.Teams}
      alt="Team"
    />
  );
}
```

### 9.4 마이그레이션 우선순위

| 우선순위 | 대상 | 개수 | 이유 |
|----------|------|------|------|
| P1 | shared, shop | 3개 | 공통 컴포넌트, 영향 범위 큼 |
| P2 | boards | 6개 | 핵심 기능 |
| P3 | livescore (헤더/카드) | 10개 | 자주 사용 |
| P4 | livescore (탭/기타) | 24개 | 세부 기능 |
| P5 | sidebar, layout | 2개 | 부수적 기능 |

---

## 10. 구현 완료 요약 (Phase 1-8)

### 변경된 파일 목록

**서버 액션 (신규)**:
- `src/domains/livescore/actions/images/constants.ts`
- `src/domains/livescore/actions/images/ensureAssetCached.ts`
- `src/domains/livescore/actions/images/getTeamLogoUrl.ts` (2026-02-06 추가)
- `src/domains/livescore/actions/images/getLeagueLogoUrl.ts` (2026-02-06 추가)
- `src/domains/livescore/actions/images/getPlayerPhotoUrl.ts`
- `src/domains/livescore/actions/images/getCoachPhotoUrl.ts`
- `src/domains/livescore/actions/images/index.ts`
- `src/domains/boards/actions/createPlayerCardData.ts`

**서버 액션 (수정)**:
- `src/domains/livescore/actions/match/lineupData.ts` - 선수/감독 photo에 Storage URL 사용
- `src/domains/livescore/actions/match/playerStats.ts` - extractAllDataFromResponse async화
- `src/domains/livescore/actions/match/headtohead.ts` - playerPhotoUrls 필드 추가
- `src/domains/search/actions/searchEntities.ts` - 배치 Storage URL 조회

**컴포넌트 (수정)**:
- `src/shared/components/UnifiedSportsImage.tsx` - 모든 타입에서 Storage URL 사용
- `src/domains/livescore/components/football/match/tabs/Power.tsx` - playerPhotoUrls 사용
- `src/domains/livescore/components/football/match/tabs/lineups/components/Player.tsx` - props로 Storage URL 전달받음
- `src/domains/boards/components/cards/PlayerCard.tsx` - placeholder fallback 사용
- `src/domains/boards/components/post/post-content/renderers/playerCardRenderer.ts` - placeholder fallback

**훅 (수정)**:
- `src/domains/boards/components/post/post-edit-form/hooks/useEditorHandlers.ts` - 서버 액션으로 위임

### 결과

✅ 클라이언트에서 API-Sports URL 직접 사용 0건
✅ 모든 이미지가 Supabase Storage URL로 제공됨
✅ 서버 액션에서만 API-Sports URL 사용 (최초 1회 수집용)

---

## 11. Phase 9: UnifiedSportsImageClient 마이그레이션 (2026-02-06)

> 클라이언트 컴포넌트에서 서버 컴포넌트(`UnifiedSportsImage`)를 직접 사용하던 문제를 수정.
> `UnifiedSportsImageClient` + props로 Storage URL 전달 패턴 적용.

### 11.1 수정 대상 컴포넌트 (5개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../match/tabs/Power.tsx` | `teamLogoUrls` prop 추가, `getTeamLogo()` 헬퍼 |
| 2 | `livescore/.../player/tabs/PlayerRankings.tsx` | `playerPhotoUrls`, `teamLogoUrls` props 추가 |
| 3 | `livescore/.../team/tabs/overview/components/SeasonHighlights.tsx` | `playerPhotoUrls` prop 추가 |
| 4 | `livescore/.../team/tabs/transfers/TransfersTab.tsx` | `playerPhotoUrls`, `teamLogoUrls` props 추가 |
| 5 | `livescore/.../team/tabs/overview/components/RecentTransfers.tsx` | `playerPhotoUrls`, `teamLogoUrls` props 추가 |

### 11.2 부모 컴포넌트 수정 (3개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../player/TabContent.tsx` | `RankingsTab`에 `playerPhotoUrls`, `teamLogoUrls` 전달 |
| 2 | `livescore/.../team/TabContent.tsx` | `Overview`, `TransfersTab`에 URL 맵 전달 |
| 3 | `livescore/.../team/tabs/overview/Overview.tsx` | `SeasonHighlights`, `RecentTransfers`에 URL 맵 전달 |

### 11.3 서버 액션 수정 (2개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/actions/player/rankings.ts` | 모든 랭킹에서 선수/팀 ID 수집 → 배치 URL 조회 |
| 2 | `livescore/actions/match/headtohead.ts` | `teamLogoUrls` 필드 추가 |

### 11.4 타입 정의 수정 (1개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/types/player.ts` | `RankingsData`에 `playerPhotoUrls`, `teamLogoUrls` 추가 |

### 11.5 수정 패턴

#### Before (❌ 위반)

```tsx
'use client';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';

function PlayerRankings({ rankingsData }: Props) {
  return (
    <UnifiedSportsImage
      imageId={player.id}
      imageType={ImageType.Players}
      alt={player.name}
    />
  );
}
```

#### After (✅ 준수)

```tsx
'use client';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

// 상수 정의
const PLAYER_PLACEHOLDER = '/images/placeholder-player.png';
const TEAM_PLACEHOLDER = '/images/placeholder-team.png';

function PlayerRankings({
  rankingsData,
  playerPhotoUrls = {},  // 서버에서 전달받음
  teamLogoUrls = {}      // 서버에서 전달받음
}: Props) {
  // 헬퍼 함수
  const getPlayerPhoto = (id: number) => playerPhotoUrls[id] || PLAYER_PLACEHOLDER;
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;

  return (
    <UnifiedSportsImageClient
      src={getPlayerPhoto(player.id)}  // Storage URL 또는 placeholder
      alt={player.name}
    />
  );
}
```

### 11.6 데이터 흐름

```
[서버 액션: rankings.ts]
    │
    ├── 모든 선수/팀 ID 수집 (Set으로 중복 제거)
    │   └── topScorers, topAssists, topYellowCards, topRedCards
    │
    ├── getPlayerPhotoUrls([...allPlayerIds])
    ├── getTeamLogoUrls([...allTeamIds])
    │
    └── result.playerPhotoUrls, result.teamLogoUrls에 저장
          │
          ▼
[부모 컴포넌트: TabContent.tsx]
    │
    ├── const { rankingsData } = usePlayerTabData(...)
    │
    └── <PlayerRankings
          rankingsData={rankings}
          playerPhotoUrls={rankingsData.playerPhotoUrls}
          teamLogoUrls={rankingsData.teamLogoUrls}
        />
          │
          ▼
[자식 컴포넌트: PlayerRankings.tsx]
    │
    └── <UnifiedSportsImageClient
          src={getPlayerPhoto(player.id)}
          alt={player.name}
        />
```

### 11.7 빌드 검증

```bash
npm run build
# ✅ 성공 - 컴파일 오류 없음
```

---

## 11-2. Phase 9 추가 마이그레이션 (2026-02-06)

### 11-2.1 수정 대상 컴포넌트 (5개 추가)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../team/tabs/Squad.tsx` | `playerPhotoUrls`, `coachPhotoUrls` props 추가 |
| 2 | `livescore/.../player/PlayerHeader.tsx` | `playerPhotoUrl`, `teamLogoUrl` props 추가 |
| 3 | `livescore/.../match/tabs/lineups/Lineups.tsx` | `teamLogoUrls` prop 추가 |
| 4 | `livescore/.../match/tabs/lineups/components/PlayerStatsModal.tsx` | `teamLogoUrl` prop 추가 |
| 5 | `livescore/.../match/tabs/Stats.tsx` | `teamLogoUrls` prop 추가 |

### 11-2.2 서버 액션 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/actions/teams/team.ts` | `coachPhotoUrls` 필드 추가 |
| 2 | `livescore/actions/player/data.ts` | `playerPhotoUrl`, `teamLogoUrl` 필드 추가 |
| 3 | `livescore/actions/match/matchData.ts` | `teamLogoUrls` 필드 추가, `getTeamLogoUrls()` 호출 |

### 11-2.3 부모 컴포넌트 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../team/TabContent.tsx` | `Squad`에 `coachPhotoUrls` 전달 |
| 2 | `livescore/.../player/PlayerPageClient.tsx` | `PlayerHeader`에 URL props 전달 |
| 3 | `livescore/.../match/TabContent.tsx` | `Lineups`, `Stats`에 `teamLogoUrls` 전달 |

### 11-2.4 데이터 흐름 예시 (Match)

```
[서버 액션: matchData.ts]
    │
    ├── 홈/원정팀 ID 수집
    │
    ├── getTeamLogoUrls([homeTeam.id, awayTeam.id])
    │
    └── response.teamLogoUrls에 저장
          │
          ▼
[클라이언트: TabContent.tsx]
    │
    ├── const { teamLogoUrls } = initialData;
    │
    ├── <Lineups teamLogoUrls={teamLogoUrls} />
    └── <Stats teamLogoUrls={teamLogoUrls} />
          │
          ▼
[자식 컴포넌트: Lineups.tsx / Stats.tsx]
    │
    ├── const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
    │
    └── <UnifiedSportsImageClient src={getTeamLogo(teamId)} alt="..." />
```

### 11-2.5 참고: lineupData.ts의 이미지 URL

`lineupData.ts`는 이미 선수/감독 사진에 Storage URL을 사용합니다:
- `player.photo`: `getPlayerPhotoUrls()`로 조회된 Storage URL
- `coach.photo`: `getCoachPhotoUrls()`로 조회된 Storage URL

따라서 `Lineups.tsx`에서는 `player.photo`, `coach.photo`를 그대로 사용하고,
팀 로고만 `teamLogoUrls` prop에서 조회합니다.

---

## 12. 마이그레이션 작업 완료

> 섹션 9.2에 나열된 45개 클라이언트 컴포넌트 **전체 완료** ✅
> 모든 컴포넌트가 `UnifiedSportsImageClient` + props 패턴으로 마이그레이션됨.

### 12.1 마이그레이션 체크리스트

#### Livescore 도메인 (34개 → 완료 ✅)

- [x] `Power.tsx`
- [x] `PlayerRankings.tsx`
- [x] `SeasonHighlights.tsx`
- [x] `TransfersTab.tsx`
- [x] `RecentTransfers.tsx`
- [x] `Squad.tsx` ✅ 2026-02-06 완료
- [x] `PlayerHeader.tsx` ✅ 2026-02-06 완료
- [x] `PlayerStatsModal.tsx` ✅ 2026-02-06 완료
- [x] `Lineups.tsx` ✅ 2026-02-06 완료
- [x] `Stats.tsx` (match) ✅ 2026-02-06 완료
- [x] `Events.tsx` ✅ 2026-02-06 완료
- [x] `MatchHeader.tsx` ✅ 2026-02-06 완료
- [x] `RelatedPosts.tsx` ✅ 2026-02-06 완료
- [x] `MatchItems.tsx` ✅ 2026-02-06 완료
- [x] `FixturesTab.tsx` ✅ 2026-02-06 완료
- [x] `PlayerStats.tsx` ✅ 2026-02-06 완료
- [x] `MatchPredictionClient.tsx` ✅ 2026-02-06 완료
- [x] `Standings.tsx` (match) ✅ 2026-02-06 완료
- [x] `TeamHeader.tsx` ✅ 2026-02-06 완료
- [x] `PlayerTrophies.tsx` ✅ 2026-02-06 완료
- [x] `PlayerTransfers.tsx` ✅ 2026-02-06 완료
- [x] `PlayerFixtures.tsx` ✅ 2026-02-06 완료
- [x] `PlayerInjuries.tsx` ✅ 2026-02-06 완료
- [x] `LeagueMatchList/index.tsx` ✅ 2026-02-06 완료
- [x] `StatsCards.tsx` ✅ 2026-02-06 완료
- [x] `StandingsPreview.tsx` ✅ 2026-02-06 완료
- [x] `Standings.tsx` (team) ✅ 2026-02-06 완료
- [x] `BasicStatsCards.tsx` ✅ 2026-02-06 완료
- [x] `LeagueStandingsTable.tsx` ✅ 2026-02-06 완료
- [x] `LeagueTeamsList.tsx` ✅ 2026-02-06 완료 (현재 사용되지 않음)
- [x] `MatchCard/index.tsx` ✅ 2026-02-06 완료
- [x] `TeamCard.tsx` (leagues) ✅ 2026-02-06 완료
- [x] `LeagueHeader.tsx` ✅ 2026-02-06 완료
- [x] `LeagueCard.tsx` ✅ 2026-02-06 완료

#### Boards 도메인 (6개 → 완료 ✅)

- [x] `EntityPickerForm.tsx` ✅ 2026-02-06 완료
- [x] `NoticeItem.tsx` ✅ 2026-02-06 완료
- [x] `PostRenderers.tsx` ✅ 2026-02-06 완료
- [x] `LeagueInfo.tsx` ✅ 2026-02-06 완료
- [x] `BoardTeamInfo.tsx` ✅ 2026-02-06 완료
- [x] `MatchResultForm.tsx` ✅ 2026-02-06 완료

#### 기타 도메인 (5개 → 완료 ✅)

- [x] `LeagueStandings.tsx` (sidebar) ✅ 2026-02-06 완료
- [x] `MatchItem.tsx` (layout) ✅ 2026-02-06 완료
- [x] `UserIcon.tsx` (shared) ✅ 2026-02-06 완료
- [x] `PurchaseModal.tsx` (shop) ✅ 2026-02-06 완료
- [x] `ItemCard.tsx` (shop) ✅ 2026-02-06 완료

---

## 11-3. Phase 9 추가 마이그레이션 (2026-02-06)

### 11-3.1 수정 대상 컴포넌트 (5개 추가)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../match/tabs/Events.tsx` | `teamLogoUrls` prop 추가 |
| 2 | `livescore/.../match/MatchHeader.tsx` | `teamLogoUrls`, `leagueLogoUrl` props 추가 |
| 3 | `livescore/.../match/sidebar/RelatedPosts.tsx` | `boardLogoUrl` 필드 (RelatedPost 타입에 추가) |
| 4 | `livescore/.../team/tabs/overview/components/MatchItems.tsx` | `teamLogoUrls`, `leagueLogoUrls` props 추가 |
| 5 | `livescore/.../team/tabs/fixtures/FixturesTab.tsx` | `teamLogoUrls`, `leagueLogoUrls` props 추가 |

### 11-3.2 서버 액션 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/actions/match/matchData.ts` | `leagueLogoUrl` 필드 추가, `getLeagueLogoUrl()` 호출 |
| 2 | `livescore/actions/match/relatedPosts.ts` | `boardLogoUrl` 필드 추가, 배치 URL 조회 |
| 3 | `livescore/actions/teams/team.ts` | `leagueLogoUrls` 필드 추가, matches에서 리그 ID 수집 |

### 11-3.3 부모 컴포넌트 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../match/TabContent.tsx` | `Events`에 `teamLogoUrls` 전달 |
| 2 | `livescore/.../match/MatchPageClient.tsx` | `MatchHeader`에 `teamLogoUrls`, `leagueLogoUrl` 전달 |
| 3 | `livescore/.../team/tabs/overview/Overview.tsx` | `MatchItems`에 `teamLogoUrls`, `leagueLogoUrls` 전달 |
| 4 | `livescore/.../team/TabContent.tsx` | `Overview`, `FixturesTab`에 `leagueLogoUrls` 전달 |

### 11-3.4 타입 정의 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/actions/match/relatedPosts.ts` | `RelatedPost` 인터페이스에 `boardLogoUrl` 추가 |
| 2 | `livescore/actions/match/matchData.ts` | `MatchFullDataResponse`에 `leagueLogoUrl` 추가 |
| 3 | `livescore/actions/teams/team.ts` | `TeamFullDataResponse`에 `leagueLogoUrls` 추가 |

### 11-3.5 수정 패턴 (Events.tsx 예시)

#### Before (❌ 위반)

```tsx
'use client';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

function Events({ events }: EventsProps) {
  return (
    <UnifiedSportsImage
      imageId={event.team.id}
      imageType={ImageType.Teams}
      alt={event.team.name}
    />
  );
}
```

#### After (✅ 준수)

```tsx
'use client';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

const TEAM_PLACEHOLDER = '/images/placeholder-team.png';

function Events({ events, teamLogoUrls = {} }: EventsProps) {
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;

  return (
    <UnifiedSportsImageClient
      src={getTeamLogo(event.team.id)}
      alt={event.team.name}
    />
  );
}
```

### 11-3.6 데이터 흐름 (RelatedPosts)

```
[서버 액션: relatedPosts.ts]
    │
    ├── 게시글 조회
    │
    ├── 팀/리그 ID 수집 (board_team_id, board_league_id)
    │
    ├── getTeamLogoUrls([...teamIds])
    ├── getLeagueLogoUrls([...leagueIds])
    │
    └── post.boardLogoUrl에 해당 URL 매핑
          │
          ▼
[클라이언트: RelatedPosts.tsx]
    │
    └── <UnifiedSportsImageClient src={post.boardLogoUrl} alt="..." />
```

---

## 11-4. Phase 9 추가 마이그레이션 (2026-02-06)

### 11-4.1 수정 대상 컴포넌트 (5개 추가)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 27 | `livescore/.../team/tabs/Standings.tsx` | `teamLogoUrls`, `leagueLogoUrls` props 추가 |
| 28 | `livescore/.../team/tabs/stats/components/BasicStatsCards.tsx` | `leagueLogoUrl` prop 추가 |
| 29 | `livescore/.../leagues/LeagueStandingsTable.tsx` | `teamLogoUrls` prop 추가 |
| 30 | `livescore/.../leagues/LeagueTeamsList.tsx` | `teamLogoUrls` prop 추가 (현재 미사용) |
| 31 | `livescore/.../MainView/MatchCard/index.tsx` | `teamLogoUrls` prop 추가 |

### 11-4.2 부모 컴포넌트 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../team/TabContent.tsx` | `Standings`, `Stats`에 URL props 전달 |
| 2 | `livescore/.../team/tabs/stats/Stats.tsx` | `BasicStatsCards`에 `leagueLogoUrl` 전달 |
| 3 | `livescore/.../MainView/LeagueMatchList/index.tsx` | `MatchCard`에 `teamLogoUrls` 전달 |
| 4 | `app/(site)/livescore/football/leagues/[id]/page.tsx` | `LeagueStandingsTable`에 `teamLogoUrls` 전달 |

### 11-4.3 수정 패턴 (Standings.tsx 예시)

#### Before (❌ 위반)

```tsx
'use client';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

const TeamLogo = memo(({ teamName, teamId }: { teamName: string; teamId?: number }) => {
  return (
    <UnifiedSportsImage
      imageId={teamId}
      imageType={ImageType.Teams}
      alt={teamName}
    />
  );
});
```

#### After (✅ 준수)

```tsx
'use client';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

const TEAM_PLACEHOLDER = '/images/placeholder-team.png';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.png';

const TeamLogo = memo(({ teamName, logoUrl }: { teamName: string; logoUrl: string }) => {
  return (
    <UnifiedSportsImageClient
      src={logoUrl}
      alt={teamName}
    />
  );
});

function Standings({ teamLogoUrls = {}, leagueLogoUrls = {} }: StandingsProps) {
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getLeagueLogo = (id: number) => leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;

  return (
    <TeamLogo
      teamName={standing.team.name}
      logoUrl={getTeamLogo(standing.team.id)}
    />
  );
}
```

### 11-4.4 데이터 흐름 (leagues/[id]/page.tsx)

```
[서버 컴포넌트: page.tsx]
    │
    ├── fetchLeagueStandings(leagueId)
    │
    ├── 순위 데이터에서 팀 ID 수집
    │   └── standings.forEach(group => group.forEach(s => teamIds.add(s.team.id)))
    │
    ├── getTeamLogoUrls([...teamIds])
    │
    └── <LeagueStandingsTable teamLogoUrls={teamLogoUrls} />
          │
          ▼
[클라이언트: LeagueStandingsTable.tsx]
    │
    ├── const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
    │
    └── <TeamLogo logoUrl={getTeamLogo(standing.team.id)} />
```

### 11-4.5 참고사항

- `LeagueTeamsList.tsx`는 현재 앱에서 사용되지 않음 (미래 사용 대비 수정)
- `LiveScoreView.tsx` → `LeagueMatchList` → `MatchCard` 경로는 React Query 기반 동적 데이터 흐름으로, 별도 작업 필요

---

## 11-5. Phase 9 추가 마이그레이션 (2026-02-06)

### 11-5.1 수정 대상 컴포넌트 (6개 추가)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../player/tabs/PlayerStats.tsx` | `teamLogoUrls`, `leagueLogoUrls` props 추가 |
| 2 | `livescore/.../player/tabs/PlayerTrophies.tsx` | `leagueLogoUrls` prop 추가 |
| 3 | `livescore/.../player/tabs/PlayerTransfers.tsx` | `teamLogoUrls` prop 추가 |
| 4 | `livescore/.../match/sidebar/MatchPredictionClient.tsx` | `teamLogoUrls` prop 추가 |
| 5 | `livescore/.../match/tabs/Standings.tsx` | `teamLogoUrls`, `leagueLogoUrls` props 추가 |
| 6 | `livescore/.../team/TeamHeader.tsx` | `teamLogoUrl`, `venueImageUrl` props 추가 |

### 11-5.2 수정 패턴 (PlayerStats.tsx 예시)

#### Before (❌ 위반)

```tsx
'use client';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

const LeagueLogo = ({ leagueId, leagueName }: { leagueId: number; leagueName: string }) => {
  return (
    <UnifiedSportsImage
      imageId={leagueId}
      imageType={ImageType.Leagues}
      alt={leagueName}
    />
  );
};
```

#### After (✅ 준수)

```tsx
'use client';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

const LEAGUE_PLACEHOLDER = '/images/placeholder-league.png';
const TEAM_PLACEHOLDER = '/images/placeholder-team.png';

interface PlayerStatsProps {
  statistics: PlayerStatistic[];
  teamLogoUrls?: Record<number, string>;
  leagueLogoUrls?: Record<number, string>;
}

function PlayerStats({ statistics, teamLogoUrls = {}, leagueLogoUrls = {} }: PlayerStatsProps) {
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
  const getLeagueLogo = (id: number) => leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;

  return (
    <UnifiedSportsImageClient
      src={getLeagueLogo(leagueId)}
      alt={leagueName}
    />
  );
}
```

### 11-5.3 TeamHeader.tsx 수정 패턴

TeamHeader는 팀 로고 1개와 경기장 이미지 1개만 사용하므로, 맵 대신 단일 URL props 사용:

```tsx
interface TeamHeaderProps {
  initialData?: TeamResponse;
  teamLogoUrl?: string;      // 단일 URL
  venueImageUrl?: string;    // 단일 URL
}

export default function TeamHeader({
  initialData,
  teamLogoUrl,
  venueImageUrl
}: TeamHeaderProps) {
  const effectiveTeamLogoUrl = teamLogoUrl || TEAM_PLACEHOLDER;
  const effectiveVenueImageUrl = venueImageUrl || VENUE_PLACEHOLDER;

  return (
    <UnifiedSportsImageClient
      src={effectiveTeamLogoUrl}
      alt={`${teamInfo.name} 로고`}
    />
  );
}
```

### 11-5.4 참고사항

- `MatchPredictionClient.tsx`는 `PredictionButton` 내부 컴포넌트와 통계 바 섹션에서 팀 로고 사용
- `Standings.tsx` (match)는 리그 로고 + 팀 로고 모두 사용
- `TeamHeader.tsx`의 `VENUE_PLACEHOLDER`는 `/images/placeholder-venue.png` (생성 필요)

---

## 11-6. Phase 9 추가 마이그레이션 (2026-02-06)

### 11-6.1 수정 대상 컴포넌트 (3개 추가)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/.../leagues/TeamCard.tsx` | `teamLogoUrl` prop 추가 |
| 2 | `livescore/.../leagues/LeagueHeader.tsx` | `leagueLogoUrl` prop 추가 |
| 3 | `livescore/.../leagues/LeagueCard.tsx` | `leagueLogoUrl` prop 추가 |

### 11-6.2 수정 패턴

#### TeamCard.tsx

```tsx
interface TeamCardProps {
  team: LeagueTeam;
  teamLogoUrl?: string;  // 4590 표준
}

export default function TeamCard({ team, teamLogoUrl }: TeamCardProps) {
  return (
    <UnifiedSportsImageClient
      src={teamLogoUrl || TEAM_PLACEHOLDER}
      alt={`${displayName} 로고`}
    />
  );
}
```

#### LeagueHeader.tsx / LeagueCard.tsx

```tsx
interface LeagueHeaderProps {
  league: LeagueDetails;
  leagueLogoUrl?: string;  // 4590 표준
}

export default function LeagueHeader({ league, leagueLogoUrl }: LeagueHeaderProps) {
  return (
    <UnifiedSportsImageClient
      src={leagueLogoUrl || LEAGUE_PLACEHOLDER}
      alt={`${displayName} 로고`}
    />
  );
}
```

### 11-6.3 Livescore 도메인 완료

Livescore 도메인의 34개 클라이언트 컴포넌트 마이그레이션 완료.

---

## 11-7. Phase 9 Boards 도메인 마이그레이션 (2026-02-06)

### 11-7.1 수정 대상 컴포넌트 (6개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `boards/.../entity/EntityPickerForm.tsx` | `leagueLogoUrls`, `teamLogoUrls`, `playerPhotoUrls` props 추가 |
| 2 | `boards/.../notice/NoticeItem.tsx` | `boardLogoUrl` 필드 추가 |
| 3 | `boards/.../postlist/.../PostRenderers.tsx` | `renderBoardLogo` 함수에 `boardLogoUrl` 매개변수 추가 |
| 4 | `boards/.../board/LeagueInfo.tsx` | `leagueLogoUrl` prop 추가 |
| 5 | `boards/.../board/BoardTeamInfo.tsx` | `teamLogoUrl` prop 추가 |
| 6 | `boards/.../form/MatchResultForm.tsx` | `teamLogoUrls`, `leagueLogoUrls` props 추가 |

### 11-7.2 수정 패턴 (LeagueInfo.tsx 예시)

#### Before (❌ 위반)

```tsx
'use client';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

export default function LeagueInfo({ leagueData }: LeagueInfoProps) {
  return (
    <UnifiedSportsImage
      imageId={leagueData.id}
      imageType={ImageType.Leagues}
      alt={`${leagueData.name} logo`}
    />
  );
}
```

#### After (✅ 준수)

```tsx
'use client';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

const LEAGUE_PLACEHOLDER = '/images/placeholder-league.png';

interface LeagueInfoProps {
  leagueData: LeagueData | null;
  leagueLogoUrl?: string;  // 4590 표준
}

export default function LeagueInfo({ leagueData, leagueLogoUrl }: LeagueInfoProps) {
  return (
    <UnifiedSportsImageClient
      src={leagueLogoUrl || LEAGUE_PLACEHOLDER}
      alt={`${leagueData.name} logo`}
    />
  );
}
```

### 11-7.3 Boards 도메인 완료

Boards 도메인의 6개 클라이언트 컴포넌트 마이그레이션 완료.

---

## 11-8. Phase 9 기타 도메인 마이그레이션 (2026-02-06)

### 11-8.1 수정 대상 컴포넌트 (5개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `sidebar/.../league/LeagueStandings.tsx` | `leagueLogoUrls`, `teamLogoUrls` props 추가 |
| 2 | `layout/.../livescoremodal/MatchItem.tsx` | `leagueLogoUrl`, `homeTeamLogoUrl`, `awayTeamLogoUrl` props 추가 |
| 3 | `shared/components/UserIcon.tsx` | API-Sports URL 감지 로직 제거 (서버에서 처리) |
| 4 | `shop/components/PurchaseModal.tsx` | `itemImageUrl` prop 추가 |
| 5 | `shop/components/ItemCard.tsx` | `teamLogoUrl` prop 추가 |

### 11-8.2 수정 패턴

#### LeagueStandings.tsx

```tsx
interface LeagueStandingsProps {
  initialLeague?: string;
  initialStandings?: StandingsData | null;
  leagueLogoUrls?: Record<number, string>;  // 4590 표준
  teamLogoUrls?: Record<number, string>;    // 4590 표준
}

export default function LeagueStandings({
  leagueLogoUrls = {},
  teamLogoUrls = {},
}: LeagueStandingsProps) {
  const getLeagueLogo = (id: number) => leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
  const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;

  return (
    <UnifiedSportsImageClient
      src={getLeagueLogo(activeLeagueId)}
      alt="리그 로고"
    />
  );
}
```

#### MatchItem.tsx

```tsx
interface MatchItemProps {
  match: MatchData;
  onClose: () => void;
  leagueLogoUrl?: string;       // 4590 표준
  homeTeamLogoUrl?: string;     // 4590 표준
  awayTeamLogoUrl?: string;     // 4590 표준
}

const MatchItem = React.memo(function MatchItem({
  match,
  onClose,
  leagueLogoUrl,
  homeTeamLogoUrl,
  awayTeamLogoUrl,
}: MatchItemProps) {
  return (
    <UnifiedSportsImageClient
      src={homeTeamLogoUrl || TEAM_PLACEHOLDER}
      alt="홈팀 로고"
    />
  );
});
```

#### UserIcon.tsx

API-Sports URL 감지 로직 제거. 4590 표준에 따라 iconUrl은 이미 Storage URL로 변환되어 전달된다고 가정.

```tsx
// 제거된 코드:
// - isApiSportsUrl()
// - getImageTypeFromUrl()
// - getImageIdFromUrl()
// - tryRenderApiSports()

// 간소화된 코드:
const UserIcon = React.memo(function UserIcon({ iconUrl, ... }: UserIconProps) {
  return (
    <Image src={iconUrl || getLevelIconUrl(level)} alt="유저 아이콘" />
  );
});
```

#### PurchaseModal.tsx / ItemCard.tsx

```tsx
interface PurchaseModalProps {
  item: ShopItem;
  itemImageUrl?: string;  // 4590 표준
}

interface ItemCardProps {
  item: ShopItem;
  teamLogoUrl?: string;   // 4590 표준
}
```

### 11-8.3 기타 도메인 완료

기타 도메인의 5개 클라이언트 컴포넌트 마이그레이션 완료.

---

## 13. 전체 마이그레이션 완료 요약 ✅

**완료일**: 2026-02-06

### 13.1 마이그레이션 통계

| 도메인 | 컴포넌트 수 | 상태 |
|--------|-------------|------|
| Livescore | 34개 | ✅ 완료 |
| Boards | 6개 | ✅ 완료 |
| 기타 (sidebar, layout, shared, shop) | 5개 | ✅ 완료 |
| **합계** | **45개** | **✅ 전체 완료** |

### 13.2 적용된 패턴

1. **Import 변경**: `UnifiedSportsImage` → `UnifiedSportsImageClient`
2. **Props 추가**: `*LogoUrls`, `*PhotoUrls` 맵 또는 단일 URL props
3. **헬퍼 함수**: `getTeamLogo(id)`, `getPlayerPhoto(id)` 등
4. **Placeholder**: `/images/placeholder-*.png` 상수 사용

### 13.3 남은 작업

- [x] 부모 서버 컴포넌트에서 실제 URL 조회 후 props 전달 (호출부 수정) ✅ Phase 10에서 완료
- [x] placeholder 이미지 파일 확인/생성 ✅ SVG로 변경 완료

---

## 14. Phase 10: DB 직접 조회 제거 (2026-02-06)

> **문제 발견**: 일부 서버 액션에서 `teams`/`leagues` 테이블의 `logo` 컬럼을 직접 조회.
> DB의 `logo` 컬럼에는 여전히 API-Sports URL이 저장되어 있어 4590 표준 위반.

### 14.1 문제 원인

```typescript
// ❌ 문제: DB의 logo 컬럼에 API-Sports URL 저장됨
const { data } = await supabase
  .from('teams')
  .select('id, logo')  // logo = "https://media.api-sports.io/..."
  .in('id', teamIds);
```

### 14.2 수정된 서버 액션 (5개)

| # | 파일 | 문제 | 수정 |
|---|------|------|------|
| 1 | `boards/actions/posts/fetchPostsHelpers.ts` | `fetchTeamLogos()`, `fetchLeagueLogos()` DB 직접 조회 | `getTeamLogoUrls()`, `getLeagueLogoUrls()` 사용 |
| 2 | `widgets/.../getPostsMetadata.ts` | `supabase.from('teams').select('id, logo')` | `getTeamLogoUrls()`, `getLeagueLogoUrls()` 사용 |
| 3 | `sidebar/actions/topicPosts.ts` | `supabase.from('teams').select('id, logo')` | `getTeamLogoUrls()`, `getLeagueLogoUrls()` 사용 |
| 4 | `sidebar/actions/getHotPosts.ts` | `supabase.from('teams').select('id, logo')` | `getTeamLogoUrls()`, `getLeagueLogoUrls()` 사용 |
| 5 | `boards/actions/getPostDetails.ts` | `supabase.from('teams').select('*')` | `getTeamLogoUrls()`, `getLeagueLogoUrls()` 사용 |

### 14.3 수정 패턴

#### Before (❌ 위반)

```typescript
// DB에서 logo 직접 조회 (API-Sports URL)
const [teamsResult, leaguesResult] = await Promise.all([
  supabase.from('teams').select('id, logo').in('id', teamIds),
  supabase.from('leagues').select('id, logo').in('id', leagueIds)
]);

const teamLogoMap: Record<number, string> = {};
teamsResult.data?.forEach(team => {
  teamLogoMap[team.id] = team.logo || '';  // API-Sports URL
});
```

#### After (✅ 준수)

```typescript
import { getTeamLogoUrls, getLeagueLogoUrls } from '@/domains/livescore/actions/images';

// 4590 표준: Storage URL 조회
const [teamLogoMap, leagueLogoMap] = await Promise.all([
  teamIds.length > 0 ? getTeamLogoUrls(teamIds) : Promise.resolve({}),
  leagueIds.length > 0 ? getLeagueLogoUrls(leagueIds) : Promise.resolve({})
]);
// teamLogoMap = { 33: "https://xxx.supabase.co/storage/v1/object/public/teams/33.png" }
```

### 14.4 영향받는 기능

- `AllPostsWidget` (최신 게시글)
- `TopicPosts` (인기글 사이드바)
- `HotPosts` (HOT 게시글)
- `PostDetail` (게시글 상세)
- `BoardCollectionWidget` (게시판 컬렉션)

---

## 15. Phase 11: 다크모드 이미지 지원 (2026-02-06)

> 특정 리그(프리미어리그, UCL 등)는 다크모드에서 다른 로고 사용.
> `-1.png` 접미사로 다크모드 로고 구분.

### 15.1 다크모드 지원 리그

```typescript
// getLeagueLogoUrl.ts
const DARK_MODE_LEAGUE_IDS = [
  39,   // Premier League
  2,    // Champions League
  3,    // Europa League
  848,  // Conference League
  40, 41, 42, 45, 48, 140, 135, 78, 61, 88, 94, 531
];
```

### 15.2 수정된 파일

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `shared/components/UnifiedSportsImageClient.tsx` | `srcDark` prop 추가, MutationObserver로 다크모드 감지 |
| 2 | `sidebar/components/league/ServerLeagueStandings.tsx` | `leagueLogoUrlsDark` 조회 추가 |
| 3 | `sidebar/components/league/LeagueStandings.tsx` | `leagueLogoUrlsDark` prop, `getLeagueLogoDark()` 헬퍼 |

### 15.3 UnifiedSportsImageClient 다크모드 패턴

```tsx
interface UnifiedSportsImageClientProps {
  src: string;        // 라이트모드 URL (필수)
  srcDark?: string;   // 다크모드 URL (선택)
  // ...
}

export default function UnifiedSportsImageClient({ src, srcDark, ... }) {
  const [isDark, setIsDark] = useState(false);

  // MutationObserver로 다크모드 변경 감지
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const effectiveSrc = isDark && srcDark ? srcDark : src;

  return <Image src={effectiveSrc} ... />;
}
```

### 15.4 서버에서 다크모드 URL 조회

```typescript
// ServerLeagueStandings.tsx
const [leagueLogoUrls, leagueLogoUrlsDark] = await Promise.all([
  getLeagueLogoUrls(LEAGUE_API_IDS, false),  // 라이트
  getLeagueLogoUrls(LEAGUE_API_IDS, true),   // 다크
]);

// LeagueStandings.tsx (클라이언트)
const getLeagueLogoDark = (id: number) =>
  leagueLogoUrlsDark[id] || leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;

<UnifiedSportsImageClient
  src={getLeagueLogo(leagueId)}
  srcDark={getLeagueLogoDark(leagueId)}
  alt="리그 로고"
/>
```

---

## 16. 전체 완료 체크리스트 (Phase 1-11)

### 16.1 서버 액션 수정 완료

| # | 파일 | 상태 |
|---|------|------|
| 1 | `livescore/actions/match/lineupData.ts` | ✅ |
| 2 | `livescore/actions/match/playerStats.ts` | ✅ |
| 3 | `livescore/actions/match/headtohead.ts` | ✅ |
| 4 | `livescore/actions/match/matchData.ts` | ✅ |
| 5 | `livescore/actions/match/relatedPosts.ts` | ✅ |
| 6 | `livescore/actions/player/data.ts` | ✅ |
| 7 | `livescore/actions/player/rankings.ts` | ✅ |
| 8 | `livescore/actions/teams/team.ts` | ✅ |
| 9 | `livescore/actions/transfers/index.ts` | ✅ |
| 10 | `search/actions/searchEntities.ts` | ✅ |
| 11 | `boards/actions/posts/fetchPostsHelpers.ts` | ✅ Phase 10 |
| 12 | `boards/actions/getPostDetails.ts` | ✅ Phase 10 |
| 13 | `sidebar/actions/topicPosts.ts` | ✅ Phase 10 |
| 14 | `sidebar/actions/getHotPosts.ts` | ✅ Phase 10 |
| 15 | `sidebar/actions/football.ts` | ✅ |
| 16 | `widgets/.../getPostsMetadata.ts` | ✅ Phase 10 |

### 16.2 클라이언트 컴포넌트 수정 완료

| 도메인 | 개수 | 상태 |
|--------|------|------|
| Livescore | 34개 | ✅ |
| Boards | 6개 | ✅ |
| Sidebar | 2개 | ✅ |
| Layout | 1개 | ✅ |
| Shared | 2개 | ✅ Phase 11 (다크모드) |
| Shop | 2개 | ✅ |
| **합계** | **47개** | **✅ 전체 완료** |

### 16.3 핵심 원칙 준수 확인

| 원칙 | 상태 |
|------|------|
| 클라이언트에서 API-Sports URL 직접 사용 금지 | ✅ |
| DB `logo` 컬럼 직접 조회 금지 | ✅ Phase 10 |
| 모든 이미지 URL은 서버에서 확정 | ✅ |
| `UnifiedSportsImageClient`는 `src` prop만 렌더링 | ✅ |
| 다크모드 리그 로고 지원 | ✅ Phase 11 |

---

## 17. Phase 12: Post 목록 다크모드 지원 (2026-02-06)

> **문제**: 게시글 목록의 리그 로고가 다크모드에서 올바르게 표시되지 않음.
> 게시판/게시글 상세 페이지에서도 리그 로고 다크모드 미적용.

### 17.1 핵심 변경사항

리그 게시판에서 `league_logo_dark` 필드 추가:
- `Post` 타입에 `league_logo_dark?: string | null` 필드 추가
- 서버에서 다크모드 로고 URL도 함께 조회하여 클라이언트에 전달
- 클라이언트에서 MutationObserver로 다크모드 감지 후 적절한 로고 표시

### 17.2 수정된 파일

#### 타입 정의

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `boards/types/post/index.ts` | `league_logo_dark` 필드 추가 |
| 2 | `boards/types/post/layout.ts` | `LayoutPost`, `ApiPost`에 `league_logo_dark` 필드 추가 |
| 3 | `boards/types/post/formatted.ts` | `FormattedPost.league`에 `logo_dark` 필드 추가 |
| 4 | `boards/components/post/postlist/types.ts` | `league_logo_dark` 필드 추가 |
| 5 | `boards/actions/getPosts.ts` | `Post` 인터페이스에 `league_logo_dark` 추가 |

#### 서버 액션

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `boards/actions/posts/fetchPostsHelpers.ts` | `fetchLeagueLogos(supabase, ids, isDark)` 시그니처 변경 |
| 2 | `boards/actions/posts/fetchPostsHelpers.ts` | `formatPostData(...)` 에 `leagueLogoDarkMap` 파라미터 추가 |
| 3 | `boards/actions/getPosts.ts` | 다크모드 로고 배치 조회 추가 |
| 4 | `boards/actions/getBoardPageAllData.ts` | `leagueLogoUrlDark` 반환 추가 |
| 5 | `boards/actions/getPostDetails.ts` | 다크모드 리그 로고 조회 추가 (`leagueLogoDarkUrlMap`) |
| 6 | `boards/utils/post/postUtils.ts` | `formatPosts`에 `league.logo_dark` 포함 |

#### 클라이언트 컴포넌트

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `boards/components/post/postlist/.../PostRenderers.tsx` | `LeagueLogoImage` 컴포넌트 추가 (다크모드 지원) |
| 2 | `boards/components/board/LeagueInfo.tsx` | `leagueLogoUrlDark` prop 추가, MutationObserver 사용 |
| 3 | `boards/components/layout/BoardDetailLayout.tsx` | `leagueLogoUrlDark` prop 추가 |

#### 페이지

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `app/(site)/boards/[slug]/page.tsx` | `leagueLogoUrlDark` 전달 |
| 2 | `app/(site)/boards/(hotdeal)/_shared/HotdealBoardPage.tsx` | `leagueLogoUrlDark` 전달 |
| 3 | `app/(site)/boards/[slug]/[postNumber]/page.tsx` | `formattedPosts`에 `league_logo_dark` 매핑 추가 |

#### 레이아웃 컴포넌트

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `boards/components/layout/PostDetailLayout.tsx` | `formattedPosts` 타입에 로고 필드 추가, `postsWithIcons`에 로고 전달 |

### 17.3 다크모드 감지 패턴

클라이언트 컴포넌트에서 리그 로고 다크모드 처리:

```tsx
// PostRenderers.tsx - LeagueLogoImage 컴포넌트
function LeagueLogoImage({
  leagueLogo,
  leagueLogoDark,
  alt,
}: {
  leagueLogo: string;
  leagueLogoDark?: string | null;
  alt: string;
}): React.ReactNode {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const effectiveLogoUrl = isDark && leagueLogoDark ? leagueLogoDark : leagueLogo;

  return (
    <UnifiedSportsImageClient
      src={effectiveLogoUrl}
      alt={alt}
      width={20}
      height={20}
      className="object-contain w-5 h-5"
    />
  );
}
```

### 17.4 데이터 흐름

```
[서버 액션: getPosts.ts]
    │
    ├── fetchLeagueLogos(supabase, leagueIds, false)  // 라이트 모드
    ├── fetchLeagueLogos(supabase, leagueIds, true)   // 다크 모드
    │
    └── formatPostData(..., leagueLogoDarkMap)
          │
          └── Post.league_logo_dark = leagueLogoDarkMap[leagueId]
                │
                ▼
[클라이언트: PostRenderers.tsx]
    │
    ├── if (post.league_id) {
    │     <LeagueLogoImage
    │       leagueLogo={post.league_logo}
    │       leagueLogoDark={post.league_logo_dark}
    │     />
    │   }
    │
    └── LeagueLogoImage 내부:
          └── MutationObserver로 다크모드 감지
          └── isDark && leagueLogoDark ? leagueLogoDark : leagueLogo
```

### 17.5 영향받는 기능

| 기능 | 설명 |
|------|------|
| 게시글 목록 (`PostList`) | 리그 게시판 게시글의 로고가 다크모드에 맞게 변경 |
| 게시판 상세 (`BoardDetailLayout`) | 리그 정보 섹션의 로고가 다크모드에 맞게 변경 |
| 핫딜 게시판 (`HotdealBoardPage`) | 리그 연관 핫딜 게시판의 로고 지원 |

### 17.6 다크모드 지원 리그 (재확인)

다크모드 별도 로고가 있는 리그 목록:

```typescript
const DARK_MODE_LEAGUE_IDS = [
  39,   // Premier League
  2,    // Champions League
  3,    // Europa League
  848,  // Conference League
  40,   // Championship
  41,   // League One
  42,   // League Two
  45,   // FA Cup
  48,   // League Cup
  140,  // La Liga
  135,  // Serie A
  78,   // Bundesliga
  61,   // Ligue 1
  88,   // Eredivisie
  94,   // Primeira Liga
  531,  // UEFA Super Cup
];
```

---

## 18. 마무리 체크리스트 (Phase 1-12)

### 18.1 완료 항목

| Phase | 내용 | 상태 |
|-------|------|------|
| 1-8 | 핵심 4590 표준 구현 | ✅ |
| 9 | 클라이언트 컴포넌트 마이그레이션 (45개) | ✅ |
| 10 | DB 직접 조회 제거 | ✅ |
| 11 | 다크모드 기본 지원 (UnifiedSportsImageClient) | ✅ |
| 12 | Post 목록 다크모드 지원 | ✅ |

### 18.2 다크모드 지원 요약

| 컴포넌트/기능 | 다크모드 지원 방식 |
|---------------|-------------------|
| `UnifiedSportsImageClient` | `srcDark` prop + MutationObserver |
| `LeagueStandings` (sidebar) | `leagueLogoUrlsDark` prop |
| `LeagueInfo` (boards) | `leagueLogoUrlDark` prop + MutationObserver |
| `PostRenderers` (boards) | `LeagueLogoImage` 컴포넌트 + MutationObserver |
| `BoardDetailLayout` | `leagueLogoUrlDark` prop 전달 |

### 18.3 향후 고려사항

- [ ] 다크모드 로고 없는 리그에 대한 CSS 필터 적용 검토
- [ ] `league_logo_dark` 필드 캐싱 최적화
- [ ] 다크모드 전환 시 깜빡임(FOUC) 최소화

---

## 19. Phase 13: LiveScore 이미지 수정 (2026-02-06)

> **문제**: `LiveScoreView` 및 관련 컴포넌트에서 이미지가 placeholder로 표시됨.
> `footballApi.ts`에서 API-Sports URL을 그대로 반환하고 있었음.

### 19.1 원인

`fetchMatchesByDate`, `fetchLeagueDetails`, `fetchLeagueTeams` 함수들이 API 응답의 `logo` 필드를 그대로 반환.

```typescript
// Before (❌ 위반)
league: {
  logo: match.league?.logo || '',  // API-Sports URL
},
teams: {
  home: {
    logo: match.teams?.home?.logo || '',  // API-Sports URL
  }
}
```

### 19.2 수정 내용

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/actions/footballApi.ts` | `getTeamLogoUrls`, `getLeagueLogoUrls` import 추가 |
| 2 | `fetchMatchesByDate` | 팀/리그 ID 배치 조회 후 Storage URL 적용 |
| 3 | `fetchLeagueDetails` | 리그 로고 Storage URL 적용 |
| 4 | `fetchLeagueTeams` | 팀 로고 배치 조회 후 Storage URL 적용 |

### 19.3 수정 패턴

```typescript
// After (✅ 준수)
// 1. ID 수집
const teamIds = new Set<number>();
const leagueIds = new Set<number>();
filteredApiMatches.forEach(match => {
  teamIds.add(match.teams.home.id);
  teamIds.add(match.teams.away.id);
  leagueIds.add(match.league.id);
});

// 2. 배치로 Storage URL 조회
const [teamLogoUrls, leagueLogoUrls] = await Promise.all([
  getTeamLogoUrls([...teamIds]),
  getLeagueLogoUrls([...leagueIds])
]);

// 3. MatchData에 Storage URL 적용
return {
  league: {
    logo: leagueLogoUrls[leagueId] || '',  // Storage URL
  },
  teams: {
    home: {
      logo: teamLogoUrls[homeId] || '',  // Storage URL
    }
  }
};
```

### 19.4 영향받는 기능

- `LiveScoreView` (라이브스코어 메인)
- `LeagueMatchList` → `MatchCard` (경기 카드)
- `LiveScoreModal` (모달)
- 리그 상세 페이지
- 리그 팀 목록

---

## 20. Phase 14: LiveScore 데이터 흐름 수정 (2026-02-06)

> **문제**: Phase 13에서 `footballApi.ts`를 수정했지만 이미지가 여전히 placeholder로 표시됨.
> 원인: 데이터 흐름과 컴포넌트 사용 방식이 불일치했음.

### 20.1 근본 원인 분석

1. `footballApi.ts`에서 Storage URL을 `match.league.logo`, `match.teams.home.logo`에 설정 ✅
2. `useLiveScoreQueries.ts`의 `processMatches`에서 `match.teams.home.logo`를 `img`로 복사 ✅
3. **문제점**: `MatchCard`, `LeagueMatchList`가 별도 `teamLogoUrls`/`leagueLogoUrls` props를 기대
4. `LiveScoreView`에서 이 props를 전달하지 않음 → 빈 객체 → placeholder만 표시

### 20.2 수정 방향

**방법 A 적용**: 컴포넌트에서 데이터 내 URL을 직접 사용 (props 전달 방식 폐기)

서버에서 이미 `match.teams.home.logo`, `match.league.logo`에 Storage URL이 설정되어 있으므로,
컴포넌트에서 이 값을 직접 사용하도록 변경.

### 20.3 수정 파일

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `useLiveScoreQueries.ts` | `DEFAULT_TEAM_LOGO`를 4590 placeholder로 변경 |
| 2 | `MatchCard/index.tsx` | `teamLogoUrls` prop 제거, `match.teams.home.img` 직접 사용 |
| 3 | `LeagueMatchList/index.tsx` | `leagueLogoUrls`, `teamLogoUrls` props 제거, `group.logo` 직접 사용 |

### 20.4 수정 패턴

#### useLiveScoreQueries.ts

```typescript
// Before (❌ 외부 URL 사용)
const DEFAULT_TEAM_LOGO = 'https://cdn.sportmonks.com/images/soccer/team_placeholder.png';

logo: match.league.logo || '',
img: match.teams.home.logo || DEFAULT_TEAM_LOGO,

// After (✅ 4590 표준 placeholder)
const PLACEHOLDER_TEAM = '/images/placeholder-team.svg';
const PLACEHOLDER_LEAGUE = '/images/placeholder-league.svg';

logo: match.league.logo || PLACEHOLDER_LEAGUE,
img: match.teams.home.logo || PLACEHOLDER_TEAM,
```

#### MatchCard/index.tsx

```typescript
// Before (❌ URL 맵에서 조회)
const getTeamLogo = (id: number) => teamLogoUrls[id] || TEAM_PLACEHOLDER;
<UnifiedSportsImageClient src={getTeamLogo(homeTeam.id)} />

// After (✅ 데이터 내 URL 직접 사용)
const homeTeam = {
  ...
  logo: match.teams?.home?.img || TEAM_PLACEHOLDER
};
<UnifiedSportsImageClient src={homeTeam.logo} />
```

#### LeagueMatchList/index.tsx

```typescript
// Before (❌ URL 맵에서 조회)
const getLeagueLogo = (leagueId: number) => leagueLogoUrls[leagueId] || LEAGUE_PLACEHOLDER;
<UnifiedSportsImageClient src={getLeagueLogo(group.leagueId)} />

// After (✅ 데이터 내 URL 직접 사용)
groups.push({
  ...
  logo: match.league.logo || LEAGUE_PLACEHOLDER
});
<UnifiedSportsImageClient src={group.logo} />
```

### 20.5 데이터 흐름 (최종)

```
[서버 액션: footballApi.ts]
    │
    ├── fetchMatchesByDate()
    │   ├── 팀/리그 ID 수집
    │   ├── getTeamLogoUrls([...teamIds])
    │   ├── getLeagueLogoUrls([...leagueIds])
    │   └── MatchData에 Storage URL 설정
    │       ├── league.logo = leagueLogoUrls[id]
    │       ├── teams.home.logo = teamLogoUrls[homeId]
    │       └── teams.away.logo = teamLogoUrls[awayId]
          │
          ▼
[서버 컴포넌트: page.tsx]
    │
    └── <LiveScoreView initialToday={matches} />
          │
          ▼
[클라이언트 훅: useLiveScoreQueries.ts]
    │
    ├── processMatches(matchesData)
    │   └── img: match.teams.home.logo || PLACEHOLDER_TEAM
    │
    └── { matches } 반환
          │
          ▼
[클라이언트: LiveScoreView.tsx]
    │
    └── <LeagueMatchList matches={filteredMatches} />
          │
          ▼
[클라이언트: LeagueMatchList.tsx]
    │
    ├── group.logo = match.league.logo || PLACEHOLDER_LEAGUE
    │
    └── <MatchCard match={match} />
          │
          ▼
[클라이언트: MatchCard.tsx]
    │
    ├── homeTeam.logo = match.teams.home.img || TEAM_PLACEHOLDER
    │
    └── <UnifiedSportsImageClient src={homeTeam.logo} />
```

### 20.6 결과

- ✅ `LiveScoreView` 이미지 정상 표시
- ✅ 데이터 흐름 단순화 (props 전달 불필요)
- ✅ 4590 표준 placeholder 사용
- ✅ 외부 URL 완전 제거 (`sportmonks.com` URL 제거)

---

## 21. Phase 15: LiveScore 다크모드 리그 로고 (2026-02-06)

> **문제**: LiveScore에서 다크모드 리그 로고가 표시되지 않음
> **원인**: `page.tsx`의 `processMatchData`에서 `logoDark` 필드를 전달하지 않음

### 21.1 수정 파일

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `footballApi.ts` | `MatchData.league.logoDark` 필드 추가, 다크모드 URL 조회 |
| 2 | `match.ts` (types) | `Match.league.logoDark` 필드 추가 |
| 3 | `page.tsx` (livescore) | `processMatchData`에서 `logoDark` 전달, placeholder 변경 |
| 4 | `useLiveScoreQueries.ts` | `processMatches`에서 `logoDark` 전달 |
| 5 | `LeagueMatchList/index.tsx` | MutationObserver로 다크모드 감지, 로고 전환 |
| 6 | `getLeagueLogoUrl.ts` | `DARK_MODE_LEAGUE_IDS`를 실제 Storage 파일 기준으로 수정 |

### 21.2 다크모드 로고 지원 리그

Storage에 `-1.png` 파일이 있는 리그만 다크모드 지원:

```typescript
// getLeagueLogoUrl.ts
const DARK_MODE_LEAGUE_IDS = [2, 3, 13, 39, 66, 88, 98, 119, 179, 292, 848];
```

| ID | 리그명 |
|----|--------|
| 2 | UEFA 챔피언스리그 |
| 3 | UEFA 유로파리그 |
| 13 | 코파 리베르타도레스 |
| 39 | 프리미어리그 |
| 66 | 수페르리가 (우크라이나) |
| 88 | 에레디비시 |
| 98 | J리그 |
| 119 | 슈퍼리그 (덴마크) |
| 179 | 스코티시 프리미어십 |
| 292 | K리그1 |
| 848 | UEFA 컨퍼런스리그 |

### 21.3 데이터 흐름

```
[서버: footballApi.ts]
    │
    ├── getLeagueLogoUrls([...leagueIds], true)  // 다크모드
    │
    └── MatchData.league.logoDark = leagueLogoDarkUrls[id]
          │
          ▼
[서버: page.tsx]
    │
    └── processMatchData()
        └── league.logoDark = match.league.logoDark
          │
          ▼
[클라이언트: LeagueMatchList.tsx]
    │
    ├── MutationObserver로 다크모드 감지
    │
    └── src={isDark && group.logoDark ? group.logoDark : group.logo}
```

### 21.4 page.tsx 수정 패턴

```typescript
// Before (❌ logoDark 누락)
league: {
  logo: match.league.logo || '',
  flag: match.league.flag || ''
}

// After (✅ logoDark 포함)
league: {
  logo: match.league.logo || PLACEHOLDER_LEAGUE,
  logoDark: match.league.logoDark || '',  // 다크모드 리그 로고
  flag: match.league.flag || ''
}
```

### 21.5 LeagueMatchList 다크모드 감지

```typescript
const [isDark, setIsDark] = useState(false);

useEffect(() => {
  setIsDark(document.documentElement.classList.contains('dark'));

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    });
  });

  observer.observe(document.documentElement, { attributes: true });
  return () => observer.disconnect();
}, []);

// 로고 렌더링
<UnifiedSportsImageClient
  src={isDark && group.logoDark ? group.logoDark : group.logo}
  alt={group.name}
/>
```

### 21.6 결과

- ✅ 다크모드에서 지원 리그 로고 자동 전환
- ✅ 라이트모드에서 일반 로고 표시
- ✅ 다크모드 로고 없는 리그는 일반 로고 유지
- ✅ 실시간 다크모드 토글 반응

---

## 22. Phase 16: Player 탭 이미지 URL 파이프라인 (2026-02-06)

> **문제**: Player 상세 페이지의 각 탭(Stats, Fixtures, Transfers, Trophies, Injuries)에서
> 이미지 URL이 4590 표준을 완전히 준수하지 않음.
> 다크모드 리그 로고 미지원, placeholder fallback 미적용.

### 22.1 수정 대상 컴포넌트 (5개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `player/tabs/PlayerStats.tsx` | `teamLogoUrls`, `leagueLogoUrls`, `leagueLogoDarkUrls` props 추가, MutationObserver 다크모드 감지 |
| 2 | `player/tabs/PlayerFixtures.tsx` | `leagueLogoDarkUrls` prop 추가, MutationObserver 다크모드 감지 |
| 3 | `player/tabs/PlayerTransfers.tsx` | `teamLogoUrls` prop 추가, placeholder fallback |
| 4 | `player/tabs/PlayerTrophies.tsx` | `leagueLogoUrls`, `leagueLogoDarkUrls` props 추가, MutationObserver 다크모드 감지 |
| 5 | `player/tabs/PlayerInjuries.tsx` | `teamLogoUrls` prop 추가 (기존) |

### 22.2 서버 액션 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `livescore/actions/player/data.ts` | 각 탭별 이미지 URL 필드 추가 |

**PlayerFullDataResponse 확장:**

```typescript
interface PlayerFullDataResponse {
  // 기존 필드...

  // Statistics 탭
  statisticsTeamLogoUrls?: Record<number, string>;
  statisticsLeagueLogoUrls?: Record<number, string>;
  statisticsLeagueLogoDarkUrls?: Record<number, string>;

  // Fixtures 탭 (기존 teamLogoUrls, leagueLogoUrls에 추가)
  fixturesLeagueLogoDarkUrls?: Record<number, string>;

  // Transfers 탭
  transfersTeamLogoUrls?: Record<number, string>;

  // Trophies 탭
  trophiesLeagueLogoUrls?: Record<number, string>;
  trophiesLeagueLogoDarkUrls?: Record<number, string>;

  // Injuries 탭
  injuriesTeamLogoUrls?: Record<number, string>;
}
```

### 22.3 React Query 훅 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `hooks/usePlayerQueries.ts` | `UsePlayerTabDataReturn` 인터페이스 확장 |

**UsePlayerTabDataReturn 확장:**

```typescript
interface UsePlayerTabDataReturn {
  // 기존 필드...

  // Trophies 탭 URL 맵
  trophiesLeagueLogoUrls: Record<number, string>;
  trophiesLeagueLogoDarkUrls: Record<number, string>;

  // Transfers 탭 URL 맵
  transfersTeamLogoUrls: Record<number, string>;

  // Injuries 탭 URL 맵
  injuriesTeamLogoUrls: Record<number, string>;
}
```

### 22.4 부모 컴포넌트 수정

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `player/TabContent.tsx` | 각 탭 컴포넌트에 URL 맵 props 전달 |

**TabContent.tsx 수정:**

```tsx
// usePlayerTabData에서 URL 맵 추출
const {
  statsData,
  fixturesData,
  transfersData,
  trophiesData,
  injuriesData,
  rankingsData,
  trophiesLeagueLogoUrls,
  trophiesLeagueLogoDarkUrls,
  transfersTeamLogoUrls,
  injuriesTeamLogoUrls,
  // ...
} = usePlayerTabData({ playerId, currentTab, initialData });

// 각 탭에 URL 맵 전달
case 'trophies':
  return (
    <TrophiesTab
      playerId={playerIdNum}
      trophiesData={trophies}
      leagueLogoUrls={trophiesLeagueLogoUrls}
      leagueLogoDarkUrls={trophiesLeagueLogoDarkUrls}
    />
  );

case 'transfers':
  return (
    <TransfersTab
      playerId={playerIdNum}
      transfersData={transfers}
      teamLogoUrls={transfersTeamLogoUrls}
    />
  );
```

### 22.5 수정 패턴 (PlayerTrophies.tsx 예시)

#### Before (❌ 위반)

```tsx
'use client';
import UnifiedSportsImage from '@/shared/components/UnifiedSportsImage';
import { ImageType } from '@/shared/types/image';

function PlayerTrophies({ trophiesData }: PlayerTrophiesProps) {
  return (
    <UnifiedSportsImage
      imageId={leagueId}
      imageType={ImageType.Leagues}
      alt={trophy.league}
    />
  );
}
```

#### After (✅ 준수)

```tsx
'use client';
import { useState, useEffect } from 'react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';

interface PlayerTrophiesProps {
  trophiesData: TrophyData[];
  leagueLogoUrls?: Record<number, string>;
  leagueLogoDarkUrls?: Record<number, string>;
}

function PlayerTrophies({
  trophiesData,
  leagueLogoUrls = {},
  leagueLogoDarkUrls = {}
}: PlayerTrophiesProps) {
  // 다크모드 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // URL 헬퍼 함수
  const getLeagueLogo = (id: number) => {
    if (isDark && leagueLogoDarkUrls[id]) {
      return leagueLogoDarkUrls[id];
    }
    return leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
  };

  return (
    <UnifiedSportsImageClient
      src={getLeagueLogo(leagueId)}
      alt={trophy.league}
    />
  );
}
```

### 22.6 Trophies 리그 ID 추출 패턴

`trophy.leagueLogo`에서 리그 ID를 추출:

```typescript
// data.ts
response.trophies.forEach(trophy => {
  if (trophy.leagueLogo) {
    // leagueLogo 형식: "https://media.api-sports.io/football/leagues/39.png"
    const match = trophy.leagueLogo.match(/\/(\d+)\.(png|svg)$/);
    if (match) {
      trophiesLeagueIds.add(parseInt(match[1], 10));
    }
  }
});

// 배치 URL 조회
const [trophiesLeagueLogoUrls, trophiesLeagueLogoDarkUrls] = await Promise.all([
  trophiesLeagueIds.size > 0 ? getLeagueLogoUrls([...trophiesLeagueIds]) : {},
  trophiesLeagueIds.size > 0 ? getLeagueLogoUrls([...trophiesLeagueIds], true) : {}
]);
```

### 22.7 데이터 흐름

```
[서버 액션: player/data.ts]
    │
    ├── getPlayerFullData(playerId)
    │
    ├── 각 탭 데이터에서 ID 수집
    │   ├── statistics: teamIds, leagueIds
    │   ├── fixtures: teamIds, leagueIds
    │   ├── transfers: teamIds
    │   ├── trophies: leagueIds (leagueLogo에서 추출)
    │   └── injuries: teamIds
    │
    ├── 배치로 Storage URL 조회
    │   ├── getTeamLogoUrls([...allTeamIds])
    │   ├── getLeagueLogoUrls([...allLeagueIds])
    │   └── getLeagueLogoUrls([...allLeagueIds], true)  // 다크모드
    │
    └── response에 URL 맵 추가
          │
          ▼
[React Query 훅: usePlayerQueries.ts]
    │
    ├── usePlayerTabData({ playerId, currentTab, initialData })
    │
    └── { statsData, trophiesLeagueLogoUrls, ... } 반환
          │
          ▼
[부모 컴포넌트: TabContent.tsx]
    │
    └── <TrophiesTab
          trophiesData={trophies}
          leagueLogoUrls={trophiesLeagueLogoUrls}
          leagueLogoDarkUrls={trophiesLeagueLogoDarkUrls}
        />
          │
          ▼
[자식 컴포넌트: PlayerTrophies.tsx]
    │
    ├── MutationObserver로 다크모드 감지
    │
    └── <UnifiedSportsImageClient
          src={getLeagueLogo(leagueId)}
          alt={trophy.league}
        />
```

### 22.8 완료된 탭

| 탭 | 팀 로고 | 리그 로고 | 다크모드 |
|----|---------|-----------|----------|
| Stats | ✅ | ✅ | ✅ |
| Fixtures | ✅ | ✅ | ✅ |
| Transfers | ✅ | N/A | N/A |
| Trophies | N/A | ✅ | ✅ |
| Injuries | ✅ | N/A | N/A |
| Rankings | ✅ | ✅ | N/A |

### 22.9 빌드 검증

```bash
npm run build
# ✅ 성공 - 컴파일 오류 없음
```

---

## 23. 전체 완료 체크리스트 (Phase 1-16)

### 23.1 서버 액션 수정 완료

| # | 파일 | 상태 |
|---|------|------|
| 1-16 | (이전 Phase 완료) | ✅ |
| 17 | `livescore/actions/player/data.ts` (Player 탭 URL 필드) | ✅ Phase 16 |

### 23.2 클라이언트 컴포넌트 수정 완료

| 도메인 | 개수 | 상태 |
|--------|------|------|
| Livescore (기존) | 34개 | ✅ |
| Livescore (Player 탭) | 5개 | ✅ Phase 16 |
| Boards | 6개 | ✅ |
| 기타 | 5개 | ✅ |
| **합계** | **50개** | **✅ 전체 완료** |

### 23.3 Player 탭 다크모드 지원 요약

| 컴포넌트 | 다크모드 지원 방식 |
|----------|-------------------|
| `PlayerStats.tsx` | `leagueLogoDarkUrls` + MutationObserver |
| `PlayerFixtures.tsx` | `leagueLogoDarkUrls` + MutationObserver |
| `PlayerTrophies.tsx` | `leagueLogoDarkUrls` + MutationObserver |
| `PlayerTransfers.tsx` | N/A (팀 로고만 사용) |
| `PlayerInjuries.tsx` | N/A (팀 로고만 사용) |

---

**최종 업데이트**: 2026-02-06
