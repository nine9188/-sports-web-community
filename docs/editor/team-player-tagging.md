# 팀/선수 태그 기능 설계 문서

## 개요

게시글 작성 시 툴바 버튼을 통해 팀/선수를 단계별로 선택하고, 카드 형태로 삽입되는 기능입니다.

### 사용자 경험 (UX)

#### 팀 선택 흐름
```
1. 툴바에서 "팀/선수" 버튼 클릭 → [팀] 탭 선택
2. 리그 선택 (EPL, 라리가, 분데스리가, 세리에A, 리그1)
3. 해당 리그의 팀 목록에서 팀 선택
4. 팀 카드가 에디터에 삽입됨
```

#### 선수 선택 흐름
```
1. 툴바에서 "팀/선수" 버튼 클릭 → [선수] 탭 선택
2. 리그 선택
3. 팀 선택
4. 해당 팀의 선수 목록에서 선수 선택
5. 선수 카드가 에디터에 삽입됨
```

**UI 예시:**
```
[툴바] ... | 🏟️ 경기 | 👥 팀/선수 | ...
                           ↓ 클릭

┌─────────────────────────────────────┐
│ [팀] [선수]                          │  ← 탭
├─────────────────────────────────────┤
│                                     │
│  Step 1: 리그 선택                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ EPL │ │라리가│ │분데스│ │세리에│   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
│  Step 2: 팀 선택 (EPL 선택 시)       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │🔵   │ │🔵   │ │🔴   │ │🔵   │   │
│  │토트넘│ │맨시티│ │리버풀│ │첼시 │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
└─────────────────────────────────────┘

선택 시 에디터에 삽입:
┌─────────────────┐
│      (🔵)       │  ← 원형 로고/사진
│    토트넘        │  ← 이름 (중앙)
│ 프리미어리그     │  ← 부제목 (중앙)
└─────────────────┘
```

---

## 구현 방식: 툴바 버튼 방식

기존 "경기 불러오기" 기능(`MatchResultForm`)과 동일한 패턴으로 구현합니다.

### 비교: 기존 @ 멘션 방식 vs 새 툴바 방식

| 항목 | @ 멘션 방식 (제거됨) | 툴바 버튼 방식 (적용) |
|------|---------------------|----------------------|
| 트리거 | 에디터에서 `@` 입력 | 툴바 버튼 클릭 |
| UI | 인라인 드롭다운 | 모달 다이얼로그 |
| 사용성 | 텍스트 입력 중 자연스러움 | 명확한 액션, 탭으로 구분 |
| 검색 범위 | 팀+선수 통합 검색 | 탭으로 팀/선수 분리 |
| 구현 복잡도 | 높음 (Tiptap suggestion API) | 낮음 (모달 + 버튼) |

---

## 기존 구조 분석

### 1. 경기 카드 시스템 (참고용)

| 항목 | 파일 위치 |
|------|----------|
| Tiptap 확장 | `src/shared/ui/tiptap/MatchCardExtension.ts` |
| 노드 컴포넌트 | `src/domains/boards/components/match/MatchCardNode.tsx` |
| 카드 컴포넌트 | `src/domains/boards/components/match/MatchCard.tsx` |
| 선택 폼 | `src/domains/boards/components/match/MatchResultForm.tsx` |
| 렌더러 | `src/domains/boards/components/post/post-content/renderers/matchCardRenderer.ts` |

**핵심 패턴:**
```typescript
// 툴바 버튼 클릭 → 모달 열기 → 항목 선택 → 카드 삽입
const handleMatchSelect = (match: MatchData) => {
  editor.commands.setMatchCard(match.id, match);
  setShowMatchModal(false);
};
```

### 2. 데이터 소스

#### 팀 데이터
- **DB 테이블**: `football_teams`
- **한글 매핑**: `src/domains/livescore/constants/teams/index.ts`
- **검색 API**: `src/domains/search/actions/searchTeams.ts` ✅

#### 선수 데이터
- **DB 테이블**: `football_players`
- **한글 매핑**: `src/domains/livescore/constants/players/index.ts`
- **검색 API**: `src/domains/search/actions/searchPlayers.ts` ✅

---

## 구현 계획

### Phase 1: 데이터 레이어 (기존 함수 재사용 ✅)

#### 1.1 리그별 팀 목록 조회 (기존 함수 사용)

**파일:** `src/domains/livescore/constants/teams/index.ts` ✅

