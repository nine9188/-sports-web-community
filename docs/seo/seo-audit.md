# SEO 전체 감사 보고서

> 작성일: 2026-03-19
> 대상: 4590football.com

---

## 현재 상태

**기본기는 잘 갖춰져 있지만, 색인 범위와 구조화 데이터에서 성장 한계가 걸린 상태.**

### 잘 되어있는 것
- 루트 메타데이터 (title, description, OG, Twitter Card)
- `buildMetadata()` 유틸리티로 37개 페이지 메타데이터 설정
- robots.txt 적절한 크롤링 규칙
- 보안 헤더 (HSTS, X-Frame-Options 등)
- 구글/네이버 인증 완료
- PWA manifest 설정
- Canonical URL 자동 생성
- 스크립트 lazy loading (GA, AdSense)

### 문제점 요약

| 우선순위 | 문제 | 카테고리 | 현재 상태 |
|---------|------|---------|----------|
| **P0** | 사이트맵 불완전 | 색인 | 전체 URL의 80% 누락 |
| **P0** | 비공개 페이지 noindex 없음 | 색인 제어 | 19개 페이지 무방비 |
| **P0** | robots.txt 중복 | 운영 | 정적/동적 2개 공존 |
| **P1** | JSON-LD 구조화 데이터 없음 | 검색 이해도 | 문서만 있고 미구현 |
| **P1** | H1/title/canonical 비일관 | 페이지 구조 | 대부분 페이지에 h1 없음 |
| **P2** | force-dynamic 과다 사용 | 성능 | ISR 캐싱 불가 |
| **P2** | OG 이미지 단일 사용 | 공유 품질 | 모든 페이지 동일 이미지 |
| **P3** | 스포츠 스키마 미적용 | 장기 SEO | SportsEvent/Team/Person |

---

## P0 — 바로 해야 하는 것

### 1. 사이트맵 전체화

**현재 제일 먼저 고쳐야 할 문제.** 검색엔진에 "이 URL들이 존재한다"를 제대로 알리지 못하고 있음.

| 콘텐츠 | DB 전체 | 사이트맵 포함 | 누락률 |
|--------|---------|-------------|--------|
| 게시글 | 616 | 최대 1,000 | 0% (현재는 OK) |
| 팀 | 1,210 | 100 | **92%** |
| 선수 | 7,775 | **0** | **100%** |
| 리그 | 9 | 20 | 0% |
| 경기 예측 | 38 | **0** | **100%** |

**총 ~9,800개 URL 중 ~1,800개만 포함 → 80% 이상 누락**

> 사이트맵에 없다고 색인이 아예 안 되는 건 아님 (내부 링크로 일부 크롤링됨).
> 하지만 엔터티 수가 이 정도면 사이트맵은 필수 운영 인프라.

#### 해결: 사이트맵 인덱스

```
/sitemap.xml (인덱스)
├── /sitemaps/static.xml     → 정적 페이지 + 게시판 (~200개)
├── /sitemaps/posts.xml      → 게시글 전체
├── /sitemaps/teams.xml      → 팀 전체 (~1,210개)
├── /sitemaps/players.xml    → 선수 전체 (~7,775개)
└── /sitemaps/predictions.xml → 리그 + 경기 예측
```

#### 주의사항
- `lastModified` 정확히 넣기
- **색인해도 되는 URL만 포함** (필터 파라미터, 빈 검색결과, 로그인 필요 페이지 제외)
- canonical이 자기 자신을 가리키는 URL만 포함
- `export const revalidate = 3600` 설정 (현재 기본값 사용 중)

---

### 2. 비공개 페이지 noindex

robots.txt 차단만으로는 부족함. robots.txt로 차단하면 검색엔진이 페이지를 읽지 못해 `noindex` 태그도 못 보고, 외부/내부 링크만 보고 **제목/설명 없이 URL만 색인**될 수 있음.

