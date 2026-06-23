const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FUNCTIONS = ['admin', 'api', 'boards', 'livescore', 'settings', 'default'];

// 1. Read base wrangler config
const wranglerConfigPath = path.join(__dirname, '../wrangler.jsonc');
const wranglerConfig = JSON.parse(fs.readFileSync(wranglerConfigPath, 'utf8'));

// 2. Prepare dist directory
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 3. Define routes mapping for each function
const routesMap = {
  admin: [{ pattern: "4590fb.com/admin/*", zone_name: "4590fb.com" }],
  api: [{ pattern: "4590fb.com/api/*", zone_name: "4590fb.com" }],
  boards: [{ pattern: "4590fb.com/boards/*", zone_name: "4590fb.com" }],
  livescore: [{ pattern: "4590fb.com/livescore/football/*", zone_name: "4590fb.com" }],
  settings: [{ pattern: "4590fb.com/settings/*", zone_name: "4590fb.com" }],
  default: [{ pattern: "4590fb.com/*", zone_name: "4590fb.com" }]
};

console.log('Starting deployment orchestration for split functions...');

for (const fn of FUNCTIONS) {
  console.log(`\n========================================`);
  // Create entrypoint wrapper (all workers point to the pre-bundled 'default' engine)
  const wrapperContent = `import { handler } from "../.open-next/server-functions/default/handler.mjs";
import { runWithCloudflareRequestContext } from "../.open-next/cloudflare/init.js";

const BLOCKED_BOTS = [
  "claudebot",
  "semrushbot",
  "mj12bot",
  "gptbot",
  "applebot",
  "barkrowler",
  "baiduspider"
];

export default {
  async fetch(request, env, ctx) {
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    if (BLOCKED_BOTS.some((bot) => ua.includes(bot))) {
      return new Response("Forbidden", { status: 403 });
    }

    return runWithCloudflareRequestContext(request, env, ctx, async () => {
      return handler(request, env, ctx, request.signal);
    });
  }
};
`;
  const wrapperPath = path.join(distDir, `${fn}-worker.mjs`);
  fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
  console.log(`Created wrapper entrypoint at ${wrapperPath}`);

  // Create customized wrangler config
  const customWrangler = {
    $schema: "node_modules/wrangler/config-schema.json",
    name: fn === 'default' ? '4590fb-default' : `4590fb-${fn}`,
    main: `dist/${fn}-worker.mjs`,
    compatibility_date: wranglerConfig.compatibility_date,
    compatibility_flags: wranglerConfig.compatibility_flags,
    workers_dev: true,
    assets: wranglerConfig.assets,
    r2_buckets: wranglerConfig.r2_buckets,
    services: [
      {
        binding: "WORKER_SELF_REFERENCE",
        service: fn === 'default' ? '4590fb-default' : `4590fb-${fn}`
      }
    ],
    images: wranglerConfig.images,
    observability: wranglerConfig.observability,
    routes: routesMap[fn],
    vars: wranglerConfig.vars
  };

  const customWranglerPath = path.join(__dirname, `../wrangler.${fn}.jsonc`);
  fs.writeFileSync(customWranglerPath, JSON.stringify(customWrangler, null, 2), 'utf8');
  console.log(`Created wrangler config at ${customWranglerPath}`);

  // Deploy via Wrangler CLI
  const isDryRun = process.argv.includes('--dry-run') ? '--dry-run' : '';
  const deployCmd = `npx wrangler deploy --config wrangler.${fn}.jsonc --minify --define __dirname:\\".\\" --define __filename:\\"\\" --alias sharp:./.open-next/cloudflare-templates/shims/empty.js ${isDryRun}`;
  console.log(`Executing: ${deployCmd}`);
  
  try {
    const output = execSync(deployCmd, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: process.env
    });
  } catch (error) {
    console.error(`Failed to deploy ${fn} worker:`, error.message);
    process.exit(1);
  }
}

console.log('\nAll split functions deployed successfully! 🎉');
