import { Injectable, Optional } from '@nestjs/common';
import type { Prisma } from '@blog/database';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { AnalyticsGateway } from './analytics.gateway';
import type {
  AnalyticsRangeQueryDto,
  TrackEventDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    @Optional() private readonly analyticsGateway?: AnalyticsGateway,
  ) {}

  async trackEvent(
    dto: TrackEventDto,
    context?: { userId?: string; ip?: string; userAgent?: string },
  ) {
    await this.prisma.analyticsEvent.create({
      data: {
        eventType: dto.eventType,
        postId: dto.postId,
        sessionId: dto.sessionId,
        path: dto.path,
        referrer: dto.referrer,
        userAgent: dto.userAgent ?? context?.userAgent,
        userId: context?.userId,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    if (dto.eventType === 'page_view') {
      void this.analyticsGateway?.notifyPageView();
    }

    return { success: true };
  }

  async getOverview(query: AnalyticsRangeQueryDto) {
    const range = query.range ?? '7d';
    const cacheKey = this.cache.analyticsOverviewKey(range);
    const cached = await this.cache.get<unknown>(cacheKey);

    if (cached) {
      return cached;
    }

    const since = this.rangeToDate(range);
    const [pageViews, postViews, uniqueSessions, comments, bookmarks, signups] =
      await Promise.all([
        this.prisma.analyticsEvent.count({
          where: { eventType: 'page_view', createdAt: { gte: since } },
        }),
        this.prisma.analyticsEvent.count({
          where: { eventType: 'post_view', createdAt: { gte: since } },
        }),
        this.prisma.analyticsEvent.groupBy({
          by: ['sessionId'],
          where: {
            sessionId: { not: null },
            createdAt: { gte: since },
          },
        }),
        this.prisma.comment.count({ where: { createdAt: { gte: since } } }),
        this.prisma.bookmark.count({ where: { createdAt: { gte: since } } }),
        this.prisma.analyticsEvent.count({
          where: { eventType: 'signup', createdAt: { gte: since } },
        }),
      ]);

    const result = {
      range,
      since: since.toISOString(),
      pageViews,
      postViews,
      uniqueVisitors: uniqueSessions.length,
      comments,
      bookmarks,
      signups,
    };

    await this.cache.set(cacheKey, result, 300);

    return result;
  }

  async getTraffic(query: AnalyticsRangeQueryDto) {
    const since = this.rangeToDate(query.range ?? '7d');
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: { in: ['page_view', 'post_view'] },
        createdAt: { gte: since },
      },
      select: { createdAt: true, eventType: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<string, { pageViews: number; postViews: number }>();

    for (const event of events) {
      const day = event.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(day) ?? { pageViews: 0, postViews: 0 };

      if (event.eventType === 'page_view') {
        bucket.pageViews += 1;
      } else {
        bucket.postViews += 1;
      }

      buckets.set(day, bucket);
    }

    return Array.from(buckets.entries()).map(([date, values]) => ({
      date,
      ...values,
    }));
  }

  async getPopularPosts(query: AnalyticsRangeQueryDto) {
    const since = this.rangeToDate(query.range ?? '7d');

    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['postId'],
      where: {
        eventType: 'post_view',
        postId: { not: null },
        createdAt: { gte: since },
      },
      _count: { postId: true },
      orderBy: { _count: { postId: 'desc' } },
      take: 10,
    });

    const postIds = grouped
      .map((entry) => entry.postId)
      .filter((id): id is string => id !== null);

    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, title: true, slug: true },
    });

    const postsById = new Map(posts.map((post) => [post.id, post]));

    return grouped.map((entry) => ({
      postId: entry.postId,
      views: entry._count.postId,
      post: entry.postId ? (postsById.get(entry.postId) ?? null) : null,
    }));
  }

  async getCategories(query: AnalyticsRangeQueryDto) {
    const since = this.rangeToDate(query.range ?? '7d');

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'post_view',
        postId: { not: null },
        createdAt: { gte: since },
      },
      select: {
        post: {
          select: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    const counts = new Map<
      string,
      { name: string; slug: string; views: number }
    >();

    for (const event of events) {
      const category = event.post?.category;
      if (!category) {
        continue;
      }

      const existing = counts.get(category.id) ?? {
        name: category.name,
        slug: category.slug,
        views: 0,
      };
      existing.views += 1;
      counts.set(category.id, existing);
    }

    return Array.from(counts.values()).sort((a, b) => b.views - a.views);
  }

  async getEngagement(query: AnalyticsRangeQueryDto) {
    const since = this.rangeToDate(query.range ?? '7d');

    const [comments, bookmarks, signups, searches] = await Promise.all([
      this.prisma.comment.count({ where: { createdAt: { gte: since } } }),
      this.prisma.bookmark.count({ where: { createdAt: { gte: since } } }),
      this.prisma.analyticsEvent.count({
        where: { eventType: 'signup', createdAt: { gte: since } },
      }),
      this.prisma.analyticsEvent.count({
        where: { eventType: 'search', createdAt: { gte: since } },
      }),
    ]);

    return { comments, bookmarks, signups, searches };
  }

  async aggregateDaily(date = new Date()) {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const metrics = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'page_view',
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'post_view',
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          sessionId: { not: null },
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      }),
      this.prisma.comment.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
      this.prisma.bookmark.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      }),
    ]);

    const entries = [
      { metric: 'page_views', value: metrics[0] },
      { metric: 'post_views', value: metrics[1] },
      { metric: 'unique_sessions', value: metrics[2].length },
      { metric: 'comments', value: metrics[3] },
      { metric: 'bookmarks', value: metrics[4] },
    ];

    for (const entry of entries) {
      await this.prisma.analyticsDailyAggregate.upsert({
        where: {
          date_metric: {
            date: dayStart,
            metric: entry.metric,
          },
        },
        create: {
          date: dayStart,
          metric: entry.metric,
          value: entry.value,
        },
        update: {
          value: entry.value,
        },
      });
    }

    await this.cache.delByPattern('cache:analytics:*');

    return { date: dayStart.toISOString().slice(0, 10), metrics: entries };
  }

  private rangeToDate(range: string): Date {
    const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }
}
