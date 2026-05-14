# 22. Emoticon studio

대상 route:
- `/shop/emoticon-studio`
- `src/app/(site)/shop/emoticon-studio/page.tsx`
- `src/app/(site)/shop/emoticon-studio/EmoticonStudioClient.tsx`

관련 파일:
- `src/domains/shop/components/emoticon-studio/StudioTabs.tsx`
- `src/domains/shop/components/emoticon-studio/SubmitForm.tsx`
- `src/domains/shop/components/emoticon-studio/MyEmoticonList.tsx`
- `src/domains/shop/components/emoticon-studio/SuspendedList.tsx`
- `src/domains/shop/components/emoticon-studio/GuideSection.tsx`
- `src/domains/shop/hooks/useEmoticonStudio.ts`
- `src/domains/shop/actions/emoticon-submissions.ts`
- `src/domains/shop/types/emoticon-submission.ts`
- `src/shared/utils/metadataNew.ts`

문서 작성 / 확인 기준:
- 이 문서는 UTF-8로 작성한다.
- 검증 명령은 bash 터미널 기준으로 기록한다.
- Windows PowerShell 전용 명령은 검증 절차에 넣지 않는다.
- 이번 22번은 코드 수정 없이 App Router SSR 관점의 검토 결과만 기록한다.

## 점검 기준

- 이모티콘 스튜디오 page가 Server Component인지 확인한다.
- 사용자 전용 작성 / 신청 route가 서버에서 보호되는지 확인한다.
- metadata / robots 정책이 상점 공개 페이지와 분리되어 있는지 확인한다.
- `tab` query가 서버에서 정규화되는지 확인한다.
- `useSearchParams()` 사용 범위가 적절한지 확인한다.
- 내 신청 / 판매중지 목록 초기 데이터가 서버에서 준비되는지 확인한다.
- 업로드와 submit 흐름에서 실패 시 orphan file이 남지 않는지 확인한다.
- 내부 이동에 `prefetch={false}`가 적용되는지 확인한다.
- route segment에 `loading.tsx`가 없는지 확인한다.

## 발견한 문제

### 1. 사용자 전용 기능인데 route-level 인증 guard가 없다

`/shop/emoticon-studio` page는 바로 `EmoticonStudioClient`를 반환한다.
route 진입 시 서버에서 로그인 여부를 확인하지 않는다.

`SubmitForm`에서 브라우저 Supabase client로 user를 확인하고, `submitEmoticonPack()` server action도 다시 user를 확인하기는 한다.
하지만 페이지 자체는 비로그인 사용자에게도 열리고, "내 이모티콘" / "신고·중지" 탭도 mount 이후 빈 목록처럼 보일 수 있다.

작성 / 신청 도구 성격이면 page 또는 layout 수준에서 `/signin?redirect=/shop/emoticon-studio`로 보호하는 편이 맞다.

### 2. metadata에 `noindex`가 없다

`page.tsx`의 `generateMetadata()`는 `path: '/shop/emoticon-studio'`를 넣지만 `noindex`를 넣지 않는다.

이 route는 공개 상품 listing이 아니라 사용자 신청 도구다.
상점 공개 페이지와 달리 검색 색인 대상이 아니므로 `noindex`를 명시해야 한다.

### 3. page가 거의 전체를 client component로 넘긴다

`EmoticonStudioPage`는 서버에서 데이터를 준비하지 않고 `EmoticonStudioClient`만 반환한다.
그 아래에서 header, tab, submit form, 내 신청 목록, 판매중지 목록, guide가 모두 client component다.

실제 client가 필요한 부분:
- 파일 선택 / preview
- upload 진행 상태
- form 입력
- 신청 취소
- accordion interaction

서버로 둘 수 있는 부분:
- header shell
- 현재 tab 정규화
- guide의 기본 본문
- 내 신청 / 판매중지 초기 목록

### 4. `useSearchParams()`가 route 최상위 client component에 있다

`EmoticonStudioClient`와 `StudioTabs` 모두 `useSearchParams()`를 사용한다.
현재 page는 별도 `Suspense` 경계 없이 client component를 직접 반환한다.

Next App Router에서 `useSearchParams()`를 쓰는 client subtree는 CSR bailout과 관련이 있다.
서버 page에서 `searchParams`를 받아 tab을 정규화하고, 필요한 client island에 prop으로 넘기는 구조가 더 안전하다.

### 5. `tab` query 정규화가 없다

현재 tab은 다음처럼 읽는다.

```ts
const currentTab = (searchParams.get('tab') as StudioTab) || 'submit';
```

문제 사례:
- `/shop/emoticon-studio?tab=abc`
- `/shop/emoticon-studio?tab=`

이 경우 어느 탭 콘텐츠도 렌더링되지 않을 수 있다.
서버에서 `submit | my | reports | guide`만 허용하고, 나머지는 기본 `submit`으로 정규화해야 한다.

### 6. 내 신청 / 판매중지 목록이 client mount 이후에만 조회된다

`MyEmoticonList`와 `SuspendedList`는 `useMySubmissions()`, `useMySuspendedSubmissions()` hook으로 mount 이후 server action을 호출한다.

그 결과:
- 첫 HTML에는 실제 목록이 없다.
- `tab=my`나 `tab=reports` 직접 진입도 서버에서 목록을 준비하지 않는다.
- 로그인하지 않은 사용자도 빈 목록처럼 보일 수 있다.

인증 route로 바꾼 뒤 현재 tab에 필요한 목록은 서버에서 먼저 조회하고, 취소 버튼 같은 mutation만 client island로 남기는 편이 맞다.

