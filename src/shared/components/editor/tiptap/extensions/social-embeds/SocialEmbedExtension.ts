import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SocialEmbedComponent } from './SocialEmbedComponent';
import type { SocialPlatform } from './utils/detectPlatform';

export interface SocialEmbedOptions {
  HTMLAttributes: Record<string, string>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    socialEmbed: {
      /**
       * 소셜 미디어 임베드 추가
       */
      setSocialEmbed: (options: { platform: SocialPlatform; url: string }) => ReturnType;
    };
  }
}

export const SocialEmbedExtension = Node.create<SocialEmbedOptions>({
  name: 'socialEmbed',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: '',

  draggable: true,

  selectable: true,

  atom: true,

  addAttributes() {
    return {
      platform: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-platform'),
        renderHTML: (attributes) => {
          if (!attributes.platform) {
            return {};
          }
          return {
            'data-platform': attributes.platform,
          };
        },
      },
      url: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-url'),
        renderHTML: (attributes) => {
          if (!attributes.url) {
            return {};
          }
          return {
            'data-url': attributes.url,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="social-embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'social-embed' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addCommands() {
    return {
      setSocialEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(SocialEmbedComponent);
  },
});
