const baseUrl = 'https://4590fb.com';

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
}

async function fetchXml(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': '4590-sitemap-checker/1.0',
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
  return body;
}

async function main() {
  console.log(`📡 Fetching root sitemap from ${baseUrl}/sitemap.xml ...`);
  try {
    const rootXml = await fetchXml(`${baseUrl}/sitemap.xml`);
    const sitemaps = extractLocs(rootXml);
    console.log(`Found ${sitemaps.length} sitemap sections in index:`);

    let totalUrls = 0;
    for (const sitemapUrl of sitemaps) {
      console.log(`- Fetching section: ${sitemapUrl} ...`);
      try {
        const sectionXml = await fetchXml(sitemapUrl);
        const locs = extractLocs(sectionXml);
        console.log(`  => ${locs.length} URLs`);
        totalUrls += locs.length;

        // Print first 5 sample URLs
        if (locs.length > 0) {
          console.log(`  Samples:`);
          locs.slice(0, 5).forEach(loc => console.log(`    * ${loc}`));
        }
      } catch (err) {
        console.error(`  ❌ Error fetching section:`, err.message);
      }
    }
    console.log(`\n📊 Total URLs in sitemap index: ${totalUrls}`);
  } catch (err) {
    console.error('❌ Error fetching root sitemap:', err.message);
  }
}

main();
