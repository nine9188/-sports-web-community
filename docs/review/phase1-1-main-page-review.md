# Phase 1.1 메인 페이지 코드 리뷰

> 리뷰 일시: 2024-12-23
> 마지막 업데이트: 2025-12-23
> 리뷰어: Claude Code

## 개요

메인 페이지(`src/app/page.tsx`)와 관련 위젯 컴포넌트 6개를 코드 리뷰했습니다.

## 파일별 분석 결과

### 1. page.tsx (메인 페이지)

| 항목 | 내용 |
|------|------|
| **경로** | `src/app/page.tsx` |
| **줄 수** | 27줄 |
| **평가** | ✅ 우수 |

#### 장점
- 매우 깔끔하고 간결한 구조
- 컴포넌트 분리가 잘 되어있음
- 서버 컴포넌트로 작성되어 있음

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 | 상태 |
|--------|------|------|------|------|
| ✅ 해결 | 인라인 스타일 중복 | 8, 10번 줄 | `style={{ overflow: 'visible' }}` → `overflow-visible` | 완료 |

#### 개선 완료
```tsx
// Before
<main className="bg-transparent space-y-4" style={{ overflow: 'visible' }}>
  <div className="bg-transparent" style={{ overflow: 'visible' }}>

// After (Tailwind 사용) ✅
<main className="bg-transparent space-y-4 overflow-visible">
  <div className="bg-transparent overflow-visible">
```

---

### 2. BoardQuickLinksWidget

| 항목 | 내용 |
|------|------|
| **경로** | `src/domains/widgets/components/board-quick-links-widget/BoardQuickLinksWidget.tsx` |
| **줄 수** | 97줄 |
| **평가** | ✅ 우수 |

#### 장점
- 타입 정의가 명확함 (`QuickLinkItem`, `BoardQuickLinksWidgetProps`)
- 접근성 고려 (`aria-label`)
- 모바일/데스크톱 반응형 잘 구현됨
- 기본값 설정으로 유연한 사용 가능

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 | 상태 |
|--------|------|------|------|------|
| 🟡 낮음 | classNames 함수 중복 | 28-30번 줄 | 프로젝트에 이미 `cn` 유틸이 있다면 재사용 권장 | 유지 |
| ✅ 해결 | 불필요한 빈 줄 | index.ts | 파일 끝에 빈 줄 15개 → 제거됨 | 완료 |

---

### 3. LiveScoreWidgetV2 ✅ 타입 분리 완료

| 항목 | 내용 |
|------|------|
| **경로** | `src/domains/widgets/components/live-score-widget/` |
| **파일** | `LiveScoreWidgetV2.tsx` (232줄), `LiveScoreWidgetV2Server.tsx` (92줄), `types.ts` (29줄) |
| **평가** | ✅ 우수 |

#### 장점
- 서버/클라이언트 컴포넌트 분리 잘 됨
- 리그별 접기/펼치기 UX 좋음
- 에러 처리 및 빈 상태 처리 있음
- `ApiSportsImage` 공통 컴포넌트 활용

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 | 상태 |
|--------|------|------|------|------|
| ✅ 해결 | 타입 중복 정의 | Client, Server | `types.ts`로 공통 타입 분리 | 완료 |

#### 개선 완료

**새 파일 구조:**
```
live-score-widget/
├── index.ts                    # export
├── types.ts                    # 공통 타입 (Team, Match, League, Props) ✅ NEW
├── LiveScoreWidgetV2.tsx       # 클라이언트 컴포넌트 (232줄)
└── LiveScoreWidgetV2Server.tsx # 서버 컴포넌트 (92줄)
```

---

### 4. BoardCollectionWidget ⚠️

| 항목 | 내용 |
|------|------|
| **경로** | `src/domains/widgets/components/board-collection-widget/` |
| **파일** | `BoardCollectionWidget.tsx` (269줄), `BoardCollectionWidgetClient.tsx` (257줄), `types.ts` (33줄) |
| **평가** | ⚠️ 개선 필요 |

