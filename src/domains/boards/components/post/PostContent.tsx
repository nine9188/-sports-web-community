'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import MatchStatsChart from './MatchStatsChart';

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
  meta?: Record<string, unknown> | null;
}

// 텍스트에서 경기 통계를 추출하는 함수
const parseMatchStatsFromText = (text: string) => {
  try {
    
    // 홈팀과 원정팀 데이터 추출
    const homeTeamMatch = text.match(/【\s*홈팀\s+(.+?)\s+시즌\s+통계\s*】([\s\S]*?)(?=【|$)/);
    const awayTeamMatch = text.match(/【\s*어웨이팀\s+(.+?)\s+시즌\s+통계\s*】([\s\S]*?)(?=【|$)/);
    const oddsMatch = text.match(/【\s*배당률\s+정보\s*】([\s\S]*?)(?=【|$)/);
    
    
    
    if (!homeTeamMatch || !awayTeamMatch) {
      return null;
    }

    const homeTeamName = homeTeamMatch[1].trim();
    const homeTeamData = homeTeamMatch[2];
    const awayTeamName = awayTeamMatch[1].trim();
    const awayTeamData = awayTeamMatch[2];
    const oddsData = oddsMatch ? oddsMatch[1] : '';

    // 홈팀 데이터 파싱 (실제 데이터 형식에 맞게 수정)
    // "- 경기수: 19경기 - 승부 기록: 11승 4무 4패 - 홈 승률: 57. 9%" 형식
    const homeMatches = parseInt(homeTeamData.match(/경기수:\s*(\d+)\s*경기/)?.[1] || '0');
    const homeWinsMatch = homeTeamData.match(/승부\s+기록:\s*(\d+)\s*승\s+(\d+)\s*무\s+(\d+)\s*패/);
    const homeWins = homeWinsMatch ? parseInt(homeWinsMatch[1]) : 0;
    const homeDraws = homeWinsMatch ? parseInt(homeWinsMatch[2]) : 0;
    const homeLosses = homeWinsMatch ? parseInt(homeWinsMatch[3]) : 0;
    
    // "홈 승률: 57. 9%" 형식 (공백 포함)
    const homeWinRateMatch = homeTeamData.match(/홈\s*승률:\s*([\d.\s]+)%/);
    const homeWinRate = homeWinRateMatch ? parseFloat(homeWinRateMatch[1].replace(/\s+/g, '')) : 0;
    
    // "득점: 31골" 형식
    const homeGoals = parseInt(homeTeamData.match(/득점:\s*(\d+)\s*골/)?.[1] || '0');
    const homeConceded = parseInt(homeTeamData.match(/실점:\s*(\d+)\s*골/)?.[1] || '0');
    
    // "최근 5경기 폼: W - D - W - D - L" 형식
    const homeFormMatch = homeTeamData.match(/최근\s*5경기\s*폼:\s*([W\s\-\s*D\s\-\s*L\s\-\s*]+)/);
    const homeForm = homeFormMatch ? homeFormMatch[1].replace(/\s+/g, '') : '';
    
    const homeInjuries = parseInt(homeTeamData.match(/부상자\s*수:\s*(\d+)\s*명/)?.[1] || '0');

    

    // 어웨이팀 데이터 파싱 (실제 데이터 형식에 맞게 수정)
    // "- 경기수: 20경기 - 승부 기록: 5승 4무 11패 - 원정 승률: 25. 0%" 형식
    const awayMatches = parseInt(awayTeamData.match(/경기수:\s*(\d+)\s*경기/)?.[1] || '0');
    const awayWinsMatch = awayTeamData.match(/승부\s+기록:\s*(\d+)\s*승\s+(\d+)\s*무\s+(\d+)\s*패/);
    const awayWins = awayWinsMatch ? parseInt(awayWinsMatch[1]) : 0;
    const awayDraws = awayWinsMatch ? parseInt(awayWinsMatch[2]) : 0;
    const awayLosses = awayWinsMatch ? parseInt(awayWinsMatch[3]) : 0;
    
    // "원정 승률: 25. 0%" 형식 (공백 포함)
    const awayWinRateMatch = awayTeamData.match(/원정\s*승률:\s*([\d.\s]+)%/);
    const awayWinRate = awayWinRateMatch ? parseFloat(awayWinRateMatch[1].replace(/\s+/g, '')) : 0;
    
    // "득점: 25골" 형식
    const awayGoals = parseInt(awayTeamData.match(/득점:\s*(\d+)\s*골/)?.[1] || '0');
    const awayConceded = parseInt(awayTeamData.match(/실점:\s*(\d+)\s*골/)?.[1] || '0');
    
    // "최근 5경기 폼: D - W - W - W - W" 형식
    const awayFormMatch = awayTeamData.match(/최근\s*5경기\s*폼:\s*([W\s\-\s*D\s\-\s*L\s\-\s*]+)/);
    const awayForm = awayFormMatch ? awayFormMatch[1].replace(/\s+/g, '') : '';
    
    const awayInjuries = parseInt(awayTeamData.match(/부상자\s*수:\s*(\d+)\s*명/)?.[1] || '0');

    

    // 새로운 인터페이스에 맞는 데이터 구조
    const homeTeam = {
      name: homeTeamName,
      matches: homeMatches,
      wins: homeWins,
      draws: homeDraws,
      losses: homeLosses,
      winRate: homeWinRate,
      goals: homeGoals,
      conceded: homeConceded,
      goalDifference: homeGoals - homeConceded,
      form: homeForm,
      injuries: homeInjuries
    };

    const awayTeam = {
      name: awayTeamName,
      matches: awayMatches,
      wins: awayWins,
      draws: awayDraws,
      losses: awayLosses,
      winRate: awayWinRate,
      goals: awayGoals,
      conceded: awayConceded,
      goalDifference: awayGoals - awayConceded,
      form: awayForm,
      injuries: awayInjuries
    };

    // 배당률 데이터 파싱 (실제 데이터 형식에 맞게)
    // "- 홈 승리: 2. 75 - 무승부: 3. 30 - 어웨이 승리: 2. 45" 형식 (공백 포함)
    let bettingOdds = null;
    if (oddsData) {
      const homeOddMatch = oddsData.match(/홈\s*승리:\s*([\d.\s]+)/);
      const drawOddMatch = oddsData.match(/무승부:\s*([\d.\s]+)/);
      const awayOddMatch = oddsData.match(/어웨이\s*승리:\s*([\d.\s]+)/);
      
      const homeOdd = homeOddMatch ? parseFloat(homeOddMatch[1].replace(/\s+/g, '')) : 0;
      const drawOdd = drawOddMatch ? parseFloat(drawOddMatch[1].replace(/\s+/g, '')) : 0;
      const awayOdd = awayOddMatch ? parseFloat(awayOddMatch[1].replace(/\s+/g, '')) : 0;
      
      
      
      if (homeOdd > 0 && drawOdd > 0 && awayOdd > 0) {
        bettingOdds = {
          home: homeOdd,
          draw: drawOdd,
          away: awayOdd
        };
      }
    }

    

    return {
      homeTeam,
      awayTeam,
      bettingOdds
    };
  } catch (error) {
    return null;
  }
};

