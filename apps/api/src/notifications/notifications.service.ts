import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      readAt: notification.readAt?.toISOString() ?? null,
      metadata: notification.metadata,
      createdAt: notification.createdAt.toISOString(),
    }));
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return { success: false };
    }

    await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  async createCommentReplyNotification(input: {
    recipientId: string;
    postId: string;
    commentId: string;
    replierName: string;
  }) {
    await this.prisma.notification.create({
      data: {
        userId: input.recipientId,
        type: 'comment_reply',
        title: 'New reply to your comment',
        content: `${input.replierName} replied to your comment.`,
        metadata: {
          postId: input.postId,
          commentId: input.commentId,
        },
      },
    });
  }
}
