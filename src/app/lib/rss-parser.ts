/**
 * RSS 피드를 파싱하는 유틸리티 함수
 */

import { DOMParser } from '@xmldom/xmldom';

export interface RSSItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  content?: string;
  author?: string;
  imageUrl?: string;
}

export interface RSSFeed {
  title: string;
  description?: string;
  link?: string;
  items: RSSItem[];
}

/**
 * XML 문자열에서 특정 태그의 내용을 추출
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractFromXml = (xml: any, tagName: string, parentNode: any = xml): string => {
  try {
    const node = parentNode.getElementsByTagName(tagName)[0];
    if (!node) return '';
    
    // CDATA 처리
    const cdata = node.childNodes?.[0];
    if (cdata && cdata.nodeType === 4) { // CDATA_SECTION_NODE
      return cdata.nodeValue || '';
    }
    
    // 일반 텍스트 노드
    return node.textContent || '';
  } catch (error) {
    console.error(`태그 ${tagName} 추출 중 오류:`, error);
    return '';
  }
};

/**
 * 원문 URL에서 og:image 메타태그를 추출합니다.
 */
async function extractOGImage(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot/1.0)'
      },
      next: { revalidate: 0 }
    });
    
    if (!response.ok) return undefined;
    
    const html = await response.text();
    
    // 이미지 후보들을 저장할 배열
    const imageCandidates: { url: string; priority: number }[] = [];
    
    // 1. og:image 메타태그 추출 (우선순위 높음)
    const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
    const ogImageMatch = html.match(ogImageRegex);
    
    if (ogImageMatch && ogImageMatch[1]) {
      imageCandidates.push({
        url: ogImageMatch[1],
        priority: 100 // 높은 우선순위
      });
    }
    
    // content 속성이 먼저 오는 경우도 처리
    const altOgImageRegex = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i;
    const altOgImageMatch = html.match(altOgImageRegex);
    
    if (altOgImageMatch && altOgImageMatch[1]) {
      imageCandidates.push({
        url: altOgImageMatch[1],
        priority: 100
      });
    }
    
    // 2. twitter:image 태그 추출 (트위터 카드 이미지, 종종 고품질)
    const twitterImageRegex = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
    const twitterImageMatch = html.match(twitterImageRegex);
    
    if (twitterImageMatch && twitterImageMatch[1]) {
      imageCandidates.push({
        url: twitterImageMatch[1],
        priority: 90
      });
    }
    
    // 3. 본문에서 큰 이미지 추출
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const imgElement = imgMatch[0];
      const imgSrc = imgMatch[1];
      
      // 작은 이미지나 아이콘 필터링 (일반적으로 작은 이미지는 무시)
      if (imgSrc.includes('icon') || imgSrc.includes('logo') || imgSrc.includes('avatar')) {
        continue;
      }
      
      // 이미지 크기 정보가 포함된 경우 우선순위 조정
      let priority = 50; // 기본 우선순위
      
      // width/height 속성으로 큰 이미지 찾기
      const widthMatch = imgElement.match(/width=["'](\d+)["']/i);
      const heightMatch = imgElement.match(/height=["'](\d+)["']/i);
      
      if (widthMatch && heightMatch) {
        const width = parseInt(widthMatch[1], 10);
        const height = parseInt(heightMatch[1], 10);
        
        // 큰 이미지에 높은 우선순위 부여
        if (width > 500 && height > 300) {
          priority = 80;
        } else if (width > 300 && height > 200) {
          priority = 70;
        }
      }
      
      // 클래스나 ID에 메인/대표 이미지를 나타내는 단어가 있으면 우선순위 증가
      if (imgElement.includes('class="main') || 
          imgElement.includes('class="featured') || 
          imgElement.includes('class="hero') ||
          imgElement.includes('id="main') || 
          imgElement.includes('id="featured')) {
        priority += 20;
      }
      
      // 파일 확장자로 판단하여 jpg/png 이미지 우선순위 높임
      if (imgSrc.match(/\.(jpe?g|png)(\?.*)?$/i)) {
        priority += 10;
      }
      
      imageCandidates.push({
        url: imgSrc,
        priority
      });
    }
    
    // 후보 이미지가 없으면 undefined 반환
    if (imageCandidates.length === 0) {
      return undefined;
    }
    
    // 우선순위에 따라 정렬
    imageCandidates.sort((a, b) => b.priority - a.priority);
    
    // 절대 URL로 변환
    let bestImageUrl = imageCandidates[0].url;
    
    // 상대 경로인 경우 절대 경로로 변환
    if (bestImageUrl.startsWith('/')) {
      const urlObj = new URL(url);
      bestImageUrl = `${urlObj.protocol}//${urlObj.host}${bestImageUrl}`;
    } else if (!bestImageUrl.startsWith('http')) {
      // 도메인이 없는 상대 경로
      const basePath = url.substring(0, url.lastIndexOf('/') + 1);
      bestImageUrl = new URL(bestImageUrl, basePath).toString();
    }
    
    return bestImageUrl;
  } catch (error) {
    console.error(`이미지 추출 오류 (${url}):`, error);
    return undefined;
  }
}

/**
 * RSS 피드를 파싱하여 구조화된 데이터로 반환
 */
export async function parseRSSFeed(url: string): Promise<RSSFeed> {
  try {
    const feed = await fetchSimpleRSSFeed(url);
    return feed;
  } catch (error) {
    console.error('RSS 피드 파싱 오류:', error);
    throw error;
  }
}

/**
 * RSS 피드를 가져와 간단한 형태로 변환
 */
export async function fetchSimpleRSSFeed(url: string): Promise<RSSFeed> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot/1.0)'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`피드를 가져오는데 실패했습니다. 상태 코드: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');

    // 파싱 오류 확인
    const errorNode = xml.getElementsByTagName('parsererror');
    if (errorNode.length > 0) {
      throw new Error('XML 파싱 오류: ' + errorNode[0].textContent);
    }

    // RSS 또는 Atom 형식 감지
    const isRSS = xml.getElementsByTagName('rss').length > 0;
    const isAtom = xml.getElementsByTagName('feed').length > 0;

    let feed: RSSFeed;

    if (isRSS) {
      feed = await parseRSSFormat(xml);
    } else if (isAtom) {
      feed = await parseAtomFormat(xml);
    } else {
      throw new Error('지원하지 않는 피드 형식입니다.');
    }

    return feed;
  } catch (error) {
    console.error('RSS 피드 가져오기 오류:', error);
    throw error;
  }
}

