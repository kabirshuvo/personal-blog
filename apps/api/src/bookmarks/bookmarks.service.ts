import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { CreateBookmarkDto } from './dto/bookmarks.dto';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId: user.sub },
      include: {
        post: {
          include: {
            author: {
              select: { id: true, name: true, slug: true, avatarUrl: true },
            },
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookmarks.map((bookmark) => ({
      id: bookmark.id,
      postId: bookmark.postId,
      createdAt: bookmark.createdAt.toISOString(),
      post: {
        id: bookmark.post.id,
        title: bookmark.post.title,
        slug: bookmark.post.slug,
        excerpt: bookmark.post.excerpt,
        publishedAt: bookmark.post.publishedAt?.toISOString() ?? null,
        author: bookmark.post.author,
        category: bookmark.post.category,
      },
    }));
  }

  async create(user: AuthUser, dto: CreateBookmarkDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: user.sub,
          postId: dto.postId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Post already bookmarked');
    }

    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId: user.sub,
        postId: dto.postId,
      },
    });

    return {
      id: bookmark.id,
      postId: bookmark.postId,
      createdAt: bookmark.createdAt.toISOString(),
    };
  }

  async remove(user: AuthUser, postId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: user.sub,
          postId,
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.prisma.bookmark.delete({
      where: { id: bookmark.id },
    });

    return { success: true };
  }
}
