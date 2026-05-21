import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/shared/lib/supabase/client.server'

export const runtime = 'nodejs'

type RssEnrichmentModule = {
  enrichInsertedRssPost: (
    supabase: ReturnType<typeof getSupabaseAdmin>,
    options: { postId: string; board?: string; verbose?: boolean }
  ) => Promise<number>
}

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true

  return request.headers.get('authorization') === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const postId = typeof body?.postId === 'string' ? body.postId : null
  const board = typeof body?.board === 'string' ? body.board : 'foreign-news'

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { enrichInsertedRssPost } = await import('../../../../../scripts/enrich-rss-posts.cjs') as RssEnrichmentModule
  const updated = await enrichInsertedRssPost(supabase, { postId, board })

  return NextResponse.json({ updated })
}
