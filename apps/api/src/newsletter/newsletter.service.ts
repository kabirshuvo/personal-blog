import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import {
  buildPaginationMeta,
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination.dto';
import type { SubscribeNewsletterDto } from './dto/newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async subscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing?.status === 'ACTIVE') {
      throw new ConflictException('Email already subscribed');
    }

    const subscriber = await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        status: 'ACTIVE',
      },
      update: {
        status: 'ACTIVE',
        unsubscribedAt: null,
      },
    });

    void this.emailService.sendNewsletterConfirmation(email);

    return {
      id: subscriber.id,
      email: subscriber.email,
      status: subscriber.status,
      subscribedAt: subscriber.subscribedAt.toISOString(),
    };
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, subscribers] = await this.prisma.$transaction([
      this.prisma.newsletterSubscriber.count(),
      this.prisma.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: subscribers.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        status: subscriber.status,
        subscribedAt: subscriber.subscribedAt.toISOString(),
        unsubscribedAt: subscriber.unsubscribedAt?.toISOString() ?? null,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
