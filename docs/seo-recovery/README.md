# 4590football SEO Recovery

작성일: 2026-05-16

이 폴더는 Search Console 색인 급락, sitemap 구조, URL query 중복, 서버 안정성 문제를 주제별로 나눈 작업 문서입니다.

## 읽는 순서

1. [현재 상황 요약](./01-current-status.md)
2. [서버 연결 실패와 Googlebot 안정성](./02-googlebot-server-stability.md)
3. [URL 구조 변경과 redirect 점검](./03-url-migration-redirects.md)
4. [sitemap 구조 재설계](./04-sitemap-structure.md)
5. [게시글 상세 query 정리](./05-board-detail-query-policy.md)
6. [robots.txt와 proxy 정책](./06-robots-proxy-policy.md)
7. [metadata와 SSR 병목](./07-metadata-ssr-performance.md)
8. [에이전트별 작업 분배](./08-agent-tasks.md)
9. [최종 검증 체크리스트](./09-verification-checklist.md)

## 핵심 결론

현재 상황은 SEO 설정 하나가 단독으로 잘못된 상태라기보다 다음 문제가 동시에 발생한 상태입니다.

```txt
대규모 URL 구조 변경
+ sitemap 구조 변경
+ 게시글 상세 query URL 중복
+ redirect 대량 발생
+ 서버 연결 실패 증가
+ Google 재평가 단계
```

우선순위는 다음과 같습니다.

1. Googlebot 서버 연결 실패 원인 제거
2. 게시글 상세 query URL 신규 생성 중단
3. `page` / `listPage` / `from` 중복 제거
4. old -> new redirect 품질 검사
5. root sitemap index 구조로 재설계
6. sitemap/robots 정적화 또는 강한 캐시 적용
7. `generateMetadata` fetch 최소화
8. SSR 외부 API 의존도 축소
9. Search Console에서 대표 sitemap 재제출
10. 색인 회복 모니터링
