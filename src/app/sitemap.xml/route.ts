import { NextResponse } from 'next/server';
import { siteConfig } from '@/shared/config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SITEMAP_IDS = [
  'static',
  'boards-football',
  'boards-kleague',
  'boards-news',
  'boards-community',
  'posts-football',
  'posts-kleague',
  'posts-news',
  'posts-community',
  'teams',
  'matches',
  'shop',
  'players-epl',
  'players-laliga',
  'players-bundesliga',
  'players-serie-a',
  'players-ligue1',
  'players-eredivisie',
  'players-primeira',
  'players-danish',
  'players-kleague',
  'players-jleague',
  'players-saudi',
  'players-mls',
];

export async function GET() {
  const baseUrl = siteConfig.url;

  const entries = SITEMAP_IDS.map(
    (id) => `  <sitemap>
    <loc>${baseUrl}/sitemaps/${id}.xml</loc>
  </sitemap>`
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}
