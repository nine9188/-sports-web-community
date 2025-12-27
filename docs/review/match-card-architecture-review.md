# 매치카드 시스템 아키텍처 리뷰

> 작성일: 2025-12-24
> 마지막 업데이트: 2025-12-24
> 목적: 근본적인 설계 문제 분석 및 재구축 방향 제시

## 리팩토링 진행 상황

### 완료된 작업 ✅

| 작업 | 상태 | 변경 내용 |
|------|------|----------|
| 타입 정의 통합 | ✅ 완료 | `shared/types/matchCard.ts` 생성 |
| 이미지 URL 함수 통합 | ✅ 완료 | `shared/utils/matchCard.ts`로 통합 |
| 다크모드 리그 ID 통합 | ✅ 완료 | `DARK_MODE_LEAGUE_IDS` 상수화 |
| 상태 텍스트 로직 통합 | ✅ 완료 | `getStatusInfo()` 단일 함수 |
| 빌드 테스트 | ✅ 완료 | 에러 없음 |

### 신규 생성 파일

```
src/shared/types/matchCard.ts     ← 통합 타입 정의
src/shared/utils/matchCard.ts     ← 통합 유틸리티
```

### 수정된 파일 (공통 유틸리티 사용)

```
src/domains/boards/components/match/MatchCard.tsx
src/shared/ui/tiptap/MatchCardExtension.ts
src/domains/boards/components/post/post-content/renderers/matchCardRenderer.ts
src/shared/utils/matchCardRenderer.ts
src/domains/boards/actions/posts/utils.ts
```

### 2단계 완료 ✅ (렌더러 단일화)

| 작업 | 상태 | 변경 내용 |
|------|------|----------|
| 통합 HTML 생성기 | ✅ 완료 | `generateMatchCardHtml()` 함수 |
| 에디터 렌더러 | ✅ 완료 | 297줄 → 36줄 (88% 감소) |
| 조회 렌더러 | ✅ 완료 | 196줄 → 46줄 (77% 감소) |
| 저장 렌더러 | ✅ 완료 | 148줄 → 75줄 (49% 감소) |

**통합 함수 옵션:**
```typescript
generateMatchCardHtml(matchData, {
  useInlineStyles: true,   // 에디터용
  includeDataAttr: true,   // 에디터용
  includeHoverHandlers: true,  // 조회용
  markAsProcessed: true,   // 저장/조회용
});
```

### 3단계 완료 ✅ (저장 형식 재설계)

| 작업 | 상태 | 변경 내용 |
|------|------|----------|
| 기존 매치카드 게시글 삭제 | ✅ 완료 | 35개 게시글 정리 |
| processMatchCardsInContent 제거 | ✅ 완료 | create.ts, update.ts에서 호출 제거 |
| TipTap JSON 직접 저장 | ✅ 완료 | HTML 변환 없이 JSON 그대로 저장 |
| PostContent.tsx 중복 제거 | ✅ 완료 | matchCard 처리 코드 1개로 통합 |
| 빌드 테스트 | ✅ 완료 | 에러 없음 |

**새로운 저장 흐름:**
```
에디터 → TipTap JSON (matchCard 노드 포함) → DB 저장 → PostContent.tsx에서 렌더링
```

### 미해결 과제 (선택적 개선)

| 작업 | 상태 | 비고 |
|------|------|------|
| matchId만 저장 + API 조회 | ⏳ 선택 | 실시간 업데이트 필요 시 |
| React Server Component | ⏳ 선택 | 성능 최적화 필요 시 |

---

## 핵심 결론

**현재 시스템은 "조기 직렬화(Premature Serialization)" 안티패턴을 사용하고 있음**

- 구조화된 데이터 대신 렌더링된 HTML을 저장
- 관심사 분리 없이 데이터를 속성에 임베딩
- 단일 소스가 아닌 다중 렌더링 경로 존재
- **가장 치명적: 데이터 갱신 불가능**

---

## 1. 근본적인 설계 결함

### 1.1 데이터 저장 방식 - 완전히 잘못됨

