# 이미지 처리 룰셋 (4590 표준)

이 문서는 프로젝트의 이미지 처리 표준을 정의합니다. API-Sports 등 외부 API의 이미지를 Supabase Storage로 캐싱하여 안정적이고 빠른 이미지 서빙을 보장합니다.

---

## 0. 원칙 (절대 규칙)

> **핵심**: 클라이언트는 API-Sports 이미지 URL을 **절대** 직접 사용하지 않는다.

1. 앱에서 사용하는 이미지의 "정식 원본"은 **Supabase Storage**다.
2. 이미지 URL은 **서버에서 확정해서 내려준다** (서버 컴포넌트/서버 액션).
3. **모든 타입** (팀, 리그, 선수, 감독)이 동일한 규칙을 따른다.

---

## 1. 지원 이미지 타입

| 타입 | 서버 함수 | 버킷 | 예시 경로 |
|------|-----------|------|-----------|
| 팀 로고 | `getTeamLogoUrl(s)` | `teams` | `teams/33.png` |
| 리그 로고 | `getLeagueLogoUrl(s)` | `leagues` | `leagues/39.png` |
| 선수 사진 | `getPlayerPhotoUrl(s)` | `players` | `players/306.png` |
| 감독 사진 | `getCoachPhotoUrl(s)` | `coachs` | `coachs/123.png` |

---

## 2. 사용법

### 2.1 서버 컴포넌트/서버 액션에서

```typescript
import {
  getTeamLogoUrl,
  getTeamLogoUrls,
  getLeagueLogoUrl,
  getLeagueLogoUrls,
  getPlayerPhotoUrl,
  getPlayerPhotoUrls,
  getCoachPhotoUrl,
  getCoachPhotoUrls,
} from '@/domains/livescore/actions/images';

// 단일 조회
const teamLogo = await getTeamLogoUrl(33);           // 맨유
const leagueLogo = await getLeagueLogoUrl(39);       // 프리미어리그
const leagueLogoDark = await getLeagueLogoUrl(39, true);  // 다크모드
const playerPhoto = await getPlayerPhotoUrl(306);   // 손흥민
const coachPhoto = await getCoachPhotoUrl(123);     // 감독

// 배치 조회 (성능 최적화 - 권장)
const teamLogos = await getTeamLogoUrls([33, 34, 40]);
const playerPhotos = await getPlayerPhotoUrls([306, 1485, 874]);
```

### 2.2 클라이언트 컴포넌트에서

클라이언트 컴포넌트는 **서버에서 받은 URL만 사용**합니다.

```tsx
// ❌ 잘못된 예 - 클라이언트에서 URL 조합
function PlayerCard({ playerId }: { playerId: number }) {
  const photoUrl = `https://media.api-sports.io/football/players/${playerId}.png`;
  return <Image src={photoUrl} />;
}

// ✅ 올바른 예 - 서버에서 URL을 받음
function PlayerCard({ photoUrl }: { photoUrl: string }) {
  return <Image src={photoUrl} />;
}

// ✅ 서버 컴포넌트/액션에서 URL 조회 후 전달
async function PlayerPage({ playerId }: { playerId: number }) {
  const photoUrl = await getPlayerPhotoUrl(playerId);
  return <PlayerCard photoUrl={photoUrl} />;
}
```

---

## 3. 저장 경로 규칙 (Storage Key 규격)

### 버킷 구조

```
Supabase Storage
├── teams/          # 팀 로고
│   ├── 33.png
│   └── 34.png
├── leagues/        # 리그 로고
│   ├── 39.png
│   └── 39-1.png    # 다크모드용
├── players/        # 선수 사진
│   └── 306.png
└── coachs/         # 감독 사진
    └── 123.png
```

**중요**: 키는 절대 변하지 않게. 그래야 "한 번 저장 → 영구 캐시"가 됨.

### 다크모드 리그 로고

일부 리그는 다크모드용 로고가 별도로 존재합니다:
- 파일명 형식: `{leagueId}-1.png`
- 예: `39-1.png` (프리미어리그 다크모드)

지원 리그: EPL(39), Championship(40), League One(41), League Two(42), EFL Cup(45), FA Cup(48), 라리가(140), 세리에A(135), 분데스리가(78), 리그앙(61), 에레디비시(88), 포르투갈(94), UCL(2), UEL(3), 컨퍼런스리그(848), K리그1(292)

---

## 4. DB 캐시 테이블 규칙

### 테이블: `asset_cache`

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | text | `team_logo` \| `league_logo` \| `player_photo` \| `coach_photo` |
| `entity_id` | bigint | 팀/리그/선수/감독 ID |
| `storage_path` | text | 예: `33.png` |
| `source_url` | text | API-Sports 원본 URL |
| `status` | text | `ready` \| `pending` \| `error` |
| `checked_at` | timestamptz | 갱신 검사 시각 |
| `updated_at` | timestamptz | 마지막 업데이트 시각 |

### 제약조건

- **유니크 키**: `(type, entity_id)` - 중복 업로드/레코드 방지

---

## 5. 캐싱 동작 규칙

### On-demand 캐싱 (기본 전략)

```
getTeamLogoUrl(teamId)
    │
    ▼
