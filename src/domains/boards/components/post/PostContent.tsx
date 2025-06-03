'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

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
  const [isMounted, setIsMounted] = useState(false);
  
  // content가 객체인 경우 HTML로 변환
  const processContent = () => {
    if (!content) return '';
    
    // 이미 문자열인 경우 그대로 반환 (기존 HTML 내용)
    if (typeof content === 'string') {
      return content;
    }
    
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
    
    // 기본값
    return '';
  };
  
  // 소셜 임베드와 매치카드 백업 처리 함수
  const processEmbeds = useCallback(() => {
    if (!contentRef.current || !isMounted) return;
    const rootElement = contentRef.current;
    
    // 1. 서버에서 처리되지 않은 매치카드 백업 처리
    const unprocessedMatchCards = rootElement.querySelectorAll('[data-type="match-card"]:not(.processed-match-card)');
    
    if (unprocessedMatchCards.length > 0) {
      unprocessedMatchCards.forEach((element, index) => {
        try {
          const matchDataString = element.getAttribute('data-match');
          const matchId = element.getAttribute('data-match-id');
          
          if (matchDataString) {
            const decodedData = decodeURIComponent(matchDataString);
            const matchData = JSON.parse(decodedData);
            
            // 간단한 매치카드 HTML 생성
            const { teams, goals, league } = matchData;
            const homeTeam = teams?.home || { name: '홈팀', logo: '/placeholder.png' };
            const awayTeam = teams?.away || { name: '원정팀', logo: '/placeholder.png' };
            const leagueData = league || { name: '알 수 없는 리그', logo: '/placeholder.png' };
            const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
            const awayScore = typeof goals?.away === 'number' ? goals.away : '-';
            const actualMatchId = matchData.id || matchId || 'unknown';
            
            const cardElement = element as HTMLElement;
            cardElement.innerHTML = `
              <a href="/livescore/football/match/${actualMatchId}">
                <div class="league-header">
                  <div style="display: flex; align-items: center;">
                    <img 
                      src="${leagueData.logo}" 
                      alt="${leagueData.name}" 
                      class="league-logo"
                      onerror="this.onerror=null;this.src='/placeholder.png';"
                    />
                    <span class="league-name">${leagueData.name}</span>
                  </div>
                </div>
                
                <div class="match-main">
                  <div class="team-info">
                    <img 
                      src="${homeTeam.logo}" 
                      alt="${homeTeam.name}" 
                      class="team-logo"
                      onerror="this.onerror=null;this.src='/placeholder.png';"
                    />
                    <span class="team-name">${homeTeam.name}</span>
                  </div>
                  
                  <div class="score-area">
                    <div class="score">
                      <span class="score-number">${homeScore}</span>
                      <span class="score-separator">-</span>
                      <span class="score-number">${awayScore}</span>
                    </div>
                    <div class="match-status">경기 결과</div>
                  </div>
                  
                  <div class="team-info">
                    <img 
                      src="${awayTeam.logo}" 
                      alt="${awayTeam.name}" 
                      class="team-logo"
                      onerror="this.onerror=null;this.src='/placeholder.png';"
                    />
                    <span class="team-name">${awayTeam.name}</span>
                  </div>
                </div>
                
                <div class="match-footer">
                  <span class="footer-link">매치 상세 정보</span>
                </div>
              </a>
            `;
            
            cardElement.classList.add('match-card', 'processed-match-card');
            cardElement.setAttribute('data-processed', 'true');
            
          }
        } catch (error) {
          console.error(`PostContent - 백업 매치카드 ${index + 1} 처리 오류:`, error);
        }
      });
    }
    
    // 2. 소셜 임베드 요소 처리
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
          if (!document.getElementById('twitter-widget-js')) {
            const script = document.createElement('script');
            script.id = 'twitter-widget-js';
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            document.body.appendChild(script);
          }
          
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
          
          if (window.twttr) {
            window.twttr.widgets.load();
          }
        } else if (platform === 'instagram') {
          if (!document.getElementById('instagram-embed-js')) {
            const script = document.createElement('script');
            script.id = 'instagram-embed-js';
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
          }
          
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
  }, [isMounted]);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // 소셜 임베드와 매치카드 백업 처리
  useEffect(() => {
    if (!isMounted) return;
    
    const timeoutId = setTimeout(() => {
      processEmbeds();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isMounted, processEmbeds, content]);
  
  return (
    <>
      <style jsx>{`
        /* 경기 카드 기본 스타일 */
        :global(.match-card),
        :global(.processed-match-card) {
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          margin: 12px 0 !important;
          background: white !important;
          width: 100% !important;
          max-width: 100% !important;
          display: block !important;
        }
        
        /* 경기 카드 링크 스타일 */
        :global(.match-card a),
        :global(.processed-match-card a) {
          display: block !important;
          text-decoration: none !important;
          color: inherit !important;
        }
        
        /* 경기 카드 이미지 스타일 */
        :global(.match-card img),
        :global(.processed-match-card img) {
          object-fit: contain !important;
          flex-shrink: 0 !important;
          display: block !important;
        }
        
        /* 리그 헤더 스타일 */
        :global(.match-card .league-header),
        :global(.processed-match-card .league-header) {
          padding: 12px !important;
          background-color: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
          display: flex !important;
          align-items: center !important;
          height: 40px !important;
        }
        
        /* 리그 로고 스타일 */
        :global(.match-card .league-logo),
        :global(.processed-match-card .league-logo) {
          width: 24px !important;
          height: 24px !important;
          object-fit: contain !important;
          margin-right: 8px !important;
          flex-shrink: 0 !important;
        }
        
        /* 리그 이름 스타일 */
        :global(.match-card .league-name),
        :global(.processed-match-card .league-name) {
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #4b5563 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        
        /* 메인 경기 정보 스타일 */
        :global(.match-card .match-main),
        :global(.processed-match-card .match-main) {
          padding: 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }
        
        /* 팀 정보 스타일 */
        :global(.match-card .team-info),
        :global(.processed-match-card .team-info) {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 40% !important;
        }
        
        /* 팀 로고 스타일 */
        :global(.match-card .team-logo),
        :global(.processed-match-card .team-logo) {
          width: 48px !important;
          height: 48px !important;
          object-fit: contain !important;
          margin-bottom: 8px !important;
          flex-shrink: 0 !important;
        }
        
        /* 팀 이름 스타일 */
        :global(.match-card .team-name),
        :global(.processed-match-card .team-name) {
          font-size: 14px !important;
          font-weight: 500 !important;
          text-align: center !important;
          line-height: 1.2 !important;
          color: #000 !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }
        
        /* 승리 팀 이름 스타일 */
        :global(.match-card .team-name.winner),
        :global(.processed-match-card .team-name.winner) {
          color: #2563eb !important;
        }
        
        /* 스코어 영역 스타일 */
        :global(.match-card .score-area),
        :global(.processed-match-card .score-area) {
          text-align: center !important;
          flex-shrink: 0 !important;
          width: 20% !important;
        }
        
        /* 스코어 스타일 */
        :global(.match-card .score),
        :global(.processed-match-card .score) {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-bottom: 8px !important;
        }
        
        /* 스코어 숫자 스타일 */
        :global(.match-card .score-number),
        :global(.processed-match-card .score-number) {
          font-size: 24px !important;
          font-weight: bold !important;
          min-width: 24px !important;
          text-align: center !important;
        }
        
        /* 스코어 구분자 스타일 */
        :global(.match-card .score-separator),
        :global(.processed-match-card .score-separator) {
          color: #9ca3af !important;
          margin: 0 4px !important;
        }
        
        /* 경기 상태 스타일 */
        :global(.match-card .match-status),
        :global(.processed-match-card .match-status) {
          font-size: 12px !important;
          color: #6b7280 !important;
        }
        
        /* 진행 중 경기 상태 스타일 */
        :global(.match-card .match-status.live),
        :global(.processed-match-card .match-status.live) {
          color: #059669 !important;
          font-weight: 500 !important;
        }
        
        /* 푸터 스타일 */
        :global(.match-card .match-footer),
        :global(.processed-match-card .match-footer) {
          padding: 8px 12px !important;
          background-color: #f9fafb !important;
          border-top: 1px solid #e5e7eb !important;
          text-align: center !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        /* 푸터 링크 스타일 */
        :global(.match-card .footer-link),
        :global(.processed-match-card .footer-link) {
          font-size: 12px !important;
          color: #2563eb !important;
          text-decoration: underline !important;
        }
        
        /* 반응형 비디오 컨테이너 */
        :global(.responsive-video-container) {
          position: relative;
          width: 100%;
          margin: 1rem 0;
        }
        
        :global(.youtube-container iframe) {
          width: 100%;
          max-width: 640px;
          height: 360px;
        }
        
        :global(.video-wrapper video) {
          width: 100%;
          max-width: 640px;
          height: auto;
        }
        
        /* RSS 콘텐츠 스타일 */
        :global(.rss-content) {
          line-height: 1.6;
        }
        
        :global(.rss-content img) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        
        /* 일반 이미지 스타일 */
        :global(.prose img) {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px !important;
          margin: 16px auto !important;
          display: block !important;
        }
      `}</style>
    <div 
      ref={contentRef}
      className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:font-bold prose-img:rounded-lg prose-img:mx-auto p-4 sm:p-6"
      dangerouslySetInnerHTML={{ __html: processContent() }}
    />
    </>
  );
} 