'use client';

import React, { useEffect, useRef } from 'react';
import { generateMatchCardHTML } from '@/app/utils/matchCardRenderer';

interface PostContentProps {
  content: string;
}

export default function PostContent({ content }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
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
    
    // 2. YouTube iframe 처리
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
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
} 