```typescript
import { getTeamsByLeagueId } from '@/domains/livescore/constants/teams'

// 프리미어리그(39) 팀 조회
const premierTeams = getTeamsByLeagueId(39)
// [ { id: 33, name_ko: '맨유', name_en: 'Manchester United', logo: '...', ... } ]

// 지원 리그: EPL(39), 라리가(140), 분데스(78), 세리에A(135), 리그1(61) 등 15개 리그
```

**TeamMapping 타입:**
```typescript
interface TeamMapping {
  id: number
  name_ko: string
  name_en: string
  country_ko: string
  country_en: string
  code: string
  logo: string
}
```

#### 1.2 팀별 선수 목록 조회 (기존 함수 사용)

**파일:** `src/domains/livescore/actions/teams/squad.ts` ✅

```typescript
import { fetchTeamSquad } from '@/domains/livescore/actions/teams/squad'

const squad = await fetchTeamSquad('33') // 팀 ID (문자열)
// { success: true, data: [
//   { id: 18, name: 'Bruno Fernandes', position: 'Midfielder', number: 8, photo: '...' }
// ]}
```

**Player 타입:**
```typescript
interface Player {
  id: number
  name: string
  age: number
  number: number | null
  position: string
  photo: string
}
```

#### 1.3 관련 상수/유틸

**리그 목록:** `src/domains/search/constants/leagues.ts`
```typescript
export const ALLOWED_LEAGUE_IDS = [39, 140, 78, 135, 61, ...]
```

**선수 한글 이름:** `src/domains/livescore/constants/players/index.ts`
```typescript
import { getPlayerById } from '@/domains/livescore/constants/players'

const player = getPlayerById(306) // 손흥민
// { id: 306, name_ko: '손흥민', name_en: 'Son Heung-Min', team_id: 47, ... }
```

### Phase 2: Tiptap 확장 (완료 ✅)

#### 2.1 TeamCardExtension

**파일:** `src/shared/ui/tiptap/TeamCardExtension.ts` ✅

```typescript
export const TeamCardExtension = Node.create({
  name: 'teamCard',
  group: 'block',
  atom: true,
  draggable: true,

  addCommands() {
    return {
      setTeamCard: (teamId, teamData) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { teamId, teamData }
        });
      }
    };
  }
});
```

#### 2.2 PlayerCardExtension

**파일:** `src/shared/ui/tiptap/PlayerCardExtension.ts` ✅

동일한 패턴으로 구현.

### Phase 3: UI 컴포넌트

#### 3.1 EntityPickerForm (신규 필요)

**파일:** `src/domains/boards/components/entity/EntityPickerForm.tsx`

