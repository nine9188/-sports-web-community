# Step 1: 동적 페이지 메타데이터 구현

## 개요

현재 동적 페이지들(Post, Match, Team, Player)에 `generateMetadata()` 함수가 없어서 검색 결과에 페이지 제목/설명이 제대로 표시되지 않습니다.

## 작업 대상

| 페이지 | 경로 | 파일 위치 | 상태 |
|--------|------|----------|------|
| Post | `/boards/[slug]/[postNumber]` | `src/app/boards/[slug]/[postNumber]/page.tsx` | ✅ 완료 |
| Board | `/boards/[slug]` | `src/app/boards/[slug]/page.tsx` | ✅ 완료 |
| Match | `/livescore/football/match/[id]` | `src/app/livescore/football/match/[id]/page.tsx` | ✅ 완료 |
| Team | `/livescore/football/team/[id]` | `src/app/livescore/football/team/[id]/page.tsx` | ✅ 완료 |
| Player | `/livescore/football/player/[id]` | `src/app/livescore/football/player/[id]/page.tsx` | ✅ 완료 |

---

## 1.1 Post 페이지 메타데이터 ✅

### 구현 위치
`src/app/boards/[slug]/[postNumber]/page.tsx`

### 구현된 코드

```typescript
import { Metadata } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string; postNumber: string }>
}): Promise<Metadata> {
  try {
    const { slug, postNumber } = await params;
    const supabase = await getSupabaseServer();
    const seoSettings = await getSeoSettings();

    const siteUrl = seoSettings?.site_url || 'https://4590.co.kr';
    const siteName = seoSettings?.site_name || '4590 Football';

    // 게시글 정보 조회
    const { data: post } = await supabase
      .from('posts')
      .select(`
        title,
        content,
        created_at,
        updated_at,
        profiles:author_id (nickname),
        boards:board_id (name, slug)
      `)
      .eq('post_number', postNumber)
      .single();

    if (!post) {
      return {
        title: '게시글을 찾을 수 없습니다',
        description: '요청하신 게시글이 존재하지 않습니다.',
      };
    }

    // 본문에서 설명 추출 (HTML 태그 제거, 160자 제한)
    let description = '';
    if (post.content) {
      const contentStr = typeof post.content === 'string'
        ? post.content
        : JSON.stringify(post.content);
      description = contentStr
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
    }

    const boardName = (post.boards as { name?: string })?.name || '게시판';
    const title = `${post.title} - ${boardName}`;
    const url = `${siteUrl}/boards/${slug}/${postNumber}`;
    const authorName = (post.profiles as { nickname?: string })?.nickname || '익명';

    return {
      title,
      description: description || `${boardName}의 게시글입니다.`,
      openGraph: {
        title,
        description: description || `${boardName}의 게시글입니다.`,
        url,
        type: 'article',
        publishedTime: post.created_at,
        modifiedTime: post.updated_at,
        authors: [authorName],
        siteName,
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: description || `${boardName}의 게시글입니다.`,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[PostPage generateMetadata] 오류:', error);
    return {
      title: '게시글 - 4590 Football',
      description: '축구 커뮤니티 게시글',
    };
  }
}
```

### 체크리스트
- [x] 게시글 제목이 메타 타이틀에 포함
- [x] 본문 일부가 description에 포함
- [x] OG 태그에 article 타입 설정
- [x] 작성일, 작성자 정보 포함
- [x] canonical URL 설정

---

## 1.2 Board 페이지 메타데이터 ✅

### 구현 위치
`src/app/boards/[slug]/page.tsx`

### 구현된 코드

