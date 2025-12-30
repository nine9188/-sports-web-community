# Step 2: Robots.txt & Sitemap 개선

## 개요

현재 robots.txt에 sitemap URL이 주석 처리되어 있고, sitemap에 동적 라이브스코어 페이지가 포함되지 않아 크롤링 효율이 떨어집니다.

---

## 2.1 Robots.txt 수정

### 현재 상태 (문제점)
```txt
# Sitemap: [URL 미설정]  <-- 주석 처리됨
```

### 수정 파일
`public/robots.txt`

### 수정 코드

```txt
# 4590 Football Robots.txt
# Last updated: 2024

User-agent: *
Allow: /

# Crawl-delay for all bots
Crawl-delay: 1

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /settings/
Disallow: /_next/

# Block AI training bots
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

# Sitemap location
Sitemap: https://your-domain.com/sitemap.xml
```

### 변경사항
1. Sitemap URL 주석 해제 및 실제 도메인 설정
2. `/admin/`, `/api/`, `/settings/` 경로 차단
3. `/_next/` 정적 파일 차단
4. 추가 AI 봇 차단 (Google-Extended, Bytespider)

---

## 2.2 Sitemap 확장

### 현재 상태 (문제점)
- 정적 페이지 11개만 포함
- 동적 게시글 1000개 포함
- **라이브스코어 동적 페이지 미포함** (Match, Team, Player, League)

### 수정 파일
`src/app/sitemap.ts`

### 수정 코드

```typescript
import { MetadataRoute } from 'next';
import { createClient } from '@/shared/api/supabaseServer';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

// 지원하는 주요 리그 ID 목록
const MAJOR_LEAGUES = [
  39,   // Premier League
  140,  // La Liga
  135,  // Serie A
  78,   // Bundesliga
  61,   // Ligue 1
  2,    // Champions League
  3,    // Europa League
  848,  // Conference League
  292,  // K League 1
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // 1. 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/boards/all`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/boards/popular`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/livescore/football`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/livescore/football/leagues`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/transfers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/shorts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 2. 동적 게시판 페이지
  const { data: boards } = await supabase
    .from('boards')
    .select('slug, updated_at')
    .eq('is_active', true);

  const boardPages: MetadataRoute.Sitemap = (boards || []).map((board) => ({
    url: `${BASE_URL}/boards/${board.slug}`,
    lastModified: new Date(board.updated_at),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }));

  // 3. 동적 게시글 페이지 (최근 1000개)
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      post_number,
      updated_at,
      boards!inner(slug)
    `)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(1000);

  const postPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${BASE_URL}/boards/${post.boards.slug}/${post.post_number}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  // 4. 리그 페이지
  const leaguePages: MetadataRoute.Sitemap = MAJOR_LEAGUES.map((leagueId) => ({
    url: `${BASE_URL}/livescore/football/league/${leagueId}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // 5. 최근 경기 페이지 (오늘 + 어제 + 내일)
  // 실제 구현에서는 DB나 API에서 경기 ID를 가져와야 함
  const matchPages: MetadataRoute.Sitemap = await getRecentMatches();

  // 6. 인기 팀 페이지
  const teamPages: MetadataRoute.Sitemap = await getPopularTeams();

  return [
    ...staticPages,
    ...boardPages,
    ...postPages,
    ...leaguePages,
    ...matchPages,
    ...teamPages,
  ];
}

// 최근 경기 가져오기 (캐시된 데이터 또는 DB에서)
async function getRecentMatches(): Promise<MetadataRoute.Sitemap> {
  try {
    // 옵션 1: Supabase에 캐시된 경기 데이터 사용
    const supabase = await createClient();
    const { data: matches } = await supabase
      .from('cached_fixtures')
      .select('fixture_id, updated_at')
      .gte('fixture_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .lte('fixture_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    if (matches && matches.length > 0) {
      return matches.map((match) => ({
        url: `${BASE_URL}/livescore/football/match/${match.fixture_id}`,
        lastModified: new Date(match.updated_at),
        changeFrequency: 'hourly' as const,
        priority: 0.7,
      }));
    }

    // 옵션 2: 캐시된 데이터가 없으면 빈 배열 반환
    return [];
  } catch (error) {
    console.error('Failed to get recent matches for sitemap:', error);
    return [];
  }
}

// 인기 팀 가져오기
async function getPopularTeams(): Promise<MetadataRoute.Sitemap> {
  // 주요 팀 ID 목록 (프리미어리그 빅6 + 주요 팀들)
  const popularTeamIds = [
    33,   // Manchester United
    40,   // Liverpool
    42,   // Arsenal
    47,   // Tottenham
    49,   // Chelsea
    50,   // Manchester City
    529,  // Barcelona
    541,  // Real Madrid
    489,  // AC Milan
    496,  // Juventus
    157,  // Bayern Munich
    165,  // Borussia Dortmund
    85,   // PSG
    2836, // 울산 HD FC
    2764, // 전북 현대
  ];

  return popularTeamIds.map((teamId) => ({
    url: `${BASE_URL}/livescore/football/team/${teamId}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
}
```

---

## 2.3 Sitemap Index 분할 (대규모 사이트용)

게시글이 50,000개 이상이면 sitemap을 분할해야 합니다.

### 구현 (선택적)

```typescript
// src/app/sitemap.ts - 메인 sitemap index
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/sitemap/static.xml`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/sitemap/posts.xml`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/sitemap/livescore.xml`,
      lastModified: new Date(),
    },
  ];
}
```

```typescript
// src/app/sitemap/posts/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@/shared/api/supabaseServer';

export async function generateSitemaps() {
  const supabase = await createClient();
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  const totalPosts = count || 0;
  const postsPerSitemap = 10000;
  const sitemapCount = Math.ceil(totalPosts / postsPerSitemap);

  return Array.from({ length: sitemapCount }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const limit = 10000;
  const offset = id * limit;

  const { data: posts } = await supabase
    .from('posts')
    .select('post_number, updated_at, boards!inner(slug)')
    .eq('is_deleted', false)
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  return (posts || []).map((post) => ({
    url: `${BASE_URL}/boards/${post.boards.slug}/${post.post_number}`,
    lastModified: new Date(post.updated_at),
  }));
}
```

---

## 2.4 환경 변수 설정

`.env.local` 또는 `.env.production`에 추가:

```env
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
```

---

## 테스트 방법

### 1. Sitemap 확인
```bash
npm run build
npm run start
# 브라우저에서 http://localhost:3000/sitemap.xml 확인
```

### 2. Robots.txt 확인
```bash
# 브라우저에서 http://localhost:3000/robots.txt 확인
```

### 3. 검색 엔진에 제출
- [Google Search Console](https://search.google.com/search-console) - Sitemap 제출
- [Bing Webmaster Tools](https://www.bing.com/webmasters) - Sitemap 제출
- [Naver Search Advisor](https://searchadvisor.naver.com/) - Sitemap 제출

### 4. Sitemap 유효성 검사
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)

---

## 완료 체크리스트

- [ ] robots.txt에 Sitemap URL 추가
- [ ] robots.txt에 차단할 경로 추가
- [ ] sitemap.ts에 리그 페이지 추가
- [ ] sitemap.ts에 경기 페이지 추가 (캐시 테이블 필요시 생성)
- [ ] sitemap.ts에 팀 페이지 추가
- [ ] 환경 변수 NEXT_PUBLIC_SITE_URL 설정
- [ ] 빌드 테스트
- [ ] Google Search Console에 sitemap 제출
- [ ] Naver Search Advisor에 sitemap 제출
