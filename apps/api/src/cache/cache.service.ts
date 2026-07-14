import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const client = this.redis.getClient();
    let cursor = '0';

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== '0');
  }

  buildPostsListKey(query: Record<string, unknown>): string {
    const hash = Buffer.from(JSON.stringify(query)).toString('base64url');
    return `cache:posts:list:${hash}`;
  }

  postSlugKey(slug: string): string {
    return `cache:posts:slug:${slug}`;
  }

  categoriesKey(): string {
    return 'cache:categories:all';
  }

  analyticsOverviewKey(range: string): string {
    return `cache:analytics:overview:${range}`;
  }

  async invalidatePosts(): Promise<void> {
    await this.delByPattern('cache:posts:*');
  }

  async invalidatePostSlug(slug: string): Promise<void> {
    await this.del(this.postSlugKey(slug));
    await this.delByPattern('cache:posts:list:*');
  }

  async invalidateCategories(): Promise<void> {
    await this.del(this.categoriesKey());
  }
}
