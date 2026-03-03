# 매치 하이라이트 시스템

경기 종료 후 공식 하이라이트 영상(YouTube)을 자동으로 매칭하여 매치 상세 페이지에 표시하는 시스템.

---

## 1. 개요

### 목표
- 매치 상세 페이지에서 **공식 하이라이트 영상** 자동 제공
- 한국어 하이라이트 채널(쿠팡플레이, SPOTV) 우선 사용
- 사용자가 별도로 검색하지 않아도 경기 하이라이트를 바로 시청

### 참고
- FotMob 앱의 매치 상세 → 공식 하이라이트 기능과 동일한 UX 목표

---

## 2. 아키텍처

### 전체 흐름

```
경기 종료 (FT)
    ↓
Cron / Edge Function (주기적 실행)
    ↓
YouTube API로 한국 중계 채널에서 영상 검색
    ↓
팀명 매칭으로 올바른 영상 식별
    ↓
match_highlights 테이블에 videoId 캐싱
    ↓
매치 상세 페이지에서 캐싱된 videoId로 임베드
```

### YouTube API 전략: playlistItems.list (핵심)

| 메서드 | Quota Cost | 일일 호출 가능 | 용도 |
|--------|-----------|---------------|------|
| `search.list` | **100 units** | 100회 | 키워드 검색 |
| `playlistItems.list` | **1 unit** | 10,000회 | 채널 업로드 목록 조회 |

**→ `playlistItems.list`를 메인으로 사용 (100배 저렴)**

채널의 업로드 재생목록 ID는 채널 ID의 `UC`를 `UU`로 바꾸면 됨:
- 채널 ID: `UCnBht7BrOx-A328KFXgysqQ`
- 업로드 재생목록: `UUnBht7BrOx-A328KFXgysqQ`

### 매칭 로직

```
1. 한국 중계 채널(쿠팡플레이/SPOTV)의 최근 업로드 50개 조회 (1 unit each)
2. 영상 제목에서 "하이라이트" 키워드 + 팀명 매칭:
   - 쿠팡: "[프리미어리그] 28R 아스날 vs 첼시 2분 하이라이트"
   - SPOTV: "[25/26 세리에A] 27R AS 로마 vs 유벤투스 3분 하이라이트"
3. 매칭 성공 시 videoId를 DB에 저장
4. 매칭 실패 시 fallback: 리그 공식 채널에서 검색
```

---

## 3. 채널 매핑

### 1순위: 한국 중계 채널 (한국어 하이라이트)

| 채널 | 채널 ID | Uploads Playlist ID | 커버 리그 |
|------|---------|-------------------|----------|
| **쿠팡플레이 스포츠** | `UCnBht7BrOx-A328KFXgysqQ` | `UUnBht7BrOx-A328KFXgysqQ` | EPL, 라리가, 분데스리가, 리그앙, K리그 |
| **SPOTV** | `UCtm_QoN2SIxwCE-59shX7Qg` | `UUtm_QoN2SIxwCE-59shX7Qg` | 세리에A, UCL, UEL |

**제목 패턴**:
- 쿠팡플레이: `[프리미어리그] 28R 아스날 vs 첼시 2분 하이라이트`
- SPOTV: `[25/26 세리에A] 27R AS 로마 vs 유벤투스 3분 하이라이트｜SPOTV FOOTBALL`

**일일 API 비용: 2 units** (채널 2개 × 1 unit)

### 리그-채널 매핑

| 리그 | API ID | 1순위 채널 | 제목 내 리그명 |
|------|--------|-----------|--------------|
| 프리미어리그 | 39 | 쿠팡플레이 | `프리미어리그` |
| 라리가 | 140 | 쿠팡플레이 | `라리가` |
| 분데스리가 | 78 | 쿠팡플레이 | `분데스리가` |
| 리그앙 | 61 | 쿠팡플레이 | `리그 1` |
| K리그1 | 292 | 쿠팡플레이 | `K리그1` |
| 세리에A | 135 | SPOTV | `세리에A` |
| UCL | 2 | SPOTV | `UCL` |
| UEL | 3 | SPOTV | `UEL` |

