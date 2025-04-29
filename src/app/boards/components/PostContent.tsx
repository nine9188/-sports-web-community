'use client';

import React, { useEffect, useRef } from 'react';
import { generateMatchCardHTML } from '@/app/utils/matchCardRenderer';

// 글로벌 타입 확장
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

// TipTap 문서 타입 정의
interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: {
    type: string;
    attrs?: {
      href?: string;
      target?: string;
      rel?: string;
    }
  }[];
  attrs?: {
    src?: string;
    alt?: string;
    [key: string]: unknown;
  };
}

interface TipTapDoc {
  type: string;
  content: TipTapNode[];
}

// 추가 인터페이스 정의
interface RssPost {
  source_url?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  image_url?: string;
  [key: string]: unknown;
}

interface PostContentProps {
  content: string | TipTapDoc | RssPost | Record<string, unknown>;
}

export default function PostContent({ content }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // content가 객체인 경우 HTML로 변환
  const processContent = () => {
    if (!content) return '';
    
    // 객체인 경우 JSON 구조를 HTML로 변환
    if (typeof content === 'object') {
      try {
        // RSS 게시글인지 확인 (source_url 필드가 있는 경우가 많음)
        const isRssPost = Boolean(
          'source_url' in content || 
          (content as RssPost).source_url
        );
        
        // Tiptap JSON 구조 또는 다른 JSON 구조 처리
        let htmlContent = '<div class="rss-content">';
        
        // RSS 게시글이면 원문 링크와 출처 표시를 먼저 추가
        if (isRssPost) {
          const rssPost = content as RssPost;
          const sourceUrl = rssPost.source_url;
          
          if (sourceUrl) {
            // 이미지 URL 직접 사용 (외부 API 대신)
            const imageUrl = rssPost.imageUrl || rssPost.image_url;
            
            htmlContent += `
              <div class="mb-6">
                ${imageUrl ? `
                <div class="mb-4 relative overflow-hidden rounded-lg">
                  <img 
                    src="${imageUrl}" 
                    alt="기사 이미지" 
                    class="w-full h-auto"
                    onerror="this.onerror=null;this.style.display='none';"
                  />
                </div>` : ''}
                <div class="flex justify-between items-center mb-4">
                  <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" 
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    원문 보기
                  </a>
                  <span class="text-xs text-gray-500">출처: 풋볼리스트(FOOTBALLIST)</span>
                </div>
              </div>
            `;
          }
        }
        
        // JSON 구조가 Tiptap 형식인 경우
        if ('type' in content && content.type === 'doc' && 'content' in content && Array.isArray((content as TipTapDoc).content)) {
          const tipTapDoc = content as TipTapDoc;
          
          tipTapDoc.content.forEach((node) => {
            if (node.type === 'paragraph' && Array.isArray(node.content)) {
              htmlContent += '<p>';
              node.content.forEach((textNode) => {
                if (textNode.type === 'text') {
                  if (textNode.marks && textNode.marks.length > 0) {
                    // 링크 처리
                    const linkMark = textNode.marks.find((mark) => mark.type === 'link');
                    if (linkMark && linkMark.attrs && linkMark.attrs.href) {
                      htmlContent += `<a href="${linkMark.attrs.href}" target="${linkMark.attrs.target || '_blank'}" rel="${linkMark.attrs.rel || 'noopener noreferrer'}">${textNode.text}</a>`;
                    } else {
                      htmlContent += textNode.text;
                    }
                  } else {
                    htmlContent += textNode.text;
                  }
                }
              });
              htmlContent += '</p>';
            } else if (node.type === 'image' && node.attrs && node.attrs.src) {
              htmlContent += `<img src="${node.attrs.src}" alt="${node.attrs.alt || ''}" class="max-w-full mx-auto my-4 rounded-lg" />`;
            }
          });
        } else {
          // 간단한 내용 추출 시도 (RSS 항목에서 description 필드 추출)
          const rssPost = content as RssPost;
          if ('description' in content && typeof rssPost.description === 'string') {
            htmlContent += `<div class="rss-description my-4">${rssPost.description}</div>`;
          } else if ('content' in content && typeof (content as RssPost).content === 'string') {
            // content 필드도 확인 (일부 RSS 피드에서는 content 필드에 본문이 저장됨)
            htmlContent += `<div class="rss-content-full my-4">${(content as RssPost).content}</div>`;
          } else {
            // 다른 형태의 JSON인 경우 - 가독성을 위해 스타일 적용된 형태로 출력
            htmlContent += `
              <div class="bg-gray-50 p-4 rounded-md overflow-auto text-sm font-mono">
                <pre>${JSON.stringify(content, null, 2)}</pre>
              </div>
            `;
          }
        }
        
        htmlContent += '</div>';
        return htmlContent;
      } catch (error) {
        console.error('JSON content 처리 오류:', error);
        return `<div class="text-red-500">오류: 게시글 내용을 표시할 수 없습니다.</div>`;
      }
    }
    
    // 이미 문자열인 경우 그대로 반환 (기존 HTML 내용)
    return content;
  };
  
  useEffect(() => {
    if (!contentRef.current) return;
    const rootElement = contentRef.current;
    
    // 1. 경기 카드 요소 처리
    const matchCardElements = rootElement.querySelectorAll('div[data-type="match-card"]');
    
    matchCardElements.forEach((element) => {
      try {
        // 데이터 속성 가져오기
        const matchIdAttr = element.getAttribute('data-match-id');
        const matchDataAttr = element.getAttribute('data-match');
        
        // 데이터 속성 검증
        if (!matchDataAttr) {
          element.innerHTML = `<div style="padding:12px;text-align:center;color:#ef4444;">
            경기 데이터를 불러올 수 없습니다.
          </div>`;
          return;
        }
        
        // HTML 디코딩 (특수문자 이슈 해결)
        const decodedData = decodeURIComponent(matchDataAttr);
        
        // 데이터 파싱
        const matchData = JSON.parse(decodedData);
        
        // 필요한 데이터 추출
        const matchId = matchIdAttr || matchData.fixture?.id || 'unknown';
        
        // 공통 유틸리티 함수 사용
        const cardHTML = generateMatchCardHTML(matchData, matchId);
        
        // HTML 교체
        element.outerHTML = cardHTML;
      }
      catch {
        element.innerHTML = `<div style="padding:12px;text-align:center;color:#ef4444;">
          경기 데이터 처리 중 오류가 발생했습니다.
        </div>`;
      }
    });
    
    // 2. 소셜 임베드 처리
    const socialEmbedElements = rootElement.querySelectorAll('div[data-type="social-embed"]');
    
    socialEmbedElements.forEach((element) => {
      try {
        const platform = element.getAttribute('data-platform');
        const url = element.getAttribute('data-url');
        
        if (!platform || !url) {
          element.innerHTML = `<div class="p-4 border rounded bg-red-50 text-red-600">
            지원하지 않는 링크입니다.
          </div>`;
          return;
        }
        
        // 플랫폼별 처리
        if (platform === 'youtube') {
          // YouTube ID 추출
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
          const match = url.match(youtubeRegex);
          const videoId = match ? match[1] : null;
          
          if (!videoId) {
            element.innerHTML = `<div class="p-4 border rounded bg-red-50 text-red-600">
              지원하지 않는 YouTube 링크입니다.
            </div>`;
            return;
          }
          
          element.innerHTML = `
            <div class="youtube-embed my-4">
              <iframe
                width="100%"
                height="400"
                src="https://www.youtube.com/embed/${videoId}"
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          `;
        } else if (platform === 'twitter') {
          // 트위터 임베드 스크립트 로드
          if (!document.getElementById('twitter-widget-js')) {
            const script = document.createElement('script');
            script.id = 'twitter-widget-js';
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            document.body.appendChild(script);
          }
          
          // 트위터 ID 추출
          const twitterRegex = /(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/i;
          const match = url.match(twitterRegex);
          const tweetId = match ? match[1] : null;
          
          if (!tweetId) {
            element.innerHTML = `<div class="p-4 border rounded bg-red-50 text-red-600">
              지원하지 않는 트위터 링크입니다.
            </div>`;
            return;
          }
          
          element.innerHTML = `
            <div class="twitter-embed my-4">
              <blockquote class="twitter-tweet" data-conversation="none">
                <a href="https://twitter.com/i/status/${tweetId}">Loading Tweet...</a>
              </blockquote>
            </div>
          `;
          
          // 트위터 위젯 렌더링
          if (window.twttr) {
            window.twttr.widgets.load();
          }
        } else if (platform === 'instagram') {
          // 인스타그램 임베드 스크립트 로드
          if (!document.getElementById('instagram-embed-js')) {
            const script = document.createElement('script');
            script.id = 'instagram-embed-js';
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
          }
          
          // 인스타그램 ID 추출
          const instagramRegex = /(?:www\.)?instagram\.com(?:\/p|\/reel)\/([a-zA-Z0-9_-]+)/i;
          const match = url.match(instagramRegex);
          const postId = match ? match[1] : null;
          
          if (!postId) {
            element.innerHTML = `<div class="p-4 border rounded bg-red-50 text-red-600">
              지원하지 않는 인스타그램 링크입니다.
            </div>`;
            return;
          }
          
          element.innerHTML = `
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
          
          // 인스타그램 임베드 처리
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        }
      } catch (error) {
        console.error('소셜 임베드 처리 중 오류 발생:', error);
        element.innerHTML = `<div class="p-4 border rounded bg-red-50 text-red-600">
          소셜 미디어 콘텐츠를 로드하는 중 오류가 발생했습니다.
        </div>`;
      }
    });
    
    // 3. YouTube iframe 처리
    const youtubeElements = rootElement.querySelectorAll('div[data-type="youtube"]');
    
    // TipTap의 YouTube 익스텐션으로 생성된 요소 처리
    if (youtubeElements.length > 0) {
      youtubeElements.forEach(container => {
        // 이미 래핑되어 있는지 확인
        if (!container.classList.contains('responsive-video-container')) {
          container.classList.add('responsive-video-container');
        }
        
        // iframe 요소 가져오기
        const iframe = container.querySelector('iframe');
        if (iframe) {
          // 필수 속성 설정
          iframe.setAttribute('allowfullscreen', 'true');
          iframe.setAttribute('frameborder', '0');
          
          // 반응형을 위한 스타일 조정
          iframe.style.maxWidth = '100%';
          iframe.style.border = '0';
        }
        
        // 캡션 처리
        const caption = container.querySelector('.youtube-caption');
        if (caption) {
          caption.classList.add('text-sm', 'text-gray-500', 'text-center', 'mt-2');
        }
      });
    }
    
    // 기존 iframe 요소 처리 (TipTap 외부에서 추가된 경우)
    const iframeElements = rootElement.querySelectorAll('iframe');
    iframeElements.forEach(iframe => {
      const src = iframe.getAttribute('src');
      if (src && (src.includes('youtube.com') || src.includes('youtu.be'))) {
        // 부모 요소 가져오기
        const parent = iframe.parentElement;
        
        // YouTube iframe이 이미 youtube-container 내에 있는지 확인
        if (parent && !parent.classList.contains('youtube-container') && 
            !parent.classList.contains('responsive-video-container') &&
            !parent.hasAttribute('data-type')) {
          
          // 반응형 컨테이너로 래핑
          const wrapper = document.createElement('div');
          wrapper.className = 'youtube-container responsive-video-container';
          
          // 기존 iframe을 복제
          const clonedIframe = iframe.cloneNode(true) as HTMLIFrameElement;
          
          // 속성 설정
          clonedIframe.setAttribute('allowfullscreen', 'true');
          clonedIframe.setAttribute('frameborder', '0');
          clonedIframe.style.maxWidth = '100%';
          clonedIframe.style.border = '0';
          
          // 래퍼에 복제된 iframe 추가
          wrapper.appendChild(clonedIframe);
          
          // 기존 iframe 대체
          parent.replaceChild(wrapper, iframe);
        } else if (iframe) {
          // iframe이 이미 적절한 컨테이너 내에 있을 때 속성만 추가
          iframe.setAttribute('allowfullscreen', 'true');
          iframe.setAttribute('frameborder', '0');
        }
      }
    });
    
    // 3. 일반 비디오 처리
    const videoElements = rootElement.querySelectorAll('video');
    videoElements.forEach(video => {
      // controls 속성이 없으면 추가
      if (!video.hasAttribute('controls')) {
        video.setAttribute('controls', 'true');
      }
      
      // 부모 요소 확인
      const parent = video.parentElement;
      if (parent && !parent.classList.contains('video-wrapper') && !parent.classList.contains('responsive-video-container')) {
        parent.classList.add('video-wrapper');
      }
    });
  }, [content]);
  
  return (
    <div 
      ref={contentRef}
      className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:font-bold prose-img:rounded-lg prose-img:mx-auto p-4 sm:p-6"
      dangerouslySetInnerHTML={{ __html: processContent() }}
    />
  );
} 