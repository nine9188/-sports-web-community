# Step 3: JSON-LD 구조화 데이터 구현

## 개요

JSON-LD (Linked Data)는 검색 엔진이 콘텐츠를 더 잘 이해하도록 돕는 구조화된 데이터입니다. 이를 통해 검색 결과에서 리치 스니펫(별점, 이미지, 브레드크럼 등)을 표시할 수 있습니다.

## 현재 상태

**전무** - JSON-LD 스키마가 전혀 구현되어 있지 않음

## 구현할 스키마

| 스키마 | 적용 페이지 | 효과 |
|--------|------------|------|
| Organization | 전역 (layout) | 브랜드 정보 표시 |
| WebSite | 전역 (layout) | 사이트 검색창 |
| BreadcrumbList | 모든 페이지 | 경로 네비게이션 |
| Article | Post 페이지 | 게시글 리치 스니펫 |
| SportsEvent | Match 페이지 | 경기 정보 |
| SportsTeam | Team 페이지 | 팀 정보 |
| Person | Player 페이지 | 선수 정보 |

---

## 3.1 JSON-LD 컴포넌트 생성

### 파일 생성
`src/shared/components/seo/JsonLd.tsx`

```typescript
'use client';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

---

## 3.2 Organization 스키마 (전역)

### 적용 위치
`src/app/layout.tsx`

### 구현 코드

```typescript
import { JsonLd } from '@/shared/components/seo/JsonLd';

// layout.tsx 내부
export default async function RootLayout({ children }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '4590 Football',
    url: 'https://your-domain.com',
    logo: 'https://your-domain.com/icon-512.png',
    description: '축구 라이브스코어, 커뮤니티, 이적 뉴스를 제공하는 스포츠 플랫폼',
    foundingDate: '2024',
    sameAs: [
      // 소셜 미디어 링크 (있는 경우)
      // 'https://twitter.com/4590football',
      // 'https://www.instagram.com/4590football',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@your-domain.com',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '4590 Football',
    url: 'https://your-domain.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://your-domain.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="ko">
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 3.3 BreadcrumbList 스키마

### 파일 생성
`src/shared/components/seo/BreadcrumbJsonLd.tsx`

```typescript
import { JsonLd } from './JsonLd';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={breadcrumbSchema} />;
}
```

### 사용 예시 (Post 페이지)

```typescript
<BreadcrumbJsonLd
  items={[
    { name: '홈', url: 'https://your-domain.com' },
    { name: '게시판', url: 'https://your-domain.com/boards/all' },
    { name: board.name, url: `https://your-domain.com/boards/${board.slug}` },
    { name: post.title, url: `https://your-domain.com/boards/${board.slug}/${post.post_number}` },
  ]}
/>
```

---

## 3.4 Article 스키마 (Post 페이지)

### 파일 생성
`src/shared/components/seo/ArticleJsonLd.tsx`

```typescript
import { JsonLd } from './JsonLd';

interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  publisherName?: string;
  publisherLogo?: string;
}

export function ArticleJsonLd({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
  publisherName = '4590 Football',
  publisherLogo = 'https://your-domain.com/icon-512.png',
}: ArticleJsonLdProps) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    image: imageUrl,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return <JsonLd data={articleSchema} />;
}
```

### 적용 (Post 페이지)
`src/app/boards/[slug]/[postNumber]/page.tsx`

```typescript
import { ArticleJsonLd } from '@/shared/components/seo/ArticleJsonLd';
import { BreadcrumbJsonLd } from '@/shared/components/seo/BreadcrumbJsonLd';

export default async function PostPage({ params }) {
  const { slug, postNumber } = await params;
  // ... 게시글 데이터 조회 ...

  const postUrl = `https://your-domain.com/boards/${slug}/${postNumber}`;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: '홈', url: 'https://your-domain.com' },
          { name: board.name, url: `https://your-domain.com/boards/${slug}` },
          { name: post.title, url: postUrl },
        ]}
      />
      <ArticleJsonLd
        title={post.title}
        description={post.content?.slice(0, 160)}
        url={postUrl}
        imageUrl={post.thumbnail_url}
        datePublished={post.created_at}
        dateModified={post.updated_at}
        authorName={post.profiles?.nickname || '익명'}
      />
      {/* 페이지 콘텐츠 */}
    </>
  );
}
```

---

## 3.5 SportsEvent 스키마 (Match 페이지)

### 파일 생성
`src/shared/components/seo/SportsEventJsonLd.tsx`

```typescript
import { JsonLd } from './JsonLd';

