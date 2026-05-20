import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteHandler } from '@/shared/lib/supabase/server';

const POLL_VISITOR_COOKIE = 'post_poll_visitor_id';
const POLL_VISITOR_MAX_AGE = 60 * 60 * 24 * 90;

function hashValue(value: string | null): string | null {
  if (!value) return null;

  const salt = process.env.POLL_HASH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'poll';
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { pollId?: string; optionId?: string } | null;
  const pollId = body?.pollId;
  const optionId = body?.optionId;

  if (!pollId || !optionId) {
    return NextResponse.json({ success: false, error: '투표 정보를 확인할 수 없습니다.' }, { status: 400 });
  }

  const existingVisitorId = request.cookies.get(POLL_VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId || crypto.randomUUID();
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;
  const userAgent = request.headers.get('user-agent') || null;

  const { supabase } = await getSupabaseRouteHandler(request);
  const supabaseAny = supabase as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{
      data: { success?: boolean; error?: string } | null;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await supabaseAny.rpc('vote_post_poll', {
    p_poll_id: pollId,
    p_option_id: optionId,
    p_visitor_id: visitorId,
    p_ip_hash: hashValue(ipAddress),
    p_user_agent_hash: hashValue(userAgent),
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!data?.success) {
    return NextResponse.json({ success: false, error: data?.error || '투표에 실패했습니다.' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  if (!existingVisitorId) {
    response.cookies.set(POLL_VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: POLL_VISITOR_MAX_AGE,
    });
  }

  return response;
}
