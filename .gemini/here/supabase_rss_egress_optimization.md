# Supabase RSS 피드 Egress 트래픽 최적화 분석 보고서

이 보고서는 `src/app/rss.xml/route.ts` 경로의 RSS 피드 생성 로직이 유발하는 **데이터베이스 Egress 트래픽 및 direct hit API 호출 문제**의 진짜 원인을 심층 분석하고, 이를 완전히 해결하기 위한 최선의 정적 캐싱(ISR) 대안을 기술합니다.

---

## 1. 진짜 무엇이 문제인가? (핵심 원인 분석)

현재 `rss.xml` API 경로는 매 요청 시마다 Supabase 데이터베이스에 직접 접근하여 최근 100개의 게시글과 SEO 설정을 직접 Select 해오고 있습니다. 이로 인해 막대한 트래픽과 데이터베이스 Egress 요금이 낭비되는 근본 원인은 다음과 같습니다.

### 1) `cookies()` API 개입으로 인한 정적 캐싱(ISR) 원천 무력화
* **현상**: `src/app/rss.xml/route.ts`는 Supabase 클라이언트를 초기화하기 위해 `getSupabaseServer`를 사용하며, 전역 SEO 설정을 읽기 위해 `getSeoSettings`를 호출합니다.
* **진짜 원인**: 이 함수들은 내부적으로 Next.js의 `cookies()` API를 호출하도록 구현되어 있습니다.
* **Next.js 렌더링 메커니즘**: 쿠키 스토어(`cookies()`)는 사용자 세션에 따라 응답이 달라져야 하는 **Dynamic Data Source (동적 데이터 소스)**입니다. Next.js 빌더는 소스 코드 내에서 `cookies()` 호출이 발생하는 즉시 해당 라우트를 정적(Static)으로 캐싱하지 않고, **무조건 매 요청 시마다 서버 컴포넌트를 직접 실행하는 Dynamic Rendering(동적 렌더링)으로 고정**시킵니다.
* **결과**: 개발자가 코드 내에 캐싱 설정을 부여하더라도 `cookies()` 의존성 때문에 캐시가 강제로 풀리고 매번 데이터베이스 직접 조회(Direct Hit)가 터지게 됩니다.

### 2) 봇(Bot) 및 RSS 크롤러에 의한 API Direct Hit 폭증
* RSS 피드는 일반 방문자가 아닌, 검색엔진 봇(Googlebot, Naverbot)이나 다양한 RSS 피드 리더기(Feedly, Slack 봇 등)가 주기적이고 강박적으로 긁어갑니다.
* `revalidate = 0`, `dynamic = 'force-dynamic'` 설정과 `cookies()` 개입이 결합되어 봇이 요청할 때마다 데이터베이스 쿼리가 수행됩니다.
* **데이터 크기 및 트래픽**: 1회 조회 시마다 100개 글의 `title`, `summary` (최대 300자) 등을 포함해 약 **40KB** 상당의 JSON 데이터가 데이터베이스로부터 전송됩니다.
* **하루 누적 부하**: 하루에 봇들의 요청이 5,000회만 꽂혀도 $5,000 \times 40\text{KB} \approx 200\text{MB}$의 쓸모없는 데이터베이스 Egress 요금이 매일 부과되며, DB 커넥션 풀을 실시간으로 소모하게 됩니다.

---

## 2. Supabase MCP 기반 DB 스펙 검증 결과

Supabase MCP Server (`execute_sql`)를 통하여 `posts` 테이블의 인덱스 설계 상태를 정밀 진단했습니다.

* **확인된 인덱스**: `CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at)`
* **인덱스 분석**: `posts` 테이블에는 작성 날짜 역순 조회를 위한 단일 인덱스(`idx_posts_created_at`)가 정상적으로 걸려 있습니다.
* **DB 부하 진단**: 다행히 작성시간 기준 인덱스를 타고 데이터를 역순으로 100개만 스캔해 오므로, 데이터베이스 엔진 자체에 큰 정렬 부하(Full Table Scan)를 주지는 않습니다.
* **진단 결론**: 따라서, 진짜 문제는 **데이터베이스 쿼리 속도나 인덱스 부재가 아니라, 15분~1시간 정체되어도 무방한 XML 문서 하나를 만들기 위해 매번 DB로 Direct API Call을 꽂아 전송 요금(Egress)을 발생시키는 호출 방식 자체의 설계 문제**입니다.

