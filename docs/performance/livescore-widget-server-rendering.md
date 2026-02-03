# 위젯 서버 렌더링 최적화

## 목차
1. [LiveScoreWidgetV2](#livescorewidgetv2)
2. [TopicTabs (인기글)](#topictabs-인기글)
3. [HotdealTabs (핫딜 베스트)](#hotdealtabs-핫딜-베스트)

---

# LiveScoreWidgetV2

## 개요

LCP(Largest Contentful Paint) 성능 개선을 위해 LiveScoreWidgetV2를 서버 렌더링 방식으로 리팩토링.

## 변경 전 (문제)

```
LiveScoreWidgetV2Server.tsx (서버)
    ↓ 데이터만 전달
LiveScoreWidgetV2.tsx (클라이언트) ← 전체 UI 렌더링 ❌
```

**문제점:**
- 클라이언트에서 전체 UI 렌더링 → LCP 지연
- JS 하이드레이션 후에야 콘텐츠 표시
- SEO 약화 (크롤러가 빈 HTML 봄)

## 변경 후 (해결)

```
LiveScoreWidgetV2Server.tsx (서버)
├─ leagues.map()
│   └─ LeagueToggleClient (클라, 로컬 state)
│       ├─ LeagueHeader (서버 HTML)
│       └─ MatchCardServer (서버 HTML)
```

**개선점:**
- 서버에서 경기 목록 HTML 렌더링 → LCP 즉시
- 클라이언트는 펼침/접기 토글만 담당
- 초기 HTML에 콘텐츠 포함 → SEO 개선

## 파일 구조

```
live-score-widget/
├── index.ts                    # 진입점 (LiveScoreWidgetV2Server export)
├── types.ts                    # 타입 정의
├── LiveScoreWidgetV2Server.tsx # 서버 컴포넌트 (메인)
├── LeagueToggleClient.tsx      # 클라이언트 (토글만)
├── LeagueHeader.tsx            # 서버 (리그 헤더)
├── MatchCardServer.tsx         # 서버 (경기 카드)
└── WidgetHeader.tsx            # 서버 (위젯 타이틀)
```

## 핵심 설계 원칙

### 1. 리그별 로컬 state

```tsx
// ❌ 전역 Set으로 관리 (직렬화/비교 문제)
const [expandedIds, setExpandedIds] = useState(new Set(['league-1']));

// ✅ 각 리그가 독립적 로컬 state
function LeagueToggleClient({ defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
}
```

### 2. 서버 HTML 재조립 금지

```tsx
// ❌ children을 map 돌며 재구성
{React.Children.map(children, child => ...)}

// ✅ children 그대로 show/hide만
{expanded && children}
```

### 3. 초기 펼침 상태는 서버에서 결정

```tsx
// 서버에서 첫 번째 리그만 펼침 지정
<LeagueToggleClient defaultExpanded={index === 0}>
```

## 컴포넌트 역할

### LeagueToggleClient (클라이언트)

```tsx
'use client';

function LeagueToggleClient({ header, children, defaultExpanded, matchCount }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <>
      <Button onClick={() => setExpanded(!expanded)}>
        {header}
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </Button>
      {expanded && <div>{children}</div>}
    </>
  );
}
```

- 역할: 펼침/접기 상태만 관리
- 서버 HTML(header, children)을 그대로 사용
- DOM 재조립 없이 show/hide만 처리

### LeagueHeader (서버)

```tsx
function LeagueHeader({ league }) {
  return (
    <div>
      <UnifiedSportsImage imageId={league.leagueIdNumber} />
      <span>{league.name}</span>
    </div>
  );
}
```

- 역할: 리그 로고 + 이름 렌더링
- 서버에서 HTML 생성 → LCP에 포함

### MatchCardServer (서버)

```tsx
function MatchCardServer({ match, isLast }) {
  return (
    <Link href={`/livescore/football/match/${match.id}`}>
      {/* 경기 상태, 홈팀, 스코어, 원정팀 */}
    </Link>
  );
}
```

- 역할: 개별 경기 카드 렌더링
- 서버에서 HTML 생성 → SEO/LCP 개선

## 성능 영향

| 메트릭 | 전 | 후 | 개선 |
|--------|----|----|------|
| LCP | JS 실행 후 | 즉시 | ⬇️ ~1초 |
| 초기 HTML | 빈 껍데기 | 경기 목록 | ✅ |
| JS 번들 | 전체 렌더링 로직 | 토글만 | ⬇️ |
| 하이드레이션 | 무거움 | 가벼움 | ⬇️ |

## 제거된 기능

- "전체 펼치기/접기" 버튼
  - 이유: 각 리그가 독립적 로컬 state를 가지므로 복잡도 증가
  - 대안: 필요시 Context로 구현 가능

## 사용법

```tsx
// page.tsx (서버 컴포넌트)
import LiveScoreWidgetV2 from '@/domains/widgets/components/live-score-widget';

export default async function Page() {
  const data = await fetchLiveScoreData();

  return <LiveScoreWidgetV2 initialData={data} />;
}
```

## 관련 파일

- `src/app/(site)/page.tsx` - 메인 페이지에서 사용
- `src/domains/widgets/components/live-score-widget/` - 위젯 폴더

---

# TopicTabs (인기글)

## 변경 전
```
TopicTabsClient.tsx (클라이언트)
└─ 4개 탭 + 게시글 목록 전체 렌더링 ❌
```

## 변경 후
```
TopicTabsServer.tsx (서버)
├─ 헤더 (서버 렌더링)
└─ TopicTabToggleClient (클라이언트 - 탭 전환만)
    ├─ hotContent (서버 HTML)
    ├─ viewsContent (서버 HTML)
    ├─ likesContent (서버 HTML)
    └─ commentsContent (서버 HTML)
```

## 파일 구조
```
sidebar/components/
├── TopicTabsServer.tsx       # 서버 컴포넌트 (메인)
├── TopicTabToggleClient.tsx  # 클라이언트 (탭 전환만)
├── TopicPostItem.tsx         # 서버 (개별 게시글)
└── TabsClient.tsx.backup     # 기존 클라이언트 (백업)
```

---

# HotdealTabs (핫딜 베스트)

## 변경 전
```
HotdealTabsClient.tsx (클라이언트)
└─ pathname 체크 + 4개 탭 + 게시글 목록 전체 렌더링 ❌
```

## 변경 후
```
HotdealTabsServer.tsx (서버)
└─ HotdealTabToggleClient (클라이언트 - pathname 체크 + 탭 전환만)
    ├─ hotContent (서버 HTML)
    ├─ discountContent (서버 HTML)
    ├─ likesContent (서버 HTML)
    └─ commentsContent (서버 HTML)
```

## 파일 구조
```
sidebar/components/
├── HotdealTabsServer.tsx       # 서버 컴포넌트 (메인)
├── HotdealTabToggleClient.tsx  # 클라이언트 (pathname + 탭 전환)
├── HotdealPostItem.tsx         # 서버 (개별 핫딜)
└── HotdealTabsClient.tsx.backup # 기존 클라이언트 (백업)
```

## 특이사항
- `usePathname()` 체크가 필요하여 완전한 서버 컴포넌트 불가
- 하지만 게시글 목록 HTML은 서버에서 렌더링됨

---

## 공통 설계 원칙

### 1. 탭별 콘텐츠 사전 렌더링
```tsx
// 서버에서 4개 탭 모두 렌더링
<TabToggleClient
  hotContent={<PostList posts={data.hot} />}
  viewsContent={<PostList posts={data.views} />}
  ...
/>
```

### 2. 클라이언트는 show/hide만
```tsx
// 클라이언트에서 탭 전환 시 서버 HTML 그대로 표시
{activeTab === 'hot' && hotContent}
```

### 3. 서버에서 결정하는 기본값
```tsx
<TabToggleClient defaultTab="hot" />
```

---

## 날짜

- 2024-02-03: LiveScoreWidgetV2 서버 렌더링
- 2024-02-03: TopicTabs, HotdealTabs 서버 렌더링
