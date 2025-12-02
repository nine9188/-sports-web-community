import { Node, mergeAttributes } from '@tiptap/core';

export interface VideoOptions {
  HTMLAttributes: Record<string, string | number | boolean>;
  responsive: boolean;
}

export interface VideoAttributes {
  src: string;
  width?: string;
  height?: string;
  controls?: boolean;
  caption?: string;
  poster?: string;
  autoplay?: boolean;
  playsinline?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
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
      responsive: true, // 기본값을 true로 설정
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
      poster: {
        default: null,
      },
      autoplay: {
        default: false,
      },
      playsinline: {
        default: true,
      },
      preload: {
        default: 'metadata',
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
    
    const videoAttrs = mergeAttributes(attrs, { 
      controls: 'true',
      playsinline: 'true',
      preload: attrs.preload || 'metadata',
    });
    
    const wrapperClass = this.options.responsive 
      ? `${this.options.HTMLAttributes.class} responsive-video-container` 
      : this.options.HTMLAttributes.class;
    
    return [
      'div',
      { class: wrapperClass },
      ['video', videoAttrs],
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