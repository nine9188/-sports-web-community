# SEO 개선 가이드

이 문서는 프로젝트의 SEO 개선 작업을 단계별로 정리한 가이드입니다.

## 현재 상태 요약

### 구현 완료
- [x] Root Metadata 동적 생성
- [x] OpenGraph & Twitter 카드
- [x] Sitemap 기본 구현
- [x] Robots.txt 기본 설정
- [x] 관리자 SEO 설정 UI
- [x] Web Manifest & Favicon

### 미구현 (작업 필요)
- [ ] 동적 페이지 메타데이터 (Post, Match, Team, Player)
- [ ] Robots.txt sitemap URL 추가
- [ ] Sitemap 동적 페이지 확장
- [ ] JSON-LD 구조화 데이터
- [ ] Canonical URL

## 단계별 구현 가이드

| 단계 | 작업 | 우선순위 | 문서 |
|------|------|---------|------|
| 1 | 동적 페이지 메타데이터 | 🔴 높음 | [step-1-dynamic-metadata.md](./step-1-dynamic-metadata.md) |
| 2 | Robots.txt & Sitemap 개선 | 🔴 높음 | [step-2-robots-sitemap.md](./step-2-robots-sitemap.md) |
| 3 | JSON-LD 구조화 데이터 | 🟡 중간 | [step-3-json-ld.md](./step-3-json-ld.md) |
| 4 | Canonical URL | 🟢 낮음 | [step-4-canonical-url.md](./step-4-canonical-url.md) |

## 예상 효과

1. **검색 노출 증가**: 게시글/경기/팀/선수 페이지가 검색 결과에 제대로 노출
2. **클릭률 향상**: 리치 스니펫으로 검색 결과에서 눈에 띄는 표시
3. **인덱싱 효율**: 크롤러가 모든 페이지를 효과적으로 수집
4. **중복 콘텐츠 방지**: canonical URL로 SEO 점수 분산 방지

## 관련 파일

```
src/
├── app/
│   ├── layout.tsx                    # Root metadata
│   ├── sitemap.ts                    # Sitemap 생성
│   ├── opengraph-image.png           # OG 이미지
│   └── boards/[slug]/[postNumber]/   # Post 페이지
├── domains/
│   └── seo/
│       └── actions/seoSettings.ts    # SEO 설정 액션
├── shared/
│   └── utils/metadataNew.ts          # 메타데이터 유틸
public/
├── robots.txt                        # Robots 설정
└── site.webmanifest                  # PWA 매니페스트
```