### 7. 파일 업로드가 server action 검증보다 먼저 실행되어 orphan file이 남을 수 있다

`SubmitForm`은 브라우저에서 storage에 썸네일과 이모티콘 파일을 먼저 업로드한다.
그 다음 `submitEmoticonPack()` server action을 호출한다.

server action에서 실패할 수 있는 조건:
- 로그인 세션 없음
- 정지된 계정
- 하루 신청 제한 초과
- 팩 이름 중복
- 입력값 검증 실패
- DB insert 실패

이 경우 이미 업로드된 파일이 storage에 남을 수 있다.
서버 검증을 먼저 수행하거나, 실패 시 업로드한 파일을 정리하는 보상 로직이 필요하다.

### 8. preview object URL을 revoke하지 않는다

`URL.createObjectURL()`로 썸네일과 이모티콘 preview를 만들지만, 제거 / 초기화 / unmount 시 `URL.revokeObjectURL()`을 호출하지 않는다.
여러 파일을 반복해서 고르면 브라우저 메모리가 누적될 수 있다.

### 9. 팩 이름 중복 체크가 입력마다 바로 server action을 호출한다

`useCheckPackName(packName)`은 이름 길이가 2자 이상이면 입력 변경마다 `checkPackNameDuplicate()`를 호출한다.
debounce가 없어 빠른 타이핑 시 server action 호출이 많아질 수 있다.

### 10. guide 본문 일부가 accordion 상태에 따라 기본 HTML에서 빠진다

`GuideSection`은 client accordion이고 첫 항목만 `defaultOpen`이다.
나머지 guide 본문은 클릭 전에는 렌더링되지 않는다.

이 route를 `noindex`로 둘 예정이면 SEO 문제는 작지만, SSR 원칙상 정적 가이드 본문은 서버에서 기본 HTML로 내려도 된다.

## 확인 결과

- `/shop/emoticon-studio` page 자체는 Server Component다.
- 하지만 page가 서버 데이터 없이 `EmoticonStudioClient`만 반환하므로 실제 화면 대부분은 client boundary다.
- metadata는 존재하지만 `noindex`가 없다.
- route-level 인증 guard가 없다.
- 상점으로 돌아가기 링크는 `prefetch={false}`를 사용한다.
- submit action은 서버에서 user, 정지 여부, 하루 신청 제한, 팩 이름 중복, 입력값을 다시 검증한다.
- 대상 route 아래에 별도 `loading.tsx`는 없다.

## 후속 수정 후보

### 1. route-level auth guard 추가

page 서버 컴포넌트에서 `authGuard({ redirectTo: '/signin?redirect=/shop/emoticon-studio' })` 형태로 보호한다.
정지 사용자의 처리 정책도 작성 / 신청 기능 기준으로 명확히 한다.

### 2. metadata `noindex` 추가

`buildMetadata()` 호출에 `noindex: true`를 추가한다.
이 route는 상점 sitemap에도 넣지 않는 것이 맞다.

### 3. 서버에서 tab 정규화

page가 `searchParams`를 받고 `tab`을 정규화한다.
정상 값이 아니면 `submit`으로 처리하거나 canonical 상태로 redirect한다.

### 4. `useSearchParams()` 범위 축소

`EmoticonStudioClient`가 searchParams를 직접 읽지 않게 하고, 서버에서 계산한 `currentTab`을 prop으로 넘긴다.
`StudioTabs`도 가능하면 `Link prefetch={false}` 기반으로 바꾼다.

### 5. 현재 tab 초기 데이터 서버 준비

`tab=my`이면 `getMySubmissions()`, `tab=reports`이면 `getMySuspendedSubmissions()`를 서버에서 먼저 호출한다.
취소 버튼과 mutation 후 refresh만 client island로 둔다.

### 6. 업로드 전 사전 검증 또는 실패 cleanup

업로드 전에 서버에서 신청 가능 여부를 먼저 확인한다.
또는 submit 실패 시 방금 업로드한 storage path들을 삭제하는 cleanup server action을 둔다.

### 7. object URL revoke

썸네일 / 이모티콘 preview 제거, form reset, component unmount 시 `URL.revokeObjectURL()`을 호출한다.

### 8. 팩 이름 중복 체크 debounce

300ms 정도 debounce를 두거나 blur 시 검사로 바꾼다.
서버 action의 최종 중복 검증은 유지한다.

### 9. guide server shell 분리

정적 가이드 본문은 Server Component로 렌더링하고, accordion 토글만 작은 client island로 둔다.

## 검증

문서 작성 후 bash 기준으로 다음 명령으로 UTF-8을 확인한다.

```bash
file -bi docs/app-router-review/results/22-emoticon-studio.md
iconv -f UTF-8 -t UTF-8 docs/app-router-review/results/22-emoticon-studio.md >/dev/null && echo "utf-8 ok"
```

코드 수정은 하지 않았으므로 이 문서 작성만으로 `npm run typecheck`나 `npm run build`가 새로 검증해야 할 변경 사항은 없다.

## 결론

22번 이모티콘 스튜디오는 page 파일 자체는 Server Component지만, 실제 기능은 거의 전부 client component에서 시작된다.
사용자 신청 도구인데 route-level 인증 guard와 `noindex`가 없는 점이 가장 크다.

우선순위는 auth guard 추가, `noindex` 추가, tab 정규화, `useSearchParams()` 범위 축소, 내 신청 / 판매중지 목록 SSR, 업로드 실패 cleanup이다.
