import { siteConfig } from '@/shared/config';
import { siteUrl } from '@/shared/seo/sitemap';

function generatedSitemapUrl(path: string) {
  return siteUrl(`${path}/sitemap/0.xml`);
}

const DAUM_WEBMASTER_PIN =
  '#DaumWebMasterTool:01765042dd66f6f3757a98813cab0c841580123d8059d5895751b2575132466f:Qc8LDKHH1AV7wtQw2Sv8Rw==';

export const dynamic = 'force-static';

export function GET() {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Allow: /livescore/',
    'Disallow: /signin',
    'Disallow: /signup',
    'Disallow: /social-signup',
    'Disallow: /auth',
    'Disallow: /help',
    'Disallow: /settings',
    'Disallow: /notifications',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /user/',
    'Disallow: /search',
    'Disallow: /boards/*/create',
    'Disallow: /boards/*/edit',
    'Disallow: /ui',
    'Disallow: /*?from=*',
    'Disallow: /*?sort=*',
    '',
    'User-agent: YandexBot',
    'Crawl-delay: 10',
    'Allow: /',
    'Disallow: /user/',
    'Disallow: /settings',
    'Disallow: /notifications',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /search',
    '',
    'User-agent: bingbot',
    'Crawl-delay: 5',
    'Allow: /',
    'Disallow: /user/',
    'Disallow: /settings',
    'Disallow: /notifications',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /search',
    '',
    'User-agent: Yeti',
    'Crawl-delay: 5',
    'Allow: /',
    'Disallow: /user/',
    'Disallow: /settings',
    'Disallow: /notifications',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /search',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    'Allow: /livescore/football',
    'Allow: /livescore/football/leagues',
    'Disallow: /livescore/football/match/',
    'Disallow: /livescore/football/player/',
    'Disallow: /livescore/football/team/',
    'Disallow: /livescore/football/*?*',
    'Disallow: /*_rsc=*',
    '',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    '',
    'User-agent: SERankingBot',
    'Disallow: /',
    '',
    `Host: ${new URL(siteConfig.url).host}`,
    `Sitemap: ${siteUrl('/sitemap.xml')}`,
    `Sitemap: ${siteUrl('/boards/sitemap.xml')}`,
    `Sitemap: ${generatedSitemapUrl('/boards/posts')}`,
    `Sitemap: ${siteUrl('/livescore/football/leagues/sitemap.xml')}`,
    `Sitemap: ${generatedSitemapUrl('/livescore/football/team')}`,
    `Sitemap: ${generatedSitemapUrl('/livescore/football/player')}`,
    `Sitemap: ${generatedSitemapUrl('/livescore/football/match')}`,
    `Sitemap: ${siteUrl('/transfers/sitemap.xml')}`,
    `Sitemap: ${siteUrl('/shop/sitemap.xml')}`,
    '',
    DAUM_WEBMASTER_PIN,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