**현재 방식**:
```
TipTap JSON → processMatchCardsInContent() → HTML 문자열 → DB 저장
```

**저장되는 형태**:
```html
<div class="match-card processed-match-card" data-processed="true">
  <a href="/livescore/football/match/1379129">
    <div class="league-header">
      <img src="https://media.api-sports.io/football/leagues/39.png" />
      <span>Premier League</span>
    </div>
    <div class="match-main">
      <span class="score-number">2</span> - <span class="score-number">1</span>
    </div>
  </a>
</div>
```

**문제점**:
| 문제 | 영향 |
|------|------|
| HTML이 고정됨 | 경기 결과 변경 시 업데이트 불가 |
| 데이터 + HTML 혼합 | 파싱/역직렬화 복잡성 증가 |
| URL 인코딩된 JSON | 저장 공간 낭비, 디버깅 어려움 |

### 1.2 경기 데이터 영구 고정 문제

```
사용자가 전반 45분에 글 작성 → "현재 스코어: 0-0 | 상태: HT"
                ↓
        경기가 3-2로 종료
                ↓
게시글은 영원히 "0-0 | HT" 표시 ← 갱신 메커니즘 없음
```

**이것이 가장 심각한 설계 결함**

---

## 2. 다중 렌더링 경로 (Spaghetti Architecture)

현재 매치카드를 렌더링하는 경로가 **4개** 존재:

```
┌─────────────────────────────────────────────────────────────────┐
│                    렌더링 경로 1: 저장 시점                       │
│  create.ts → processMatchCardsInContent() → HTML 생성           │
│  위치: posts/utils.ts                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    렌더링 경로 2: 조회 시점                       │
│  PostContent.tsx → querySelectorAll('[data-type="match-card"]') │
│  → data-match 추출 → JSON 디코드 → HTML 재생성                   │
│  위치: PostContent.tsx (200줄 이상의 폴백 로직)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    렌더링 경로 3: 에디터                          │
│  TipTap MatchCardExtension → ReactNodeViewRenderer              │
│  → MatchCardNode.tsx → MatchCard.tsx                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    렌더링 경로 4: 유틸리티                        │
│  matchCardRenderer.ts → renderMatchCard()                       │
│  (PostContent.tsx에서 호출)                                     │
└─────────────────────────────────────────────────────────────────┘
```

**왜 문제인가?**
- 한 곳을 수정하면 다른 곳과 불일치
- 버그 발생 시 어디서 발생했는지 추적 어려움
- 테스트 불가능한 구조

---

## 3. 코드 스멜 (Code Smells)

### 3.1 정규식 기반 역직렬화
```typescript
// PostContent.tsx - HTML을 파싱해서 JSON 추출
const matchCardRegex = /<div[^>]*data-type="match-card"[^>]*data-match="([^"]*)"[^>]*>/g;
```
→ HTML 구조가 바뀌면 즉시 깨짐

### 3.2 전역 함수 등록
```typescript
// PostContent.tsx
window.handleMatchCardHover = function(element, isEnter) { ... }

// HTML에서 호출
onmouseenter="window.handleMatchCardHover(this, true)"
```
→ React 패턴 위반, XSS 취약점

### 3.3 God Component
`PostContent.tsx`: **1,380줄**
- HTML 정화 로직
- 다중 렌더링 경로
- 다크모드 이미지 교체
- 호버 효과 MutationObserver
- 차트 렌더링 (동적 React root)

→ 단일 책임 원칙 완전 위반

### 3.4 타입 불일치
```typescript
// 4곳에서 각각 다르게 정의
MatchCardExtension.ts  → interface MatchData { ... }
MatchCard.tsx          → interface MatchData { ... }  // 다른 구조
match.ts               → interface MatchData { ... }  // 또 다른 구조
matchCardRenderer.ts   → Record<string, unknown>      // 타입 없음
```

---

## 4. 현대적 접근 방식과 비교

### 현재 방식 (Anti-Pattern)
```
저장: TipTap JSON → HTML 문자열 → DB
조회: DB → HTML 문자열 → DOM 파싱 → JSON 추출 → HTML 재생성
```