┌─────────────────────────────────────┐
│ 1. asset_cache 조회                  │
│    WHERE type='team_logo'           │
│    AND entity_id={teamId}           │
└─────────────────────────────────────┘
    │
    ├─── status='ready' ──► Storage URL 반환
    │
    ├─── status='pending' ──► 대기 후 재확인 또는 placeholder
    │
    └─── 없음 또는 'error' ──▼
                              │
┌─────────────────────────────────────┐
│ 2. pending 락 선점 (upsert)          │
│    → 중복 다운로드 방지              │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 3. API-Sports에서 이미지 다운로드     │
│    https://media.api-sports.io/...  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 4. Storage에 업로드                  │
│    teams/{teamId}.png               │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ 5. asset_cache 업데이트              │
│    status='ready'                   │
└─────────────────────────────────────┘
    │
    ▼
   Storage URL 반환
```

### TTL (Time To Live)

| 타입 | TTL | 근거 |
|------|-----|------|
| 팀 로고 | 90일 | 거의 변경 없음 |
| 리그 로고 | 90일 | 거의 변경 없음 |
| 선수 사진 | 30일 | 이적/변경 가능성 |
| 감독 사진 | 30일 | 이적/변경 가능성 |

### 실패 처리

1. **기존 `ready` 캐시가 있으면** 그걸 계속 사용
2. **없으면** 공용 placeholder 반환
3. `status='error'` 기록 + 쿨다운 1시간

**원칙**: "에러 때문에 화면이 깨지는 것"을 **절대 허용하지 않는다**.

---

## 6. Placeholder URL

```typescript
const PLACEHOLDER_URLS = {
  player_photo: '/images/placeholder-player.png',
  coach_photo: '/images/placeholder-coach.png',
  team_logo: '/images/placeholder-team.png',
  league_logo: '/images/placeholder-league.png',
};
```

---

## 7. 코드 리뷰 체크리스트

PR 리뷰 시 다음 항목을 확인하세요:

- [ ] 클라이언트에서 API-Sports 이미지 URL 사용한 흔적이 없는가?
- [ ] 클라이언트에서 Storage URL을 직접 조합하지 않는가?
- [ ] 이미지 URL은 서버에서 확정해서 내려주는가?
- [ ] 배치 조회가 가능한 곳에서 배치 함수를 사용하는가?
- [ ] 실패 시 placeholder로 안전하게 떨어지는가?

---

## 8. 파일 위치

### 서버 액션 (URL 조회)

```
src/domains/livescore/actions/images/
├── index.ts              # re-export (진입점)
├── constants.ts          # 상수 정의
├── ensureAssetCached.ts  # 공통 캐싱 로직
├── getTeamLogoUrl.ts     # 팀 로고
├── getLeagueLogoUrl.ts   # 리그 로고
├── getPlayerPhotoUrl.ts  # 선수 사진
└── getCoachPhotoUrl.ts   # 감독 사진
```

### 컴포넌트 (렌더링)

```
src/shared/components/
├── UnifiedSportsImage.tsx        # 서버 컴포넌트 (내부에서 URL 조회)
└── UnifiedSportsImageClient.tsx  # 클라이언트 전용 (src만 받음)
```

### 컴포넌트 선택 가이드

| 사용 환경 | 컴포넌트 | 4590 표준 |
|-----------|----------|-----------|
| 서버 컴포넌트 | `UnifiedSportsImage` | ✅ 완전 준수 (내부에서 URL 조회) |
| 클라이언트 (URL 전달받음) | `UnifiedSportsImageClient` | ✅ 완전 준수 |

---

## 9. 다크모드 리그 로고 처리

### 9.1 서버에서 다크모드 URL 조회

```typescript
// 서버 컴포넌트/액션에서
import { getLeagueLogoUrl, getLeagueLogoUrls } from '@/domains/livescore/actions/images';

// 단일 조회
const leagueLogo = await getLeagueLogoUrl(39);       // 라이트모드
const leagueLogoDark = await getLeagueLogoUrl(39, true);  // 다크모드

// 배치 조회 (권장)
const [leagueLogos, leagueLogosDark] = await Promise.all([
  getLeagueLogoUrls([39, 140, 78]),
  getLeagueLogoUrls([39, 140, 78], true),
]);
```

### 9.2 클라이언트에서 다크모드 감지

클라이언트 컴포넌트에서 다크모드에 따라 적절한 로고를 표시하려면 MutationObserver 패턴을 사용합니다.

```tsx
'use client';

