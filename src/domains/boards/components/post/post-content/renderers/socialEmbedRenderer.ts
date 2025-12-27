/**
 * 소셜 미디어 임베드 처리
 */

/**
 * YouTube 임베드 HTML 생성
 */
export function renderYouTubeEmbed(url: string): string | null {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(youtubeRegex);
  const videoId = match ? match[1] : null;

  if (!videoId) {
    return null;
  }

  return `
    <div class="youtube-container">
      <iframe
        src="https://www.youtube.com/embed/${videoId}"
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  `;
}

/**
 * Twitter 임베드 HTML 생성
 */
export function renderTwitterEmbed(url: string): string | null {
  const twitterRegex = /(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i;
  const match = url.match(twitterRegex);
  const tweetId = match ? match[1] : null;

  if (!tweetId) {
    return null;
  }

  return `
    <div class="twitter-embed my-4">
      <blockquote class="twitter-tweet" data-conversation="none">
        <a href="https://twitter.com/i/status/${tweetId}">Loading Tweet...</a>
      </blockquote>
    </div>
  `;
}

/**
 * Instagram 임베드 HTML 생성
 */
export function renderInstagramEmbed(url: string): string | null {
  const instagramRegex = /(?:www\.)?instagram\.com(?:\/p|\/reel)\/([a-zA-Z0-9_-]+)/i;
  const match = url.match(instagramRegex);
  const postId = match ? match[1] : null;

  if (!postId) {
    return null;
  }

  return `
    <div class="instagram-embed my-4">
      <blockquote
        class="instagram-media"
        data-instgrm-permalink="https://www.instagram.com/p/${postId}/"
        data-instgrm-version="14"
        style="
          background: #FFF;
          border: 0;
          border-radius: 3px;
          box-shadow: 0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15);
          margin: 1px;
          max-width: 540px;
          min-width: 326px;
          padding: 0;
          width: 99.375%;
        "
      >
        <div style="padding: 16px;">
          <a
            href="https://www.instagram.com/p/${postId}/"
            style="
              background: #FFFFFF;
              line-height: 0;
              padding: 0 0;
              text-align: center;
              text-decoration: none;
              width: 100%;
            "
            target="_blank"
            rel="noopener noreferrer"
          >
            인스타그램 게시물 보기
          </a>
        </div>
      </blockquote>
    </div>
  `;
}

/**
 * Facebook 임베드 HTML 생성
 */
export function renderFacebookEmbed(url: string): string {
  // 페이스북 플러그인 iframe 사용
  const encodedUrl = encodeURIComponent(url);
  return `
    <div class="facebook-embed my-4 flex justify-center">
      <iframe
        src="https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500"
        width="500"
        height="500"
        style="border:none;overflow:hidden"
        scrolling="no"
        frameborder="0"
        allowfullscreen="true"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      ></iframe>
    </div>
  `;
}

/**
 * TikTok 임베드 HTML 생성
 */
export function renderTikTokEmbed(url: string): string {
  return `
    <div class="tiktok-embed my-4 flex justify-center">
      <blockquote class="tiktok-embed" cite="${url}" data-video-id="" style="max-width: 605px;min-width: 325px;">
        <section>
          <a target="_blank" href="${url}">TikTok 영상 보기</a>
        </section>
      </blockquote>
    </div>
  `;
}

/**
 * LinkedIn 임베드 HTML 생성
 */
export function renderLinkedInEmbed(url: string): string {
  return `
    <div class="linkedin-embed my-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">LinkedIn 게시물</p>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
        게시물 보기 →
      </a>
    </div>
  `;
}

/**
 * 에러 메시지 HTML 생성
 */
export function renderEmbedError(message: string): string {
  return `<div class="p-4 border border-red-200 dark:border-red-900/50 rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
    ${message}
  </div>`;
}

/**
 * 소셜 임베드 스크립트 로드
 */
export function loadTwitterScript(): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById('twitter-widget-js')) return;

  const script = document.createElement('script');
  script.id = 'twitter-widget-js';
  script.src = 'https://platform.twitter.com/widgets.js';
  script.async = true;
  document.body.appendChild(script);
}

export function loadInstagramScript(): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById('instagram-embed-js')) return;

  const script = document.createElement('script');
  script.id = 'instagram-embed-js';
  script.src = 'https://www.instagram.com/embed.js';
  script.async = true;
  document.body.appendChild(script);
}

export function loadTikTokScript(): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById('tiktok-embed-js')) return;

  const script = document.createElement('script');
  script.id = 'tiktok-embed-js';
  script.src = 'https://www.tiktok.com/embed.js';
  script.async = true;
  document.body.appendChild(script);
}

/**
 * 소셜 임베드 요소 처리 (DOM에서)
 */
export function processSocialEmbed(element: Element): void {
  const platform = element.getAttribute('data-platform');
  const url = element.getAttribute('data-url');

  if (!platform || !url) {
    element.innerHTML = renderEmbedError('지원하지 않는 링크입니다.');
    return;
  }

  try {
    if (platform === 'youtube') {
      const embedHtml = renderYouTubeEmbed(url);
      if (embedHtml) {
        element.innerHTML = embedHtml;
      } else {
        element.innerHTML = renderEmbedError('지원하지 않는 YouTube 링크입니다.');
      }
    } else if (platform === 'twitter') {
      loadTwitterScript();
      const embedHtml = renderTwitterEmbed(url);
      if (embedHtml) {
        element.innerHTML = embedHtml;
        if (window.twttr) {
          window.twttr.widgets.load();
        }
      } else {
        element.innerHTML = renderEmbedError('지원하지 않는 트위터 링크입니다.');
      }
    } else if (platform === 'instagram') {
      loadInstagramScript();
      const embedHtml = renderInstagramEmbed(url);
      if (embedHtml) {
        element.innerHTML = embedHtml;
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      } else {
        element.innerHTML = renderEmbedError('지원하지 않는 인스타그램 링크입니다.');
      }
    } else if (platform === 'facebook') {
      const embedHtml = renderFacebookEmbed(url);
      element.innerHTML = embedHtml;
    } else if (platform === 'tiktok') {
      loadTikTokScript();
      const embedHtml = renderTikTokEmbed(url);
      element.innerHTML = embedHtml;
    } else if (platform === 'linkedin') {
      const embedHtml = renderLinkedInEmbed(url);
      element.innerHTML = embedHtml;
    }
  } catch {
    element.innerHTML = renderEmbedError('소셜 미디어 콘텐츠를 로드하는 중 오류가 발생했습니다.');
  }
}
