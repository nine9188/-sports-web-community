# PostContent.tsx 리팩토링 계획

> 작성일: 2024-12-23
> 상태: 🔄 1차 완료 (추가 작업 가능)

## 1. 현재 상태 분석

### 1.1 파일 정보
| 항목 | 내용 |
|------|------|
| **경로** | `src/domains/boards/components/post/PostContent.tsx` |
| **줄 수** | 1727줄 |
| **문제** | 단일 파일에 파싱, 렌더링, 스타일, 유틸리티 모두 혼재 |

### 1.2 현재 구조

```
PostContent.tsx (1727줄)
│
├── [1-51줄] 타입 정의
│   ├── TipTapNode, TipTapDoc
│   ├── RssPost
│   └── PostContentProps
│
├── [53-184줄] parseMatchStatsFromText() - 131줄
│   └── 경기 통계 텍스트 파싱 (정규식 기반)
│
├── [186-205줄] window.handleMatchCardHover 전역 함수
│
└── [207-1727줄] PostContent 컴포넌트 (~1520줄!)
    ├── processObjectContent() - RSS/TipTap 처리
    │   ├── RSS 게시글 처리
    │   ├── TipTap JSON 파싱
    │   ├── matchCard 노드 HTML 생성 (200줄+)
    │   ├── image/video 노드 처리
    │   └── paragraph/heading 노드 처리
    │
    ├── processHtmlContent() - HTML 처리
    │   ├── 이미지 태그 처리
    │   ├── 비디오 태그 처리
    │   └── iframe 처리 (YouTube, 소셜)
    │
    ├── useEffect들 - 소셜 미디어 스크립트 로딩
    │   ├── Twitter 임베드
    │   ├── Instagram 임베드
    │   └── 다크모드 이미지 처리
    │
    └── JSX 렌더링
```

---

## 2. 리팩토링 목표

### 2.1 정량적 목표
| 항목 | 현재 | 목표 |
|------|------|------|
| PostContent.tsx 줄 수 | 1727줄 | < 400줄 |
| 단일 함수 최대 줄 수 | 1520줄 | < 100줄 |

### 2.2 정성적 목표
- 파싱 로직과 렌더링 로직 분리
- 재사용 가능한 유틸리티 추출
- 테스트 용이성 향상
- 단일 책임 원칙 준수

---

## 3. 리팩토링 계획

### 3.1 새로운 파일 구조

```
components/post/
├── PostContent.tsx                   # 메인 컴포넌트 (간소화)
└── post-content/
    ├── index.ts                      # export
    ├── types.ts                      # 타입 정의
    ├── parsers/
    │   ├── index.ts
    │   ├── matchStatsParser.ts       # 경기 통계 파싱
    │   └── tipTapParser.ts           # TipTap JSON 파싱
    ├── renderers/
    │   ├── index.ts
    │   ├── RssContentRenderer.tsx    # RSS 콘텐츠 렌더러
    │   ├── TipTapRenderer.tsx        # TipTap 렌더러
    │   ├── MatchCardRenderer.tsx     # 매치 카드 렌더러
    │   └── SocialEmbedRenderer.tsx   # 소셜 미디어 임베드
    ├── hooks/
    │   ├── useSocialEmbeds.ts        # 소셜 미디어 훅
    │   └── useDarkModeImages.ts      # 다크모드 이미지 훅
    └── utils/
        ├── imageUtils.ts             # 이미지 URL 처리
        └── contentUtils.ts           # 콘텐츠 처리 유틸
```

### 3.2 단계별 작업

#### Step 1: 타입 분리
**파일:** `post-content/types.ts`
- TipTapNode, TipTapDoc 타입
- RssPost 타입
- PostContentProps 타입

#### Step 2: 경기 통계 파서 분리
**파일:** `post-content/parsers/matchStatsParser.ts`
- parseMatchStatsFromText 함수 (131줄)
- 관련 타입 정의

#### Step 3: 이미지 유틸리티 분리
**파일:** `post-content/utils/imageUtils.ts`
- getImageUrls 함수
- 다크모드 이미지 처리 로직

#### Step 4: 매치 카드 렌더러 분리
**파일:** `post-content/renderers/MatchCardRenderer.tsx`
- 매치 카드 HTML 생성 로직
- 호버 효과 관련 코드

#### Step 5: 소셜 미디어 훅 분리
**파일:** `post-content/hooks/useSocialEmbeds.ts`
- Twitter, Instagram 임베드 로직
- 스크립트 로딩 관리

#### Step 6: 메인 컴포넌트 간소화
**파일:** `PostContent.tsx`
- 분리된 모듈들을 import
- 조합하여 렌더링

---

## 4. 작업 체크리스트

- [ ] Step 1: types.ts 작성
- [x] Step 2: matchStatsParser.ts 작성 ✅ (2024-12-23 완료)
- [ ] Step 3: imageUtils.ts 작성
- [ ] Step 4: MatchCardRenderer.tsx 작성
- [ ] Step 5: useSocialEmbeds.ts 작성
- [ ] Step 6: PostContent.tsx 간소화
- [x] Step 7: 빌드 테스트 ✅ (1차 완료)

---

## 5. 우선순위

이 리팩토링은 큰 작업이므로 단계적으로 진행:

1. **1차 (필수)**: matchStatsParser.ts 분리 ✅ 완료 (-132줄)
2. **2차 (권장)**: imageUtils.ts 분리 (~50줄 감소)
3. **3차 (선택)**: MatchCardRenderer 분리 (~200줄 감소)
4. **4차 (추후)**: 나머지 리팩토링

---

## 6. 1차 리팩토링 결과 (2024-12-23)

### 6.1 생성된 파일

```
components/post/post-content/
├── parsers/
│   ├── index.ts                 # 2줄
│   └── matchStatsParser.ts      # 132줄
```

### 6.2 변경 사항

| 항목 | 변경 전 | 변경 후 | 감소 |
|------|---------|---------|------|
| PostContent.tsx | 1727줄 | 1595줄 | -132줄 |

### 6.3 분리된 내용

- `parseMatchStatsFromText()` 함수
- `TeamStats`, `BettingOdds`, `MatchStats` 타입
- 경기 통계 텍스트 파싱 로직 (정규식 기반)

### 6.4 빌드 테스트

✅ 성공

---

## 7. 참고

- PostContent.tsx는 콘텐츠 렌더링의 핵심 컴포넌트
- 리팩토링 중 기능 저하 없어야 함
- 빌드 테스트 필수

---

[← Phase 1.2 게시판 리뷰](./phase1-2-boards-review.md)
