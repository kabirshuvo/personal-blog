import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { UpsertReadingHistoryDto } from './dto/reading-history.dto';

@Injectable()
export class ReadingHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser) {
    const history = await this.prisma.readingHistory.findMany({
      where: { userId: user.sub },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            publishedAt: true,
            author: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { lastReadAt: 'desc' },
      take: 50,
    });

    return history.map((entry) => ({
      id: entry.id,
      postId: entry.postId,
      progress: entry.progress,
      lastReadAt: entry.lastReadAt.toISOString(),
      post: {
        ...entry.post,
        publishedAt: entry.post.publishedAt?.toISOString() ?? null,
      },
    }));
  }

  async upsert(user: AuthUser, dto: UpsertReadingHistoryDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const entry = await this.prisma.readingHistory.upsert({
      where: {
        userId_postId: {
          userId: user.sub,
          postId: dto.postId,
        },
      },
      create: {
        userId: user.sub,
        postId: dto.postId,
        progress: dto.progress,
        lastReadAt: new Date(),
      },
      update: {
        progress: dto.progress,
        lastReadAt: new Date(),
      },
    });

    return {
      id: entry.id,
      postId: entry.postId,
      progress: entry.progress,
      lastReadAt: entry.lastReadAt.toISOString(),
    };
  }
}