### 2순위: 리그 공식 채널 (fallback, 영어)

| 리그 | 채널 ID | Uploads Playlist ID |
|------|---------|-------------------|
| Premier League | `UCG5qGWdu8nIRZqJ_GgDwQ-w` | `UUG5qGWdu8nIRZqJ_GgDwQ-w` |
| La Liga | `UCTv-XvfzLX3i4IGWAm4sbmA` | `UUTv-XvfzLX3i4IGWAm4sbmA` |
| Bundesliga | `UC6UL29enLNe4mqwTfAyeNuw` | `UU6UL29enLNe4mqwTfAyeNuw` |
| Serie A | `UCBJeMCIeLQos7wacox4hmLQ` | `UUBJeMCIeLQos7wacox4hmLQ` |
| Ligue 1 | `UC58LMAlfwtGRNR6Xpd4DlSA` | `UU58LMAlfwtGRNR6Xpd4DlSA` |
| K League | `UCak5ZEX4BjijJcf7fdppuIQ` | `UUak5ZEX4BjijJcf7fdppuIQ` |
| UEFA (UCL/UEL) | `UCyGa1YEx9ST66rYrJTGIKOw` | `UUyGa1YEx9ST66rYrJTGIKOw` |

> 모든 채널 ID는 실제 API 호출로 검증 완료 (2026-03-03)

---

## 4. 데이터베이스 설계

### match_highlights 테이블

```sql
CREATE TABLE match_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id INTEGER NOT NULL,              -- API-Sports fixture ID
  league_id INTEGER NOT NULL,               -- 리그 ID
  video_id TEXT NOT NULL,                    -- YouTube videoId
  video_title TEXT,                          -- 영상 제목
  channel_name TEXT,                         -- 채널명 (쿠팡플레이/SPOTV 등)
  source_type TEXT NOT NULL DEFAULT 'korean', -- 'korean' | 'official' | 'search'
  thumbnail_url TEXT,                        -- 썸네일 URL
  published_at TIMESTAMPTZ,                 -- 영상 게시 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(fixture_id)                        -- 경기당 1개 영상
);

-- 인덱스
CREATE INDEX idx_match_highlights_fixture ON match_highlights(fixture_id);
CREATE INDEX idx_match_highlights_league ON match_highlights(league_id);

-- RLS
ALTER TABLE match_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_highlights_read" ON match_highlights
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "match_highlights_write" ON match_highlights
  FOR ALL TO service_role
  USING (true);
```

---

## 5. 구현 계획

### Phase 1: 기반 (MVP)

#### 5-1. 채널 매핑 상수

```
src/domains/livescore/constants/youtube-channels.ts
```

