import { createClient } from '@/app/lib/supabase.server';
import { NextRequest, NextResponse } from 'next/server';
import { fetchSimpleRSSFeed } from '@/app/lib/rss-parser';

// GET: 모든 RSS 피드 목록 가져오기
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('rss_feeds')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '피드 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('RSS 피드 목록 가져오기 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST: 새 RSS 피드 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, board_id, name, description } = body;

    if (!url || !board_id) {
      return NextResponse.json({ error: 'URL과 게시판 ID는 필수 입력값입니다.' }, { status: 400 });
    }

    // 직접 RSS 피드 연결 시도 (CORS 및 보안 정책 우회를 위해 서버 측에서 처리)
    try {
      // 유효한 URL인지 확인
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: '유효한 URL 형식이 아닙니다.' }, { status: 400 });
      }
      
      // 피드 가져오기 시도
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot/1.0)'
        },
        next: { revalidate: 0 } // 캐시 방지
      });
      
      if (!response.ok) {
        return NextResponse.json({ 
          error: `피드를 가져오는데 실패했습니다. 상태 코드: ${response.status}` 
        }, { status: 400 });
      }
      
      const text = await response.text();
      
      // 간단한 XML 검증 - RSS 피드의 기본 구조 확인
      if (!text.includes('<rss') && !text.includes('<feed') && !text.includes('<channel')) {
        return NextResponse.json({ error: '유효한 RSS 또는 Atom 피드 형식이 아닙니다.' }, { status: 400 });
      }
      
      // item 또는 entry 태그가 있는지 확인
      if (!text.includes('<item') && !text.includes('<entry')) {
        return NextResponse.json({ error: '피드에 항목이 없습니다.' }, { status: 400 });
      }
      
      // 세부 파싱은 fetchSimpleRSSFeed로 처리
      const feedData = await fetchSimpleRSSFeed(url);
      if (feedData.items.length === 0) {
        return NextResponse.json({ error: '유효한 RSS 피드지만 항목이 없습니다.' }, { status: 400 });
      }
    } catch (error) {
      console.error('RSS 피드 유효성 검증 오류:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : '피드 검증에 실패했습니다.'
      }, { status: 400 });
    }

    const supabase = await createClient();

    // 이미 등록된 URL인지 확인
    const { data: existingFeed } = await supabase
      .from('rss_feeds')
      .select('id')
      .eq('url', url)
      .single();

    if (existingFeed) {
      return NextResponse.json({ error: '이미 등록된 RSS 피드 URL입니다.' }, { status: 400 });
    }

    // 게시판 존재 여부 확인
    const { data: boardExists } = await supabase
      .from('boards')
      .select('id')
      .eq('id', board_id)
      .single();

    if (!boardExists) {
      return NextResponse.json({ error: '존재하지 않는 게시판입니다.' }, { status: 400 });
    }

    // 새 RSS 피드 추가
    const { data, error } = await supabase
      .from('rss_feeds')
      .insert([
        {
          url,
          board_id,
          name: name || null,
          description: description || null,
          is_active: true,
          last_fetched_at: null
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '피드 등록에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('RSS 피드 추가 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PUT: RSS 피드 정보 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: '피드 ID는 필수 입력값입니다.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 피드 존재 여부 확인
    const { data: feedExists } = await supabase
      .from('rss_feeds')
      .select('id')
      .eq('id', id)
      .single();

    if (!feedExists) {
      return NextResponse.json({ error: '존재하지 않는 피드입니다.' }, { status: 404 });
    }

    // 업데이트할 필드 구성
    const updateFields: Record<string, unknown> = {};
    
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (is_active !== undefined) updateFields.is_active = is_active;

    const { data, error } = await supabase
      .from('rss_feeds')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '피드 정보 업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('RSS 피드 업데이트 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE: RSS 피드 삭제
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '피드 ID는 필수 입력값입니다.' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('rss_feeds')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: '피드 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RSS 피드 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 