const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://4590fb.com';

const rootSitemap = { path: '/sitemap.xml', minUrlLocs: 1000 };

function absoluteUrl(pathOrUrl) {
  return new URL(pathOrUrl, baseUrl).toString();
}

function fetchUrlForLoc(loc) {
  const base = new URL(baseUrl);
  const parsed = new URL(loc, baseUrl);

  if (base.hostname === 'localhost' || base.hostname === '127.0.0.1') {
    return new URL(`${parsed.pathname}${parsed.search}`, base).toString();
  }

  return parsed.toString();
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

async function fetchXml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': '4590-sitemap-verifier/1.0',
    },
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  if (!body.includes('<urlset') && !body.includes('<sitemapindex')) {
    throw new Error(`${url} is not a sitemap XML response`);
  }

  return body;
}

async function verifySitemap({ path, minUrlLocs }) {
  const url = absoluteUrl(path);
  const rootXml = await fetchXml(url);
  const rootLocs = extractLocs(rootXml);

  if (rootXml.includes('<urlset')) {
    if (rootLocs.length < minUrlLocs) {
      throw new Error(`${url} has ${rootLocs.length} URL entries, expected at least ${minUrlLocs}`);
    }

    console.log(`${url} OK (${rootLocs.length} urls)`);
    return;
  }

  let totalUrlLocs = 0;
  const sectionResults = [];

  for (const loc of rootLocs) {
    const fetchUrl = fetchUrlForLoc(loc);
    const sectionXml = await fetchXml(fetchUrl);
    const sectionLocs = extractLocs(sectionXml);

    if (!sectionXml.includes('<urlset')) {
      throw new Error(`${fetchUrl} is listed in the sitemap index but is not a urlset`);
    }

    totalUrlLocs += sectionLocs.length;
    sectionResults.push({ loc, count: sectionLocs.length });
  }

  if (totalUrlLocs < minUrlLocs) {
    throw new Error(`${url} has ${totalUrlLocs} total URL entries, expected at least ${minUrlLocs}`);
  }

  console.log(`${url} OK (${rootLocs.length} sections, ${totalUrlLocs} urls)`);
  for (const section of sectionResults) {
    console.log(`- ${section.loc} (${section.count} urls)`);
  }
}

async function main() {
  const failures = [];

  try {
    await verifySitemap(rootSitemap);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
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