```typescript
// 한국 중계 채널 (1순위)
export const KOREAN_CHANNELS = {
  COUPANG_PLAY: {
    channelId: 'UCnBht7BrOx-A328KFXgysqQ',
    uploadsPlaylistId: 'UUnBht7BrOx-A328KFXgysqQ',
    name: '쿠팡플레이 스포츠',
    // 커버 리그: EPL(39), 라리가(140), 분데스리가(78), 리그앙(61), K리그(292)
    leagueIds: [39, 140, 78, 61, 292],
  },
  SPOTV: {
    channelId: 'UCtm_QoN2SIxwCE-59shX7Qg',
    uploadsPlaylistId: 'UUtm_QoN2SIxwCE-59shX7Qg',
    name: 'SPOTV',
    // 커버 리그: 세리에A(135), UCL(2), UEL(3)
    leagueIds: [135, 2, 3],
  },
} as const;

// 리그 ID → 한국 채널 매핑
export const LEAGUE_TO_KOREAN_CHANNEL: Record<number, keyof typeof KOREAN_CHANNELS> = {
  39: 'COUPANG_PLAY',
  140: 'COUPANG_PLAY',
  78: 'COUPANG_PLAY',
  61: 'COUPANG_PLAY',
  292: 'COUPANG_PLAY',
  135: 'SPOTV',
  2: 'SPOTV',
  3: 'SPOTV',
};

// 리그 ID → 한국어 제목 내 리그명 (매칭용)
export const LEAGUE_TITLE_KEYWORDS: Record<number, string[]> = {
  39: ['프리미어리그'],
  140: ['라리가'],
  78: ['분데스리가'],
  61: ['리그 1', '리그1'],
  292: ['K리그1', 'K리그'],
  135: ['세리에A', '세리에 A'],
  2: ['UCL', '챔피언스리그'],
  3: ['UEL', '유로파'],
};

// 리그 공식 채널 (2순위 fallback)
export const OFFICIAL_LEAGUE_CHANNELS: Record<number, {
  channelId: string;
  uploadsPlaylistId: string;
  name: string;
}> = {
  39: { channelId: 'UCG5qGWdu8nIRZqJ_GgDwQ-w', uploadsPlaylistId: 'UUG5qGWdu8nIRZqJ_GgDwQ-w', name: 'Premier League' },
  140: { channelId: 'UCTv-XvfzLX3i4IGWAm4sbmA', uploadsPlaylistId: 'UUTv-XvfzLX3i4IGWAm4sbmA', name: 'La Liga' },
  78: { channelId: 'UC6UL29enLNe4mqwTfAyeNuw', uploadsPlaylistId: 'UU6UL29enLNe4mqwTfAyeNuw', name: 'Bundesliga' },
  135: { channelId: 'UCBJeMCIeLQos7wacox4hmLQ', uploadsPlaylistId: 'UUBJeMCIeLQos7wacox4hmLQ', name: 'Serie A' },
  61: { channelId: 'UC58LMAlfwtGRNR6Xpd4DlSA', uploadsPlaylistId: 'UU58LMAlfwtGRNR6Xpd4DlSA', name: 'Ligue 1' },
  292: { channelId: 'UCak5ZEX4BjijJcf7fdppuIQ', uploadsPlaylistId: 'UUak5ZEX4BjijJcf7fdppuIQ', name: 'K League' },
  2: { channelId: 'UCyGa1YEx9ST66rYrJTGIKOw', uploadsPlaylistId: 'UUyGa1YEx9ST66rYrJTGIKOw', name: 'UEFA' },
  3: { channelId: 'UCyGa1YEx9ST66rYrJTGIKOw', uploadsPlaylistId: 'UUyGa1YEx9ST66rYrJTGIKOw', name: 'UEFA' },
};
```

#### 5-2. YouTube API 서버 액션

```
src/domains/livescore/actions/highlights/
├── fetchHighlights.ts       -- YouTube API 호출 + 매칭 로직
├── getMatchHighlight.ts     -- DB에서 캐싱된 하이라이트 조회
└── syncHighlights.ts        -- Cron용: 종료 경기 일괄 검색
```

**핵심 로직 (fetchHighlights.ts)**:

```typescript
'use server';

// 1. 리그 ID로 한국 채널(쿠팡플레이/SPOTV) 결정
// 2. playlistItems.list로 최근 영상 50개 조회 (1 unit)
// 3. "하이라이트" 키워드 필터 + 팀명 매칭
// 4. 매칭 성공 → match_highlights 테이블에 저장
// 5. 매칭 실패 → 리그 공식 채널 fallback (1 unit 추가)
```

#### 5-3. 매치 상세 페이지 통합

**표시 위치**: MatchHeader 하단 (탭 위), 경기 종료(FT) 상태일 때만 표시

```
MatchPageClient.tsx
├── MatchHeader (스코어, 팀명)
├── HighlightBanner (NEW - 하이라이트 영상)  ← 여기
├── TabNavigation (탭 버튼)
└── TabContent (탭 콘텐츠)
```

**컴포넌트**:

```
src/domains/livescore/components/football/match/HighlightBanner.tsx
```

- 경기 종료(FT) 상태일 때만 렌더링
- YouTube 임베드 (iframe) 또는 썸네일 + 링크
- 반응형 (16:9 비율)

### Phase 2: 자동화

#### 5-4. Cron Job (하이라이트 동기화)

