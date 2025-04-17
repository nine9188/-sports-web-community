import { createClient } from '@/app/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/app/lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

// 현재 인증된 사용자를 가져오는 함수
async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('사용자 인증 정보 확인 중 오류:', error);
    return null;
  }
}

interface YoutubeVideo {
  id: string;
  title: string;
  description: string | null;
  publishedAt: string;
  thumbnails: {
    default?: { url: string, width: number, height: number };
    medium?: { url: string, width: number, height: number };
    high?: { url: string, width: number, height: number };
    standard?: { url: string, width: number, height: number };
    maxres?: { url: string, width: number, height: number };
  };
}

interface YoutubeApiResponse {
  items: Array<{
    snippet: {
      resourceId?: {
        videoId: string;
      };
      title: string;
      description: string;
      publishedAt: string;
      thumbnails: YoutubeVideo['thumbnails'];
    };
  }>;
  nextPageToken?: string;
  error?: {
    message: string;
  };
}

interface ChannelApiResponse {
  items: Array<{
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }>;
  error?: {
    message: string;
  };
}

interface ChannelInfo {
  id: string;
  title: string;
}

// 유튜브 동영상을 가져오는 함수 - 채널 전체 또는 특정 재생목록
async function fetchYoutubeVideos(channelId: string, apiKey: string, playlistId: string | null = null): Promise<YoutubeVideo[]> {
  try {
    const videos: YoutubeVideo[] = [];
    let nextPageToken: string | null = null;
    let totalFetched = 0;
    const maxResults = 50; // 한 번에 가져올 최대 개수
    const maxTotal = 10; // 총 가져올 최대 개수 (테스트를 위해 10개로 제한)
    
    // 재생목록이 있으면 재생목록에서 동영상 가져오기, 없으면 채널의 모든 동영상 가져오기
    if (playlistId) {
      // 특정 재생목록에서 동영상 가져오기
      do {
        const url: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const response: Response = await fetch(url);
        const data: YoutubeApiResponse = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || '유튜브 API 요청 실패');
        }
        
        // 동영상 정보 추출 및 저장
        for (const item of data.items) {
          if (item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId) {
            videos.push({
              id: item.snippet.resourceId.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              publishedAt: item.snippet.publishedAt,
              thumbnails: item.snippet.thumbnails
            });
          }
        }
        
        totalFetched += data.items.length;
        nextPageToken = data.nextPageToken || null;
      } while (nextPageToken && totalFetched < maxTotal);
    } else {
      // 채널의 업로드된 모든 동영상 가져오기
      
      // 1. 먼저 채널의 업로드 플레이리스트 ID 가져오기
      const channelUrl: string = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
      const channelResponse: Response = await fetch(channelUrl);
      const channelData: ChannelApiResponse = await channelResponse.json();
      
      if (!channelResponse.ok) {
        throw new Error(channelData.error?.message || '유튜브 API 요청 실패');
      }
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('채널을 찾을 수 없습니다.');
      }
      
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
      
      // 2. 업로드 플레이리스트에서 동영상 가져오기
      do {
        const url: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${uploadsPlaylistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const response: Response = await fetch(url);
        const data: YoutubeApiResponse = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || '유튜브 API 요청 실패');
        }
        
        // 동영상 정보 추출 및 저장
        for (const item of data.items) {
          if (item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId) {
            videos.push({
              id: item.snippet.resourceId.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              publishedAt: item.snippet.publishedAt,
              thumbnails: item.snippet.thumbnails
            });
          }
        }
        
        totalFetched += data.items.length;
        nextPageToken = data.nextPageToken || null;
      } while (nextPageToken && totalFetched < maxTotal);
    }
    
    return videos;
  } catch (error) {
    console.error('유튜브 동영상 가져오기 오류:', error);
    throw error;
  }
}

// 동영상을 게시글로 변환하는 함수
async function createPostFromVideo(
  video: YoutubeVideo, 
  channelInfo: ChannelInfo, 
  boardId: string, 
  supabase: SupabaseClient<Database>, 
  userId: string
) {
  try {
    // 썸네일 URL 가져오기
    const thumbnailUrl = video.thumbnails?.high?.url || video.thumbnails?.default?.url || null;
    
    // HTML 콘텐츠 생성 (썸네일 포함)
    const content = `
<div class="youtube-embed">
  <iframe 
    width="100%" 
    height="480" 
    src="https://www.youtube.com/embed/${video.id}" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen
  ></iframe>
</div>

${thumbnailUrl ? `<div class="thumbnail" style="display:none;"><img src="${thumbnailUrl}" alt="${video.title}" /></div>` : ''}

<div class="video-description">
  ${video.description ? video.description.replace(/\n/g, '<br>') : ''}
</div>

<div class="video-meta">
  <p>출처: <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">YouTube - ${channelInfo.title}</a></p>
  <p>업로드 일자: ${new Date(video.publishedAt).toLocaleString()}</p>
</div>
    `;
    
    // 게시물 등록 - thumbnail_url과 source_type 필드 제거, meta 필드 사용
    const { data: post, error } = await supabase.from('posts').insert({
      title: video.title,
      content: content,
      user_id: userId,
      board_id: boardId,
      views: 0,
      likes: 0,
      dislikes: 0,
      is_published: true,
      // thumbnail_url 필드 제거
      source_url: `https://www.youtube.com/watch?v=${video.id}`,
      // source_type 제거
      meta: {
        youtube_id: video.id,
        channel_id: channelInfo.id,
        source_type: 'youtube',
        thumbnail_url: thumbnailUrl // 썸네일 URL을 meta에 저장
      }
    }).select('id').single();
    
    if (error) {
      console.error('게시글 등록 오류:', error);
      console.log('테이블 구조 확인 필요:', error.message);
      return null;
    }
    
    return post;
  } catch (error) {
    console.error('게시글 생성 오류:', error);
    return null;
  }
}