export default function PostContent({ content, meta }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [processedContent, setProcessedContent] = useState<string>('');

  // 객체 콘텐츠를 HTML로 변환하는 함수
  const processObjectContent = useCallback((content: TipTapDoc | RssPost | Record<string, unknown>) => {
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
          
          tipTapDoc.content.forEach((node, nodeIndex) => {
            
            
            if (node.type === 'matchCard' && node.attrs) {
              // 매치 카드 노드 처리
              
              const { matchId, matchData } = node.attrs;
              
              if (matchData && typeof matchData === 'object') {
                const matchDataObj = matchData as Record<string, unknown>;
                const teams = matchDataObj.teams as Record<string, unknown> | undefined;
                const goals = matchDataObj.goals as Record<string, unknown> | undefined;
                const league = matchDataObj.league as Record<string, unknown> | undefined;
                const status = matchDataObj.status as Record<string, unknown> | undefined;
                
                const homeTeam = (teams?.home as Record<string, unknown>) || { name: '홈팀', logo: '/placeholder.png' };
                const awayTeam = (teams?.away as Record<string, unknown>) || { name: '원정팀', logo: '/placeholder.png' };
                const leagueData = league || { name: '알 수 없는 리그', logo: '/placeholder.png' };
                const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
                const awayScore = typeof goals?.away === 'number' ? goals.away : '-';
                const actualMatchId = matchDataObj.id || matchId || 'unknown';
                
                // 경기 상태 텍스트 설정
                let statusText = '경기 결과';
                let statusClass = '';
                
                if (status) {
                  const statusCode = (status.code as string) || '';
                  
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
                    statusClass = 'live';
                  }
                }
                
                htmlContent += `
                  <div class="match-card processed-match-card" data-type="match-card" data-match-id="${actualMatchId}" data-processed="true">
                    <a href="/livescore/football/match/${actualMatchId}">
                      <div class="league-header">
                        <div style="display: flex; align-items: center;">
                          <img 
                            src="${(leagueData.logo as string) || '/placeholder.png'}" 
                            alt="${(leagueData.name as string) || '알 수 없는 리그'}" 
                            class="league-logo"
                            onerror="this.onerror=null;this.src='/placeholder.png';"
                          />
                          <span class="league-name">${(leagueData.name as string) || '알 수 없는 리그'}</span>
                        </div>
                      </div>
                      
                      <div class="match-main">
                        <div class="team-info">
                          <img 
                            src="${(homeTeam.logo as string) || '/placeholder.png'}" 
                            alt="${(homeTeam.name as string) || '홈팀'}" 
                            class="team-logo"
                            onerror="this.onerror=null;this.src='/placeholder.png';"
                          />
                          <span class="team-name${homeTeam.winner ? ' winner' : ''}">${(homeTeam.name as string) || '홈팀'}</span>
                        </div>
                        
                        <div class="score-area">
                          <div class="score">
                            <span class="score-number">${homeScore}</span>
                            <span class="score-separator">-</span>
                            <span class="score-number">${awayScore}</span>
                          </div>
                          <div class="match-status${statusClass ? ' ' + statusClass : ''}">${statusText}</div>
                        </div>
                        
                        <div class="team-info">
                          <img 
                            src="${(awayTeam.logo as string) || '/placeholder.png'}" 
                            alt="${(awayTeam.name as string) || '원정팀'}" 
                            class="team-logo"
                            onerror="this.onerror=null;this.src='/placeholder.png';"
                          />
                          <span class="team-name${awayTeam.winner ? ' winner' : ''}">${(awayTeam.name as string) || '원정팀'}</span>
                        </div>
                      </div>
                      
                      <div class="match-footer">
                        <span class="footer-link">매치 상세 정보</span>
                      </div>
                    </a>
                  </div>
                `;
              } else {
                // 매치 데이터가 없는 경우 오류 표시
                htmlContent += `
                  <div class="p-3 border rounded-lg bg-red-50 text-red-500 my-4">
                    경기 결과 데이터를 불러올 수 없습니다.
                  </div>
                `;
              }
            } else if (node.type === 'horizontalRule') {
              // 구분선 노드 처리
              htmlContent += '<hr class="my-6 border-gray-300" />';
            } else if (node.type === 'image' && node.attrs && node.attrs.src) {
              // 이미지 노드 처리 (paragraph보다 먼저)
              
              htmlContent += `
                <div class="my-6 text-center">
                  <img 
                    src="${node.attrs.src}" 
                    alt="${node.attrs.alt || '기사 이미지'}" 
                    title="${node.attrs.title || ''}"
                    class="max-w-full h-auto mx-auto rounded-lg shadow-md"
                    style="max-height: 500px; object-fit: contain;"
                    onerror="this.onerror=null;this.style.display='none';"
                  />
                </div>
              `;
            } else if (node.type === 'paragraph' && node.content && Array.isArray(node.content)) {
              // 단락 처리
              let paragraphContent = '';
              
              node.content.forEach((textNode) => {
                if (textNode.type === 'text' && textNode.text) {
                  let text = textNode.text;
                  
                  // 차트 마커 제거 (단순 텍스트로 처리)
                  const chartMarkerRegex = /\[MATCH_STATS_CHART:(.*?)\]/g;
                  text = text.replace(chartMarkerRegex, '📊 경기 통계 차트');
                  
                  // 텍스트 마크업 적용
                  if (textNode.marks && Array.isArray(textNode.marks)) {
                    textNode.marks.forEach((mark) => {
                      if (mark.type === 'bold') {
                        text = `<strong>${text}</strong>`;
                      } else if (mark.type === 'italic') {
                        text = `<em>${text}</em>`;
                      } else if (mark.type === 'link' && mark.attrs?.href) {
                        const href = mark.attrs.href;
                        const target = mark.attrs.target || '_blank';
                        const rel = mark.attrs.rel || 'noopener noreferrer';
                        text = `<a href="${href}" target="${target}" rel="${rel}">${text}</a>`;
                      }
                    });
                  }
                  
                  paragraphContent += text;
                }
              });
              
              if (paragraphContent.trim()) {
                htmlContent += `<p>${paragraphContent}</p>`;
              }
            } else if (node.type === 'heading' && Array.isArray(node.content)) {
              const level = node.attrs?.level || 2;
              htmlContent += `<h${level} class="font-bold text-lg mb-3 mt-6">`;
              node.content.forEach((textNode) => {
                if (textNode.type === 'text') {
                  htmlContent += textNode.text || '';
                }
              });
              htmlContent += `</h${level}>`;
            } else if (node.type === 'bulletList' && Array.isArray(node.content)) {
              htmlContent += '<ul class="list-disc list-inside mb-4">';
              node.content.forEach((listItem) => {
                if (listItem.type === 'listItem' && Array.isArray(listItem.content)) {
                  htmlContent += '<li>';
                  listItem.content.forEach((para) => {
                    if (para.type === 'paragraph' && Array.isArray(para.content)) {
                      para.content.forEach((textNode) => {
                        if (textNode.type === 'text') {
                          htmlContent += textNode.text || '';
                        }
                      });
                    }
                  });
                  htmlContent += '</li>';
                }
              });
              htmlContent += '</ul>';

            } else if (node.type === 'matchCard' && node.attrs) {
              // 매치 카드 노드 처리
              
              const { matchId, matchData } = node.attrs;
              
              if (matchData && typeof matchData === 'object') {
                const matchDataObj = matchData as Record<string, unknown>;
                const teams = matchDataObj.teams as Record<string, unknown> | undefined;
                const goals = matchDataObj.goals as Record<string, unknown> | undefined;
                const league = matchDataObj.league as Record<string, unknown> | undefined;
                const status = matchDataObj.status as Record<string, unknown> | undefined;
                
                const homeTeam = (teams?.home as Record<string, unknown>) || { name: '홈팀', logo: '/placeholder.png' };
                const awayTeam = (teams?.away as Record<string, unknown>) || { name: '원정팀', logo: '/placeholder.png' };
                const leagueData = league || { name: '알 수 없는 리그', logo: '/placeholder.png' };
                const homeScore = typeof goals?.home === 'number' ? goals.home : '-';
                const awayScore = typeof goals?.away === 'number' ? goals.away : '-';
                const actualMatchId = matchDataObj.id || matchId || 'unknown';
                
                // 경기 상태 텍스트 설정
                let statusText = '경기 결과';
                let statusClass = '';
                
                if (status) {
                  const statusCode = (status.code as string) || '';
                  
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
                    statusClass = 'live';
                  }
                }
                
                htmlContent += `
                  <div class="match-card processed-match-card" data-type="match-card" data-match-id="${actualMatchId}" data-processed="true">
                    <a href="/livescore/football/match/${actualMatchId}">
                      <div class="league-header">
                        <div style="display: flex; align-items: center;">
                          <img 
                            src="${(leagueData.logo as string) || '/placeholder.png'}" 
                            alt="${(leagueData.name as string) || '알 수 없는 리그'}" 
                            class="league-logo"
                            onerror="this.onerror=null;this.src='/placeholder.png';"
                          />
                          <span class="league-name">${(leagueData.name as string) || '알 수 없는 리그'}</span>
                        </div>
                      </div>
                      
                      <div class="match-main">
                        <div class="team-info">
                          <img 
                            src="${(homeTeam.logo as string) || '/placeholder.png'}" 
                            alt="${(homeTeam.name as string) || '홈팀'}" 
                            class="team-logo"
                            onerror="this.onerror=null;this.src='/placeholder.png';"
                          />
                          <span class="team-name${homeTeam.winner ? ' winner' : ''}">${(homeTeam.name as string) || '홈팀'}</span>
                        </div>
                        
                        <div class="score-area">
                          <div class="score">
                            <span class="score-number">${homeScore}</span>
                            <span class="score-separator">-</span>
                            <span class="score-number">${awayScore}</span>
                          </div>
                          <div class="match-status${statusClass ? ' ' + statusClass : ''}">${statusText}</div>
                        </div>
                        
                        <div class="team-info">
                          <img 
                            src="${(awayTeam.logo as string) || '/placeholder.png'}" 
                            alt="${(awayTeam.name as string) || '원정팀'}" 
                            class="team-logo"
                            onerror="this.onerror=null;this.src='/placeholder.png';"
                          />
                          <span class="team-name${awayTeam.winner ? ' winner' : ''}">${(awayTeam.name as string) || '원정팀'}</span>
                        </div>
                      </div>
                      
                      <div class="match-footer">
                        <span class="footer-link">매치 상세 정보</span>
                      </div>
                    </a>
                  </div>
                `;
              } else {
                // 매치 데이터가 없는 경우 오류 표시
                htmlContent += `
                  <div class="p-3 border rounded-lg bg-red-50 text-red-500 my-4">
                    경기 결과 데이터를 불러올 수 없습니다.
                  </div>
                `;
              }
            } else {
              
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
        return `<div class="text-red-500">오류: 게시글 내용을 표시할 수 없습니다.</div>`;
      }
    }
    
    // 기본값
    return '';
  }, []);

  // content가 객체인 경우 HTML로 변환
  const processContent = useCallback(() => {
    if (!content) return '';
    
    // 문자열인 경우 JSON 파싱 시도
    if (typeof content === 'string') {
      // JSON 형태인지 확인 (TipTap JSON)
      if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
        try {
          const parsedContent = JSON.parse(content);
          
          // 파싱된 객체를 처리
          return processObjectContent(parsedContent);
        } catch (error) {
          return content; // 파싱 실패시 원본 문자열 반환
        }
      }
      return content; // 일반 HTML 문자열
    }
    
    // 객체인 경우 처리
    return processObjectContent(content);
  }, [content, processObjectContent]);
  
  // 소셜 임베드와 매치카드 백업 처리 함수
  const processEmbeds = useCallback(() => {
    if (!contentRef.current || !isMounted) return;
    const rootElement = contentRef.current;
    
    // 0. 차트 데이터 확인 및 렌더링 (meta 데이터 또는 텍스트 파싱)
    let chartDataToRender = null;
    
    
    
    // meta 데이터에서 차트 데이터 확인
    if (meta && meta.chart_data && Array.isArray(meta.chart_data)) {
      
      
      // 기존 구조를 새로운 인터페이스로 변환
      chartDataToRender = meta.chart_data.map((data: Record<string, unknown>) => {
        
        
        const homeTeam = data.homeTeam as Record<string, unknown> | undefined;
        const awayTeam = data.awayTeam as Record<string, unknown> | undefined;
        const bettingOdds = data.bettingOdds as Record<string, unknown> | unknown[] | undefined;
        
        // stats 객체에서 실제 데이터 추출
        const homeStats = homeTeam?.stats as Record<string, unknown> | undefined;
        const awayStats = awayTeam?.stats as Record<string, unknown> | undefined;
        
        
        
        // 홈팀과 원정팀의 실제 데이터 추출
        const homeMatches = (homeStats?.homePlayed as number) || 0;
        const homeWins = (homeStats?.homeWins as number) || 0;
        const homeGoals = (homeStats?.homeGoalsFor as number) || 0;
        const homeConceded = (homeStats?.homeGoalsAgainst as number) || 0;
        
        const awayMatches = (awayStats?.awayPlayed as number) || 0;
        const awayWins = (awayStats?.awayWins as number) || 0;
        const awayGoals = (awayStats?.awayGoalsFor as number) || 0;
        const awayConceded = (awayStats?.awayGoalsAgainst as number) || 0;
        
        // 승률 직접 계산 (승수 / 경기수 * 100)
        const homeWinRate = homeMatches > 0 ? Math.round((homeWins / homeMatches) * 100 * 10) / 10 : 0;
        const awayWinRate = awayMatches > 0 ? Math.round((awayWins / awayMatches) * 100 * 10) / 10 : 0;
        
        
        
        // 기존 구조에서 새로운 구조로 변환
        const convertedData = {
          homeTeam: {
            name: (homeTeam?.name as string) || 'Unknown',
            matches: homeMatches,
            wins: homeWins,
            draws: 0, // 무승부는 계산해야 함 (경기수 - 승수 - 패수)
            losses: 0, // 패수도 계산해야 함
            winRate: homeWinRate, // 직접 계산한 홈승률
            goals: homeGoals,
            conceded: homeConceded,
            goalDifference: homeGoals - homeConceded,
            form: (homeStats?.form as string) || '',
            injuries: (homeStats?.injuries as number) || 0
          },
          awayTeam: {
            name: (awayTeam?.name as string) || 'Unknown',
            matches: awayMatches,
            wins: awayWins,
            draws: 0, // 무승부는 계산해야 함
            losses: 0, // 패수도 계산해야 함
            winRate: awayWinRate, // 직접 계산한 원정승률
            goals: awayGoals,
            conceded: awayConceded,
            goalDifference: awayGoals - awayConceded,
            form: (awayStats?.form as string) || '',
            injuries: (awayStats?.injuries as number) || 0
          },
          bettingOdds: bettingOdds ? {
            home: Array.isArray(bettingOdds) ? 
              ((bettingOdds as unknown[]).find((odd: unknown) => (odd as Record<string, unknown>).value === 'Home') as Record<string, unknown>)?.odd as number || 0 : 
              (bettingOdds as Record<string, unknown>).home as number || 0,
            draw: Array.isArray(bettingOdds) ? 
              ((bettingOdds as unknown[]).find((odd: unknown) => (odd as Record<string, unknown>).value === 'Draw') as Record<string, unknown>)?.odd as number || 0 : 
              (bettingOdds as Record<string, unknown>).draw as number || 0,
            away: Array.isArray(bettingOdds) ? 
              ((bettingOdds as unknown[]).find((odd: unknown) => (odd as Record<string, unknown>).value === 'Away') as Record<string, unknown>)?.odd as number || 0 : 
              (bettingOdds as Record<string, unknown>).away as number || 0
          } : null
        };
        
        
        return convertedData;
      });
      
      
    } else {
      // meta 데이터가 없으면 텍스트에서 파싱 시도
      const textContent = rootElement.textContent || '';
      
      // 더 광범위한 조건으로 파싱 시도
      const hasMatchData = textContent.includes('【') || 
                          textContent.includes('홈팀') || 
                          textContent.includes('어웨이팀') ||
                          textContent.includes('승률') ||
                          textContent.includes('득점') ||
                          textContent.includes('배당률') ||
                          (textContent.includes('Gimcheon') && textContent.includes('Jeonbuk'));
      
      if (hasMatchData) {
        const parsedData = parseMatchStatsFromText(textContent);
        if (parsedData) {
          chartDataToRender = [parsedData];
          
        } else {
          
        }
      } else {
        
      }
    }
    
    // 차트 데이터가 있으면 렌더링
    if (chartDataToRender && Array.isArray(chartDataToRender)) {
      // 차트 플레이스홀더 찾기 (AI 분석 게시글에서 경기별로 삽입)
      const matchHeaders = rootElement.querySelectorAll('h2, h3');
      
      matchHeaders.forEach((header, index) => {
        if (index < chartDataToRender.length && chartDataToRender[index]) {
          const chartData = chartDataToRender[index];
          
          // 차트 컨테이너가 이미 있는지 확인
          const existingChart = header.nextElementSibling?.querySelector('.match-stats-chart');
          if (existingChart) return;
          
          // 경기 관련 헤더 다음에 차트 삽입 (조건 완화)
          const headerText = header.textContent || '';
          const isMatchHeader = headerText.includes('경기') || 
                               headerText.includes('분석') || 
                               headerText.includes('통계') ||
                               headerText.includes('데이터') ||
                               headerText.includes('홈팀') ||
                               headerText.includes('어웨이') ||
                               headerText.includes('원정') ||
                               headerText.includes('VS') ||
                               headerText.includes('vs') ||
                               headerText.includes('배당') ||
                               headerText.includes('【') ||
                               headerText.includes('】');
          
          if (!isMatchHeader) {
            return;
          }
          
          
          
          // 차트 컨테이너 생성
          const chartContainer = document.createElement('div');
          chartContainer.className = 'chart-container';
          
          // React 컴포넌트 동적 렌더링
          import('react-dom/client').then(({ createRoot }) => {
            const root = createRoot(chartContainer);
            root.render(
              React.createElement(MatchStatsChart, {
                homeTeam: chartData.homeTeam || { name: '홈팀' },
                awayTeam: chartData.awayTeam || { name: '원정팀' },
                bettingOdds: chartData.bettingOdds || null
              })
            );
          }).catch(error => {
            chartContainer.innerHTML = `
              <div class="match-stats-chart-container my-8 p-6 bg-red-50 border border-red-200 rounded-xl">
                <div class="text-center text-red-600">
                  <p class="font-medium">차트를 로드할 수 없습니다</p>
                  <p class="text-sm mt-1">페이지를 새로고침해 주세요</p>
                </div>
              </div>
            `;
          });
          
          // 헤더 다음에 차트 삽입
          header.parentNode?.insertBefore(chartContainer, header.nextSibling);
        }
      });
    }
    
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
            <div class="youtube-container">
              <iframe
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
        element.innerHTML = `<div class="p-4 border rounded bg-red-50 text-red-600">
          소셜 미디어 콘텐츠를 로드하는 중 오류가 발생했습니다.
        </div>`;
      }
    });
  }, [isMounted, meta]);

  // 컴포넌트 마운트 상태 추적 및 콘텐츠 처리
  useEffect(() => {
    setIsMounted(true);
    // 클라이언트에서만 콘텐츠 처리
    setProcessedContent(processContent());
    return () => {
      setIsMounted(false);
    };
  }, [processContent]);

  // 소셜 임베드와 매치카드 백업 처리
  useEffect(() => {
    if (!isMounted) return;
    
    const timeoutId = setTimeout(() => {
      processEmbeds();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isMounted, processEmbeds, content, meta]);
  
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
        
        /* 유튜브 임베드 스타일은 globals.css에서 관리 */
        
        :global(.video-wrapper video) {
          width: 100%;
          max-width: 800px; /* PC에서 더 큰 최대 너비 */
          height: auto;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        /* 대형 화면용 최적화 */
        @media (min-width: 1025px) {
          :global(.video-wrapper) {
            margin: 2rem auto;
            max-width: 900px;
          }
          
          :global(.video-wrapper video) {
            max-height: 650px;
          }
        }
        
        @media (min-width: 1441px) {
          :global(.video-wrapper) {
            margin: 2.5rem auto;
            max-width: 1000px;
          }
          
          :global(.video-wrapper video) {
            max-height: 750px;
          }
        }
        
        /* 모바일에서 비디오 래퍼 추가 최적화 */
        @media (max-width: 480px) {
          :global(.video-wrapper video) {
            max-height: none !important;
            height: auto !important;
            aspect-ratio: 16/9 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          :global(.video-wrapper) {
            margin: 0.5rem -1rem !important;
            border-radius: 0 !important;
          }
          
          :global(.prose .video-wrapper) {
            margin-left: -1rem !important;
            margin-right: -1rem !important;
            width: calc(100% + 2rem) !important;
            max-width: calc(100% + 2rem) !important;
          }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
          :global(.video-wrapper video) {
            max-height: none !important;
            height: auto !important;
            aspect-ratio: 16/9 !important;
          }
          
          :global(.video-wrapper) {
            margin: 0.5rem -0.5rem !important;
          }
          
          :global(.prose .video-wrapper) {
            margin-left: -0.5rem !important;
            margin-right: -0.5rem !important;
            width: calc(100% + 1rem) !important;
            max-width: calc(100% + 1rem) !important;
          }
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
      dangerouslySetInnerHTML={{ __html: isMounted ? processedContent : '' }}
    />
    </>
  );
} 