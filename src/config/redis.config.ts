import { registerAs } from '@nestjs/config';

// Parse Redis URL (e.g., rediss://:password@host:port/db or redis://host:port/db)
function parseRedisUrl(url: string): { host: string; port: number; password?: string; db: number } | null {
  try {
    // Handle rediss:// or redis:// URLs
    const match = url.match(/^(rediss?:\/\/)(?:([^:@]+):?([^@]*)@)?([^:]+):(\d+)(?:\/(\d+))?$/);
    if (!match) return null;

    const [, , username, password, host, port, db] = match;
    return {
      host,
      port: parseInt(port, 10),
      password: password || undefined,
      db: db ? parseInt(db, 10) : 0,
    };
  } catch {
    return null;
  }
}

export default registerAs('redis', () => {
  // Prefer REDIS_URL if provided (Render-style connection string)
  if (process.env.REDIS_URL) {
    const parsed = parseRedisUrl(process.env.REDIS_URL);
    if (parsed) {
      return parsed;
    }
  }

  // Fallback to individual env vars
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  };
});
