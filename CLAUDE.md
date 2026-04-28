# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 (App Router) sports community platform with live scores, boards, shop features, and AI chatbot integration. The project uses Supabase as the backend, TypeScript, and follows a domain-driven architecture.

**Main Project Location**: `123/1234/` (subdirectory structure)

## Tech Stack

- **Framework**: Next.js 15.3+ (App Router)
- **Database/Auth**: Supabase (SSR package `@supabase/ssr`)
- **State Management**: React Query (`@tanstack/react-query`), Zustand (via context)
- **Rich Text Editor**: Tiptap
- **UI Libraries**: Radix UI, Tailwind CSS, Framer Motion
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest (unit), Playwright (e2e)
- **AI Integration**: OpenAI SDK (`@ai-sdk/openai`)

## Development Commands

From the `123/1234` directory:

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build            # Production build
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Testing
npm run test             # Run Vitest in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright e2e tests
npm run test:e2e:ui      # Run e2e tests with UI
npm run test:all         # Run all tests (unit + e2e)
```

## Project Structure

The codebase follows a **domain-based architecture** with shared utilities:

```
123/1234/src/
├── app/                    # Next.js App Router pages & layouts
│   ├── boards/            # Community boards pages
│   ├── livescore/         # Live score pages
│   │   └── football/      # Football-specific live scores
│   ├── shop/              # Shop pages
│   ├── admin/             # Admin panel
│   ├── settings/          # User settings
│   ├── api/               # API routes (limited use, prefer server actions)
│   ├── layout.tsx         # Root layout
│   ├── RootLayoutClient.tsx  # Client-side root layout wrapper
│   └── globals.css        # Global styles
│
├── domains/               # Domain-specific business logic
│   ├── boards/           # Community boards domain
│   │   ├── actions/      # Server actions for boards
│   │   ├── components/   # Board-specific components
│   │   ├── hooks/        # Board-specific hooks
│   │   ├── types/        # Board types
│   │   └── utils/        # Board utilities
│   ├── auth/             # Authentication domain
│   ├── shop/             # Shop/commerce domain
│   ├── livescore/        # Live score domain
│   ├── chatbot/          # AI chatbot domain
│   ├── admin/            # Admin functionality
│   ├── search/           # Search functionality
│   ├── prediction/       # Match prediction features
│   └── [other domains]/
│
├── shared/               # Shared across all domains
│   ├── api/             # API clients
│   │   ├── supabase.ts  # Client-side Supabase client
│   │   └── supabaseServer.ts  # Server-side Supabase client
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Reusable hooks
│   ├── utils/           # Utility functions
│   ├── context/         # Global React contexts
│   ├── types/           # Shared types
│   └── ui/              # Base UI component system
│
└── types/               # Global type definitions
    └── supabase.ts      # Generated Supabase types
