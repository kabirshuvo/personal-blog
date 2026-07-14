import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../database/prisma.service';

@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('audit:view')
  async list(@Query() query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.limit ?? 20;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
