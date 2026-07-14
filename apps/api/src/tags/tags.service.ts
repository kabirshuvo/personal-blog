import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { generateUniqueSlug } from '../common/utils/slug.util';
import type { CreateTagDto, UpdateTagDto } from './dto/tags.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateTagDto) {
    const slug = await this.resolveSlug(dto.name, dto.slug);

    try {
      return await this.prisma.tag.create({
        data: {
          name: dto.name.trim(),
          slug,
        },
      });
    } catch {
      throw new ConflictException('Tag slug already exists');
    }
  }

  async update(id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const name = dto.name?.trim() ?? tag.name;
    const slug =
      dto.slug !== undefined
        ? await this.resolveSlug(name, dto.slug, id)
        : dto.name
          ? await this.resolveSlug(name, tag.slug, id)
          : tag.slug;

    try {
      return await this.prisma.tag.update({
        where: { id },
        data: {
          name,
          slug,
        },
      });
    } catch {
      throw new ConflictException('Tag slug already exists');
    }
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tag.delete({ where: { id } });

    return { success: true };
  }

  private async resolveSlug(
    name: string,
    requestedSlug: string | undefined,
    excludeId?: string,
  ) {
    const base = requestedSlug?.trim() || name;

    return generateUniqueSlug(base, async (candidate) => {
      const existing = await this.prisma.tag.findUnique({
        where: { slug: candidate },
      });
      return existing !== null && existing.id !== excludeId;
    });
  }
}