```

## Architecture Patterns

### 1. Server Actions Over API Routes

This project uses **Next.js Server Actions** instead of traditional API routes:

- Server actions are located in `domains/*/actions/` directories
- Each action file starts with `'use server'` directive
- Actions are imported directly in components/pages
- Use `revalidatePath()` or `revalidateTag()` for cache invalidation

**Example**:

```typescript
// domains/boards/actions/getBoards.ts
"use server";

import { createClient } from "@/shared/api/supabaseServer";

export async function getAllBoards() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("boards").select("*");

  if (error) throw new Error("Failed to fetch boards");
  return data;
}
```

### 2. Supabase Client Usage

**Two distinct Supabase clients**:

- **Client Components**: Use `createClient()` from `@/shared/api/supabase`

  ```tsx
  "use client";
  import { createClient } from "@/shared/api/supabase";

  const supabase = createClient();
  ```

- **Server Components/Actions**: Use `createClient()` from `@/shared/api/supabaseServer`

  ```tsx
  "use server";
  import { createClient } from "@/shared/api/supabaseServer";

  const supabase = await createClient();
  ```

### 3. Async Params Handling

**CRITICAL**: In Next.js 15 App Router, `params` are async and **must** be awaited:

```typescript
// ✅ Correct
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
}

// ❌ Wrong
export default async function Page({ params }: { params: { slug: string } }) {
  const slug = params.slug; // Will cause errors
}
```

This applies to:

- `page.tsx`
- `layout.tsx`
- `generateMetadata()`
- `generateStaticParams()`

### 4. Domain Organization

Each domain follows this structure:

- **actions/**: Server actions (`'use server'`)
- **components/**: Domain-specific React components
- **hooks/**: Domain-specific custom hooks
- **types/**: TypeScript types/interfaces
- **utils/**: Helper functions specific to the domain
- **index.ts**: Re-exports public API

### 5. Code Quality Principles

This project follows **Toss Frontend Guidelines** (see `.cursor/rules/toss-frontend-rules.mdc`):

**Readability**:

- Name magic numbers as constants
- Abstract complex logic into dedicated components
- Separate conditional rendering into distinct components
- Use named variables for complex boolean conditions

**Predictability**:

- Standardize return types (e.g., all React Query hooks return `UseQueryResult`)
- Use consistent validation patterns (discriminated unions)
- Avoid hidden side effects in functions

**Cohesion**:

- Organize code by feature/domain, not just by type
- Keep related logic close together
- Consider form-level vs field-level cohesion

**Coupling**:

- Avoid premature abstraction
- Use component composition over prop drilling
- Break down broad state management into focused hooks

## UI/Design Guidelines

### Color System

This project uses a consistent color system across all components. Always follow these patterns:

#### Brand Color — Klein Blue

4590 Football의 브랜드 컬러는 **Klein Blue**입니다. UI 전반에 걸쳐 primary 액션, 링크, 강조 요소에 이 색상을 사용합니다.

| 용도 | 라이트 모드 | 다크 모드 |
|------|------------|----------|
| **Primary (메인)** | `#002FA7` | `#3366CC` |
| **Soft BG (배지·버튼 배경)** | `#E6EAFB` | `rgba(0,47,167,0.2)` |
| **Soft Text (배지·보조 텍스트)** | `#001F78` | `#6690DD` |

**Tailwind 적용 패턴**:
- Primary 버튼: `bg-[#002FA7] dark:bg-[#3366CC] text-white`
- Outline 버튼/링크: `text-[#002FA7] dark:text-[#3366CC] border-[#002FA7] dark:border-[#3366CC]`
- Soft 배지: `bg-[#E6EAFB] dark:bg-[rgba(0,47,167,0.2)] text-[#001F78] dark:text-[#6690DD]`
- 탭 활성 언더라인: `border-b-[#002FA7] dark:border-b-[#3366CC]`

#### Dark Mode Support

All UI components must support dark mode using Tailwind's `dark:` prefix:

- Background: `bg-white dark:bg-[#1D1D1D]`
- Secondary Background: `bg-gray-50 dark:bg-[#2D2D2D]`
- Text: `text-gray-900 dark:text-gray-100`
- Borders: `border-gray-200 dark:border-gray-700`

#### Sport Result Colors (W/D/L)

Use these colors consistently for match results:

- **Win (W)**: `bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400`
- **Draw (D)**: `bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400`
- **Loss (L)**: `bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400`

#### Success/Attendance Colors

Use these colors for success states, attendance, checkmarks:

- **Background**: `bg-green-100 dark:bg-green-900/30`
- **Text/Icon**: `text-green-800 dark:text-green-400`

#### Team Role Colors (Home/Away)

Use these colors for home/away team indicators:

- **Home Team**:
  - Background: `bg-blue-50 dark:bg-blue-900/30`
  - Hover: `hover:bg-blue-200 dark:hover:bg-blue-800/50`
  - Badge: `bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200`
- **Away Team**:
  - Background: `bg-red-50 dark:bg-red-900/30`
  - Hover: `hover:bg-red-200 dark:hover:bg-red-800/50`
  - Badge: `bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200`

#### Standings Status Colors

League standings qualification zones:

- **Champions League**: `bg-green-400`
- **Europa League**: `bg-blue-400`
- **Conference League**: `bg-cyan-400`
- **Relegation**: `bg-red-400`

### Shared UI Components

Use shared UI components from `@/shared/components/ui` for consistency:

- `Container`: Wrapper for content sections
- `ContainerHeader`: Section header
- `ContainerTitle`: Section title
- `ContainerContent`: Section content wrapper

Example usage:

```tsx
import {
  Container,
  ContainerHeader,
  ContainerTitle,
  ContainerContent,
} from "@/shared/components/ui";

<Container className="bg-white dark:bg-[#1D1D1D]">
  <ContainerHeader>
    <ContainerTitle>Section Title</ContainerTitle>
  </ContainerHeader>
  <ContainerContent>{/* content */}</ContainerContent>
