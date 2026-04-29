/**
 * Cloudflare Worker cron for match highlight sync.
 *
 * Deploy:
 *   cd workers/sync-highlights
 *   npx wrangler secret put CRON_SECRET
 *   npx wrangler deploy
 */

async function runSync(env, trigger = 'manual') {
  const siteOrigin = env.SITE_ORIGIN || 'https://4590football.com';
  const days = env.SYNC_DAYS || '7';
  const targetUrl = `${siteOrigin.replace(/\/$/, '')}/api/sync-highlights?days=${encodeURIComponent(days)}`;

  const response = await fetch(targetUrl, {
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET || ''}`,
      'User-Agent': `4590-sync-highlights-worker/${trigger}`,
    },
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(`sync-highlights failed: ${response.status} ${text}`);
  }

  return {
    ok: true,
    status: response.status,
    targetUrl,
    body,
  };
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runSync(env, 'cron'));
  },

  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/health') {
      return Response.json({ ok: true, service: 'sync-highlights' });
    }

    if (url.pathname === '/run') {
      const header = request.headers.get('Authorization');
      if (env.CRON_SECRET && header !== `Bearer ${env.CRON_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        const result = await runSync(env, 'manual');
        return Response.json(result);
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};
