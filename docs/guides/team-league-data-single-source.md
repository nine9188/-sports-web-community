# 팀/리그 데이터 단일 소스(SoT) 가이드

## 요약

팀/리그 한글명·메타데이터는 **DB가 단일 소스**입니다.
- 팀: `football_teams` 테이블 (`team_id`, `name`, `name_ko`, `country_ko`, `code`, `league_id`, ...)
- 리그: `leagues` 테이블 (`id`, `name`, `name_ko`, `country_ko`, `logo`, ...)

기존 `src/domains/livescore/constants/teams/*` 와 `league-mappings.ts`의 `LEAGUE_NAMES_MAP` 등 데이터 매핑은 **제거**되었습니다.

## 데이터 추가/수정 워크플로

1. Supabase Studio (또는 SQL)에서 직접 수정
   ```sql
   -- 팀 한글명 추가
   UPDATE football_teams SET name_ko = '맨체스터 시티', country_ko = '잉글랜드'
   WHERE team_id = 50;

   -- 새 리그 추가
   INSERT INTO leagues (id, name, country, logo, flag, name_ko, country_ko)
   VALUES (270, 'New League', 'Country', '...', '...', '새 리그', '나라');
   ```

2. 캐시 무효화 (필요시)
   ```ts
   import { revalidateTag } from 'next/cache';
   revalidateTag('football-teams');  // 팀 변경 시
   revalidateTag('leagues');         // 리그 변경 시
   ```
   - `unstable_cache`는 7일 TTL이라 다음 revalidate 시점에 자연 갱신됨

## 코드에서 조회

### 클라이언트 컴포넌트 (`'use client'`)

`(site)/layout.tsx`에서 자동으로 `TeamLeagueProvider`로 감싸져 있습니다.

```tsx
'use client';
import { useTeamLeague } from '@/shared/context/TeamLeagueContext';

function MyComponent() {
  const { getTeamById, getLeagueName, getTeamDisplayName } = useTeamLeague();
  const team = getTeamById(40);                  // 동기 lookup
  const leagueName = getLeagueName(39);          // '프리미어리그'
  const display = getTeamDisplayName(40, { language: 'ko' });
  return <div>{team?.name_ko}</div>;
}
```

지원 함수:
- `getTeamById(id)`, `getTeamsByIds(ids)`, `getTeamsByLeagueId(leagueId)`
- `getLeagueIdByTeamId(teamId)`, `getTeamDisplayName(id, opts)`
- `getLeagueById(id)`, `getLeagueName(id)`, `getLeagueKoreanName(englishName)`
- `searchTeamsByName(query)`

### 서버 컴포넌트 / 서버 액션

```ts
import {
  getTeamById, getTeamsByIds, getLeagueById, getLeagueName,
} from '@/domains/livescore/actions/teamLeagueData';

const team = await getTeamById(40);              // 비동기 — await 필요
const map = await getTeamsByIds([40, 50]);       // 배치 조회 권장
```

캐싱: 모든 함수가 `unstable_cache`로 7일 캐싱됨. 페이지당 첫 호출만 DB hit.

## 코드에 남은 로직 (DB로 옮기지 않음)

`src/domains/livescore/constants/league-mappings.ts`:
- `MAJOR_LEAGUE_IDS` — 리그 ID 상수 (코드에서 `if (id === MAJOR_LEAGUE_IDS.PREMIER_LEAGUE)` 같은 분기용)
- `getMajorLeagueIds()` — ID 배열
- `isCalendarSeasonLeague()`, `getCurrentSeasonForLeague()` — 시즌 계산 로직
- `isCupLeague()` — 컵 대회 판정
- `formatSeasonLabel()` — 시즌 표시 포맷터

`src/domains/livescore/constants/teams/mls.ts`:
- `MLS_TEAMS` — MLS 팀 ID → 컨퍼런스(East/West) 매핑 (DB에 컨퍼런스 컬럼이 없어 코드로 유지)

## 마이그레이션 이력

| 변경 | 내용 |
|------|------|
| `leagues` 테이블 확장 | 9 → 36 행, `name_ko`/`country_ko` 컬럼 추가 + 백필 |
| `football_teams.name_ko` | 기존에 이미 백필 완료 (513/554 매치 확인) |
| `constants/teams/*` 삭제 | `mls.ts` 제외 전부 제거 |
| `league-mappings.ts` 데이터 제거 | `LEAGUE_NAMES_MAP`, `getLeagueName`, `getLeagueById`, `getLeagueKoreanName`, `ENGLISH_TO_KOREAN_LEAGUE_MAP` 제거 |
| `TeamLeagueProvider` 추가 | `(site)/layout.tsx`에서 모든 클라이언트 트리에 데이터 주입 |
| `teamLeagueData.ts` 추가 | 서버 측 캐싱 액션 (`getAllTeams`, `getAllLeagues` 등) |

## 레거시 정리 (선택)

`teams` 테이블(128행)은 더 이상 코드에서 참조되지 않습니다. 안전하게 DROP 가능:

```sql
-- 사용처 0건 확인 후 실행
DROP TABLE IF EXISTS public.teams;
```

`leagues` 테이블은 **사용 중** — DROP 금지.
