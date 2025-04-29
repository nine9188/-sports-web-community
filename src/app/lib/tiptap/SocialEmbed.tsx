'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import React, { useEffect, useState } from 'react';

// 지원하는 소셜 미디어 플랫폼 타입
type SocialPlatform = 'youtube' | 'twitter' | 'instagram';

// 소셜 미디어 임베드 컴포넌트를 위한 Props
interface SocialEmbedProps {
  platform: SocialPlatform;
  url: string;
  nodeViewProps: NodeViewProps;
}

// 각 플랫폼별 스크립트 URL
const PLATFORM_SCRIPTS = {
  twitter: 'https://platform.twitter.com/widgets.js',
  instagram: 'https://www.instagram.com/embed.js',
};

// 각 플랫폼별 정규식
const URL_REGEX = {
  youtube: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  twitter: /(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i,
  instagram: /(?:www\.)?instagram\.com(?:\/p|\/reel)\/([a-zA-Z0-9_-]+)/i,
};

// 스크립트 로딩 헬퍼 함수
const loadScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 스크립트인지 확인
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
};

// YouTube 임베드를 위한 컴포넌트
const YouTubeEmbed: React.FC<{ videoId: string }> = ({ videoId }) => {
  return (
    <div className="youtube-embed">
      <iframe
        width="100%"
        height="400"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

// Twitter 임베드를 위한 컴포넌트
const TwitterEmbed: React.FC<{ tweetId: string }> = ({ tweetId }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // 이미 트위터 위젯 스크립트가 로드되었는지 확인
    loadScript(PLATFORM_SCRIPTS.twitter, 'twitter-widget-js')
      .then(() => {
        setLoaded(true);
        // 트위터 위젯 렌더링
        if (window.twttr) {
          window.twttr.widgets.load();
        }
      })
      .catch(console.error);
  }, [tweetId]);

  return (
    <div className="twitter-embed my-4">
      <blockquote className="twitter-tweet" data-conversation="none">
        <a href={`https://twitter.com/i/status/${tweetId}`}>Loading Tweet...</a>
      </blockquote>
      {!loaded && <div className="text-center py-4 text-gray-500">트윗을 불러오는 중...</div>}
    </div>
  );
};

// Instagram 임베드를 위한 컴포넌트
const InstagramEmbed: React.FC<{ postId: string }> = ({ postId }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadScript(PLATFORM_SCRIPTS.instagram, 'instagram-embed-js')
      .then(() => {
        setLoaded(true);
        // Instagram 임베드 처리
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      })
      .catch(console.error);
  }, [postId]);

  return (
    <div className="instagram-embed my-4">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: '0',
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          margin: '1px',
          maxWidth: '540px',
          minWidth: '326px',
          padding: '0',
          width: '99.375%',
        }}
      >
        <div style={{ padding: '16px' }}>
          <a
            href={`https://www.instagram.com/p/${postId}/`}
            style={{
              background: '#FFFFFF',
              lineHeight: '0',
              padding: '0 0',
              textAlign: 'center',
              textDecoration: 'none',
              width: '100%',
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram 게시물 보기
          </a>
        </div>
      </blockquote>
      {!loaded && <div className="text-center py-4 text-gray-500">인스타그램 게시물을 불러오는 중...</div>}
    </div>
  );
};

// 소셜 임베드를 위한 React 컴포넌트
const SocialEmbedComponent: React.FC<SocialEmbedProps> = ({
  platform,
  url,
}) => {
  // URL에서 ID 추출
  const extractId = (url: string, platform: SocialPlatform): string | null => {
    const regex = URL_REGEX[platform];
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const id = extractId(url, platform);

  if (!id) {
    return (
      <NodeViewWrapper className="social-embed-error">
        <div className="p-4 border rounded bg-red-50 text-red-600">
          지원하지 않는 링크입니다.
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className={`social-embed ${platform}-embed`}>
      {platform === 'youtube' && <YouTubeEmbed videoId={id} />}
      {platform === 'twitter' && <TwitterEmbed tweetId={id} />}
      {platform === 'instagram' && <InstagramEmbed postId={id} />}
    </NodeViewWrapper>
  );
};

// URL에서 플랫폼 감지 함수
export const detectPlatform = (url: string): SocialPlatform | null => {
  if (URL_REGEX.youtube.test(url)) return 'youtube';
  if (URL_REGEX.twitter.test(url)) return 'twitter';
  if (URL_REGEX.instagram.test(url)) return 'instagram';
  return null;
};

// TipTap 확장 정의
export const SocialEmbed = Node.create({
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
  
  defining: true,
  
  addAttributes() {
    return {
      platform: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-platform'),
        renderHTML: (attributes: Record<string, string>) => {
          return {
            'data-platform': attributes.platform,
          };
        },
      },
      url: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-url'),
        renderHTML: (attributes: Record<string, string>) => {
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
  
  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => {
      const { node } = props;
      const platform = node.attrs.platform as SocialPlatform;
      const url = node.attrs.url as string;
      
      return (
        <SocialEmbedComponent
          platform={platform}
          url={url}
          nodeViewProps={props}
        />
      );
    });
  },
});

// 글로벌 타입 확장을 위한 선언
declare global {
  interface Window {
    twttr: {
      widgets: {
        load: () => void;
      };
      [key: string]: unknown;
    } | undefined;
    instgrm: {
      Embeds: {
        process: () => void;
      };
      [key: string]: unknown;
    } | undefined;
  }
} 