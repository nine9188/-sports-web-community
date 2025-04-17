import { createClient } from '@/app/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
import { parseRSSFeed } from '@/app/lib/rss-parser';

// RSS 피드를 가져와 게시글로 변환하는 함수
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feed_id, manual_fetch = false } = body;

    if (!feed_id) {
      return NextResponse.json({ error: '피드 ID는 필수 입력값입니다.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 피드 정보 가져오기
    const { data: feedData, error: feedError } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('id', feed_id)
      .single();

    if (feedError || !feedData) {
      return NextResponse.json({ error: '피드를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!feedData.is_active && !manual_fetch) {
      return NextResponse.json({ error: '비활성화된 피드입니다.' }, { status: 400 });
    }

    // 피드 URL이 없는 경우
    if (!feedData.url) {
      return NextResponse.json({ error: '피드 URL이 없습니다.' }, { status: 400 });
    }

    // 마지막 가져온 시간 이후로 1시간이 지나지 않았으면 스킵 (수동 가져오기는 제외)
    if (!manual_fetch && feedData.last_fetched_at) {
      const lastFetchedTime = new Date(feedData.last_fetched_at).getTime();
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      if (lastFetchedTime > oneHourAgo) {
        return NextResponse.json({ 
          message: '최근에 이미 가져왔습니다. 1시간 후에 다시 시도해주세요.',
          last_fetched_at: feedData.last_fetched_at
        });
      }
    }

    // RSS 피드 파싱
    try {
      const feed = await parseRSSFeed(feedData.url);
      const boardId = feedData.board_id;

      // 이미 가져온 게시글 URL 목록 확인 (중복 방지)
      const { data: existingPosts } = await supabase
        .from('rss_posts')
        .select('source_url')
        .eq('feed_id', feed_id);

      const existingUrls = new Set((existingPosts || []).map(post => post.source_url));

      // 새 게시글만 필터링
      const newItems = feed.items.filter(item => item.link && !existingUrls.has(item.link));

      if (newItems.length === 0) {
        // 마지막 가져온 시간 업데이트
        await supabase
          .from('rss_feeds')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', feed_id);
          
        return NextResponse.json({ message: '새로운 게시글이 없습니다.', imported: 0 });
      }

      // RSS 게시글 정보 준비
      const rssPostsData = newItems.map(item => ({
        feed_id: feed_id,
        title: item.title,
        source_url: item.link,
        description: item.description || '',
        image_url: item.imageUrl || null,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        author: item.author || null,
        is_processed: false
      }));

      // 실제 게시판 게시글 정보 준비
      const postsData = newItems.map(async (item) => {
        // JSON 형태의 게시글 내용 생성
        const contentObj = {
          type: "doc",
          content: [] as Array<{
            type: string;
            content?: Array<{
              type: string;
              text?: string;
              marks?: Array<{
                type: string;
                attrs?: {
                  href?: string;
                  target?: string;
                  rel?: string;
                }
              }>;
            }>;
            attrs?: {
              src?: string;
              alt?: string;
            }
          }>
        };
        
        // 출처 문단 추가
        contentObj.content.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `출처: ${feed.title}`
            }
          ]
        });
        
        // 이미지가 있으면 상단에 이미지 추가
        if (item.imageUrl) {
          contentObj.content.push({
            type: "image",
            attrs: {
              src: item.imageUrl,
              alt: item.title
            }
          });
        }
        
        // 설명 추가
        if (item.description) {
          contentObj.content.push({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: item.description
              }
            ]
          });
        }
        
        // 출처 링크 추가
        contentObj.content.push({
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "원문 보기: "
            },
            {
              type: "text",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: item.link,
                    target: "_blank",
                    rel: "noopener noreferrer"
                  }
                }
              ],
              text: feed.title
            }
          ]
        });
        
        // 관리자 사용자 ID 찾기
        const { data: adminUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_admin', true)
          .limit(1)
          .single();
        
        const adminId = adminUser?.id || "00000000-0000-0000-0000-000000000000";
        
        return {
          board_id: boardId,
          title: item.title,
          content: contentObj,
          user_id: adminId,
          status: "published",
          created_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category: "rss",
          tags: ["rss", "자동 생성"],
          source_url: item.link
        };
      });

      // Promise.all로 배열 처리
      const resolvedPostsData = await Promise.all(postsData);

      // 트랜잭션으로 게시글과 RSS 포스트 정보 저장
      const { data: insertedRssPosts, error: rssPostError } = await supabase
        .from('rss_posts')
        .insert(rssPostsData)
        .select();

      if (rssPostError) {
        return NextResponse.json({ error: 'RSS 게시글 저장에 실패했습니다.' }, { status: 500 });
      }

      // 게시판 게시글 저장
      const { data: insertedPosts, error: postsError } = await supabase
        .from('posts')
        .insert(resolvedPostsData)
        .select('id');

      if (postsError) {
        return NextResponse.json({ error: '게시글 저장에 실패했습니다.' }, { status: 500 });
      }

      // RSS 포스트의 is_processed 업데이트
      if (insertedRssPosts && insertedRssPosts.length > 0) {
        await supabase
          .from('rss_posts')
          .update({ is_processed: true })
          .in('id', insertedRssPosts.map(post => post.id));
      }

      // 마지막 가져온 시간 업데이트
      await supabase
        .from('rss_feeds')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', feed_id);

      return NextResponse.json({
        message: '성공적으로 가져왔습니다.',
        imported: newItems.length,
        posts: insertedPosts
      });
    } catch (error: unknown) {
      console.error('RSS 피드 파싱 및 게시글 저장 오류:', error);
      
      // 피드 오류 횟수 증가
      await supabase
        .from('rss_feeds')
        .update({
          error_count: (feedData.error_count || 0) + 1,
          last_error: error instanceof Error ? error.message : '알 수 없는 오류',
          last_error_at: new Date().toISOString()
        })
        .eq('id', feed_id);
        
      return NextResponse.json({ error: '피드 파싱에 실패했습니다.' }, { status: 500 });
    }
  } catch (error) {
    console.error('RSS 피드 가져오기 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 모든 활성화된 피드 가져오기
export async function GET() {
  try {
    const supabase = await createClient();

    // 활성화된 피드만 가져오기
    const { data: activeFeeds, error } = await supabase
      .from('rss_feeds')
      .select('id, url, board_id, name, last_fetched_at')
      .eq('is_active', true)
      .order('last_fetched_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: '피드 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }

    // 각 피드별로 가져오기 수행
    const results = await Promise.all(
      activeFeeds.map(async (feed) => {
        // 마지막 가져온 시간 확인
        let shouldFetch = true;
        if (feed.last_fetched_at) {
          const lastFetchedTime = new Date(feed.last_fetched_at).getTime();
          const oneHourAgo = Date.now() - 60 * 60 * 1000;
          shouldFetch = lastFetchedTime < oneHourAgo;
        }

        if (!shouldFetch) {
          return {
            feed_id: feed.id,
            name: feed.name,
            status: 'skipped',
            message: '최근에 이미 가져왔습니다.'
          };
        }

        try {
          // 내부 API 호출
          const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/rss/fetch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ feed_id: feed.id })
          });

          const result = await response.json();
          
          return {
            feed_id: feed.id,
            name: feed.name,
            status: response.ok ? 'success' : 'error',
            message: result.message || result.error,
            imported: result.imported || 0
          };
        } catch (error: unknown) {
          return {
            feed_id: feed.id,
            name: feed.name,
            status: 'error',
            message: error instanceof Error ? error.message : '피드 가져오기 실패'
          };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('RSS 피드 가져오기 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 