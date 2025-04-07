import { Node, mergeAttributes } from '@tiptap/core';

export interface VideoOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
}

export interface VideoAttributes {
  src: string;
  width?: string;
  height?: string;
  controls?: boolean;
  caption?: string;
}

export const Video = Node.create<VideoOptions>({
  name: 'video',
  
  group: 'block',
  
  content: '',
  
  marks: '',
  
  draggable: true,
  
  isolating: true,
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'video-wrapper',
      },
    };
  },
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: 'auto',
      },
      controls: {
        default: true,
      },
      caption: {
        default: null,
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'video[src]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { caption, ...attrs } = HTMLAttributes;
    
    return [
      'div',
      { class: this.options.HTMLAttributes.class },
      ['video', mergeAttributes(attrs, { controls: 'true' })],
      caption ? ['figcaption', {}, caption] : '',
    ];
  },
  
  // @ts-expect-error: tiptap 타입 정의와의 호환성 문제 무시
  addCommands() {
    return {
      // @ts-expect-error: 타입 체크 무시
      setVideo: (options: VideoAttributes) => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs: options,
          })
          .run();
      },
    };
  },
}); 