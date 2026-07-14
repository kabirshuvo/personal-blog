import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok' as const,
      service: 'api' as const,
      timestamp: new Date().toISOString(),
    };
  }
}
