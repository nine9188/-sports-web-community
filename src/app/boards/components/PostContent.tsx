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
    
    // 경기 카드 요소 찾기
    const matchCardElements = contentRef.current.querySelectorAll('div[data-type="match-card"]');
    
    // 각 경기 카드 요소 처리
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
  }, []);
  
  return (
    <div 
      ref={contentRef}
      className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:font-bold prose-img:rounded-lg prose-img:mx-auto p-4 sm:p-6"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
} 