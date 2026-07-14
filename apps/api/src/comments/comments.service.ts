import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { sanitizePlainText } from '../common/utils/sanitize.util';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findApprovedByPost(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        status: 'APPROVED',
        parentId: null,
      },
      include: this.commentInclude,
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((comment) => this.toResponse(comment));
  }

  async create(user: AuthUser, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent || parent.postId !== dto.postId) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    const content = sanitizePlainText(dto.content);

    if (!content) {
      throw new BadRequestException('Comment content is required');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId: dto.postId,
        authorId: user.sub,
        parentId: dto.parentId,
        content,
        status: 'PENDING',
      },
      include: this.commentInclude,
    });

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { authorId: true, postId: true },
      });

      if (parent && parent.authorId !== user.sub) {
        await this.notifications.createCommentReplyNotification({
          recipientId: parent.authorId,
          postId: parent.postId,
          commentId: comment.id,
          replierName: comment.author.name,
        });
      }
    }

    return this.toResponse(comment);
  }

  async update(id: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const updated = await this.prisma.comment.update({
      where: { id },
      data: {
        content:
          dto.content === undefined
            ? comment.content
            : sanitizePlainText(dto.content),
        status: dto.status ?? comment.status,
      },
      include: this.commentInclude,
    });

    return this.toResponse(updated);
  }

  async remove(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.prisma.comment.delete({ where: { id } });

    return { success: true };
  }

  private readonly commentInclude = {
    author: {
      select: {
        id: true,
        name: true,
        slug: true,
        avatarUrl: true,
      },
    },
    replies: {
      where: { status: 'APPROVED' as const },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' as const },
    },
  };

  private toResponse(comment: {
    id: string;
    postId: string;
    parentId: string | null;
    content: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string;
      slug: string;
      avatarUrl: string | null;
    };
    replies?: Array<{
      id: string;
      postId: string;
      parentId: string | null;
      content: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      author: {
        id: string;
        name: string;
        slug: string;
        avatarUrl: string | null;
      };
    }>;
  }) {
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      content: comment.content,
      status: comment.status,
      author: comment.author,
      replies: comment.replies?.map((reply) => ({
        id: reply.id,
        postId: reply.postId,
        parentId: reply.parentId,
        content: reply.content,
        status: reply.status,
        author: reply.author,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
      })),
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }
}