// 테이블 상태 확인 함수 추가
async function checkTableStructure(supabase: SupabaseClient<Database>, tableName: string) {
  try {
    // 테이블 정보 조회 
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error) {
      console.error(`테이블 상태 확인 오류(${tableName}):`, error);
      return false;
    }
    
    // 조회 성공 - 스키마 정보 로깅
    if (data) {
      console.log(`테이블 ${tableName} 구조:`, 
        data.length > 0 ? Object.keys(data[0]).join(', ') : '(비어있음)');
    }
    
    return true;
  } catch (error) {
    console.error(`테이블 확인 중 오류(${tableName}):`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 관리자 확인
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    // 요청 데이터 파싱
    const body = await request.json();
    const { channelId } = body;
    
    if (!channelId) {
      return NextResponse.json(
        { error: '채널 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 테이블 구조 확인
    await checkTableStructure(supabase, 'posts');
    
    // 채널 정보 가져오기
    const { data: channelInfo, error: channelError } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('id', channelId)
      .single();
    
    if (channelError || !channelInfo) {
      return NextResponse.json(
        { error: '유튜브 채널 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 최근 크롤링 일시 확인 (디버깅을 위해 로깅)
    const lastCrawledAt = channelInfo.last_crawled_at ? new Date(channelInfo.last_crawled_at) : null;
    console.log('마지막 크롤링 시간:', lastCrawledAt);
    console.log('채널 정보:', JSON.stringify({
      channel_id: channelInfo.channel_id,
      playlist_id: channelInfo.playlist_id
    }));
    
    // 채널이나 재생목록에서 동영상 가져오기
    const videos = await fetchYoutubeVideos(
      channelInfo.channel_id, 
      channelInfo.api_key,
      channelInfo.playlist_id || null
    );
    
    console.log(`총 ${videos.length}개의 동영상을 가져왔습니다.`);
    
    // 최대 30개 처리
    const newVideos = videos.slice(0, 30); // 30개까지 처리
    
    console.log(`새 동영상 ${newVideos.length}개 처리 시작`);
    
    // 이미 등록된 유튜브 ID 목록 가져오기 (중복 체크용)
    const { data: existingVideos, error: existingVideosError } = await supabase
      .from('posts')
      .select('meta')
      .eq('board_id', channelInfo.board_id)
      .not('meta', 'is', null);
      
    if (existingVideosError) {
      console.error('기존 유튜브 게시물 조회 오류:', existingVideosError);
    }
    
    // 기존 유튜브 ID 목록 생성
    const existingYoutubeIds = new Set();
    if (existingVideos) {
      existingVideos.forEach(post => {
        if (post.meta && typeof post.meta === 'object' && post.meta.youtube_id) {
          existingYoutubeIds.add(post.meta.youtube_id);
        }
      });
    }
    
    console.log(`이미 등록된 유튜브 ID 수: ${existingYoutubeIds.size}개`);
    
    // 각 동영상을 게시글로 변환 (중복 체크 적용)
    const createdPosts = [];
    let duplicateCount = 0;
    
    for (const video of newVideos) {
      // 중복 체크
      if (existingYoutubeIds.has(video.id)) {
        console.log(`동영상 중복 건너뛰기: ${video.title} (ID: ${video.id})`);
        duplicateCount++;
        continue;
      }
      
      console.log(`동영상 처리 중: ${video.title} (ID: ${video.id})`);
      const post = await createPostFromVideo(
        video, 
        { id: channelInfo.channel_id, title: channelInfo.channel_name }, 
        channelInfo.board_id, 
        supabase, 
        user.id
      );
      
      if (post) {
        createdPosts.push(post);
        console.log(`- 게시글 생성 성공: ${post.id}`);
      } else {
        console.log(`- 게시글 생성 실패`);
      }
    }
    
    // 마지막 크롤링 시간 업데이트
    await supabase
      .from('youtube_channels')
      .update({ last_crawled_at: new Date().toISOString() })
      .eq('id', channelId);
    
    return NextResponse.json({
      success: true,
      imported: createdPosts.length,
      total: videos.length,
      filtered: newVideos.length,
      duplicates: duplicateCount,
      channel_info: {
        id: channelInfo.id,
        channel_id: channelInfo.channel_id,
        playlist_id: channelInfo.playlist_id,
        last_crawled_at: lastCrawledAt?.toISOString()
      },
      db_columns_available: {
        posts_table: "id, title, content, user_id, category, views, likes, tags, created_at, updated_at, board_id, status, dislikes, post_number, source_url, is_published, meta",
        fixed: "thumbnail_url과 source_type 필드를 meta 객체에 포함시킴"
      },
      message: `${createdPosts.length}개의 새 동영상을 가져왔습니다. ${duplicateCount}개의 중복 건너뛰기.`
    });
  } catch (error) {
    console.error('유튜브 크롤링 오류:', error);
    return NextResponse.json(
      { 
        error: '동영상 크롤링 중 오류가 발생했습니다.',
        message: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 