```typescript
interface EntityPickerFormProps {
  isOpen: boolean
  onClose: () => void
  onSelectTeam: (team: TeamCardData) => void
  onSelectPlayer: (player: PlayerCardData) => void
}

// 지원 리그 목록
const LEAGUES = [
  { id: 39, name: '프리미어리그', logo: '...' },
  { id: 140, name: '라리가', logo: '...' },
  { id: 78, name: '분데스리가', logo: '...' },
  { id: 135, name: '세리에A', logo: '...' },
  { id: 61, name: '리그1', logo: '...' },
]

export function EntityPickerForm({ isOpen, onClose, onSelectTeam, onSelectPlayer }: EntityPickerFormProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'player'>('team')

  // 단계별 선택 상태
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  // 데이터
  const [teams, setTeams] = useState<TeamCardData[]>([])
  const [players, setPlayers] = useState<PlayerCardData[]>([])

  // 리그 선택 시 → 팀 목록 로드
  useEffect(() => {
    if (selectedLeagueId) {
      loadTeamsByLeague(selectedLeagueId).then(setTeams)
    }
  }, [selectedLeagueId])

  // 팀 선택 시 → 선수 목록 로드 (선수 탭일 때만)
  useEffect(() => {
    if (activeTab === 'player' && selectedTeamId) {
      loadPlayersByTeam(selectedTeamId).then(setPlayers)
    }
  }, [activeTab, selectedTeamId])

  // 뒤로가기
  const handleBack = () => {
    if (selectedTeamId) {
      setSelectedTeamId(null)
      setPlayers([])
    } else if (selectedLeagueId) {
      setSelectedLeagueId(null)
      setTeams([])
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        {/* 헤더 */}
        <div className="flex items-center gap-2">
          {(selectedLeagueId || selectedTeamId) && (
            <button onClick={handleBack}>← 뒤로</button>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="team">팀</TabsTrigger>
              <TabsTrigger value="player">선수</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Step 1: 리그 선택 */}
        {!selectedLeagueId && (
          <div>
            <h3 className="text-sm font-medium mb-3">리그 선택</h3>
            <div className="grid grid-cols-5 gap-2">
              {LEAGUES.map(league => (
                <button
                  key={league.id}
                  onClick={() => setSelectedLeagueId(league.id)}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100"
                >
                  <img src={league.logo} className="w-10 h-10" />
                  <span className="text-xs mt-1">{league.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 팀 선택 */}
        {selectedLeagueId && !selectedTeamId && (
          <div>
            <h3 className="text-sm font-medium mb-3">팀 선택</h3>
            <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => {
                    if (activeTab === 'team') {
                      onSelectTeam(team)
                      onClose()
                    } else {
                      setSelectedTeamId(team.id)
                    }
                  }}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100"
                >
                  <img src={team.logo} className="w-12 h-12" />
                  <span className="text-xs mt-1 text-center">{team.koreanName || team.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: 선수 선택 (선수 탭에서만) */}
        {activeTab === 'player' && selectedTeamId && (
          <div>
            <h3 className="text-sm font-medium mb-3">선수 선택</h3>
            <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
              {players.map(player => (
                <button
                  key={player.id}
                  onClick={() => {
                    onSelectPlayer(player)
                    onClose()
                  }}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100"
                >
                  <img src={player.photo} className="w-12 h-12 rounded-full" />
                  <span className="text-xs mt-1 text-center">{player.koreanName || player.name}</span>
                  <span className="text-xs text-gray-500">{player.position}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

#### 3.2 카드 UI (UnifiedSportsImage 사용)

**참고:** `PlayerStatsModal.tsx`의 이미지 처리 방식을 따름

```typescript
import { UnifiedSportsImage, ImageType } from '@/shared/components/UnifiedSportsImage'

// 팀 카드 - UnifiedSportsImage 사용
function SimpleTeamCard({ team }: { team: TeamMapping }) {
  return (
    <Link
      href={`/livescore/football/team/${team.id}`}
      className="inline-flex flex-col items-center p-4 bg-white dark:bg-[#1D1D1D] rounded-xl border border-black/7 dark:border-0 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
    >
      <UnifiedSportsImage
        imageId={team.id}
        imageType={ImageType.Teams}
        alt={team.name_ko}
        size="xl"  // w-12 h-12
        variant="square"
        fit="contain"
      />
      <span className="mt-2 font-semibold text-sm text-center text-gray-900 dark:text-[#F0F0F0]">
        {team.name_ko}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {getLeagueName(team.id)}
      </span>
    </Link>
  )
}