</Container>;
```

### Loading Spinner

**IMPORTANT**: Always use the unified `Spinner` component from `@/shared/components/Spinner` for all loading states.

**Location**: `src/shared/components/Spinner.tsx`

**Size Variants**:

- `xs` - 16px (w-4 h-4) - For inline text or small buttons
- `sm` - 20px (w-5 h-5) - For small UI elements
- `md` - 24px (w-6 h-6) - Default, for general use
- `lg` - 32px (w-8 h-8) - For larger areas
- `xl` - 40px (w-10 h-10) - For full-page loading states

**Style**:

- Border: `border-2` with `border-gray-300 dark:border-gray-600`
- Top border accent: `border-t-gray-900 dark:border-t-[#F0F0F0]`
- Shape: `rounded-full` (circular)
- Animation: `animate-spin`

**Usage**:

```tsx
import Spinner from '@/shared/components/Spinner';

// Default size (md)
<Spinner />

// With size variant
<Spinner size="lg" />

// In a centered loading state
<div className="flex items-center justify-center py-8">
  <Spinner size="md" />
</div>
```

**DO NOT**:

- ❌ Use `Loader2` from lucide-react
- ❌ Create custom spinner divs with `animate-spin`
- ❌ Use different border colors or styles
- ❌ Use any old spinner components (LoadingState, etc.)

### Pagination

**Location**: `src/shared/components/ui/pagination.tsx`

**Standard Pattern**: Pagination 여백은 다음 표준 패턴을 따릅니다.

```tsx
import { Pagination } from '@/shared/components/ui';

// space-y-4 컨테이너 내부: withMargin={false}
<div className="space-y-4">
  <Content />
  <Pagination withMargin={false} />
</div>

// 독립 사용: withMargin={true}
<Content />
<Pagination withMargin={true} />
```

**Props**:

- `currentPage`: 현재 페이지 (1부터 시작)
- `totalPages`: 전체 페이지 수
- `onPageChange`: 페이지 변경 콜백 (button 모드)
- `mode`: `'url'` (Link 기반) 또는 `'button'` (콜백 기반)
- `withMargin`: 상단 여백 포함 여부 (기본값: 독립使用时 true, space-y-4 내부 사용시 false)
- `maxButtons`: 표시할 최대 페이지 버튼 수 (기본값: 5)

**Filter Reset on Change**:

```tsx
useEffect(() => {
  setCurrentPage(1);
}, [filter, typeFilter]);
```

## Path Aliases

Configured in `tsconfig.json`:

```typescript
"@/*": ["./src/*"]
"@teams": ["./src/domains/livescore/constants/teams/index.ts"]
"@teams/*": ["./src/domains/livescore/constants/teams/*"]
```

## Database Schema

Key Supabase tables:

- `boards` - Community boards/forums
- `posts` - User posts
- `comments` - Post comments
- `shop_items` - Shop inventory
- `item_purchases` - Purchase history
- `profiles` - User profiles
- `user_points` - Point system
- `user_exp` - Experience/leveling system

## Important Notes

1. **TypeScript/ESLint**: Build errors are currently ignored (`ignoreBuildErrors: true`). Fix types incrementally, don't add more `any` types.

2. **Image Optimization**: Next.js Image component is configured for:

   - `media.api-sports.io` (sports data API)
   - `vnjjfhsuzoxcljqqwwvx.supabase.co` (Supabase storage)
   - `cdn.footballist.co.kr`
   - `i.ytimg.com` (YouTube thumbnails)

3. **Testing Strategy**:

   - Unit tests with Vitest for utilities and hooks
   - E2E tests with Playwright for critical user flows
   - Use `npm run test:all` before committing major changes

4. **Server vs Client Components**:

   - Default to Server Components when possible
   - Use `'use client'` only when needed (interactivity, browser APIs, hooks)
   - Server Actions handle mutations and data fetching

5. **Working Directory**: Main codebase is in `123/1234/`, not the root directory.

## Common Tasks

### Adding a New Domain Feature

1. Create domain directory: `src/domains/[feature-name]/`
2. Add subdirectories: `actions/`, `components/`, `hooks/`, `types/`
3. Implement server actions in `actions/`
4. Create page in `src/app/[feature-name]/page.tsx`
5. Import and use actions in page/components

### Adding a Server Action

1. Create file in `domains/[domain]/actions/[action-name].ts`
2. Start with `'use server'` directive
3. Import server Supabase client: `import { createClient } from '@/shared/api/supabaseServer'`
4. Implement function and export
5. Re-export from `actions/index.ts` if needed

### Modifying Database Types

1. Make schema changes in Supabase dashboard
2. Regenerate types: Update `src/types/supabase.ts` or `src/shared/types/supabase.ts`
3. Update affected components/actions

### Working with Forms

- Use React Hook Form with Zod schema validation
- Follow form-level cohesion pattern for related fields
- Consider field-level cohesion for independent validations

## Documentation

All project documentation is centralized in the [`docs/`](123/1234/docs/README.md) folder:

- **[docs/README.md](123/1234/docs/README.md)** - Documentation index (start here!)
- **[docs/hot-system/](123/1234/docs/hot-system/)** - HOT posts system (scoring, edge functions)
- **[docs/notifications/](123/1234/docs/notifications/)** - Notification system (9 types)
- **[docs/auth-refactoring/](123/1234/docs/auth-refactoring/)** - Auth refactoring history
- **[docs/guides/](123/1234/docs/guides/)** - Testing and deployment guides

**Quick Links**:

- [HOT Score Calculation](123/1234/docs/hot-system/score-calculation.md)
- [Notification System Overview](123/1234/docs/notifications/system-overview.md)
- [Testing HOT Notifications](123/1234/docs/guides/testing-hot-notifications.md)

## Migration Status

The project is in **active migration** from API routes to Server Actions:

- ✅ Most board operations migrated to server actions
- ✅ Domain structure established
- ⚠️ Some legacy API routes remain in `src/app/api/` (RSS auto-fetch, team sync)
- 🔄 Ongoing: Move remaining features to domain-based structure
