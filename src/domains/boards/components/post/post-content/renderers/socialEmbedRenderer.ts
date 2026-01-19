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
    <div class="linkedin-embed my-4 max-w-full overflow-hidden">
      <a
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 p-4 bg-[#F5F5F5] dark:bg-[#262626] border border-black/7 dark:border-white/10 rounded-lg hover:bg-[#EAEAEA] dark:hover:bg-[#333333] transition-colors"
      >
        <div class="flex-1 min-w-0 overflow-hidden">
          <div class="font-semibold text-gray-900 dark:text-[#F0F0F0]">LinkedIn 게시물 보기</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 truncate">${url}</div>
        </div>
        <svg class="w-10 h-10 text-[#0A66C2] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
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