// 선수 카드 - PlayerStatsModal 스타일 참고
function SimplePlayerCard({ player, teamId }: { player: Player; teamId: number }) {
  const playerMapping = getPlayerById(player.id)  // 한글 이름 조회

  return (
    <Link
      href={`/livescore/football/player/${player.id}`}
      className="inline-flex flex-col items-center p-4 bg-white dark:bg-[#1D1D1D] rounded-xl border border-black/7 dark:border-0 hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
    >
      {/* 원형 이미지 + 팀 로고 뱃지 (PlayerStatsModal 스타일) */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-white dark:border-[#1D1D1D] shadow-md overflow-hidden">
          <UnifiedSportsImage
            imageId={player.id}
            imageType={ImageType.Players}
            alt={player.name}
            size="xl"
            variant="circle"
            className="w-full h-full"
          />
        </div>
        {/* 팀 로고 뱃지 */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-[#1D1D1D] shadow flex items-center justify-center">
          <UnifiedSportsImage
            imageId={teamId}
            imageType={ImageType.Teams}
            alt="팀 로고"
            size="sm"
            variant="square"
            fit="contain"
            className="w-4 h-4"
          />
        </div>
      </div>

      <span className="mt-2 font-semibold text-sm text-center text-gray-900 dark:text-[#F0F0F0]">
        {playerMapping?.name_ko || player.name}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {player.position}
        {player.number && ` · #${player.number}`}
      </span>
    </Link>
  )
}
```

**UnifiedSportsImage 사이즈:**
| size | 크기 |
|------|------|
| sm | w-6 h-6 |
| md | w-8 h-8 |
| lg | w-10 h-10 |
| xl | w-12 h-12 |
| xxl | w-28 h-28 |

### Phase 4: 에디터 통합

#### 4.1 PostEditForm 수정

**파일:** `src/domains/boards/components/post/PostEditForm.tsx`

```typescript
// 상태 추가
const [showEntityPicker, setShowEntityPicker] = useState(false)

// 툴바 버튼 추가 (경기 불러오기 버튼 옆에)
<button
  onClick={() => setShowEntityPicker(true)}
  className="toolbar-button"
>
  👥 팀/선수
</button>

// 카드 삽입 핸들러
const handleTeamSelect = (team: TeamCardData) => {
  editor?.commands.setTeamCard(team.id, team)
  setShowEntityPicker(false)
}

const handlePlayerSelect = (player: PlayerCardData) => {
  editor?.commands.setPlayerCard(player.id, player)
  setShowEntityPicker(false)
}

// 모달 렌더링
<EntityPickerForm
  isOpen={showEntityPicker}
  onClose={() => setShowEntityPicker(false)}
  onSelectTeam={handleTeamSelect}
  onSelectPlayer={handlePlayerSelect}
/>
```

### Phase 5: 렌더링 시스템 (완료 ✅)

**파일:** `src/domains/boards/components/post/post-content/renderers/tipTapRenderer.ts` ✅

팀/선수 카드 렌더링 이미 추가됨.

---

## 파일 구조

```
src/
├── domains/
│   ├── boards/
│   │   └── components/
│   │       ├── cards/
│   │       │   ├── TeamCard.tsx          # 팀 카드 컴포넌트 ✅
│   │       │   ├── TeamCardNode.tsx      # Tiptap 노드 래퍼 ✅
│   │       │   ├── PlayerCard.tsx        # 선수 카드 컴포넌트 ✅
│   │       │   └── PlayerCardNode.tsx    # Tiptap 노드 래퍼 ✅
│   │       ├── entity/
│   │       │   └── EntityPickerForm.tsx  # 팀/선수 선택 모달 (신규)
│   │       └── post/
│   │           └── post-content/
│   │               └── renderers/
│   │                   ├── teamCardRenderer.ts   ✅
│   │                   └── playerCardRenderer.ts ✅
│   ├── livescore/
│   │   ├── constants/
│   │   │   ├── teams/index.ts            # getTeamsByLeagueId() ✅ (기존)
│   │   │   └── players/index.ts          # getPlayerById() ✅ (기존)
│   │   └── actions/teams/
│   │       └── squad.ts                  # fetchTeamSquad() ✅ (기존)
│   └── search/
│       └── actions/
│           ├── searchPlayers.ts          # 선수 검색 API ✅
│           └── searchEntities.ts         # 통합 검색 API ✅
│
├── shared/
│   ├── components/
│   │   └── UnifiedSportsImage.tsx        # 스포츠 이미지 컴포넌트 ✅ (기존)
│   ├── ui/
│   │   └── tiptap/
│   │       ├── TeamCardExtension.ts      # 팀 카드 Tiptap 확장 ✅
│   │       └── PlayerCardExtension.ts    # 선수 카드 Tiptap 확장 ✅
│   └── types/
│       ├── teamCard.ts                   # 팀 카드 타입 ✅
│       └── playerCard.ts                 # 선수 카드 타입 ✅
```

---

## 구현 상태

### 완료됨 ✅
1. [x] `searchPlayers.ts` - 선수 검색 API
2. [x] `searchEntities.ts` - 통합 검색 API
3. [x] 타입 정의 (`teamCard.ts`, `playerCard.ts`)
4. [x] `TeamCardExtension.ts` - Tiptap 확장
5. [x] `PlayerCardExtension.ts` - Tiptap 확장
6. [x] `TeamCard.tsx`, `TeamCardNode.tsx` - 카드 컴포넌트
7. [x] `PlayerCard.tsx`, `PlayerCardNode.tsx` - 카드 컴포넌트
8. [x] `tipTapRenderer.ts` - 렌더러 통합
9. [x] `teamCardRenderer.ts`, `playerCardRenderer.ts` - 카드 렌더러
10. [x] 카드 스타일링 (`globals.css`)

### 삭제됨 (@ 멘션 방식)
- ~~`EntityMentionExtension.ts`~~ - 삭제됨
- ~~`entitySuggestion.tsx`~~ - 삭제됨
- ~~`MentionList.tsx`~~ - 삭제됨

### 구현 필요 (단계별 선택 방식)
1. [x] ~~`getTeamsByLeague.ts`~~ - 기존 함수 사용: `getTeamsByLeagueId()`
2. [x] ~~`getPlayersByTeam.ts`~~ - 기존 함수 사용: `fetchTeamSquad()`
3. [ ] `EntityPickerForm.tsx` - 팀/선수 선택 모달 (단계별 UI)
4. [ ] `PostEditForm.tsx` - 툴바 버튼 추가
5. [ ] 카드 UI 업데이트 (`UnifiedSportsImage` 사용)

---

## UI 디자인 가이드

**참고:** `src/shared/components/ui/UI_GUIDELINES.md` 준수

### 색상 체계 (UI_GUIDELINES 기준)

| 용도 | 라이트 모드 | 다크 모드 |
|------|------------|----------|
| 카드 배경 | `bg-white` | `dark:bg-[#1D1D1D]` |
| 카드 테두리 | `border-black/7` | `dark:border-0` |
| 호버 배경 | `hover:bg-[#EAEAEA]` | `dark:hover:bg-[#333333]` |
| 기본 텍스트 | `text-gray-900` | `dark:text-[#F0F0F0]` |
| 보조 텍스트 | `text-gray-500` | `dark:text-gray-400` |

### 컴포넌트 스타일

```tsx
// 카드 컨테이너 (UI_GUIDELINES 준수)
className="inline-flex flex-col items-center p-4
  bg-white dark:bg-[#1D1D1D]
  rounded-xl border border-black/7 dark:border-0
  hover:bg-[#EAEAEA] dark:hover:bg-[#333333]
  transition-colors"

// 기본 텍스트
className="font-semibold text-sm text-gray-900 dark:text-[#F0F0F0]"

// 보조 텍스트
className="text-xs text-gray-500 dark:text-gray-400"
```

### 이미지 처리 (UnifiedSportsImage)

```tsx
import { UnifiedSportsImage, ImageType } from '@/shared/components/UnifiedSportsImage'

// 팀 로고
<UnifiedSportsImage
  imageId={teamId}
  imageType={ImageType.Teams}
  size="xl"
  variant="square"
  fit="contain"
/>

// 선수 사진 (원형)
<UnifiedSportsImage
  imageId={playerId}
  imageType={ImageType.Players}
  size="xl"
  variant="circle"
/>
```

### 참고 컴포넌트
- `PlayerStatsModal.tsx` - 선수 이미지 + 팀 로고 뱃지 스타일
- `PlayerHeader.tsx` - 선수 프로필 헤더 스타일

---

## 관련 문서

- [경기 카드 시스템](../hot-system/score-calculation.md)
- [에디터 확장 가이드](./editor-extensions.md)





  /새로한거 
  
매치카드 vs 선수카드/팀카드 UI 차이점 분석

  스크린샷과 코드를 비교 분석한 결과입니다. 매치카드 기준으로 선수/팀카드와의 차이점을 정리했습니 다.

  ---
  1. 레이아웃 (Display)

  | 속성           | 매치카드        | 선수카드/팀카드         |
  |----------------|-----------------|-------------------------|
  | display        | block (기본값)  | inline-block            |
  | vertical-align | 없음            | top                     |
  | min-width      | 없음            | 100px                   |
  | margin         | 1rem 0 (상하만) | 0.5rem + margin-left: 0 |

  결과: 매치카드는 전체 너비, 선수/팀카드는 인라인으로 나란히 배치됨

  ---
  2. 메인 영역 구조

  | 구분            | 매치카드 (.match-main)                          | 선수/팀카드 (.player-main,
 .team-main) |
  |-----------------|-------------------------------------------------|----------------------------------------|
  | flex-direction  | row (기본값)                                    | column                    
             |
  | justify-content | space-between                                   | 없음                      
             |
  | padding         | 0.75rem                                         | 0.75rem 1rem              
             |
  | 구조            | 홈팀(40%) - 스코어(20%) - 원정팀(40%) 가로 배치 | 이미지 → 이름 세로 배치                |

  ---
  3. 이미지/로고 크기

  | 구분         | 매치카드                            | 선수/팀카드                              
       |
  |--------------|-------------------------------------|-------------------------------------------------|
  | 팀/선수 로고 | .team-logo: 3rem (48px), CSS 클래스 | 인라인 스타일 max-width: 48px; max-height: 48px |
  | 선수 사진    | 없음                                | .player-photo: 48px, border-radius: 50%         |
  | 리그 로고    | 1.5rem (24px)                       | 1.5rem (24px) - 동일                     
       |

  ---
  4. 다크모드 이미지 전환 ⚠️ 핵심 차이

  | 구분          | 매치카드                           | 선수카드/팀카드 |
  |---------------|------------------------------------|-----------------|
  | data 속성     | data-light-src, data-dark-src 있음 | 없음            |
  | 다크모드 전환 | 지원됨 (JS로 이미지 URL 교체)      | 미지원          |

  매치카드 (matchCard.ts:313-330):
  <img src="${leagueImages.light}"
       data-light-src="${leagueImages.light}"
       data-dark-src="${leagueImages.dark}" ... />

  팀카드 (teamCardRenderer.ts:43-51):
  <img src="${leagueLogoUrl}" class="league-logo" ... />
  <!-- data-*-src 속성 없음 -->

  ---
  5. 이름 표시 줄 수

  | 구분               | 매치카드    | 선수/팀카드 |
  |--------------------|-------------|-------------|
  | -webkit-line-clamp | 2 (2줄까지) | 1 (1줄까지) |
  | margin-top         | 없음        | 0.5rem      |

  ---
  6. 헤더 내용

  | 구분     | 헤더 내용              |
  |----------|------------------------|
  | 매치카드 | 리그 로고 + 리그명     |
  | 팀카드   | 리그 로고 + 리그명     |
  | 선수카드 | 팀 로고 + 팀명 (다름!) |

  ---
  7. 앵커 태그 스타일

  | 구분            | 매치카드 | 선수/팀카드        |
  |-----------------|----------|--------------------|
  | text-decoration | none     | none !important    |
  | color           | inherit  | inherit !important |

  ---
  8. 푸터 링크 텍스트

  | 카드     | 텍스트           |
  |----------|------------------|
  | 매치카드 | "매치 상세 정보" |
  | 팀카드   | "팀 정보 확인"   |
  | 선수카드 | "선수 정보 확인" |

  ---
  9. HTML 구조 차이 요약

  매치카드:
  .match-card
  └── a (href="/livescore/football/match/{id}")
      ├── .league-header
      │   └── div (flex)
      │       ├── img.league-logo (data-light-src, data-dark-src)
      │       └── span.league-name
      ├── .match-main
      │   ├── .team-info (40%)
      │   │   ├── img.team-logo (data-light-src, data-dark-src)
      │   │   └── span.team-name
      │   ├── .score-area (20%)
      │   │   ├── .score > .score-number + .score-separator + .score-number
      │   │   └── .match-status
      │   └── .team-info (40%)
      └── .match-footer > .footer-link

  선수카드:
  .player-card
  └── a (href="/livescore/football/player/{id}")
      ├── .league-header
      │   └── div (inline style)
      │       ├── img.league-logo (data 속성 없음)
      │       └── span.league-name
      ├── .player-main
      │   ├── .player-photo > img (inline style)
      │   └── span.player-name
      └── .match-footer > .footer-link

  팀카드:
  .team-card
  └── a (href="/livescore/football/team/{id}")
      ├── .league-header
      │   └── div (inline style)
      │       ├── img.league-logo (data 속성 없음)
      │       └── span.league-name
      ├── .team-main
      │   ├── div (inline style wrapper) > img (inline style)
      │   └── span.team-name
      └── .match-footer > .footer-link

  ---
  10. 코드 파일별 위치

  | 파일                        | 관련 내용                            |
  |-----------------------------|--------------------------------------|
  | globals.css:524-695         | 매치카드 CSS                         |
  | globals.css:1135-1316       | 선수/팀카드 CSS                      |
  | matchCard.ts:251-366        | 매치카드 HTML 생성 (data-*-src 포함) |
  | playerCardRenderer.ts:32-78 | 선수카드 HTML 생성 (data-*-src 없음) |
  | teamCardRenderer.ts:28-75   | 팀카드 HTML 생성 (data-*-src 없음)   |

  ---
  결론: 주요 불일치 사항

  1. 다크모드 이미지 전환: 매치카드만 지원, 선수/팀카드 미지원
  2. 이미지 스타일: 매치카드는 CSS 클래스, 선수/팀카드는 인라인 스타일 혼용
  3. 레이아웃 방식: 매치카드는 block/row, 선수/팀카드는 inline-block/column
