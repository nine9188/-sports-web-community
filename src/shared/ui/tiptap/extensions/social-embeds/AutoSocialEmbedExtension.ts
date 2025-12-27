import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { detectPlatform } from './utils/detectPlatform';

export interface AutoSocialEmbedOptions {
  /**
   * 자동 임베드 활성화 여부
   */
  enabled: boolean;
}

/**
 * iframe/embed 코드에서 URL 추출
 */
function extractUrlFromEmbed(text: string): string | null {
  // Facebook iframe에서 href 파라미터 추출
  const fbIframeMatch = text.match(/facebook\.com\/plugins\/post\.php\?href=([^&"'\s]+)/i);
  if (fbIframeMatch) {
    try {
      return decodeURIComponent(fbIframeMatch[1]);
    } catch {
      return fbIframeMatch[1];
    }
  }

  // Instagram blockquote에서 URL 추출
  const igMatch = text.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/i);
  if (igMatch) {
    return `https://www.instagram.com/p/${igMatch[1]}/`;
  }

  // Twitter/X blockquote에서 URL 추출
  const twitterMatch = text.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i);
  if (twitterMatch) {
    return `https://twitter.com/i/status/${twitterMatch[1]}`;
  }

  // TikTok에서 URL 추출
  const tiktokMatch = text.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  if (tiktokMatch) {
    return text.match(/(https?:\/\/[^\s"'<>]+tiktok\.com[^\s"'<>]+)/i)?.[1] || null;
  }

  // YouTube iframe에서 video ID 추출
  const ytIframeMatch = text.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (ytIframeMatch) {
    return `https://www.youtube.com/watch?v=${ytIframeMatch[1]}`;
  }

  return null;
}

export const AutoSocialEmbedExtension = Extension.create<AutoSocialEmbedOptions>({
  name: 'autoSocialEmbed',

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey('autoSocialEmbed'),
        props: {
          handlePaste: (view, event) => {
            if (!extension.options.enabled) {
              return false;
            }

            const text = event.clipboardData?.getData('text/plain');
            const html = event.clipboardData?.getData('text/html');

            if (!text && !html) {
              return false;
            }

            const pastedContent = text?.trim() || html?.trim() || '';

            if (!pastedContent) {
              return false;
            }

            let url: string | null = null;
            let platform: ReturnType<typeof detectPlatform> = null;

            // 1. 먼저 직접 URL인지 확인
            const urlPattern = /^https?:\/\//i;
            if (urlPattern.test(pastedContent)) {
              url = pastedContent;
              platform = detectPlatform(url);
            }

            // 2. URL이 아니면 embed 코드에서 URL 추출 시도
            if (!platform) {
              url = extractUrlFromEmbed(pastedContent);
              if (url) {
                platform = detectPlatform(url);
              }
            }

            // 3. HTML에서도 시도
            if (!platform && html) {
              url = extractUrlFromEmbed(html);
              if (url) {
                platform = detectPlatform(url);
              }
            }

            if (!platform || !url) {
              return false;
            }

            // 소셜 임베드 노드 삽입
            const { state, dispatch } = view;
            const { tr } = state;

            const node = state.schema.nodes.socialEmbed?.create({
              platform,
              url,
            });

            if (!node) {
              return false;
            }

            // 현재 선택 위치에 노드 삽입
            tr.replaceSelectionWith(node);
            dispatch(tr);

            // 기본 붙여넣기 동작 방지
            return true;
          },
        },
      }),
    ];
  },
});