#### 장점
- 타입 파일 분리됨 (`types.ts`)
- 클라이언트 컴포넌트는 상대적으로 깔끔함
- 데스크톱/모바일 레이아웃 분리

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 |
|--------|------|------|------|
| 🔴 높음 | 서버 컴포넌트 너무 김 | BoardCollectionWidget.tsx | 269줄 - 데이터 로직과 컴포넌트가 혼재 |
| 🟠 중간 | N+1 쿼리 문제 | getBoardsData 함수 | 게시판마다 개별 쿼리 실행 (70-250번 줄) |
| 🟠 중간 | 타입 단언 사용 | 32, 49번 줄 | `as never`, `as unknown` 사용 |
| 🟡 낮음 | 사용 안 하는 쿼리 | 91-96번 줄 | `popularPosts` 쿼리가 `limit(0)`으로 설정됨 |

#### 구조 분석

```
BoardCollectionWidget.tsx (269줄)
├── 타입 정의 (11-22줄)
├── getBoardsData() 함수 (25-257줄)  ← 너무 김!
│   ├── 설정 조회 (31-51줄)
│   ├── 게시판 정보 조회 (56-66줄)
│   ├── Promise.all로 각 게시판 처리 (69-249줄)
│   │   ├── 하위 게시판 조회
│   │   ├── 최신 게시글 조회
│   │   ├── 인기 게시글 조회 (사용 안 함)
│   │   ├── 댓글 수 조회
│   │   ├── 게시판 정보 매핑
│   │   ├── 팀/리그 로고 조회
│   │   └── 데이터 포맷팅
│   └── 반환 (252줄)
└── 컴포넌트 (260-268줄)
```

#### 개선 제안

**1. 데이터 로직 분리**
```
board-collection-widget/
├── index.ts
├── types.ts
├── BoardCollectionWidget.tsx          # 서버 컴포넌트 (간단하게)
├── BoardCollectionWidgetClient.tsx    # 클라이언트
├── actions/
│   └── getBoardsData.ts               # 데이터 fetching 로직 분리
└── utils/
    └── formatPost.ts                  # 포맷팅 로직 분리
```

**2. 쿼리 최적화**
- 여러 게시판의 게시글을 한 번에 조회하도록 변경
- RPC 함수 사용 검토

---

### 5. AllPostsWidget ✅ 링크 수정 완료

| 항목 | 내용 |
|------|------|
| **경로** | `src/domains/widgets/components/AllPostsWidget.tsx` |
| **줄 수** | 60줄 |
| **평가** | ✅ 우수 |

#### 장점
- 매우 깔끔하고 간결한 구조
- 서버 컴포넌트로 데이터 직접 로드
- 에러 처리 UI 제공
- `PostList` 공통 컴포넌트 활용

#### 이슈
| 심각도 | 이슈 | 위치 | 설명 | 상태 |
|--------|------|------|------|------|
| ✅ 해결 | 하드코딩된 링크 | 23번 줄 | `/boards/soccer` → `/boards/all` 변경 | 완료 |

---

### 6. NewsWidget ✅ 리팩토링 완료

| 항목 | 내용 |
|------|------|
| **경로** | `src/domains/widgets/components/news-widget/` |
| **파일** | `NewsWidget.tsx` (24줄), `NewsWidgetClient.tsx` (302줄), `actions/`, `utils/` |
| **평가** | ✅ 리팩토링 완료 |

#### 리팩토링 결과

> **[📋 리팩토링 계획 문서](./refactoring-news-widget.md)** 참조

**리팩토링 전**
```
news-widget.tsx (242줄) - 타입, 유틸, 액션, 컴포넌트 혼재
news-widget-client.tsx (310줄)
```

