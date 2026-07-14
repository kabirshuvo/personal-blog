import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { hashPassword, verifyPassword } from '../common/utils/password.util';
import { generateUniqueSlug } from '../common/utils/slug.util';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../common/dto/pagination.dto';
import type {
  AdminUsersQueryDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      slug: user.slug,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      status: user.status,
      role: user.role.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let slug = user.slug;

    if (dto.name && dto.name.trim() !== user.name) {
      slug = await generateUniqueSlug(dto.name, async (candidate) => {
        const existing = await this.prisma.user.findUnique({
          where: { slug: candidate },
        });
        return existing !== null && existing.id !== userId;
      });
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim() ?? user.name,
        slug,
        bio: dto.bio === undefined ? user.bio : dto.bio,
        avatarUrl: dto.avatarUrl === undefined ? user.avatarUrl : dto.avatarUrl,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      slug: updated.slug,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      status: updated.status,
      role: updated.role.name,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      lastLoginAt: updated.lastLoginAt?.toISOString() ?? null,
    };
  }

  async findAllAdmin(
    query: AdminUsersQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              {
                name: {
                  contains: query.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: query.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        slug: user.slug,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Password change is not available for social login accounts',
      );
    }

    const valid = await verifyPassword(dto.currentPassword, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must differ from current password',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(dto.newPassword),
      },
    });

    return { success: true };
  }
}