interface SportsEventJsonLdProps {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate?: string;
  location: string;
  homeTeam: {
    name: string;
    url?: string;
    logo?: string;
  };
  awayTeam: {
    name: string;
    url?: string;
    logo?: string;
  };
  homeScore?: number;
  awayScore?: number;
  eventStatus: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  competition: string;
}

export function SportsEventJsonLd({
  name,
  description,
  url,
  startDate,
  endDate,
  location,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  eventStatus,
  competition,
}: SportsEventJsonLdProps) {
  const eventStatusMap = {
    scheduled: 'https://schema.org/EventScheduled',
    live: 'https://schema.org/EventScheduled', // Schema.org doesn't have "live"
    finished: 'https://schema.org/EventScheduled',
    postponed: 'https://schema.org/EventPostponed',
    cancelled: 'https://schema.org/EventCancelled',
  };

  const sportsEventSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name,
    description,
    url,
    startDate,
    endDate: endDate || startDate,
    eventStatus: eventStatusMap[eventStatus],
    location: {
      '@type': 'Place',
      name: location,
    },
    homeTeam: {
      '@type': 'SportsTeam',
      name: homeTeam.name,
      url: homeTeam.url,
      logo: homeTeam.logo,
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: awayTeam.name,
      url: awayTeam.url,
      logo: awayTeam.logo,
    },
    competitor: [
      {
        '@type': 'SportsTeam',
        name: homeTeam.name,
        ...(homeScore !== undefined && { result: homeScore.toString() }),
      },
      {
        '@type': 'SportsTeam',
        name: awayTeam.name,
        ...(awayScore !== undefined && { result: awayScore.toString() }),
      },
    ],
    organizer: {
      '@type': 'Organization',
      name: competition,
    },
  };

  return <JsonLd data={sportsEventSchema} />;
}
```

### 적용 (Match 페이지)
`src/app/livescore/football/match/[id]/page.tsx`

```typescript
import { SportsEventJsonLd } from '@/shared/components/seo/SportsEventJsonLd';
import { BreadcrumbJsonLd } from '@/shared/components/seo/BreadcrumbJsonLd';

export default async function MatchPage({ params }) {
  const { id } = await params;
  // ... 경기 데이터 조회 ...

  const matchUrl = `https://your-domain.com/livescore/football/match/${id}`;
  const matchName = `${fixture.teams.home.name} vs ${fixture.teams.away.name}`;

  // 경기 상태 매핑
  const getEventStatus = (status: string) => {
    if (['NS', 'TBD'].includes(status)) return 'scheduled';
    if (['1H', '2H', 'HT', 'ET', 'P'].includes(status)) return 'live';
    if (['FT', 'AET', 'PEN'].includes(status)) return 'finished';
    if (['PST', 'SUSP'].includes(status)) return 'postponed';
    if (['CANC', 'ABD'].includes(status)) return 'cancelled';
    return 'scheduled';
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: '홈', url: 'https://your-domain.com' },
          { name: '라이브스코어', url: 'https://your-domain.com/livescore/football' },
          { name: fixture.league.name, url: `https://your-domain.com/livescore/football/league/${fixture.league.id}` },
          { name: matchName, url: matchUrl },
        ]}
      />
      <SportsEventJsonLd
        name={matchName}
        description={`${fixture.league.name} - ${matchName} 경기 정보`}
        url={matchUrl}
        startDate={fixture.fixture.date}
        location={fixture.fixture.venue?.name || 'TBD'}
        homeTeam={{
          name: fixture.teams.home.name,
          url: `https://your-domain.com/livescore/football/team/${fixture.teams.home.id}`,
          logo: fixture.teams.home.logo,
        }}
        awayTeam={{
          name: fixture.teams.away.name,
          url: `https://your-domain.com/livescore/football/team/${fixture.teams.away.id}`,
          logo: fixture.teams.away.logo,
        }}
        homeScore={fixture.goals.home}
        awayScore={fixture.goals.away}
        eventStatus={getEventStatus(fixture.fixture.status.short)}
        competition={fixture.league.name}
      />
      {/* 페이지 콘텐츠 */}
    </>
  );
}
```

---

## 3.6 SportsTeam 스키마 (Team 페이지)

### 파일 생성
`src/shared/components/seo/SportsTeamJsonLd.tsx`

```typescript
import { JsonLd } from './JsonLd';