import { useState, useEffect } from 'react';
import UnifiedSportsImageClient from '@/shared/components/UnifiedSportsImageClient';

interface LeagueLogoProps {
  leagueLogo: string;
  leagueLogoDark?: string | null;
  alt: string;
}

function LeagueLogo({ leagueLogo, leagueLogoDark, alt }: LeagueLogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 초기 다크모드 상태 확인
    setIsDark(document.documentElement.classList.contains('dark'));

    // 다크모드 변경 감지
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

  // 다크모드이고 다크로고가 있으면 다크로고 사용
  const effectiveLogoUrl = isDark && leagueLogoDark ? leagueLogoDark : leagueLogo;

  return (
    <UnifiedSportsImageClient
      src={effectiveLogoUrl}
      alt={alt}
    />
  );
}
```

### 9.3 Post 목록에서 다크모드 처리

게시글 목록의 리그 로고는 `Post` 타입에 `league_logo_dark` 필드가 포함되어 있습니다.

```typescript
// Post 타입
interface Post {
  // ...
  league_logo?: string | null;
  league_logo_dark?: string | null;  // 다크모드 리그 로고 URL
}

// 서버 액션에서 조회 (getPosts.ts)
const [leagueLogoMap, leagueLogoDarkMap] = await Promise.all([
  fetchLeagueLogos(supabase, leagueIds),
  fetchLeagueLogos(supabase, leagueIds, true),  // isDark = true
]);

// formatPostData에서 적용
formatPostData(post, ..., leagueLogoDarkMap);
```

### 9.4 다크모드 지원 체크리스트

리그 로고를 표시하는 컴포넌트를 작성할 때:

- [ ] 서버에서 다크모드 URL도 함께 조회하는가?
- [ ] 클라이언트에서 MutationObserver로 다크모드 변경을 감지하는가?
- [ ] `isDark && leagueLogoDark` 조건으로 적절한 URL을 선택하는가?
- [ ] 다크모드 로고가 없는 리그도 정상 동작하는가?

---

## 10. 마이그레이션 참고

기존 코드에서 API-Sports URL을 직접 사용하는 경우 다음과 같이 수정:

```typescript
// Before (❌)
const photo = `https://media.api-sports.io/football/players/${playerId}.png`;

// After (✅)
import { getPlayerPhotoUrl } from '@/domains/livescore/actions/images';
const photo = await getPlayerPhotoUrl(playerId);
```

---

## 11. Player 탭 컴포넌트 패턴

Player 상세 페이지의 각 탭 컴포넌트는 4590 표준을 완전히 준수합니다.

### 11.1 지원 탭 및 이미지 타입

| 탭 | 팀 로고 | 리그 로고 | 다크모드 |
|----|---------|-----------|----------|
| Stats (통계) | ✅ | ✅ | ✅ |
| Fixtures (경기 기록) | ✅ | ✅ | ✅ |
| Transfers (이적 기록) | ✅ | - | - |
| Trophies (트로피) | - | ✅ | ✅ |
| Injuries (부상 기록) | ✅ | - | - |
| Rankings (순위) | ✅ | ✅ | - |

### 11.2 데이터 흐름

```
[서버: player/data.ts]
    │
    ├── 각 탭 데이터에서 팀/리그 ID 수집
    │
    ├── getTeamLogoUrls([...teamIds])
    ├── getLeagueLogoUrls([...leagueIds])
    ├── getLeagueLogoUrls([...leagueIds], true)  // 다크모드
    │
    └── response에 URL 맵 추가
          │
          ▼
[React Query: usePlayerTabData()]
    │
    └── { statsData, trophiesLeagueLogoUrls, ... }
          │
          ▼
[TabContent.tsx]
    │
    └── <TrophiesTab leagueLogoUrls={...} leagueLogoDarkUrls={...} />
          │
          ▼
[PlayerTrophies.tsx]
    │
    ├── MutationObserver로 다크모드 감지
    │
    └── <UnifiedSportsImageClient src={getLeagueLogo(id)} />
```

### 11.3 다크모드 감지 패턴

모든 Player 탭 컴포넌트는 동일한 MutationObserver 패턴을 사용합니다:

```tsx
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

const getLeagueLogo = (id: number) => {
  if (isDark && leagueLogoDarkUrls[id]) {
    return leagueLogoDarkUrls[id];
  }
  return leagueLogoUrls[id] || LEAGUE_PLACEHOLDER;
};
```

### 11.4 Placeholder 상수

각 탭 컴포넌트에서 사용하는 placeholder 상수:

```typescript
const TEAM_PLACEHOLDER = '/images/placeholder-team.svg';
const LEAGUE_PLACEHOLDER = '/images/placeholder-league.svg';
const PLAYER_PLACEHOLDER = '/images/placeholder-player.png';
```

---

**문서 작성일**: 2026-02-06
**최종 업데이트**: 2026-02-06
