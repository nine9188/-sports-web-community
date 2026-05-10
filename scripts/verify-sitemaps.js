const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://4590football.com';

const checks = [
  { path: '/sitemap.xml', minLocs: 8 },
  { path: '/boards/posts/sitemap/0.xml', minLocs: 100 },
  { path: '/livescore/football/team/sitemap/0.xml', minLocs: 100 },
  { path: '/livescore/football/player/sitemap/0.xml', minLocs: 100 },
  { path: '/livescore/football/match/sitemap/0.xml', minLocs: 100 },
  { path: '/transfers/sitemap.xml', minLocs: 100 },
];

function absoluteUrl(path) {
  return new URL(path, baseUrl).toString();
}

async function verifySitemap({ path, minLocs }) {
  const url = absoluteUrl(path);
  const response = await fetch(url, {
    headers: {
      'user-agent': '4590-sitemap-verifier/1.0',
    },
  });

  const body = await response.text();
  const locs = (body.match(/<loc>/g) || []).length;

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  if (!body.includes('<urlset') && !body.includes('<sitemapindex')) {
    throw new Error(`${url} is not a sitemap XML response`);
  }

  if (locs < minLocs) {
    throw new Error(`${url} has ${locs} <loc> entries, expected at least ${minLocs}`);
  }

  console.log(`${url} OK (${locs} urls)`);
}

async function main() {
  const failures = [];

  for (const check of checks) {
    try {
      await verifySitemap(check);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (failures.length > 0) {
    console.error('Sitemap verification failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
