# 06. robots.txt와 proxy 정책

## 현재 충돌

현재 robots.txt에는 다음 차단이 있습니다.

```txt
Disallow: /*?from=*
Disallow: /*?sort=*
```

동시에 proxy에서는 게시글 상세의 `from`, `sort`, `page`를 clean URL로 301 redirect합니다.

## 문제

- robots가 먼저 막으면 Google이 해당 URL의 301을 직접 확인하지 못할 수 있음
- redirect로 정리할 URL과 robots로 차단할 URL 정책이 섞임
- Search Console에는 robots blocked / duplicate / redirect URL이 같이 남을 수 있음

## 권장 정책

```txt
정리해야 하는 URL = redirect/canonical로 정리
크롤되면 안 되는 민감 URL = robots 차단
```

`from`, `sort`는 민감 URL이 아니라 중복 URL 정리 대상에 가깝습니다.

## 작업 순서

1. 내부에서 `from`, `sort`, `page` URL 생성을 먼저 중단
2. 기존 발견 URL은 301로 clean URL에 합치기
3. robots.txt에서 `from`, `sort` 차단 제거 검토

## 검증 기준

```txt
/boards/{slug}/{postNumber}?from=...
  -> 301 clean URL

/boards/{slug}/{postNumber}?sort=...
  -> 301 clean URL

/boards/{slug}/{postNumber}?page=...
  -> 301 clean URL
```

Google이 위 301을 볼 수 있어야 합니다.
