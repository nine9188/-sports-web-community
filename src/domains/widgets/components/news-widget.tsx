import NewsWidgetClient from './news-widget-client';
import { createClient } from '@/shared/api/supabaseServer';

// 뉴스 데이터 인터페이스
export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  url: string;
  postNumber?: number;
}

interface NewsWidgetProps {
  boardSlug?: string | string[];
}

// 이미지 URL 유효성 검사 함수 (타임아웃 방지)
async function validateImageUrl(url: string): Promise<boolean> {
  if (!url || url.startsWith('/213/')) {
    return true; // 로컬 이미지는 항상 유효
  }
  
  try {
    // 외부 URL의 경우 간단한 형식 검증만 수행
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    if (!urlPattern.test(url)) {
      return false;
    }
    
    // 모든 외부 이미지 URL을 일단 유효한 것으로 간주
    // 실제 로딩 실패는 클라이언트에서 처리
    return true;
  } catch (error) {
    console.warn('이미지 URL 검증 실패:', error);
    return false;
  }
}

// 게시글 내용에서 이미지 URL을 효과적으로 추출하는 함수
function extractImageFromContent(content: string): string {
  // 이미지가 없는 경우
  if (!content) return '';
  
  try {
    // JSON 형식인지 확인
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      try {
        const contentObj = JSON.parse(content);
        
        // TipTap 형식 확인
        if (contentObj.type === 'doc' && Array.isArray(contentObj.content)) {
          // 이미지 노드 찾기
          for (const node of contentObj.content) {
            if (node.type === 'image' && node.attrs && node.attrs.src) {
              return node.attrs.src;
            }
            
            // 이미지가 있는 문단 확인
            if (node.type === 'paragraph' && Array.isArray(node.content)) {
              for (const subNode of node.content) {
                if (subNode.type === 'image' && subNode.attrs && subNode.attrs.src) {
                  return subNode.attrs.src;
                }
              }
            }
          }
        }
        
        // RssPost 형식 확인
        if ('imageUrl' in contentObj && contentObj.imageUrl) {
          return contentObj.imageUrl;
        }
        
        if ('image_url' in contentObj && contentObj.image_url) {
          return contentObj.image_url;
        }
      } catch {
        // JSON 파싱 오류 무시
      }
    }
    
    // 일반 HTML에서 이미지 태그 찾기 - 첫 번째 방법
    const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
    const imgMatch = content.match(imgTagRegex);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
    
    // 다른 패턴의 이미지 태그 (예: 속성 순서가 다른 경우)
    const altImgTagRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/i;
    const altImgMatch = content.match(altImgTagRegex);
    if (altImgMatch && altImgMatch[1]) {
      return altImgMatch[1];
    }
    
    // 마크다운 이미지 문법 찾기
    const markdownImgRegex = /!\[[^\]]*\]\(([^)]+)\)/i;
    const markdownMatch = content.match(markdownImgRegex);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1];
    }
    
    // 모든 URL 패턴 찾기
    const urlRegex = /(https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|gif|webp))/i;
    const urlMatch = content.match(urlRegex);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    
    // og:image 태그 찾기
    const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
    const ogImageMatch = content.match(ogImageRegex);
    if (ogImageMatch && ogImageMatch[1]) {
      return ogImageMatch[1];
    }
    
    // 트위터 이미지 태그 찾기
    const twitterImageRegex = /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i;
    const twitterImageMatch = content.match(twitterImageRegex);
    if (twitterImageMatch && twitterImageMatch[1]) {
      return twitterImageMatch[1];
    }
  } catch (e) {
    console.error('이미지 URL 추출 오류:', e);
  }
  
  return '';
}

// 서버 컴포넌트에서 게시글 데이터 가져오기
async function getBoardPosts(boardSlug: string): Promise<NewsItem[]> {
  try {
    const supabase = await createClient();
    
    // 1. 게시판 정보 가져오기 (slug로 검색)
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .select("*")
      .eq("slug", boardSlug)
      .single();

    if (boardError) {
      console.error(`게시판 정보 조회 오류 (slug: ${boardSlug}):`, boardError);
      // 게시판을 찾지 못한 경우 빈 배열 반환 (에러를 throw하지 않음)
      return [];
    }
    
    if (!boardData) {
      console.warn(`게시판을 찾을 수 없습니다 (slug: ${boardSlug})`);
      return [];
    }

    // 2. 게시글 쿼리 구성
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, title, content, created_at, views, likes, post_number")
      .eq("board_id", boardData.id)
      .order('created_at', { ascending: false })
      .limit(15);

    if (postsError) {
      console.error("게시글 목록 조회 오류:", postsError);
      return [];
    }

    // 3. 데이터 포맷팅 (이미지 검증 포함)
    const newsItems = await Promise.all(posts.map(async (post, index: number) => {
      // 콘텐츠 처리 (문자열이 아닐 경우 처리)
      const content = typeof post.content === 'string' 
        ? post.content 
        : (post.content ? JSON.stringify(post.content) : '');
      
      // HTML 태그 제거 및 요약 생성
      const plainText = content.replace(/<[^>]*>/g, '');
      const summary = plainText.slice(0, 150) + (plainText.length > 150 ? '...' : '');
      
      // 개선된 함수로 썸네일 이미지 추출
      const extractedImageUrl = extractImageFromContent(content);
      
      // 이미지 URL 유효성 검사
      let finalImageUrl = '';
      if (extractedImageUrl) {
        const isValid = await validateImageUrl(extractedImageUrl);
        if (isValid) {
          finalImageUrl = extractedImageUrl;
        } else {
          console.warn(`유효하지 않은 이미지 URL, 백업 이미지 사용: ${extractedImageUrl}`);
          finalImageUrl = `/213/news${(index % 4) + 1}.jpg`;
        }
      } else {
        // 이미지가 없으면 백업 이미지 설정
        finalImageUrl = `/213/news${(index % 4) + 1}.jpg`;
      }
      
      // 클라이언트 측에서 표시할 URL 생성
      const url = `/boards/${boardSlug}/${post.post_number || 0}`;
      
      return {
        id: post.id,
        title: post.title,
        summary: summary,
        imageUrl: finalImageUrl,
        source: boardData.name,
        publishedAt: post.created_at || new Date().toISOString(),
        url: url,
        postNumber: post.post_number || 0
      };
    }));

    return newsItems;
  } catch (error) {
    console.error('게시글 가져오기 오류:', error);
    return [];
  }
}

export default async function NewsWidget({ boardSlug }: NewsWidgetProps) {
  // 기본값: foreign-news와 domestic-news 두 게시판 사용
  const boardSlugs = boardSlug 
    ? (Array.isArray(boardSlug) ? boardSlug : [boardSlug])
    : ['foreign-news', 'domestic-news'];
  
  // 여러 게시판에서 데이터 가져오기
  const newsArrays = await Promise.all(
    boardSlugs.map(slug => getBoardPosts(slug))
  );
  
  // 모든 뉴스를 합치고 날짜순으로 정렬
  const allNews = newsArrays
    .flat()
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA; // 최신순
    })
    .slice(0, 15); // 최대 15개만 표시
  
  return <NewsWidgetClient initialNews={allNews} />;
} 