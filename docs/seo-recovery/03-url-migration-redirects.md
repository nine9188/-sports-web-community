# 03. URL 구조 변경과 redirect 점검

## 현재 상황

기존 URL에서 slug URL로 대규모 변경되었습니다.

예상 흐름:

- old URL 제거는 빠르게 진행됨
- new URL 신뢰 이전은 아직 충분히 완료되지 않음
- 일부 old URL이 404, 홈 redirect, redirect chain, query redirect로 흩어졌을 가능성 있음

## 좋은 redirect 형태

```txt
old-url 301/308 exact-new-url 200
```

## 위험한 형태

```txt
old-url 301 /
old-url 404
old-url 301 intermediate-url 301 new-url
old-url 200 but canonical different
old-url blocked by robots before redirect 확인
```

## 작업 필요

- old URL 샘플 100~500개 수집
- 게시글 / 선수 / 팀 / 경기 / 게시판 목록별로 분리
- redirect 결과를 표로 검증
- 301/308 location이 exact canonical URL인지 확인
- redirect chain 여부 확인
- 404로 빠지는 old URL 비율 확인

## 검증 표 예시

```txt
old_url,status_1,location_1,status_2,final_url,result
/old/post/123,301,/boards/news/123,200,/boards/news/123,OK
/old/player/55,301,/,200,/,BAD_HOME_REDIRECT
/old/team/9,404,,,/old/team/9,BAD_404
```

## 목표

Google이 기존 신호를 새 slug URL로 이전할 수 있게 old URL을 정확한 새 URL로 연결해야 합니다.
