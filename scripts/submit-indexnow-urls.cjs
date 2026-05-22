#!/usr/bin/env node

/**
 * Submit URL lists to IndexNow.
 *
 * Usage:
 *   npm run indexnow:submit -- --sitemap https://4590football.com/sitemap.xml --dry-run
 *   npm run indexnow:submit -- --sitemap https://4590football.com/sitemap.xml
 *   npm run indexnow:submit -- --url https://4590football.com/boards/all
 */

const fs = require('fs');
const path = require('path');

const INDEXNOW_ENDPOINTS = {
  bing: 'https://www.bing.com/indexnow',
  naver: 'https://searchadvisor.naver.com/indexnow',
};
const INDEXNOW_HOST = process.env.INDEXNOW_HOST || '4590football.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'c1df662b78d0423d9ef5095856359889';
const INDEXNOW_KEY_LOCATION =
  process.env.INDEXNOW_KEY_LOCATION || `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;
const DEFAULT_BATCH_SIZE = 10000;

function parseArgs(argv) {
  const args = {
    batchSize: DEFAULT_BATCH_SIZE,
    dryRun: false,
    engines: ['bing', 'naver'],
    files: [],
    sitemaps: [],
    urls: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--file' && next) {
      args.files.push(next);
      i += 1;
    } else if (arg === '--sitemap' && next) {
      args.sitemaps.push(next);
      i += 1;
    } else if (arg === '--url' && next) {
      args.urls.push(next);
      i += 1;
    } else if (arg === '--engine' && next) {
      if (next === 'all') {
        args.engines = ['bing', 'naver'];
      } else if (Object.hasOwn(INDEXNOW_ENDPOINTS, next)) {
        args.engines = [next];
      } else {
        throw new Error('--engine must be bing, naver, or all');
      }
      i += 1;
    } else if (arg === '--batch-size' && next) {
      const parsed = Number(next);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > DEFAULT_BATCH_SIZE) {
        throw new Error('--batch-size must be an integer between 1 and 10000');
      }
      args.batchSize = parsed;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Submit URLs to IndexNow.

Options:
  --file <path>        Read URLs from a text/CSV/markdown file
  --sitemap <url>      Read URLs from a sitemap or sitemap index, repeatable
  --url <url>          Submit a single URL, repeatable
  --engine <name>      bing, naver, or all. Default: all
  --batch-size <n>     URLs per request, max 10000, default 10000
  --dry-run            Parse and validate without submitting
  -h, --help           Show help

Environment:
  INDEXNOW_HOST        Default: 4590football.com
  INDEXNOW_KEY         Default: project IndexNow key
  INDEXNOW_KEY_LOCATION
`);
}

function extractUrlsFromText(text) {
  return text.match(/https:\/\/[^\s"',)<>]+/g) || [];
}

function extractLocsFromXml(xml) {
  const locs = [];
  const locPattern = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match;

  while ((match = locPattern.exec(xml))) {
    locs.push(match[1].trim());
  }

  return locs;
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.host !== INDEXNOW_HOST) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function readUrls(files, inlineUrls) {
  const rawUrls = [...inlineUrls];

  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    const text = fs.readFileSync(filePath, 'utf8');
    rawUrls.push(...extractUrlsFromText(text));
  }

  return [...new Set(rawUrls.map(normalizeUrl).filter(Boolean))];
}

async function readSitemapUrls(sitemapUrls) {
  const pending = [...sitemapUrls];
  const visited = new Set();
  const urls = [];

  while (pending.length > 0) {
    const sitemapUrl = pending.shift();
    if (!sitemapUrl || visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);

    const response = await fetch(sitemapUrl, {
      headers: {
        'user-agent': '4590-indexnow-submitter/1.0',
      },
    }).catch((error) => {
      throw new Error(
        `Failed to fetch sitemap ${sitemapUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap ${sitemapUrl}: ${response.status}`);
    }

    const xml = await response.text();
    const locs = extractLocsFromXml(xml);

    if (/<sitemapindex\b/i.test(xml)) {
      pending.push(...locs);
    } else {
      urls.push(...locs);
    }
  }

  return urls;
}

function chunk(values, size) {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
}

async function submitBatch(engine, urlList) {
  const response = await fetch(INDEXNOW_ENDPOINTS[engine], {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList,
    }),
  });

  if (response.ok || response.status === 202) {
    return { ok: true, status: response.status };
  }

  return {
    ok: false,
    status: response.status,
    error: await response.text().catch(() => response.statusText),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const sitemapUrls = await readSitemapUrls(args.sitemaps);
  const urls = [
    ...new Set([...readUrls(args.files, args.urls), ...sitemapUrls.map(normalizeUrl).filter(Boolean)]),
  ];

  if (urls.length === 0) {
    throw new Error('No valid canonical URLs found.');
  }

  const batches = chunk(urls, args.batchSize);
  console.log(
    JSON.stringify(
      {
        engines: args.engines.map((engine) => ({
          engine,
          endpoint: INDEXNOW_ENDPOINTS[engine],
        })),
        host: INDEXNOW_HOST,
        urls: urls.length,
        sitemaps: args.sitemaps.length,
        batches: batches.length,
        batchSize: args.batchSize,
        dryRun: args.dryRun,
      },
      null,
      2,
    ),
  );

  if (args.dryRun) return;

  for (const engine of args.engines) {
    for (let i = 0; i < batches.length; i += 1) {
      const result = await submitBatch(engine, batches[i]);
      const label = `${engine} batch ${i + 1}/${batches.length}`;

      if (!result.ok) {
        throw new Error(`${label} failed: ${result.status} ${result.error || ''}`.trim());
      }

      console.log(`${label}: submitted ${batches[i].length} URLs, status ${result.status}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