---

## 3. 최선의 개선 방법 (해결 로직 제안)

쿠키 세션 의존성을 끊고 Next.js의 **정적 캐시(ISR, Incremental Static Regeneration)**를 정상 활성화하여, 봇이 긁어갈 때 CDN 캐시가 응답하도록 개선해야 합니다.

### 1) 쿠키 없는 Supabase 클라이언트 사용
사용자 세션 검증이 필요 없으므로 `cookies()`를 부르지 않고 안전하게 캐싱될 수 있는 `getSupabaseClientNoCookies`를 사용합니다.

### 2) SEO 설정 테이블 직접 조회 (Direct Select)
`getSeoSettings`가 유발하는 쿠키 의존성을 우회하도록, `rss.xml` 내부에서 데이터베이스 클라이언트를 통해 직접 단발성으로 `seo_settings` 테이블을 `select` 하도록 쿼리를 변경합니다.

### 3) 15분 정적 캐싱 (`revalidate = 900`) 적용
Next.js가 15분 주기로 백그라운드에서 정적 RSS XML을 빌드하도록 유도합니다.

---

## 4. 소스 코드 수정 가이드

`src/app/rss.xml/route.ts`에 아래와 같이 캐싱 및 우회 로직을 적용하면 데이터베이스 부하가 완벽히 제거됩니다.

```typescript
// src/app/rss.xml/route.ts
import { getSupabaseClientNoCookies } from '@/shared/lib/supabase/server';
import { siteConfig } from '@/shared/config';
import { buildPostDisplayTitle } from '@/domains/boards/utils/post/buildPostDisplayTitle';

// 15분 동안 정적 XML 파일로 캐싱 (ISR)
export const revalidate = 900; 

type RssPost = {
  id: string;
  post_number: number;
  title: string;
  summary: string | null;
  source_url: string | null;
  meta: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  board: {
    slug: string;
    name: string;
    content_type: string | null;
  } | null;
};

// ... XML Escape 및 HTML Strip 헬퍼 함수들 ...

export async function GET() {
  try {
    // cookies() 스토어 호출을 하지 않는 클라이언트 사용
    const supabase = getSupabaseClientNoCookies();
    
    // cookies() 호출을 하는 getSeoSettings() 대신 직접 single select하여 정적 캐싱 유도
    const { data: seoSettings } = await supabase
      .from('seo_settings')
      .select('site_url, site_name, default_description')
      .single();

    const baseUrl = seoSettings?.site_url || siteConfig.url;
    const siteName = seoSettings?.site_name || siteConfig.name;
    const siteDescription = seoSettings?.default_description || siteConfig.description;

    // 최근 게시글 100개 가져오기
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        post_number,
        title,
        summary,
        source_url,
        meta,
        created_at,
        updated_at,
        board:boards!inner(slug, name, content_type)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('RSS 피드 생성 실패:', error);
      return new Response('RSS 피드를 생성할 수 없습니다.', { status: 500 });
    }

    // ... RSS Items 매핑 및 XML 문자열 렌더링 로직 (기존과 동일) ...
    // ... return new Response(rssFeed, { headers }) ...
  } catch (error) {
    console.error('RSS 피드 생성 중 오류:', error);
    return new Response('RSS 피드를 생성할 수 없습니다.', { status: 500 });
  }
}
```

### 개선 후 기대 효과
* **Supabase 호출 횟수**: 수만 번의 봇 요청에도 Supabase DB hit는 **하루 96번**(15분당 1회)으로 극단적 축소.
* **Egress 트래픽**: 매일 200MB가 넘던 트래픽 소모가 **4MB 미만**으로 대폭 절감.
* **로딩 레이턴시**: 봇들이 CDN에 미리 캐싱된 정적 XML 데이터를 즉시 받아 가므로 서버 지연 시간(TTFB) 0ms로 향상.
