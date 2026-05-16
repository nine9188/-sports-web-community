# 01. 현재 상황 요약

## 핵심 증상

- 기존 약 3만 URL 색인 후 URL 구조 변경 이후 대부분 탈색인
- 현재 메인페이지 위주만 남는 수준
- URL 구조를 slug 기반으로 변경
- sitemap 구조도 함께 변경
- Search Console에서 서버 연결 실패 비율 약 8%대 확인
- 일부 URL은 새 sitemap으로 발견되지만 전체 색인 회복이 매우 느림
- 게시글 상세 URL에서 `page`, `from`, `listPage` query 정책이 섞여 있음
- Search Console에 redirect / duplicate / crawled not indexed URL이 대량 존재

## 확인된 Search Console export 기준

- 색인 URL은 2026-04-25 약 32,426개 수준
- 2026-04-28 약 49개 수준으로 급락
- 2026-05-09 이후 거의 1개 수준
- 비색인 URL은 42,000개 이상

## 주요 이슈

- `크롤링됨 - 현재 색인이 생성되지 않음`: 약 33,642
- `발견됨 - 현재 색인이 생성되지 않음`: 약 3,814
- `리디렉션 포함 페이지`: 약 3,023
- `사용자가 선택한 표준이 없는 중복 페이지`: 약 1,563
- 404: 약 256
- robots 차단: 약 172
- noindex: 약 120
- 5xx: 소량이지만 서버 연결 실패율은 별도 위험 신호

## 현재 판단

현재 상황은 단일 원인보다는 복합 문제에 가깝습니다.

```txt
대규모 URL 구조 변경
+ sitemap 구조 변경
+ 게시글 상세 query URL 중복
+ redirect 대량 발생
+ 서버 연결 실패 증가
+ Google 재평가 단계
```

따라서 sitemap만 고치거나 canonical만 고쳐서는 회복이 느릴 수 있습니다.
