import { createClient } from '@/app/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';

// 동적 라우트 설정
export const dynamic = 'force-dynamic';

// 캐시 재검증 설정
export const revalidate = 60; // 1분마다 재검증

/**
 * 게시글 내용에서 이미지 URL을 효과적으로 추출하는 함수
 */
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

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const board = searchParams.get('board');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sort = searchParams.get('sort') || 'latest';
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    if (!board) {
      return NextResponse.json(
        { error: "게시판 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 게시판 정보 가져오기 (slug로 검색)
    const { data: boardData, error: boardError } = await supabase
      .from("boards")
      .select("*")
      .eq("slug", board)
      .single();

    if (boardError) {
      console.error("게시판 정보 조회 오류:", boardError);
      return NextResponse.json(
        { error: "게시판을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 게시글 쿼리 구성 - 간단하게 필요한 정보만 가져옴
    let query = supabase
      .from("posts")
      .select("id, title, content, created_at, views, likes")
      .eq("board_id", boardData.id)
      .range(offset, offset + limit - 1);

    // 정렬 기준 적용
    if (sort === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'views') {
      query = query.order('views', { ascending: false });
    } else if (sort === 'likes') {
      query = query.order('likes', { ascending: false });
    }

    // 3. 게시글 가져오기
    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error("게시글 목록 조회 오류:", postsError);
      return NextResponse.json(
        { error: "게시글 목록을 가져오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 4. 최종 데이터 포맷팅 - 필요한 정보만 간단하게
    const formattedPosts = posts.map((post, index) => {
      // 콘텐츠 처리 (문자열이 아닐 경우 처리)
      const content = typeof post.content === 'string' 
        ? post.content 
        : (post.content ? JSON.stringify(post.content) : '');
      
      // HTML 태그 제거 및 요약 생성
      const plainText = content.replace(/<[^>]*>/g, '');
      const summary = plainText.slice(0, 150) + (plainText.length > 150 ? '...' : '');
      
      // 개선된 함수로 썸네일 이미지 추출
      let imageUrl = extractImageFromContent(content);
      
      console.log(`게시글 ${post.id}의 이미지 URL:`, imageUrl); // 디버깅 로그
      
      // 이미지가 없으면 백업 이미지 설정
      if (!imageUrl) {
        imageUrl = `/213/news${(index % 4) + 1}.jpg`;
      }
      
      return {
        id: post.id,
        title: post.title,
        content: content,
        description: summary,
        imageUrl: imageUrl,
        views: post.views || 0,
        likes: post.likes || 0,
        created_at: post.created_at,
        board_id: boardData.id,
        board_name: boardData.name,
        source: boardData.name
      };
    });

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error("게시글 목록 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 