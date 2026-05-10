# App Router SSR Review

이 폴더는 전체 페이지를 Next.js App Router SSR 기준으로 검토하기 위한 작업 공간입니다.

목표:
- 페이지별 SSR 구조 확인
- Server Component / Client Component 경계 확인
- metadata, canonical, robots, JSON-LD 확인
- prefetch 비사용 원칙 확인
- loading.tsx 비사용 원칙 확인
- hydration 범위 최소화 확인
- 중복 DB/API 호출과 중복 HTML 노출 확인

문서 구성:
- `checklist.md`: 전체 공통 점검 기준
- `page-review-order.md`: 페이지 검토 순서
- `results/`: 실제 페이지별 검토 결과 저장 위치

결과 파일 이름 규칙:
- `results/01-root-layout.md`
- `results/02-site-layout.md`
- `results/03-home.md`
- `results/04-boards-list.md`
- `results/05-post-detail.md`

원칙:
- 현재 기준 문서는 이 폴더 안에만 둔다.
- 시행착오 기록은 필요하면 `results/`가 아니라 별도 archive 문서로 분리한다.
- 같은 내용을 여러 docs에 중복 작성하지 않는다.