Vercel Cron 또는 Supabase Edge Function으로 주기적 실행:

```
실행 주기: 매 2시간
로직:
  1. 쿠팡플레이 + SPOTV 최근 영상 50개씩 조회 (2 units)
  2. "하이라이트" 포함 영상만 필터링
  3. 제목에서 팀명 파싱 → fixture 매칭
  4. 새로운 매칭 결과를 DB에 저장
```

**Quota 예산 (일일)**:

```
한국 채널 조회: 2개 채널 × 12회/일 = 24 units (playlistItems.list)
Fallback 조회: 약 2회/일 = 2 units
────────────────────
총: ~26 units/일 (할당량 10,000의 0.26%)
```

### Phase 3: 확장

- 리그 공식 채널 fallback 자동화
- 하이라이트 외 콘텐츠 (인터뷰, 프리뷰 등)
- 사용자가 직접 하이라이트 링크 제보 기능

---

## 6. UI/UX 설계

### 매치 상세 페이지 - HighlightBanner

```
┌─────────────────────────────────────────────┐
│  MatchHeader (팀 로고, 스코어, 경기 정보)      │
├─────────────────────────────────────────────┤
│  🎬 공식 하이라이트                            │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │         YouTube 임베드 (16:9)          │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│  쿠팡플레이 스포츠 · 3시간 전                  │
├─────────────────────────────────────────────┤
│  TabNavigation (전력 | 이벤트 | 라인업 | ...) │
└─────────────────────────────────────────────┘
```

**모바일**: 풀 너비 임베드, 소스 텍스트 작게
**데스크탑**: 컨테이너 내부, 최대 640px 너비

### 하이라이트 없을 때
- 아무것도 표시하지 않음 (공간 차지 X)
- 경기 진행 중(LIVE)일 때도 미표시

### 다크모드
- 배경: `bg-black/5 dark:bg-white/5`
- 텍스트: 기존 컬러 시스템 따름

---

## 7. 준비 사항 체크리스트

- [x] Google Cloud 프로젝트 생성
- [x] YouTube Data API v3 활성화
- [x] API 키 발급 → `.env.local`에 추가 완료
- [x] 채널 ID 조사 및 검증 (7개 리그 공식 + 쿠팡플레이 + SPOTV)
- [ ] Vercel 환경변수에 `YOUTUBE_API_KEY` 추가
- [ ] Supabase `match_highlights` 테이블 생성

---

## 8. 기술 제약 및 주의사항

| 항목 | 내용 |
|------|------|
| **일일 Quota** | 10,000 units. 현재 전략 기준 ~26 units/일 사용 (여유 충분) |
| **영상 업로드 딜레이** | 경기 종료 후 수 시간 뒤 업로드되는 경우 있음 |
| **팀명 매칭** | 한국어 팀명 기준 (쿠팡플레이/SPOTV). 한글 팀명 별칭 테이블 필요할 수 있음 |
| **영상 삭제/비공개** | 이미 캐싱한 videoId가 삭제될 수 있음 → 프론트에서 에러 처리 필요 |
| **Quota 리셋** | 매일 한국시간 오후 4시 (Pacific Time 자정) |
| **API 키 보안** | 반드시 서버 사이드(Server Action)에서만 호출. 클라이언트 노출 금지 |
| **저작권** | 공식 채널 영상 임베드는 YouTube TOS상 허용됨 |

---

## 9. 파일 구조 (최종)

```
src/domains/livescore/
├── constants/
│   └── youtube-channels.ts              -- 채널 ID 매핑
├── actions/
│   └── highlights/
│       ├── fetchHighlights.ts           -- YouTube API 호출
│       ├── getMatchHighlight.ts         -- DB에서 조회
│       └── syncHighlights.ts           -- Cron용 일괄 동기화
├── components/
│   └── football/
│       └── match/
│           └── HighlightBanner.tsx      -- 하이라이트 UI 컴포넌트
└── types/
    └── highlight.ts                     -- 타입 정의
```

---

**문서 작성일**: 2026-03-03
**최종 업데이트**: 2026-03-03
**상태**: 🔄 구현 시작
