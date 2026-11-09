// Vercel function: POST /api/chat. Wires real dependencies into the tested handler.
import Anthropic from '@anthropic-ai/sdk';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createChatHandler } from './_handler.js';

const isProduction = process.env.VERCEL_ENV === 'production';

function makeLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Local dev and previews may skip Redis; production must not run unlimited.
    return async () => {
      if (isProduction) throw new Error('Upstash is not configured');
      return true;
    };
  }
  const redis = Redis.fromEnv();
  const perIp = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 d'), prefix: 'chacha:ip' });
  const global = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(300, '1 d'), prefix: 'chacha:all' });
  return async (ip) => (await perIp.limit(ip)).success && (await global.limit('all')).success;
}

function allowedOrigins() {
  const list = (process.env.ALLOWED_ORIGINS || 'https://chunghan.work,https://www.chunghan.work')
    .split(',').map((s) => s.trim()).filter(Boolean);
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host) list.push(`https://${host}`);
  }
  if (!isProduction) list.push('http://localhost:3000');
  return list;
}

const handle = createChatHandler({
  client: process.env.ANTHROPIC_API_KEY ? new Anthropic() : null,
  limiter: makeLimiter(),
  model: process.env.CHACHA_MODEL || 'claude-opus-5-5',
  allowedOrigins: allowedOrigins(),
});

export const POST = handle;
export const GET = handle;