```typescript
import { Metadata } from 'next';
import { getSupabaseServer } from '@/shared/lib/supabase/server';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await getSupabaseServer();
    const seoSettings = await getSeoSettings();

    const siteUrl = seoSettings?.site_url || 'https://4590.co.kr';
    const siteName = seoSettings?.site_name || '4590 Football';

    // 게시판 정보 조회
    const { data: board } = await supabase
      .from('boards')
      .select('name, description')
      .eq('slug', slug)
      .single();

    if (!board) {
      return {
        title: '게시판을 찾을 수 없습니다',
        description: '요청하신 게시판이 존재하지 않습니다.',
      };
    }

    const title = `${board.name} - ${siteName}`;
    const description = board.description || `${board.name} 게시판의 최신 글을 확인하세요.`;
    const url = `${siteUrl}/boards/${slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        siteName,
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[BoardPage generateMetadata] 오류:', error);
    return {
      title: '게시판 - 4590 Football',
      description: '축구 커뮤니티 게시판',
    };
  }
}
```

---

## 1.3 Match 페이지 메타데이터 ✅

### 구현 위치
`src/app/livescore/football/match/[id]/page.tsx`

### 구현된 코드

```typescript
import { Metadata } from 'next';
import { fetchCachedMatchFullData } from '@/domains/livescore/actions/match/matchData';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const seoSettings = await getSeoSettings();

    const siteUrl = seoSettings?.site_url || 'https://4590.co.kr';
    const siteName = seoSettings?.site_name || '4590 Football';

    // 경기 데이터 조회 (최소한의 옵션으로)
    const matchData = await fetchCachedMatchFullData(id, {
      fetchEvents: false,
      fetchLineups: false,
      fetchStats: false,
      fetchStandings: false,
    });

    if (!matchData.success || !matchData.match) {
      return {
        title: '경기 정보를 찾을 수 없습니다',
        description: '요청하신 경기 정보가 존재하지 않습니다.',
      };
    }

    const { match } = matchData;
    const homeTeam = match.teams.home.name;
    const awayTeam = match.teams.away.name;
    const leagueName = match.league.name;

    // 스코어 표시 (경기 시작 전이면 'vs', 아니면 실제 스코어)
    const isNotStarted = ['TBD', 'NS'].includes(match.status.code);
    const score = isNotStarted
      ? 'vs'
      : `${match.goals.home} - ${match.goals.away}`;

    const title = `${homeTeam} ${score} ${awayTeam} | ${leagueName}`;
    const description = `${leagueName} - ${homeTeam} vs ${awayTeam} 경기 정보, 라인업, 통계, 하이라이트를 확인하세요.`;
    const url = `${siteUrl}/livescore/football/match/${id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        images: match.league.logo ? [
          {
            url: match.league.logo,
            width: 80,
            height: 80,
            alt: leagueName,
          },
        ] : undefined,
        siteName,
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[MatchPage generateMetadata] 오류:', error);
    return {
      title: '경기 정보 - 4590 Football',
      description: '축구 경기 정보, 라인업, 통계를 확인하세요.',
    };
  }
}
```

### 체크리스트
- [x] 홈팀 vs 원정팀 형식의 제목
- [x] 스코어 포함 (경기 종료 시)
- [x] 리그 정보 포함
- [x] 리그 로고를 OG 이미지로 사용

---

## 1.4 Team 페이지 메타데이터 ✅

### 구현 위치
`src/app/livescore/football/team/[id]/page.tsx`

### 구현된 코드

