import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import type { JwtAccessPayload } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../database/prisma.service';

const ADMIN_ROOM = 'admin';
const LIVE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
@WebSocketGateway({
  namespace: '/ws/analytics',
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class AnalyticsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AnalyticsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtAccessPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
      });

      if (!payload.permissions?.includes('analytics:view')) {
        client.disconnect();
        return;
      }

      await client.join(ADMIN_ROOM);
      client.emit('live', await this.getLiveStats());
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    client.leave(ADMIN_ROOM);
  }

  async notifyPageView(): Promise<void> {
    const stats = await this.getLiveStats();
    this.server.to(ADMIN_ROOM).emit('live', stats);
  }

  private extractToken(client: Socket): string | undefined {
    const queryToken = client.handshake.query.token;

    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    return undefined;
  }

  private async getLiveStats(): Promise<{
    liveViewers: number;
    pageViewsToday: number;
  }> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const liveSince = new Date(Date.now() - LIVE_WINDOW_MS);

    const [pageViewsToday, liveSessions] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: {
          eventType: 'page_view',
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          eventType: 'page_view',
          sessionId: { not: null },
          createdAt: { gte: liveSince },
        },
      }),
    ]);

    return {
      liveViewers: liveSessions.length,
      pageViewsToday,
    };
  }
}
