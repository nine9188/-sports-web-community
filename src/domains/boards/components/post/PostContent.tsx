'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MatchData } from '@/domains/livescore/actions/footballApi';

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
  const processedElementsRef = useRef<Set<Element>>(new Set());
  
  // content가 객체인 경우 HTML로 변환
  const processContent = () => {
    if (!content) return '';
    
    // 디버깅: 실제 content 내용 확인
    console.log('PostContent - 원본 content:', content);
    console.log('PostContent - content 타입:', typeof content);
    
    // 이미 문자열인 경우 그대로 반환 (기존 HTML 내용)
    if (typeof content === 'string') {
      console.log('PostContent - 저장된 HTML 내용:', content);
      console.log('PostContent - match-card 포함 여부:', content.includes('match-card'));
      console.log('PostContent - data-type="match-card" 포함 여부:', content.includes('data-type="match-card"'));
      console.log('PostContent - processed-match-card 포함 여부:', content.includes('processed-match-card'));
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
  
  // 경기 카드 처리 함수를 useCallback으로 메모이제이션
  const processMatchCards = useCallback(() => {
    if (!contentRef.current || !isMounted) return;
    
    const rootElement = contentRef.current;
    console.log('PostContent processMatchCards - DOM 내용 확인');
    
    // 서버에서 이미 처리된 경기 카드가 있는지 확인
    const alreadyProcessedCards = rootElement.querySelectorAll('.match-card, .processed-match-card, [data-processed="true"]');
    console.log('PostContent - 이미 처리된 경기 카드 수:', alreadyProcessedCards.length);
    
    // 서버에서 이미 처리된 경기 카드가 있으면 클라이언트 처리 완전히 건너뛰기
    if (alreadyProcessedCards.length > 0) {
      console.log('PostContent - 서버에서 이미 처리된 경기 카드가 있어 클라이언트 처리 완전히 건너뛰기');
      
      // 이미 처리된 카드들을 processedElementsRef에 추가하여 중복 처리 방지
      alreadyProcessedCards.forEach(card => {
        processedElementsRef.current.add(card);
      });
      
      return;
    }
    
    // data-type="match-card" 속성을 가진 요소 찾기 (서버에서 처리되지 않은 것만)
    const matchCardDataElements = Array.from(
      rootElement.querySelectorAll('[data-type="match-card"]:not(.processed-match-card):not([data-processed="true"]):not(.match-card)')
    ).filter(element => !processedElementsRef.current.has(element));
    
    console.log('PostContent - 새로 처리할 경기 카드 요소 수:', matchCardDataElements.length);
    
    if (matchCardDataElements.length === 0) {
      console.log('PostContent - 처리할 경기 카드 없음');
          return;
        }
        
    console.log('PostContent - 클라이언트에서 경기 카드 처리 시작 (서버 처리 실패 시 백업)');
    
    // 각 경기 카드 요소 처리 (서버 처리 실패 시 백업용)
    matchCardDataElements.forEach((element, index) => {
      try {
        console.log(`PostContent - 경기 카드 데이터 ${index + 1} 처리 시작`);
        
        // 이미 처리된 요소로 마킹
        processedElementsRef.current.add(element);
        
        // data-match 속성에서 경기 데이터 추출
        const matchDataString = element.getAttribute('data-match');
        const matchId = element.getAttribute('data-match-id');
        
        if (matchDataString) {
          try {
            // URL 디코딩 후 JSON 파싱
            const decodedData = decodeURIComponent(matchDataString);
            const matchData: MatchData = JSON.parse(decodedData);
            
            console.log(`PostContent - 경기 데이터 파싱 성공:`, matchData);
            
            // 경기 카드 내용 직접 생성
            const { teams, goals, league, status } = matchData;
            const homeTeam = teams?.home || { name: '홈팀', logo: '/placeholder.png' };
            const awayTeam = teams?.away || { name: '원정팀', logo: '/placeholder.png' };
            const leagueData = league || { name: '알 수 없는 리그', logo: '/placeholder.png' };
            const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
            const awayScore = typeof goals?.away === 'number' ? goals.away : '-';
            const actualMatchId = matchData.id || matchId || 'unknown';
            
            // 경기 상태 텍스트 설정
            let statusText = '경기 결과';
            let statusClass = '';
            
            if (status) {
              const statusCode = status.code || '';
              
              if (statusCode === 'FT') {
                statusText = '경기 종료';
              } else if (statusCode === 'NS') {
                statusText = '경기 예정';
              } else if (['1H', '2H', 'HT', 'LIVE'].includes(statusCode)) {
                if (statusCode === '1H') {
                  statusText = `전반전 진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
                } else if (statusCode === '2H') {
                  statusText = `후반전 진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
                } else if (statusCode === 'HT') {
                  statusText = '하프타임';
                } else {
                  statusText = `진행 중 ${status.elapsed ? `(${status.elapsed}분)` : ''}`;
                }
                statusClass = 'color: #059669; font-weight: 500;';
              }
            }
            
            // 기존 요소를 경기 카드로 변환
            const cardElement = element as HTMLElement;
            
            // 스타일 적용
            cardElement.style.border = '1px solid #e5e7eb';
            cardElement.style.borderRadius = '8px';
            cardElement.style.overflow = 'hidden';
            cardElement.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            cardElement.style.margin = '12px 0';
            cardElement.style.background = 'white';
            cardElement.style.width = '100%';
            cardElement.style.maxWidth = '100%';
            cardElement.style.display = 'block';
            
            // 경기 카드 HTML 내용 설정
            cardElement.innerHTML = `
              <a href="/livescore/football/match/${actualMatchId}" style="display: block; text-decoration: none; color: inherit;">
                <!-- 리그 헤더 -->
                <div style="
                  padding: 12px;
                  background-color: #f9fafb;
                  border-bottom: 1px solid #e5e7eb;
                  display: flex;
                  align-items: center;
                  height: 40px;
                ">
                  <div style="display: flex; align-items: center;">
                    <img 
                      src="${leagueData.logo}" 
                      alt="${leagueData.name}" 
                      style="
                        width: 24px;
                        height: 24px;
                        object-fit: contain;
                        margin-right: 8px;
                        flex-shrink: 0;
                      "
                      onerror="this.onerror=null;this.src='/placeholder.png';"
                    />
                    <span style="
                      font-size: 14px;
                      font-weight: 500;
                      color: #4b5563;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                    ">${leagueData.name}</span>
                  </div>
                </div>
                
                <!-- 경기 카드 메인 -->
                <div style="
                  padding: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                ">
                  <!-- 홈팀 -->
                  <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 40%;
                  ">
                    <img 
                      src="${homeTeam.logo}" 
                      alt="${homeTeam.name}" 
                      style="
                        width: 48px;
                        height: 48px;
                        object-fit: contain;
                        margin-bottom: 8px;
                        flex-shrink: 0;
                      "
                      onerror="this.onerror=null;this.src='/placeholder.png';"
                    />
                    <span style="
                      font-size: 14px;
                      font-weight: 500;
                      text-align: center;
                      line-height: 1.2;
                      color: ${homeTeam.winner ? '#2563eb' : '#000'};
                      display: -webkit-box;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                    ">
                      ${homeTeam.name}
                    </span>
                  </div>
                  
                  <!-- 스코어 -->
                  <div style="
                    text-align: center;
                    flex-shrink: 0;
                    width: 20%;
                  ">
                    <div style="
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      margin-bottom: 8px;
                    ">
                      <span style="
                        font-size: 24px;
                        font-weight: bold;
                        min-width: 24px;
                        text-align: center;
                      ">${homeScore}</span>
                      <span style="
                        color: #9ca3af;
                        margin: 0 4px;
                      ">-</span>
                      <span style="
                        font-size: 24px;
                        font-weight: bold;
                        min-width: 24px;
                        text-align: center;
                      ">${awayScore}</span>
                    </div>
                    <div style="
                      font-size: 12px;
                      ${statusClass}
                    ">
                      ${statusText}
                    </div>
                  </div>
                  
                  <!-- 원정팀 -->
                  <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 40%;
                  ">
                    <img 
                      src="${awayTeam.logo}" 
                      alt="${awayTeam.name}" 
                      style="
                        width: 48px;
                        height: 48px;
                        object-fit: contain;
                        margin-bottom: 8px;
                        flex-shrink: 0;
                      "
                      onerror="this.onerror=null;this.src='/placeholder.png';"
                    />
                    <span style="
                      font-size: 14px;
                      font-weight: 500;
                      text-align: center;
                      line-height: 1.2;
                      color: ${awayTeam.winner ? '#2563eb' : '#000'};
                      display: -webkit-box;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                    ">
                      ${awayTeam.name}
                    </span>
                  </div>
                </div>
                
                <!-- 푸터 -->
                <div style="
                  padding: 8px 12px;
                  background-color: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                  text-align: center;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <span style="
                    font-size: 12px;
                    color: #2563eb;
                    text-decoration: underline;
                  ">
                    매치 상세 정보
                  </span>
                </div>
              </a>
            `;
            
            // 처리 완료 표시 (삼중 마킹으로 강력하게 보호)
            cardElement.classList.add('match-card', 'processed-match-card', 'client-processed');
            cardElement.setAttribute('data-processed', 'true');
            cardElement.setAttribute('data-client-processed', 'true');
            
            console.log(`PostContent - 경기 카드 ${index + 1} 완전한 렌더링 완료`);
          } catch (parseError) {
            console.error(`경기 데이터 파싱 오류:`, parseError);
            
            // 파싱 실패 시 기본 스타일 적용
            const cardElement = element as HTMLElement;
            cardElement.style.border = '1px solid #e5e7eb';
            cardElement.style.borderRadius = '8px';
            cardElement.style.overflow = 'hidden';
            cardElement.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
            cardElement.style.margin = '12px 0';
            cardElement.style.background = 'white';
            cardElement.style.width = '100%';
            cardElement.style.maxWidth = '100%';
            cardElement.style.padding = '12px';
            cardElement.style.textAlign = 'center';
            
            cardElement.innerHTML = `
              <div style="color: #ef4444; font-weight: 500;">
                ⚠️ 경기 카드 오류
              </div>
              <div style="margin-top: 8px; font-size: 14px; color: #666;">
                경기 정보를 불러올 수 없습니다.
              </div>
            `;
            
            cardElement.classList.add('match-card', 'processed-match-card', 'client-processed');
            cardElement.setAttribute('data-processed', 'true');
            cardElement.setAttribute('data-client-processed', 'true');
          }
        } else {
          // data-match 속성이 없는 경우 기본 처리
          const cardElement = element as HTMLElement;
          cardElement.style.border = '1px solid #e5e7eb';
          cardElement.style.borderRadius = '8px';
          cardElement.style.overflow = 'hidden';
          cardElement.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          cardElement.style.margin = '12px 0';
          cardElement.style.background = 'white';
          cardElement.style.width = '100%';
          cardElement.style.maxWidth = '100%';
          cardElement.style.padding = '12px';
          cardElement.style.textAlign = 'center';
          
          cardElement.innerHTML = `
            <div style="color: #2563eb; font-weight: 500;">
              ⚽ 경기 카드
            </div>
            <div style="margin-top: 8px; font-size: 14px; color: #666;">
              경기 정보를 불러오는 중...
            </div>
          `;
          
          cardElement.classList.add('match-card', 'processed-match-card', 'client-processed');
          cardElement.setAttribute('data-processed', 'true');
          cardElement.setAttribute('data-client-processed', 'true');
        }
        
        console.log(`PostContent - 경기 카드 ${index + 1} 처리 완료`);
      } catch (error) {
        console.error(`경기 카드 ${index + 1} 처리 중 오류:`, error);
      }
    });
  }, [isMounted]);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    setIsMounted(true);
    
    // cleanup 함수에서 사용할 ref 값을 미리 복사
    const processedElements = processedElementsRef.current;
    
    return () => {
      setIsMounted(false);
      processedElements.clear();
    };
  }, []);

  // 경기 카드 처리 useEffect
  useEffect(() => {
    if (!isMounted) return;
    
    // DOM이 완전히 렌더링된 후 처리하기 위해 약간의 지연
    const timeoutId = setTimeout(() => {
      processMatchCards();
      
      // 디버깅: DOM 내용 확인
      if (contentRef.current) {
        console.log('PostContent - DOM innerHTML:', contentRef.current.innerHTML);
        console.log('PostContent - 모든 div 요소:', contentRef.current.querySelectorAll('div').length);
        console.log('PostContent - match-card 클래스 요소:', contentRef.current.querySelectorAll('.match-card').length);
        console.log('PostContent - data-type 속성 요소:', contentRef.current.querySelectorAll('[data-type]').length);
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isMounted, processMatchCards, content]);

  // 소셜 임베드 처리 useEffect (기존 코드 유지)
  useEffect(() => {
    if (!contentRef.current || !isMounted) return;
    const rootElement = contentRef.current;
    
    // 소셜 임베드 요소 처리
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
        
        // 플랫폼별 처리 (기존 코드와 동일)
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
  
  return (
    <>
      <style jsx>{`
        /* 경기 카드 스타일 */
        :global(.match-card) {
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
          margin: 12px 0 !important;
          background: white !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        
        :global(.match-card img) {
          object-fit: contain !important;
          flex-shrink: 0 !important;
        }
        
        /* 경기 카드 내부 요소들 */
        :global(.match-card > div) {
          width: 100% !important;
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
      `}</style>
    <div 
      ref={contentRef}
      className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:font-bold prose-img:rounded-lg prose-img:mx-auto p-4 sm:p-6"
      dangerouslySetInnerHTML={{ __html: processContent() }}
    />
    </>
  );
} 