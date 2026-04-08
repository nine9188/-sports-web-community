import { siteConfig } from '@/shared/config';

const WEBSUB_HUB = 'https://pubsubhubbub.appspot.com';

/**
 * WebSub Hub에 RSS 피드 업데이트를 알림
 * 게시글 작성/수정 시 호출하면 구글이 빠르게 인지
 */
export async function pingWebSubHub(): Promise<void> {
  try {
    await fetch(WEBSUB_HUB, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `hub.mode=publish&hub.url=${encodeURIComponent(`${siteConfig.url}/rss.xml`)}`,
    });
  } catch (error) {
    // ping 실패해도 게시글 작성에 영향 없도록 무시
    console.error('WebSub ping failed:', error);
  }
}