interface SportsTeamJsonLdProps {
  name: string;
  url: string;
  logo: string;
  description?: string;
  foundingDate?: string;
  location?: string;
  coach?: string;
  sport?: string;
}

export function SportsTeamJsonLd({
  name,
  url,
  logo,
  description,
  foundingDate,
  location,
  coach,
  sport = 'Football',
}: SportsTeamJsonLdProps) {
  const sportsTeamSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name,
    url,
    logo,
    description,
    foundingDate,
    sport,
    ...(location && {
      location: {
        '@type': 'Place',
        name: location,
      },
    }),
    ...(coach && {
      coach: {
        '@type': 'Person',
        name: coach,
      },
    }),
  };

  return <JsonLd data={sportsTeamSchema} />;
}
```

---

## 3.7 Person 스키마 (Player 페이지)

### 파일 생성
`src/shared/components/seo/PersonJsonLd.tsx`

```typescript
import { JsonLd } from './JsonLd';

interface PersonJsonLdProps {
  name: string;
  url: string;
  image: string;
  description?: string;
  birthDate?: string;
  nationality?: string;
  height?: string;
  weight?: string;
  jobTitle?: string;
  affiliation?: {
    name: string;
    url?: string;
  };
}

export function PersonJsonLd({
  name,
  url,
  image,
  description,
  birthDate,
  nationality,
  height,
  weight,
  jobTitle = 'Professional Football Player',
  affiliation,
}: PersonJsonLdProps) {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    image,
    description,
    birthDate,
    nationality,
    height,
    weight,
    jobTitle,
    ...(affiliation && {
      affiliation: {
        '@type': 'SportsTeam',
        name: affiliation.name,
        url: affiliation.url,
      },
    }),
  };

  return <JsonLd data={personSchema} />;
}
```

---

## 3.8 파일 구조

```
src/shared/components/seo/
├── index.ts                  # Re-exports
├── JsonLd.tsx               # 기본 컴포넌트
├── BreadcrumbJsonLd.tsx     # 브레드크럼
├── ArticleJsonLd.tsx        # 게시글
├── SportsEventJsonLd.tsx    # 경기
├── SportsTeamJsonLd.tsx     # 팀
└── PersonJsonLd.tsx         # 선수
```

### index.ts

```typescript
export { JsonLd } from './JsonLd';
export { BreadcrumbJsonLd } from './BreadcrumbJsonLd';
export { ArticleJsonLd } from './ArticleJsonLd';
export { SportsEventJsonLd } from './SportsEventJsonLd';
export { SportsTeamJsonLd } from './SportsTeamJsonLd';
export { PersonJsonLd } from './PersonJsonLd';
```

---

## 테스트 방법

### 1. 구조화 데이터 검증
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

### 2. 브라우저에서 확인
```javascript
// 개발자 도구 콘솔에서 실행
const scripts = document.querySelectorAll('script[type="application/ld+json"]');
scripts.forEach(s => console.log(JSON.parse(s.textContent)));
```

### 3. SEO 점수 확인
- [PageSpeed Insights](https://pagespeed.web.dev/) - SEO 섹션 확인
- [Lighthouse](chrome://extensions/) - SEO 감사

---

## 완료 체크리스트

- [ ] JsonLd 기본 컴포넌트 생성
- [ ] Organization 스키마 적용 (layout.tsx)
- [ ] WebSite 스키마 적용 (layout.tsx)
- [ ] BreadcrumbJsonLd 컴포넌트 생성
- [ ] ArticleJsonLd 컴포넌트 생성
- [ ] SportsEventJsonLd 컴포넌트 생성
- [ ] SportsTeamJsonLd 컴포넌트 생성
- [ ] PersonJsonLd 컴포넌트 생성
- [ ] Post 페이지에 Article + Breadcrumb 적용
- [ ] Match 페이지에 SportsEvent + Breadcrumb 적용
- [ ] Team 페이지에 SportsTeam + Breadcrumb 적용
- [ ] Player 페이지에 Person + Breadcrumb 적용
- [ ] Rich Results Test 통과 확인