**리팩토링 후**
```
news-widget/
├── types.ts                          # 공통 타입 (13줄)
├── NewsWidget.tsx                    # 서버 컴포넌트 (24줄) ← 90% 감소
├── NewsWidgetClient.tsx              # 클라이언트 (302줄)
├── actions/
│   └── getNewsPosts.ts               # 데이터 fetching (101줄)
└── utils/
    ├── extractImageFromContent.ts    # 이미지 추출 (127줄)
    └── validateImageUrl.ts           # URL 검증 (28줄)
```

#### 개선 완료 항목
- ✅ 이미지 추출 함수를 utils/로 분리
- ✅ 공통 타입을 types.ts로 통합
- ✅ 데이터 fetching을 actions/로 분리
- ✅ 파일명을 PascalCase로 통일

---

## 종합 평가

### 컴포넌트별 점수

| 컴포넌트 | 줄 수 | 복잡도 | 코드 품질 | 총평 |
|----------|-------|--------|-----------|------|
| page.tsx | 27 | 낮음 | ⭐⭐⭐⭐⭐ | 우수 |
| BoardQuickLinksWidget | 97 | 낮음 | ⭐⭐⭐⭐⭐ | 우수 |
| LiveScoreWidgetV2 | 386 | 중간 | ⭐⭐⭐⭐ | 양호 |
| BoardCollectionWidget | ~~559~~ **47** | ~~높음~~ **낮음** | ⭐⭐⭐⭐⭐ | ✅ 리팩토링 완료 |
| AllPostsWidget | 60 | 낮음 | ⭐⭐⭐⭐⭐ | 우수 |
| NewsWidget | ~~552~~ **24** | ~~높음~~ **낮음** | ⭐⭐⭐⭐⭐ | ✅ 리팩토링 완료 |

### 우선순위별 이슈

#### ~~🔴 높음 (반드시 개선)~~ ✅ 완료
1. ~~**BoardCollectionWidget 리팩토링**~~ ✅ 완료
   - ✅ 데이터 로직 분리
   - ✅ N+1 쿼리 최적화

#### ~~🟠 중간 (권장)~~ ✅ 완료
2. ~~**NewsWidget의 이미지 추출 함수 분리**~~ ✅ 완료
3. ~~**공통 타입 정리** (중복 제거)~~ ✅ 완료

#### ~~🟡 낮음 (선택)~~ ✅ 완료
4. ~~인라인 스타일을 Tailwind로 변경~~ ✅ 완료 (page.tsx)
5. ~~하드코딩된 링크 설정화~~ ✅ 완료 (AllPostsWidget: `/boards/all`)
6. ~~불필요한 빈 줄 정리~~ ✅ 완료 (BoardQuickLinksWidget/index.ts)
7. ~~LiveScoreWidgetV2 타입 중복~~ ✅ 완료 (`types.ts` 분리)

---

## 체크리스트 업데이트

| 항목 | 상태 | 비고 |
|------|------|------|
| 페이지 로딩 정상 | ✅ | 코드상 문제 없음 |
| 위젯 표시 | ✅ | 5개 위젯 정상 구성 |
| 코드 구조 | ✅ | 리팩토링 완료 (BoardCollectionWidget, NewsWidget) |
| 타입 정의 | ✅ | 중복 제거 완료, 타입 단언 제거 |
| 에러 처리 | ✅ | 각 위젯에 에러 처리 있음 |
| 다크모드 지원 | ✅ | 전체 dark: 클래스 적용됨 |
| 모바일 반응형 | ✅ | md: 브레이크포인트로 구현 |

---

## 다음 단계

1. [x] BoardCollectionWidget 리팩토링
   - **[📋 리팩토링 계획 문서](./refactoring-board-collection-widget.md)** ✅ 완료
2. [x] NewsWidget 리팩토링
   - **[📋 리팩토링 계획 문서](./refactoring-news-widget.md)** ✅ 완료
3. [ ] Phase 1.2 게시판 리뷰 진행

---

[← Phase 1 상세 문서](./phase1-core-user-flow.md) | [메인 체크리스트 →](../launch-review-checklist.md)