```typescript
import { Metadata } from 'next';
import { fetchTeamFullData } from '@/domains/livescore/actions/teams/team';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const seoSettings = await getSeoSettings();

    const siteUrl = seoSettings?.site_url || 'https://4590.co.kr';
    const siteName = seoSettings?.site_name || '4590 Football';

    // 팀 데이터 조회 (최소한의 옵션으로)
    const teamData = await fetchTeamFullData(id, {
      fetchMatches: false,
      fetchSquad: false,
      fetchPlayerStats: false,
      fetchStandings: false,
    });

    if (!teamData.success || !teamData.teamData?.team) {
      return {
        title: '팀 정보를 찾을 수 없습니다',
        description: '요청하신 팀 정보가 존재하지 않습니다.',
      };
    }

    const team = teamData.teamData.team;

    const title = `${team.name} | 팀 정보 - ${siteName}`;
    const description = `${team.name}의 경기 일정, 순위, 선수단, 통계 정보를 확인하세요.${team.country ? ` ${team.country}` : ''}${team.founded ? ` (창단: ${team.founded}년)` : ''}`;
    const url = `${siteUrl}/livescore/football/team/${id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'website',
        images: team.logo ? [
          {
            url: team.logo,
            width: 120,
            height: 120,
            alt: team.name,
          },
        ] : undefined,
        siteName,
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[TeamPage generateMetadata] 오류:', error);
    return {
      title: '팀 정보 - 4590 Football',
      description: '축구 팀 정보, 경기 일정, 선수단을 확인하세요.',
    };
  }
}
```

---

## 1.5 Player 페이지 메타데이터 ✅

### 구현 위치
`src/app/livescore/football/player/[id]/page.tsx`

### 구현된 코드

```typescript
import { Metadata } from 'next';
import { fetchPlayerFullData } from '@/domains/livescore/actions/player/data';
import { getSeoSettings } from '@/domains/seo/actions/seoSettings';

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const seoSettings = await getSeoSettings();

    const siteUrl = seoSettings?.site_url || 'https://4590.co.kr';
    const siteName = seoSettings?.site_name || '4590 Football';

    // 선수 데이터 조회 (최소한의 옵션으로)
    const playerData = await fetchPlayerFullData(id, {
      fetchSeasons: false,
      fetchStats: false,
      fetchFixtures: false,
      fetchTrophies: false,
      fetchTransfers: false,
      fetchInjuries: false,
      fetchRankings: false,
    });

    if (!playerData.success || !playerData.playerData) {
      return {
        title: '선수 정보를 찾을 수 없습니다',
        description: '요청하신 선수 정보가 존재하지 않습니다.',
      };
    }

    const player = playerData.playerData.player;
    const statistics = playerData.playerData.statistics;
    const currentTeam = statistics?.[0]?.team?.name || '';
    const position = statistics?.[0]?.games?.position || '';

    const title = `${player.name} | 선수 정보 - ${siteName}`;
    const description = `${player.name}${player.nationality ? ` (${player.nationality})` : ''}${currentTeam ? ` - ${currentTeam}` : ''}${position ? ` ${position}` : ''}. 시즌 통계, 경기 기록, 프로필 정보를 확인하세요.`;
    const url = `${siteUrl}/livescore/football/player/${id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: 'profile',
        images: player.photo ? [
          {
            url: player.photo,
            width: 120,
            height: 120,
            alt: player.name,
          },
        ] : undefined,
        siteName,
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('[PlayerPage generateMetadata] 오류:', error);
    return {
      title: '선수 정보 - 4590 Football',
      description: '축구 선수 정보, 통계, 경기 기록을 확인하세요.',
    };
  }
}
```

---

## 테스트 방법

### 1. 로컬 테스트
```bash
npm run build
npm run start
```

### 2. 메타데이터 확인
- 브라우저 개발자 도구 > Elements > `<head>` 태그 확인
- `<title>`, `<meta name="description">`, `<meta property="og:*">` 확인

### 3. 소셜 미리보기 테스트
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### 4. SEO 검증
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Bing Webmaster Tools](https://www.bing.com/webmasters)

---

## 완료 체크리스트

- [x] Post 페이지 generateMetadata 구현
- [x] Board 페이지 generateMetadata 구현
- [x] Match 페이지 generateMetadata 구현
- [x] Team 페이지 generateMetadata 구현
- [x] Player 페이지 generateMetadata 구현
- [x] 빌드 테스트 통과
- [ ] 소셜 미리보기 테스트 완료

---

## 구현 완료일

**2025-12-29**
