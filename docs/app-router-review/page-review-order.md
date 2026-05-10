# 페이지 검토 순서

검토 전에 먼저 전체 `src/app` 라우트 인벤토리를 만든다.

검토 기준:
- 공개 페이지 먼저
- SEO 영향 큰 상세 페이지 우선
- 공통 layout 먼저
- 그 다음 탭/상태 URL
- 마지막에 인증, 사용자, 관리자, API route

## 0. 공통 기반

1. Root layout
   - `src/app/layout.tsx`
   - `src/app/RootLayoutProvider.tsx`
   - global metadata, global script, provider, analytics 확인

2. Site layout
   - `src/app/(site)/layout.tsx`
   - `src/app/(site)/SiteLayoutClient.tsx`
   - 공통 shell, sidebar, user data, Suspense 범위 확인

3. Auth layout
   - `src/app/(auth)/layout.tsx`
   - 인증 페이지 공통 shell 확인

4. Admin layout
   - `src/app/admin/layout.tsx`
   - 관리자 shell, client boundary 확인

## 1. 공개 핵심 페이지

5. 홈
   - `/`
   - `src/app/(site)/page.tsx`

6. 게시판 목록
   - `/boards/[slug]`
   - `/boards/all`
   - `/boards/popular`
   - hotdeal 계열 게시판

7. 게시글 상세
   - `/boards/[slug]/[postNumber]`
   - query 상태: `from`, `page`, `listPage`, `sort`

8. 라이브스코어 메인
   - `/livescore/football`

9. 매치 상세
   - `/livescore/football/match/[id]`
   - `/livescore/football/match/[id]/[slug]`
   - tab 상태: `power`, `events`, `lineups`, `stats`, `standings`, `support`

10. 팀 상세
    - `/livescore/football/team/[id]`
    - `/livescore/football/team/[id]/[slug]`

11. 선수 상세
    - `/livescore/football/player/[id]`
    - `/livescore/football/player/[id]/[slug]`

12. 리그 상세
    - `/livescore/football/leagues`
    - `/livescore/football/leagues/[id]`
    - `/livescore/football/leagues/[id]/[slug]`

13. 이적시장
    - `/transfers`
    - `/transfers/team/[id]`
    - `/transfers/team/[id]/[slug]`

14. 검색
    - `/search`
    - query 상태: 검색어, 타입, 정렬, 페이지

15. 공개 유저 페이지
    - `/user/[publicId]`
    - tab 상태: 작성글, 댓글 등

16. 상점 공개 페이지
    - `/shop`
    - `/shop/[category]`

17. 정적/안내 페이지
    - `/about`
    - `/contact`
    - `/guide`
    - `/privacy`
    - `/terms`

## 2. 작성 / 수정 / 상호작용 페이지

18. 게시글 작성
    - `/boards/[slug]/create`

19. 게시글 수정
    - `/boards/[slug]/[postNumber]/edit`

20. 알림
    - `/notifications`

21. 설정
    - `/settings`
    - `/settings/profile`
    - `/settings/password`
    - `/settings/phone`
    - `/settings/points`
    - `/settings/exp`
    - `/settings/icons`
    - `/settings/my-posts`
    - `/settings/my-comments`
    - `/settings/account-delete`

22. 이모티콘 스튜디오
    - `/shop/emoticon-studio`

## 3. 인증 페이지

23. 로그인 / 회원가입
    - `/signin`
    - `/signup`
    - `/social-signup`

24. 계정 도움말
    - `/help/find-id`
    - `/help/find-password`
    - `/help/reset-password`
    - `/help/account-found`
    - `/help/account-recovery`

25. 인증 완료 / 환영
    - `/auth/confirmed`
    - `/auth/welcome`

## 4. 관리자 페이지

26. 관리자 홈
    - `/admin`

27. 관리자 게시판 / 사용자 / 공지
    - `/admin/boards`
    - `/admin/users`
    - `/admin/notices`

28. 관리자 신고 / 로그 / 알림
    - `/admin/reports`
    - `/admin/logs`
    - `/admin/notifications`

29. 관리자 포인트 / 경험치 / 예측
    - `/admin/points`
    - `/admin/exp`
    - `/admin/prediction`

30. 관리자 상점 / 이모티콘
    - `/admin/shop`
    - `/admin/emoticon-submissions`

31. 사이트 관리
    - `/admin/site-management`
    - `/admin/site-management/branding`
    - `/admin/site-management/seo-v2`
    - `/admin/site-management/ui-theme`

32. 캐시 / 위젯
    - `/admin/cache-management`
    - `/admin/cache-management/assets`
    - `/admin/cache-management/matches`
    - `/admin/widgets/board-collection`

## 5. API / 보조 엔드포인트

33. sitemap / robots / feed
    - `/sitemap.xml`
    - `/robots.txt`
    - `/rss.xml`
    - `/llms.txt`
    - `/ai.txt`

34. domain sitemap
    - board sitemap
    - post sitemap
    - livescore team/player/league/match sitemap
    - shop sitemap
    - transfers sitemap

35. API route
    - `/api/proxy-image`
    - `/api/sync-fixtures`
    - `/api/sync-highlights`

36. auth route handler
    - `/auth/callback`
    - `/auth/confirm`
    - `/auth/naver/callback`
    - `/auth/naver/complete`

## 6. 점검 결과 파일 규칙

결과는 `docs/app-router-review/results/`에 저장한다.

예시:
- `results/01-root-layout.md`
- `results/02-site-layout.md`
- `results/05-home.md`
- `results/07-post-detail.md`
- `results/09-match-detail.md`

