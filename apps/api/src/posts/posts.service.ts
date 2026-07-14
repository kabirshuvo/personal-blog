import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Post, PostStatus, Prisma } from '@blog/database';
import { CreatePostDto, SchedulePostDto, UpdatePostDto } from '@blog/shared';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CacheService } from '../cache/cache.service';
import {
  AdminPostsQueryDto,
  buildPaginationMeta,
  PaginatedResult,
  PostsQueryDto,
} from '../common/dto/pagination.dto';
import { generateUniqueSlug } from '../common/utils/slug.util';
import { sanitizeRichText } from '../common/utils/sanitize.util';

const postInclude = {
  author: {
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findPublished(query: PostsQueryDto): Promise<PaginatedResult<unknown>> {
    const cacheKey = this.cache.buildPostsListKey(
      query as Record<string, unknown>,
    );
    const cached = await this.cache.get<PaginatedResult<unknown>>(cacheKey);

    if (cached) {
      return cached;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildPublicWhere(query);

    const [total, posts] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const result = {
      data: posts.map((post) => this.toListItem(post)),
      meta: buildPaginationMeta(page, limit, total),
    };

    await this.cache.set(cacheKey, result, 60);

    return result;
  }

  async findFeatured(limit = 6) {
    const posts = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        featured: true,
      },
      include: postInclude,
      orderBy: [{ publishedAt: 'desc' }],
      take: limit,
    });

    return posts.map((post) => this.toListItem(post));
  }

  async findTrending(limit = 6) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['postId'],
      where: {
        eventType: 'post_view',
        postId: { not: null },
        createdAt: { gte: since },
      },
      _count: { postId: true },
      orderBy: { _count: { postId: 'desc' } },
      take: limit,
    });

    const postIds = grouped
      .map((entry) => entry.postId)
      .filter((id): id is string => id !== null);

    if (postIds.length === 0) {
      return this.findFeatured(limit);
    }

    const posts = await this.prisma.post.findMany({
      where: {
        id: { in: postIds },
        status: 'PUBLISHED',
      },
      include: postInclude,
    });

    const postsById = new Map(posts.map((post) => [post.id, post]));

    return postIds
      .map((id) => postsById.get(id))
      .filter((post): post is PostWithRelations => post !== undefined)
      .map((post) => this.toListItem(post));
  }

  async findPublishedBySlug(slug: string) {
    const cacheKey = this.cache.postSlugKey(slug);
    const cached = await this.cache.get<unknown>(cacheKey);

    if (cached) {
      return cached;
    }

    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: postInclude,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const result = this.toDetail(post);
    await this.cache.set(cacheKey, result, 300);

    return result;
  }

  async findRelated(slug: string, limit = 4) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        tags: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const tagIds = post.tags.map((entry) => entry.tagId);

    const related = await this.prisma.post.findMany({
      where: {
        id: { not: post.id },
        status: 'PUBLISHED',
        OR: [
          post.categoryId ? { categoryId: post.categoryId } : undefined,
          tagIds.length > 0
            ? {
                tags: {
                  some: {
                    tagId: { in: tagIds },
                  },
                },
              }
            : undefined,
        ].filter(Boolean) as Prisma.PostWhereInput[],
      },
      include: postInclude,
      orderBy: [{ publishedAt: 'desc' }],
      take: limit,
    });

    return related.map((entry) => this.toListItem(entry));
  }

  async findAdminPosts(user: AuthUser, query: AdminPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildAdminWhere(user, query);

    const [total, posts] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: posts.map((post) => this.toListItem(post, true)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findAdminById(user: AuthUser, id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    this.assertCanView(user, post);

    return this.toDetail(post);
  }

  async create(user: AuthUser, dto: CreatePostDto) {
    this.assertHasPermission(user, 'posts:create');

    const slug = await this.resolvePostSlug(dto.title, dto.slug);

    const post = await this.prisma.post.create({
      data: {
        title: dto.title.trim(),
        slug,
        content: sanitizeRichText(dto.content),
        excerpt: dto.excerpt?.trim(),
        featured: dto.featured ?? false,
        metaTitle: dto.metaTitle?.trim(),
        metaDescription: dto.metaDescription?.trim(),
        authorId: user.sub,
        categoryId: dto.categoryId,
        featuredImageId: dto.featuredImageId,
        status: 'DRAFT',
        tags: dto.tagIds?.length
          ? {
              create: dto.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: postInclude,
    });

    return this.toDetail(post);
  }

  async update(user: AuthUser, id: string, dto: UpdatePostDto) {
    const post = await this.getPostOrThrow(id);
    this.assertCanEdit(user, post);

    const title = dto.title?.trim() ?? post.title;
    let slug = post.slug;

    if (dto.slug !== undefined) {
      slug = await this.resolvePostSlug(title, dto.slug, id);
    } else if (dto.title && dto.title.trim() !== post.title) {
      slug = await this.resolvePostSlug(title, post.slug, id);
    }

    if (slug !== post.slug) {
      await this.prisma.postSlugHistory.create({
        data: {
          postId: post.id,
          oldSlug: post.slug,
        },
      });
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        content:
          dto.content === undefined
            ? post.content
            : sanitizeRichText(dto.content),
        excerpt: dto.excerpt === undefined ? post.excerpt : dto.excerpt,
        featured: dto.featured ?? post.featured,
        metaTitle:
          dto.metaTitle === undefined ? post.metaTitle : dto.metaTitle?.trim(),
        metaDescription:
          dto.metaDescription === undefined
            ? post.metaDescription
            : dto.metaDescription?.trim(),
        categoryId:
          dto.categoryId === undefined ? post.categoryId : dto.categoryId,
        featuredImageId:
          dto.featuredImageId === undefined
            ? post.featuredImageId
            : dto.featuredImageId,
        status: dto.status ?? post.status,
        tags:
          dto.tagIds !== undefined
            ? {
                deleteMany: {},
                create: dto.tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
      },
      include: postInclude,
    });

    await this.cache.invalidatePosts();
    await this.cache.invalidatePostSlug(post.slug);
    if (slug !== post.slug) {
      await this.cache.invalidatePostSlug(slug);
    }

    return this.toDetail(updated);
  }

  async remove(user: AuthUser, id: string) {
    const post = await this.getPostOrThrow(id);
    this.assertCanDelete(user, post);

    await this.prisma.post.delete({ where: { id } });

    return { success: true };
  }

  async publish(user: AuthUser, id: string) {
    this.assertHasPermission(user, 'posts:publish');

    const post = await this.getPostOrThrow(id);
    this.assertCanEdit(user, post);

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        scheduledAt: null,
      },
      include: postInclude,
    });

    await this.createAuditLog(user.sub, 'post.publish', id);
    await this.cache.invalidatePosts();
    await this.cache.invalidatePostSlug(updated.slug);

    return this.toDetail(updated);
  }

  async schedule(user: AuthUser, id: string, dto: SchedulePostDto) {
    this.assertHasPermission(user, 'posts:publish');

    const post = await this.getPostOrThrow(id);
    this.assertCanEdit(user, post);

    const scheduledAt = new Date(dto.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new ForbiddenException('Invalid scheduled date');
    }

    if (scheduledAt.getTime() <= Date.now()) {
      throw new ForbiddenException('Scheduled date must be in the future');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt,
        publishedAt: null,
      },
      include: postInclude,
    });

    await this.createAuditLog(user.sub, 'post.schedule', id, {
      scheduledAt: scheduledAt.toISOString(),
    });

    return this.toDetail(updated);
  }

  async publishDueScheduledPosts() {
    const now = new Date();

    const duePosts = await this.prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      select: { id: true, slug: true },
    });

    for (const duePost of duePosts) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.post.updateMany({
          where: {
            id: duePost.id,
            status: 'SCHEDULED',
            scheduledAt: { lte: now },
          },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
            scheduledAt: null,
          },
        });

        if (updated.count === 0) {
          return;
        }

        await tx.auditLog.create({
          data: {
            action: 'post.scheduled_publish',
            resource: 'post',
            resourceId: duePost.id,
            metadata: {
              publishedAt: now.toISOString(),
            },
          },
        });
      });

      await this.cache.invalidatePostSlug(duePost.slug);
    }

    await this.cache.invalidatePosts();

    return { published: duePosts.length };
  }

  private buildPublicWhere(query: PostsQueryDto): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {
      status: 'PUBLISHED',
    };

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.tag) {
      where.tags = {
        some: {
          tag: { slug: query.tag },
        },
      };
    }

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { excerpt: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildAdminWhere(
    user: AuthUser,
    query: AdminPostsQueryDto,
  ): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {};

    if (!user.permissions.includes('posts:edit_all')) {
      where.authorId = user.sub;
    }

    if (query.status) {
      where.status = query.status as PostStatus;
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.author) {
      where.author = { slug: query.author };
    }

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { excerpt: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async getPostOrThrow(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private assertHasPermission(user: AuthUser, permission: string) {
    if (!user.permissions.includes(permission)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private assertCanView(user: AuthUser, post: Post) {
    if (user.permissions.includes('posts:edit_all')) {
      return;
    }

    if (post.authorId === user.sub) {
      return;
    }

    throw new ForbiddenException('You can only access your own posts');
  }

  private assertCanEdit(user: AuthUser, post: Post) {
    if (user.permissions.includes('posts:edit_all')) {
      return;
    }

    if (post.authorId === user.sub && user.permissions.includes('posts:edit')) {
      return;
    }

    throw new ForbiddenException('You can only edit your own posts');
  }

  private assertCanDelete(user: AuthUser, post: Post) {
    this.assertHasPermission(user, 'posts:delete');
    this.assertCanEdit(user, post);
  }

  private async resolvePostSlug(
    title: string,
    requestedSlug: string | undefined,
    excludeId?: string,
  ) {
    const base = requestedSlug?.trim() || title;

    return generateUniqueSlug(base, async (candidate) => {
      const existing = await this.prisma.post.findUnique({
        where: { slug: candidate },
      });
      return existing !== null && existing.id !== excludeId;
    });
  }

  private async createAuditLog(
    actorId: string,
    action: string,
    resourceId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        resource: 'post',
        resourceId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private toListItem(post: PostWithRelations, includeContent = false) {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      status: post.status,
      featured: post.featured,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      author: post.author,
      category: post.category,
      tags: post.tags.map((entry) => entry.tag),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      ...(includeContent ? { content: post.content } : {}),
    };
  }

  private toDetail(post: PostWithRelations) {
    return {
      ...this.toListItem(post, true),
      content: post.content,
    };
  }
}