/**
 * RSS 2.0 형식 파싱
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseRSSFormat(xml: any): Promise<RSSFeed> {
  try {
    const channel = xml.getElementsByTagName('channel')[0];
    
    const title = extractFromXml(xml, 'title', channel);
    const description = extractFromXml(xml, 'description', channel);
    const link = extractFromXml(xml, 'link', channel);
    
    const itemNodes = channel.getElementsByTagName('item');
    const items: RSSItem[] = [];
    
    const itemPromises = [];
    
    for (let i = 0; i < itemNodes.length; i++) {
      itemPromises.push((async () => {
        try {
          const item = itemNodes[i];
          
          const title = extractFromXml(xml, 'title', item);
          const link = extractFromXml(xml, 'link', item);
          const pubDate = extractFromXml(xml, 'pubDate', item);
          
          // 콘텐츠 가져오기 
          const content = extractFromXml(xml, 'content:encoded', item) || 
                        extractFromXml(xml, 'content', item) || 
                        extractFromXml(xml, 'description', item);
          
          const description = extractFromXml(xml, 'description', item);
          const author = extractFromXml(xml, 'author', item) || 
                        extractFromXml(xml, 'dc:creator', item);
          
          // 이미지 URL 찾기
          let imageUrl = '';
          try {
            const mediaContent = item.getElementsByTagName('media:content')[0];
            const enclosure = item.getElementsByTagName('enclosure')[0];
            
            if (mediaContent && mediaContent.getAttribute('medium') === 'image') {
              imageUrl = mediaContent.getAttribute('url') || '';
            } else if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
              imageUrl = enclosure.getAttribute('url') || '';
            }
            
            // 이미지가 없고 링크가 있는 경우 og:image 메타태그 크롤링
            if (!imageUrl && link) {
              const ogImage = await extractOGImage(link);
              if (ogImage) {
                imageUrl = ogImage;
              }
            }
          } catch {
            // 이미지 URL 추출 오류는 무시
          }
          
          if (title && link) {
            return {
              title,
              link,
              pubDate,
              description,
              content,
              author,
              imageUrl
            };
          }
          return null;
        } catch (itemError) {
          console.error('아이템 파싱 오류:', itemError);
          return null; // 오류가 발생한 아이템은 건너뜀
        }
      })());
    }
    
    const results = await Promise.all(itemPromises);
    // null 제거 및 최대 10개만 유지
    items.push(...results.filter(item => item !== null).slice(0, 10));
    
    return {
      title,
      description,
      link,
      items
    };
  } catch (error) {
    console.error('RSS 형식 파싱 오류:', error);
    return { title: '파싱 오류', items: [] };
  }
}

/**
 * Atom 형식 파싱
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseAtomFormat(xml: any): Promise<RSSFeed> {
  try {
    const feed = xml.getElementsByTagName('feed')[0];
    
    const title = extractFromXml(xml, 'title', feed);
    const description = extractFromXml(xml, 'subtitle', feed) || '';
    const link = feed.getElementsByTagName('link')[0]?.getAttribute('href') || '';
    
    const entryNodes = feed.getElementsByTagName('entry');
    const items: RSSItem[] = [];
    
    const entryPromises = [];
    
    for (let i = 0; i < entryNodes.length; i++) {
      entryPromises.push((async () => {
        try {
          const entry = entryNodes[i];
          
          const title = extractFromXml(xml, 'title', entry);
          
          // link 태그에서 href 속성 가져오기
          let link = '';
          try {
            const linkElement = entry.getElementsByTagName('link')[0];
            link = linkElement ? (linkElement.getAttribute('href') || '') : '';
          } catch {
            // link 추출 오류는 무시
          }
          
          const pubDate = extractFromXml(xml, 'updated', entry) || 
                        extractFromXml(xml, 'published', entry);
          
          const content = extractFromXml(xml, 'content', entry);
          const description = extractFromXml(xml, 'summary', entry);
          
          let author = '';
          try {
            const authorElement = entry.getElementsByTagName('author')[0];
            author = authorElement ? extractFromXml(xml, 'name', authorElement) : '';
          } catch {
            // author 추출 오류는 무시
          }
          
          // 이미지 URL 찾기 (og:image)
          let imageUrl = '';
          if (link) {
            try {
              const ogImage = await extractOGImage(link);
              if (ogImage) {
                imageUrl = ogImage;
              }
            } catch {
              // og:image 추출 오류는 무시
            }
          }
          
          if (title && link) {
            return {
              title,
              link,
              pubDate,
              description,
              content,
              author,
              imageUrl
            };
          }
          return null;
        } catch (entryError) {
          console.error('항목 파싱 오류:', entryError);
          return null; // 오류가 발생한 항목은 건너뜀
        }
      })());
    }
    
    const results = await Promise.all(entryPromises);
    // null 제거 및 최대 10개만 유지
    items.push(...results.filter(item => item !== null).slice(0, 10));
    
    return {
      title,
      description,
      link,
      items
    };
  } catch (error) {
    console.error('Atom 형식 파싱 오류:', error);
    return { title: '파싱 오류', items: [] };
  }
} 