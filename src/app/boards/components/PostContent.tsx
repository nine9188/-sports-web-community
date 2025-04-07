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
    
    // 디버깅을 위한 콘솔 로그 추가
    console.log("PostContent DOM 초기화 완료");
    
    // 경기 카드 요소 찾기
    const matchCardElements = contentRef.current.querySelectorAll('div[data-type="match-card"]');
    console.log(`경기 카드 요소 개수: ${matchCardElements.length}`);
    
    // 각 경기 카드 요소 처리
    matchCardElements.forEach((element, index) => {
      try {
        // 데이터 속성 가져오기
        const matchIdAttr = element.getAttribute('data-match-id');
        const matchDataAttr = element.getAttribute('data-match');
        
        // 데이터 속성 검증
        if (!matchDataAttr) {
          console.warn(`카드 ${index}에 필요한 데이터가 없습니다.`);
          element.innerHTML = `<div style="padding:12px;text-align:center;color:#ef4444;">
            경기 데이터를 불러올 수 없습니다.
          </div>`;
          return;
        }
        
        // HTML 디코딩 (특수문자 이슈 해결)
        const decodedData = decodeURIComponent(matchDataAttr);
        console.log(`카드 ${index} 인코딩된 데이터:`, decodedData);
        
        // 데이터 파싱
        const matchData = JSON.parse(decodedData);
        console.log(`카드 ${index} 데이터:`, matchData);
        
        // 필요한 데이터 추출
        const matchId = matchIdAttr || matchData.fixture?.id || 'unknown';
        
        // 공통 유틸리티 함수 사용
        const cardHTML = generateMatchCardHTML(matchData, matchId);
        
        // HTML 교체
        element.outerHTML = cardHTML;
        console.log(`카드 ${index} 성공적으로 변환됨!`);
      } catch (error) {
        console.error(`카드 ${index} 변환 오류:`, error);
        // 오류 발생 시 대체 UI 표시
        element.outerHTML = `
          <div style="padding:12px;margin:16px 0;border:1px solid #fee2e2;border-radius:8px;background-color:#fef2f2;color:#ef4444;">
            경기 결과 카드를 표시하는 중 오류가 발생했습니다.
          </div>
        `;
      }
    });
  }, [content]);
  
  return (
    <div className="px-6 py-4 border-t">
      <style jsx global>{`
        .prose .match-card {
          width: 100% !important;
          max-width: 100% !important;
        }
      `}</style>
      <div 
        ref={contentRef}
        className="prose prose-sm max-w-none w-full"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
} 