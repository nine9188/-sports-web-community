import { siteConfig } from '@/shared/config';
import { query, toIso, sitemapResponse } from '@/shared/utils/sitemap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = siteConfig.url;

  // 모든 게시판 조회
  const boards = await query<{ id: string; slug: string }>(
    'boards',
    'select=id,slug&slug=not.is.null'
  );
  if (!boards.length) return sitemapResponse([]);

  const boardMap = new Map(boards.map((b) => [b.id, b.slug]));
  const boardIds = boards.map((b) => b.id);

  // 최근 게시글 (최대 45000개 - sitemap 50000 제한 고려)
  const posts = await query<{ post_number: number; board_id: string; updated_at: string | null }>(
    'posts',
    `select=post_number,board_id,updated_at&board_id=in.(${boardIds.join(',')})&is_deleted=eq.false&is_published=eq.true&order=created_at.desc&limit=45000`
  );

  return sitemapResponse(
    posts
      .filter((p) => boardMap.get(p.board_id))
      .map((p) => ({
        url: `${baseUrl}/boards/${boardMap.get(p.board_id)}/${p.post_number}`,
        lastModified: toIso(p.updated_at),
        changeFrequency: 'weekly',
        priority: 0.5,
      }))
  );
}
