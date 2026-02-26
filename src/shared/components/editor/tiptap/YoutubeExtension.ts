import { Node, mergeAttributes } from '@tiptap/core';

export interface YoutubeOptions {
  addPasteHandler: boolean;
  allowFullscreen: boolean;
  controls: boolean;
  height: number;
  HTMLAttributes: Record<string, string | number | boolean>;
  width: number;
  nocookie: boolean;
  origin: string;
  autoplay: boolean;
  modestbranding: boolean;
  related: boolean;
  responsive: boolean;
}

// YouTube ID를 추출하는 정규식 헬퍼 함수
const getYoutubeId = (url: string): string | null => {
  // 다양한 YouTube URL 형식 처리 (일반, 짧은 URL, 임베드 등)
  const regex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regex);
  return match && match[1].length === 11 ? match[1] : null;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      /**
       * 유튜브 동영상 추가
       */
      setYoutubeVideo: (options: { src: string, caption?: string, width?: number, height?: number }) => ReturnType;
      /**
       * 유튜브 URL 붙여넣기
       */
      pasteYoutubeLink: (url: string) => ReturnType;
    };
  }
}

export const YoutubeExtension = Node.create<YoutubeOptions>({
  name: 'youtube',
  
  group: 'block',
  
  atom: true,
  
  draggable: true,
  
  addOptions() {
    return {
      addPasteHandler: true,
      allowFullscreen: true,
      controls: true,
      height: 360,
      HTMLAttributes: {
        class: 'youtube-container',
      },
      width: 640,
      nocookie: false,
      origin: '',
      autoplay: false,
      modestbranding: true,
      related: false,
      responsive: true,
    };
  },
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      caption: {
        default: null,
      },
      start: {
        default: 0,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video] iframe',
      },
      {
        tag: 'div[data-type="youtube"]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { caption, ...attrs } = HTMLAttributes;
    
    // YouTube ID 추출
    const youtubeId = getYoutubeId(attrs.src);
    
    if (!youtubeId) {
      return ['div', { class: 'invalid-youtube' }, '유효하지 않은 YouTube URL입니다'];
    }
    
    const domain = this.options.nocookie ? 'www.youtube-nocookie.com' : 'www.youtube.com';
    
    // 쿼리 파라미터 구성
    const params = [
      this.options.controls ? 'controls=1' : 'controls=0',
      this.options.autoplay ? 'autoplay=1' : '',
      this.options.modestbranding ? 'modestbranding=1' : '',
      !this.options.related ? 'rel=0' : '',
      attrs.start ? `start=${attrs.start}` : '',
    ].filter(Boolean).join('&');
    
    // 컨테이너 클래스 설정
    const containerClass = this.options.responsive 
      ? `${this.options.HTMLAttributes.class} responsive-video-container` 
      : this.options.HTMLAttributes.class;
    
    // 최종 iframe 소스 URL 생성
    const embedUrl = `https://${domain}/embed/${youtubeId}${params ? `?${params}` : ''}`;
    
    return [
      'div',
      { 
        'data-type': 'youtube',
        'data-youtube-video': '',
        class: containerClass, 
      },
      [
        'iframe',
        mergeAttributes(
          {
            src: embedUrl,
            width: attrs.width || this.options.width,
            height: attrs.height || this.options.height,
            frameborder: '0',
            allowfullscreen: this.options.allowFullscreen ? 'true' : null,
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          }
        ),
      ],
      caption ? ['figcaption', { class: 'youtube-caption' }, caption] : '',
    ];
  },
  
  addCommands() {
    return {
      setYoutubeVideo: (options) => ({ commands }) => {
        if (!options.src) {
          return false;
        }

        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
      pasteYoutubeLink: (url) => ({ commands }) => {
        // YouTube URL 유효성 검증
        const youtubeId = getYoutubeId(url);
        if (!youtubeId) {
          return false;
        }

        return commands.insertContent({
          type: this.name,
          attrs: {
            src: url,
          },
        });
      }
    };
  },
});

export default YoutubeExtension; 