#### 원칙
- 접근은 허용하되, 페이지에서 `noindex, follow` 설정
- 정말 민감한 페이지는 인증/권한으로 추가 보호

#### 대상

| 페이지 그룹 | 개수 | 조치 |
|------------|------|------|
| `/admin/*` | 11개 | `noindex: true` 메타데이터 추가 |
| `/settings/*` | 3개 | `noindex: true` 메타데이터 추가 |
| `/test/*` | 3개 | `noindex: true` 메타데이터 추가 |
| `/notifications` | 1개 | `noindex: true` 메타데이터 추가 |
| `/shop/emoticon-studio` | 1개 | 공개 페이지면 메타데이터 추가 |

---

### 3. robots.txt 중복 제거

`public/robots.txt` (정적, 도메인 하드코딩)와 `src/app/robots.ts` (동적, siteConfig 사용) 두 개 공존 중.

**조치**: `public/robots.txt` 삭제 → `robots.ts` 단일화

---

## P1 — 빨리 해야 하는 것

### 4. JSON-LD 구조화 데이터

구조화 데이터는 검색엔진이 페이지 의미를 더 정확히 이해하도록 돕고, 일부 페이지 유형에서는 리치 결과 노출 가능성을 높임.

> 주의: 구조화 데이터를 넣는다고 리치 결과가 보장되는 것은 아님.
> 특히 SportsTeam/Person은 구글이 자체 데이터를 우선하므로 즉각적 효과를 기대하기 어려움.

#### 가성비 최고 (먼저 구현)

| 스키마 | 위치 | 기대 효과 |
|--------|------|----------|
| `Organization` | `layout.tsx` (루트) | 사이트링크, 로고 노출 가능성 |
| `WebSite` + `SearchAction` | `layout.tsx` (루트) | 검색창 노출 가능성 |
| `BreadcrumbList` | 공통 유틸 | 빵크럼 경로 표시 |
| `Article` | 게시글 상세 | 작성자, 날짜, 썸네일 표시 |

#### 장기 확장 (P3에서)

| 스키마 | 위치 | 비고 |
|--------|------|------|
| `SportsEvent` | 경기 상세 | 리치 결과 보장 안 됨, 검색 이해도 향상 |
| `SportsTeam` | 팀 상세 | 동일 |
| `Person` | 선수 상세 | 동일 |

---

### 5. 공개 페이지 H1/title 일관화

H1 하나 없다고 SEO가 크게 무너지는 건 아니지만, 페이지의 대표 제목이 명확해야 검색엔진이 주제를 정확히 파악함. **치명적 결함이 아닌 기본기 누락.**

#### 기준
- 공개 페이지마다 **보이는 H1 하나**
- H1 내용과 `<title>` 핵심 키워드 일치
- 하위 섹션은 `h2`, `h3` 순서 유지
- 디자인상 숨겨야 하면 `sr-only` 사용 가능

#### 대상
- 게시판 목록: `<h1>자유게시판</h1>`
- 게시글 상세: `<h1>게시글 제목</h1>`
- 팀 페이지: `<h1>맨체스터 유나이티드</h1>`
- 선수 페이지: `<h1>손흥민</h1>`
- 경기 페이지: `<h1>리버풀 vs 아스널</h1>`

---

## P2 — 성능 + 확장성

### 6. force-dynamic 재검토

`force-dynamic`은 직접적인 SEO 문제라기보다 **성능/서버 비용/사용자 체감** 문제. 다만 TTFB/LCP에 간접 영향 → Core Web Vitals 점수에 미미한 영향 가능.

#### 페이지 성격별 분류

| 유형 | 전략 | 예시 |
|------|------|------|
| 정적/준정적 | ISR (`revalidate`) | 게시글 상세, 팀/선수 페이지 |
| 데이터 갱신형 | ISR + `revalidateTag` | 게시판 목록 |
| 실시간/개인화 | dynamic 유지 | 실시간 경기, 로그인 상태 의존 |

