# 선수 한글명 매핑 가이드

## 📁 파일 구조

```
src/domains/livescore/constants/players/
├── index.ts                    # 메인 인덱스 (공통 인터페이스 및 통합)
├── premier-league.ts           # 프리미어리그 선수
├── laliga.ts                   # 라리가 선수
├── bundesliga.ts               # 분데스리가 선수
├── serie-a.ts                  # 세리에 A 선수
├── ligue-1.ts                  # 리그 1 선수
└── README.md                   # 이 파일
```

## 🎯 목적

API-SPORTS에서 받아온 선수 데이터에 한글명을 매핑하기 위한 상수 파일입니다.

## 📝 데이터 형식

```typescript
interface PlayerMapping {
  id: number;           // API-Football 선수 ID (필수)
  name: string;         // 영문 이름 (필수)
  korean_name: string;  // 한글 이름 (필수)
  team_id?: number;     // 소속 팀 ID (선택)
  position?: string;    // 포지션 (선택)
}
```

## 🔧 사용 방법

### 1. 선수 한글명 조회
```typescript
import { getPlayerKoreanName } from '@/domains/livescore/constants/players';

const koreanName = getPlayerKoreanName(306); // "모하메드 살라"
```

### 2. 팀별 선수 목록 조회
```typescript
import { getPlayersByTeam } from '@/domains/livescore/constants/players';

const liverpoolPlayers = getPlayersByTeam(40); // Liverpool 선수들
```

### 3. 전체 선수 목록 접근
```typescript
import { ALL_PLAYERS } from '@/domains/livescore/constants/players';

console.log(ALL_PLAYERS.length); // 전체 선수 수
```

### 4. 리그별 선수 목록
```typescript
import { PREMIER_LEAGUE_PLAYERS } from '@/domains/livescore/constants/players';

console.log(PREMIER_LEAGUE_PLAYERS.length); // 프리미어리그 선수 수
```

## ✅ 매핑 데이터 추가 가이드

### 1단계: API에서 선수 데이터 확인
`/test/players` 페이지에서 팀별 선수 조회

### 2단계: 해당 리그 파일 열기
예: `premier-league.ts`

### 3단계: 팀별 배열 추가
```typescript
export const TEAM_NAME_PLAYERS: PlayerMapping[] = [
  { 
    id: 123, 
    name: "Player Name", 
    korean_name: "선수 한글명", 
    team_id: 40, 
    position: "Midfielder" 
  },
  // ... 더 많은 선수들
];
```

### 4단계: 리그 전체 배열에 추가
```typescript
export const PREMIER_LEAGUE_PLAYERS: PlayerMapping[] = [
  ...LIVERPOOL_PLAYERS,
  ...ARSENAL_PLAYERS,
  ...TEAM_NAME_PLAYERS,  // 새로 추가
];
```

## 🎨 포지션 표준

- `Goalkeeper` - 골키퍼
- `Defender` - 수비수
- `Midfielder` - 미드필더
- `Attacker` - 공격수

## 📊 진행 상황

### 프리미어리그 (39)
- [x] Liverpool (40) - 33명
- [x] Arsenal (42) - 23명
- [ ] Manchester City (50)
- [ ] Chelsea (49)
- [ ] 기타 팀들...

### 라리가 (140)
- [ ] Real Madrid (541)
- [ ] Barcelona (529)
- [ ] 기타 팀들...

### 분데스리가 (78)
- [ ] Bayern Munich (157)
- [ ] 기타 팀들...

### 세리에 A (135)
- [ ] Inter Milan (505)
- [ ] 기타 팀들...

### 리그 1 (61)
- [ ] PSG (85)
- [ ] 기타 팀들...

## 🔄 업데이트 프로세스

1. `/test/players` 페이지에서 팀 선수 조회
2. API 응답 데이터 확인
3. 한글명 번역/검색
4. 해당 리그 파일에 추가
5. 테스트 후 커밋

## 💡 팁

- 선수 한글명은 [나무위키](https://namu.wiki), [위키백과](https://ko.wikipedia.org) 등에서 확인
- 일관된 표기법 사용 (예: "메시" vs "멧시")
- 포지션은 API 데이터와 일치시키기
- 팀 이적 시 `team_id` 업데이트 필요

## 🚀 자동화 계획

향후 `/test/players` 페이지에서 한글명 입력 후 자동으로 이 파일에 추가하는 기능 개발 예정

