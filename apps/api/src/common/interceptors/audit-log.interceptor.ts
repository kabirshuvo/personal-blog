import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      ip?: string;
      user?: { sub: string };
      params?: Record<string, string>;
      body?: Record<string, unknown>;
    }>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isAdminMutation =
      !isPublic &&
      request.url.includes('/admin/') &&
      MUTATION_METHODS.has(request.method);

    if (!isAdminMutation) {
      return next.handle();
    }

    const resource = this.extractResource(request.url);
    const action = `${request.method.toLowerCase()}.${resource}`;

    return next.handle().pipe(
      tap(() => {
        void this.prisma.auditLog.create({
          data: {
            actorId: request.user?.sub,
            action,
            resource,
            resourceId: request.params?.id,
            ipAddress: request.ip,
            metadata: {
              path: request.url,
            },
          },
        });
      }),
    );
  }

  private extractResource(url: string): string {
    const segments = url.split('/').filter(Boolean);
    const adminIndex = segments.indexOf('admin');

    if (adminIndex >= 0 && segments[adminIndex + 1]) {
      return segments[adminIndex + 1].replace(/[^a-z-]/gi, '');
    }

    return 'unknown';
  }
}
