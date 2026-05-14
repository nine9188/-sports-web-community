# 20. Notifications

대상 route:
- `/notifications`
- `src/app/(site)/notifications/layout.tsx`
- `src/app/(site)/notifications/page.tsx`
- `src/app/(site)/notifications/NotificationsPageClient.tsx`

관련 파일:
- `src/domains/notifications/actions/get.ts`
- `src/domains/notifications/actions/read.ts`
- `src/domains/notifications/actions/delete.ts`
- `src/domains/notifications/components/NotificationItem.tsx`
- `src/domains/notifications/hooks/useNotificationQueries.ts`
- `src/domains/auth/actions/auth.ts`
- `src/shared/utils/metadataNew.ts`

문서 작성 / 확인 기준:
- 이 문서는 UTF-8로 작성한다.
- 검증 명령은 bash 터미널 기준으로 기록한다.
- Windows PowerShell 전용 명령은 검증 절차에 넣지 않는다.
- 이번 20번은 코드 수정 없이 App Router SSR 관점의 검토 결과만 기록한다.

## 점검 기준

- 알림 route가 인증 사용자 전용으로 서버에서 보호되는지 확인한다.
- 알림 페이지가 검색 색인에서 제외되는지 확인한다.
- 초기 알림 목록과 unread count가 서버에서 준비되는지 확인한다.
- 필터, 타입, page 상태가 URL과 어떤 관계인지 확인한다.
- 알림 목록 전체가 불필요하게 큰 client boundary 안에 있지 않은지 확인한다.
- mark read / delete 같은 변경 작업이 Server Action으로 처리되는지 확인한다.
- 내부 링크에 `prefetch={false}`가 적용되는지 확인한다.
- route segment에 `loading.tsx`가 없는지 확인한다.

## 발견한 문제

### 1. layout과 page가 인증 조회를 중복 수행한다

`notifications/layout.tsx`는 `getCurrentUser()`로 로그인 여부를 확인한다.
그 다음 `notifications/page.tsx`는 `getNotifications(100)`을 호출하고, 이 함수 내부에서 다시 `supabase.auth.getUser()`를 호출한다.

같은 요청에서 인증 사용자 조회가 반복된다.
알림 route는 사용자별 동적 페이지라 캐시를 크게 적용하기 어렵지만, 요청 단위로 현재 사용자 조회를 공유하는 구조가 더 낫다.

### 2. 알림 목록을 최대 100개만 가져오고 나머지는 접근할 수 없다

page는 `getNotifications(100)`으로 최근 100개만 가져온 뒤 client에서 15개씩 페이지네이션한다.

문제는 다음과 같다.
- 101번째 이후 알림은 UI에서 볼 수 없다.
- page 이동이 서버 쿼리와 연결되지 않는다.
- 알림이 많은 사용자일수록 첫 요청 payload가 커진다.

`?page=2&type=comment&filter=unread` 같은 URL 상태를 서버에서 읽고 필요한 범위만 조회하는 구조가 더 맞다.

### 3. 필터 / 타입 / page 상태가 client state에만 있다

`NotificationsPageClient`는 다음 상태를 모두 client state로 관리한다.

- `filter`: all / unread
- `typeFilter`: 알림 타입
- `currentPage`

새로고침하면 상태가 사라지고, 서버는 현재 사용자가 어떤 알림 범위를 보려는지 알 수 없다.
검색 노출 대상은 아니므로 SEO 문제는 작지만, App Router SSR 구조와는 맞지 않는다.

### 4. 페이지 전체가 큰 client boundary다

`NotificationsPageClient` 안에 다음이 모두 들어 있다.

- 제목 / unread count header
- 타입 dropdown
- 전체 / 읽지 않음 탭
- 선택 삭제 / 전체 읽음 toolbar
- 알림 목록
- 빈 상태
- pagination

실제 client가 필요한 부분은 선택 상태, dropdown, mark read, delete 정도다.
초기 목록의 정적 행 렌더링과 header 일부는 server shell로 분리할 수 있다.

### 5. mark read 실패가 사용자에게 표시되지 않는다

`handleMarkAsRead()`와 `handleMarkAllAsRead()`는 server action 실패 시 별도 오류를 표시하지 않는다.
삭제 실패만 `alert()`로 알린다.

알림 변경 작업은 사용자에게 즉시 반영되는 UI라 실패 시 toast나 상태 복구가 필요하다.

### 6. page error가 200 fallback UI로 반환된다

`getNotifications()`가 실패하면 page는 `initialError`를 넘기고 client component가 오류 문구를 표시한다.
인증 사용자 전용 도구라 검색 영향은 작지만, 실제 서버 오류가 route error boundary로 가지 않는다.

예상 가능한 "알림 없음"과 서버 오류는 분리하는 편이 좋다.

## 확인 결과

- `/notifications` page 자체는 Server Component다.
- route layout에서 로그인하지 않은 사용자는 `/signin?redirect=/notifications...`로 redirect한다.
- `generateMetadata()`는 layout에 있고 `noindex: true`를 넣는다.
- page는 서버에서 초기 알림 목록과 unread count를 가져온 뒤 client component에 props로 넘긴다.
- mark read, mark all read, delete selected는 Server Action을 호출한다.
- `NotificationItem`의 내부 알림 링크는 `prefetch={false}`를 사용한다.
- 대상 route 아래에 별도 `loading.tsx`는 없다.

## 후속 수정 후보

### 1. 서버 페이지네이션으로 전환

`searchParams`에서 `page`, `filter`, `type`을 읽고 서버에서 필요한 알림만 조회한다.
기본 URL은 `/notifications`, 상태 URL은 `noindex` 유지로 충분하다.

### 2. 인증 사용자 조회 공유

layout에서 확인한 user를 page 데이터 조회와 공유하거나, 현재 사용자 조회 함수를 React `cache()`로 묶는다.

### 3. client boundary 축소

다음 방향이 적절하다.
- server: header, count, 현재 page 알림 목록, 빈 상태
- client: 선택 상태, dropdown, 읽음 / 삭제 액션 버튼

### 4. mutation 실패 처리 보강

mark read / mark all read 실패 시 toast나 inline error를 표시한다.
optimistic update를 적용한다면 실패 시 원상 복구 기준도 둔다.

### 5. 서버 오류 처리 분리

인증 실패, 알림 없음, DB 오류를 분리한다.
DB 오류는 route error boundary로 보내고, 알림 없음만 정상 빈 상태로 렌더링한다.

## 검증

문서 작성 후 bash 기준으로 다음 명령으로 UTF-8을 확인한다.

```bash
file -bi docs/app-router-review/results/20-notifications.md
iconv -f UTF-8 -t UTF-8 docs/app-router-review/results/20-notifications.md >/dev/null && echo "utf-8 ok"
```

코드 수정은 하지 않았으므로 이 문서 작성만으로 `npm run typecheck`나 `npm run build`가 새로 검증해야 할 변경 사항은 없다.

## 결론

20번 알림 route는 인증 보호, noindex, 초기 서버 데이터 준비가 되어 있다.
다만 알림 목록을 100개로 잘라 client pagination하는 구조와 큰 client boundary가 핵심 개선 대상이다.

우선순위는 서버 페이지네이션, URL 기반 filter/type/page 상태, 인증 조회 중복 제거, mutation 실패 처리 보강이다.