### 올바른 방식
```
저장: { type: "matchCard", matchId: "12345" } → DB
조회: DB → matchId로 API 조회 → React Component 렌더링
```

### React Server Components 활용 시
```
저장: matchId만 저장
조회: 서버에서 최신 경기 데이터 fetch → RSC로 렌더링 → 클라이언트 전송
```

---

## 5. 재구축 방향

### Option A: 점진적 개선 (권장하지 않음)

기존 구조 유지하면서 패치
- 렌더러 통합
- 타입 통합
- 폴백 로직 제거

**문제**: 근본적인 "데이터 갱신 불가" 문제 해결 안됨

### Option B: 데이터 구조 재설계 (권장)

**Step 1: 저장 형식 변경**
```typescript
// 현재
posts.content = "<div class='match-card'>...</div>"

// 변경 후
posts.content = {
  type: "doc",
  content: [
    {
      type: "matchCard",
      attrs: {
        matchId: "1379129",      // ID만 저장
        cachedScore: "2-1",      // 캐시 (초기 렌더링용)
        cachedStatus: "FT",
        cachedAt: "2025-12-24T10:00:00Z"
      }
    }
  ]
}
```

**Step 2: 렌더링 시점에 데이터 조회**
```typescript
// MatchCard.tsx (Server Component)
async function MatchCard({ matchId, cachedData }: Props) {
  // 캐시가 5분 이상 지났으면 API에서 최신 데이터 조회
  const freshData = await getMatchData(matchId);

  return (
    <div className="match-card">
      <Score home={freshData.goals.home} away={freshData.goals.away} />
      <Status code={freshData.status.code} />
    </div>
  );
}
```

**Step 3: 단일 렌더러**
```typescript
// shared/components/MatchCard.tsx - 유일한 매치카드 컴포넌트
export function MatchCard({ matchId }: { matchId: string }) {
  // 에디터, 저장, 조회 모두 이 컴포넌트 사용
}
```

---

## 6. 구현 로드맵

### Phase 1: 타입/유틸리티 통합 (1일)
- [ ] `shared/types/matchCard.ts` 생성
- [ ] `shared/utils/matchCard.ts` 생성 (상태 코드, 이미지 URL)
- [ ] 기존 중복 코드 → import로 교체

### Phase 2: 렌더러 단일화 (2일)
- [ ] `shared/components/MatchCard.tsx` 생성
- [ ] TipTap NodeView에서 사용
- [ ] PostContent에서 사용
- [ ] 기존 matchCardRenderer.ts 제거

### Phase 3: 저장 형식 변경 (3일)
- [ ] TipTap Extension 수정 (matchId만 저장)
- [ ] processMatchCardsInContent 수정 (HTML 생성 제거)
- [ ] 마이그레이션 스크립트 (기존 게시글)

### Phase 4: 실시간 데이터 (선택)
- [ ] API 엔드포인트: `GET /api/match/:id`
- [ ] 클라이언트 캐시 (React Query)
- [ ] 경기 진행 중이면 자동 갱신

---

## 7. 결론

| 항목 | 리팩토링 전 | 리팩토링 후 |
|------|------------|------------|
| 저장 형식 | HTML 문자열 | TipTap JSON (matchCard 노드) ✅ |
| 렌더러 개수 | 4개 | 1개 (통합 함수) ✅ |
| 타입 정의 | 4곳 | 1곳 (shared/types) ✅ |
| 유틸리티 | 3곳 중복 | 1곳 (shared/utils) ✅ |
| PostContent.tsx | 중복 matchCard 처리 | 단일 처리 ✅ |

**완료된 개선:**
- 타입/유틸리티 통합으로 유지보수성 향상
- 렌더러 단일화로 일관성 확보
- TipTap JSON 직접 저장으로 HTML 변환 제거
- 중복 코드 제거로 코드량 감소

**선택적 추가 개선 (필요 시):**
- matchId만 저장 + API 조회 → 실시간 데이터 갱신
- React Server Component → 초기 로딩 성능 개선
