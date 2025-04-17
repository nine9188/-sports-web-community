# 유튜브 크롤러 자동화 설정 가이드

이 문서는 유튜브 크롤러를 자동으로 실행하도록 설정하는 방법을 안내합니다.

## Vercel Cron Jobs 설정 (권장)

Vercel에서 호스팅하는 경우, Vercel Cron Jobs를 사용하여 주기적으로 크롤러를 실행할 수 있습니다.

### 1. `vercel.json` 파일 생성 또는 수정

프로젝트 루트 디렉토리에 `vercel.json` 파일을 생성하고 다음 내용을 추가합니다:

```json
{
  "crons": [
    {
      "path": "/api/admin/youtube/auto-crawler",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

위 설정은 4시간마다 크롤러를 실행합니다. `schedule`의 형식은 cron 표현식을 따릅니다:

- `0 */4 * * *`: 4시간마다 실행
- `0 0 * * *`: 매일 자정에 실행
- `0 0 * * 0`: 매주 일요일 자정에 실행

### 2. API 엔드포인트 구현

자동 크롤링을 처리할 API 엔드포인트를 구현합니다:

```typescript
// src/app/api/admin/youtube/auto-crawler/route.ts
import { createClient } from '@/app/lib/supabase.server';
import { NextResponse } from 'next/server';

// 모든 채널 크롤링 함수
async function crawlAllChannels() {
  const supabase = await createClient();
  
  // 모든 채널 가져오기
  const { data: channels, error } = await supabase
    .from('youtube_channels')
    .select('*');
  
  if (error || !channels || channels.length === 0) {
    return { crawled: 0, message: '크롤링할 채널이 없습니다.' };
  }
  
  // 결과 수집
  const results = [];
  
  // 각 채널에 대해 크롤링 실행
  for (const channel of channels) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/youtube/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 서버 키 기반 인증 (보안 강화)
          'X-Crawler-Secret': process.env.YOUTUBE_CRAWLER_SECRET || '',
        },
        body: JSON.stringify({ channelId: channel.id }),
      });
      
      const result = await response.json();
      results.push({ channelId: channel.id, channelName: channel.channel_name, ...result });
    } catch (error) {
      console.error(`채널 ${channel.channel_name} 크롤링 오류:`, error);
      results.push({ 
        channelId: channel.id, 
        channelName: channel.channel_name, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      });
    }
  }
  
  return { 
    crawled: channels.length,
    results
  };
}

export async function GET() {
  try {
    // Vercel Cron에서 실행하는 경우 인증 검증
    // 보안을 위해 시크릿 키 확인 (환경 변수에 설정)
    if (process.env.VERCEL_CRON_SECRET) {
      // 추가 보안 검증 로직 구현 가능
    }
    
    const results = await crawlAllChannels();
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('자동 크롤링 오류:', error);
    return NextResponse.json(
      { 
        error: '자동 크롤링 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
```

### 3. 환경 변수 설정

자동 크롤링에 필요한 환경 변수를 Vercel 대시보드에서 설정합니다:

- `NEXT_PUBLIC_APP_URL`: 앱의 기본 URL (예: https://yourdomain.com)
- `YOUTUBE_CRAWLER_SECRET`: 크롤링 API 접근을 위한 시크릿 키

## GitHub Actions 사용하기

GitHub에서 호스팅하는 경우 GitHub Actions를 사용해 주기적으로 크롤러를 실행할 수 있습니다.

### 1. GitHub Actions 워크플로우 파일 생성

`.github/workflows/youtube-crawler.yml` 파일을 생성하고 다음 내용을 추가합니다:

```yaml
name: YouTube Crawler

on:
  schedule:
    # 4시간마다 실행
    - cron: '0 */4 * * *'
  workflow_dispatch:  # 수동으로 워크플로우 실행 가능

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - name: Run YouTube Crawler
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/admin/youtube/auto-crawler" \
            -H "X-Crawler-Secret: ${{ secrets.YOUTUBE_CRAWLER_SECRET }}"
```

### 2. GitHub Secrets 설정

GitHub 저장소 설정에서 다음 Secrets를 설정합니다:

- `APP_URL`: 앱의 기본 URL
- `YOUTUBE_CRAWLER_SECRET`: 크롤링 API 접근을 위한 시크릿 키

## 주의사항

1. **API 할당량**: YouTube Data API는 일일 할당량이 있습니다. 너무 많은 요청을 보내면 할당량을 초과할 수 있습니다.

2. **보안**: 자동 크롤러 API 엔드포인트는 적절한 인증 없이 접근할 수 있으므로, 시크릿 키 기반 인증을 구현하는 것이 중요합니다.

3. **에러 처리**: 자동 크롤링 중 발생하는 오류를 로깅하고 모니터링할 수 있는 방법을 구현하세요.

4. **최적화**: 마지막 크롤링 시간 이후의 영상만 가져오도록 최적화하여 API 요청을 최소화하세요. 