# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Development server
npm run dev

# Build application
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Testing Commands
```bash
# Run unit tests with Vitest
npm test
# or npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate test coverage
npm run test:coverage

# Run end-to-end tests with Playwright
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run all tests (unit + e2e)
npm run test:all
```

### Test Setup
- **Unit tests**: Vitest with jsdom environment
- **Test files**: Located in `tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- **E2E tests**: Playwright located in `tests/e2e/`
- **Setup file**: `tests/setup.ts`

## Project Architecture

### Domain-Driven Structure
The project follows a domain-driven architecture with clear separation of concerns:

```
src/
├── domains/              # Feature domains
│   ├── admin/           # Admin functionality
│   ├── auth/            # Authentication system
│   ├── boards/          # Forum/board system
│   ├── layout/          # Layout components
│   ├── livescore/       # Live sports scores
│   ├── prediction/      # Match predictions
│   ├── search/          # Search functionality
│   ├── settings/        # User settings
│   ├── shop/            # Shop system
│   ├── sidebar/         # Sidebar components
│   └── widgets/         # Reusable widgets
├── shared/              # Shared utilities and components
└── app/                 # Next.js app router
```

### Domain Structure Pattern
Each domain follows this consistent pattern:
```
domain/
├── actions/           # Server actions
├── components/        # React components  
├── hooks/            # Custom hooks
├── types/            # TypeScript types
├── utils/            # Utility functions
└── index.ts          # Domain exports
```

### Key Technologies
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Kakao integration
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + custom components
- **State Management**: React Query (@tanstack/react-query)
- **Rich Text**: Tiptap editor
- **Charts**: Chart.js, Recharts
- **Image Optimization**: Custom ApiSportsImage component

## Authentication & Authorization

### Middleware Configuration
- Protected routes: `/admin`, `/settings`
- Auth routes: `/signin`, `/signup`, `/auth`
- Admin access controlled via `ADMIN_EMAILS` environment variable
- Session management with automatic refresh

### Authentication Flow
- Supabase SSR for server-side auth
- Client-side auth with `createClient()` from `@/shared/api/supabase`
- Kakao social login integration

## API Integration

### Sports Data (API-Sports)
- Football/soccer data integration
- Custom image caching system via `ApiSportsImage` component
- League mappings and team constants in `src/domains/livescore/constants/`

### Image Management
The project uses a sophisticated image caching system:
- **ApiSportsImage Component**: Custom component that caches API-Sports images to Supabase Storage
- **Memory Caching**: Client-side memory cache to prevent duplicate requests
- **Storage-First**: Always serves from Supabase Storage, never exposes API-Sports URLs
- **Usage**: `<ApiSportsImage imageId={40} imageType={ImageType.Teams} alt="Team Name" />`

## Database Schema

### Key Tables
- Users and profiles
- Boards and posts with hierarchical structure
- Comments with likes system
- Match data and predictions
- Shop items and user purchases
- Activity logs and experience points

## Development Guidelines

### Path Aliases
- `@/*` maps to `./src/*`

### TypeScript Configuration
- Strict mode enabled
- Build errors ignored in Next.js config (set to `true`)
- ESLint errors ignored during builds

### Component Patterns
- **Server Components**: Use for data fetching and initial rendering
- **Client Components**: Use 'use client' directive for interactivity
- **Server Actions**: Use 'use server' for database operations

### Image Optimization
- Next.js Image component configured for multiple domains
- Custom ApiSportsImage component for sports images
- Supabase Storage integration for cached images

## Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ADMIN_EMAILS= # Comma-separated admin email addresses
```

## Performance Optimizations

### Key Optimizations Applied
- Server-side data fetching with immediate rendering
- Memory caching for API requests
- Image optimization with Supabase Storage caching
- React Query for client-side data management

### Load Performance
- Playwright E2E tests configured with 2-minute timeout
- Development server runs on port 3000
- Production build optimizations enabled

## Testing Strategy

### Unit Testing
- Vitest with jsdom environment
- React Testing Library integration
- Test files in `tests/unit/` directory

### E2E Testing
- Playwright with multi-browser support (Chromium, Firefox, WebKit)
- Mobile viewport testing (Pixel 5, iPhone 12)
- Screenshot and video capture on failure
- Tests located in `tests/e2e/`

## Build Configuration

### Next.js Configuration
- TypeScript and ESLint errors ignored during builds
- Multiple image domains configured
- Webpack fallbacks for Node.js modules
- Remote patterns for sports images and Supabase storage

### Bundle Optimizations
- Tree shaking enabled
- Dynamic imports for code splitting
- Image optimization with Next.js Image component