> 무조건 `revalidate = 3600`으로 바꾸면 안 됨. 페이지별 판단 필요.

---

### 7. OG 이미지 동적화

현재 모든 페이지가 동일한 `/og-image.png` 사용. 게시글 썸네일, 팀 로고 등 페이지별 OG 이미지를 생성하면 SNS 공유 시 클릭률 향상.

> 우선순위는 사이트맵/JSON-LD/noindex보다 뒤. 운영 퀄리티 개선 영역.

---

## P3 — 장기 개선

### 8. 스포츠 스키마 확장
- `SportsEvent` (경기), `SportsTeam` (팀), `Person` (선수)
- 넣을 가치는 있지만 리치 결과를 보장하진 않음
- P1의 Article/Organization/Breadcrumb 완성 후 진행

### 9. 이미지 최적화
- `<img>` 대신 무조건 `<Image>`를 쓰는 것이 목표가 아님
- 주요 이미지의 크기 안정성, 포맷 최적화, 우선순위 로딩을 일관되게 관리하는 것이 핵심

### 10. 실제 추적
- GSC에서 색인률/노출수/CTR 모니터링
- Core Web Vitals 세부 최적화
- 네이버 Search Advisor 색인 상태 확인

---

## 실행 체크리스트

### 1단계 (P0 - 즉시)
- [x] `public/robots.txt` 삭제 → `robots.ts` 단일화 (완료)
- [x] `/admin`, `/settings`, `/test`, `/ui`, `/notifications` noindex 확인 완료 (이미 설정됨)
- [x] 사이트맵 인덱스 구조로 전환 (완료: static/posts/matches/teams/players 5개 분리, 제한 해제, revalidate=3600)

### 2단계 (P1 - 1주일)
- [x] `layout.tsx`에 Organization + WebSite JSON-LD (완료: @graph로 통합, @id 연결, 홈페이지 중복 제거)
- [x] 게시글 상세 Article JSON-LD (이미 구현됨, publisher를 @id 참조로 개선)
- [x] 게시글 상세 BreadcrumbList (이미 구현됨, 수정 불필요)
- [x] 공개 페이지 H1 정리 (완료: 게시판 h2→h1, 상점 h3→h1, 이적시장 h1 추가, 매치 sr-only h1 추가, 홈 sr-only h1 추가)
- [x] 게시글/팀/선수/리그 메타데이터 확인 완료 (전부 generateMetadata 설정됨)

### 3단계 (P2 - 2주일)
- [ ] force-dynamic 페이지별 ISR 재설계 (`revalidateTag` 포함)
- [ ] OG 이미지 동적 생성
- [ ] 이미지 크기/포맷 최적화 점검

### 4단계 (P3 - 1개월)
- [x] SportsEvent/SportsTeam/Person/SportsOrganization 스키마 확장 (완료: 경기/팀/선수/리그 4개 페이지)
- [ ] GSC 색인률/노출수/CTR 추적 시작
- [ ] Core Web Vitals 세부 최적화

---

## 참고 도구

| 도구 | 용도 |
|------|------|
| Google Search Console | 색인/크롤링 모니터링 |
| Google Rich Results Test | JSON-LD 검증 |
| PageSpeed Insights | 성능 + Core Web Vitals |
| Schema.org Validator | 스키마 검증 |
| Naver Search Advisor | 네이버 SEO |

---

## 핵심 파일 위치

| 항목 | 파일 |
|------|------|
| 루트 메타데이터 | `src/app/layout.tsx` |
| 메타데이터 유틸 | `src/shared/utils/metadataNew.ts` |
| 사이트 설정 | `src/shared/config/site.ts` |
| 사이트맵 | `src/app/sitemap.ts` |
| robots (동적) | `src/app/robots.ts` |
| robots (정적) | `public/robots.txt` (삭제 대상) |
| JSON-LD 계획 | `docs/seo/step-3-json-ld.md` |
| Next.js 설정 | `next.config.js` |
