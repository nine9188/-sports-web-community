import { handler } from "./.open-next/server-functions/boards/index.mjs";
import { runWithCloudflareRequestContext } from "./.open-next/cloudflare/init.js";

export default {
  async fetch(request, env, ctx) {
    return runWithCloudflareRequestContext(request, env, ctx, async () => {
      return handler(request, env, ctx, request.signal);
    });
  }
};
