This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 환경변수 설정

이 프로젝트는 다음 환경변수를 사용합니다:

### 필수 환경변수

- `NEXT_PUBLIC_API_URL`: API 서버 주소 (예: `https://sports-web-community.vercel.app`)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키

### Vercel 배포 시 주의사항

1. **NEXT_PUBLIC_API_URL 설정**
   - Vercel 프로젝트 설정의 "Environment Variables" 섹션에서 설정
   - 값: `https://sports-web-community.vercel.app` (프로덕션 URL)
   - **중요**: URL에 특수문자(예: `@`)가 포함되지 않도록 주의해야 합니다.

2. **API 호출 문제 해결**
   - `NEXT_PUBLIC_API_URL`이 올바르게 설정되었는지 확인
   - 개발 환경과 프로덕션 환경에서의 URL이 일관되게 동작하는지 확인
   - 문제가 계속되면 Vercel 로그를 확인하여 오류 메시지 파악

## API URL 활용

코드에서 API URL을 사용할 때는 직접 환경변수를 참조하지 말고, `utils.ts`의 유틸리티 함수를 사용하세요:

```typescript
import { getAPIURL, getFullAPIURL, apiFetch } from '@/app/lib/utils';

// 기본 API URL 가져오기
const baseUrl = getAPIURL();

// 완전한 API 엔드포인트 URL 생성
const userEndpoint = getFullAPIURL('/api/users/123');

// API 요청 보내기
const data = await apiFetch('/api/posts');
```
