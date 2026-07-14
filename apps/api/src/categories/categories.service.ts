import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';
import { generateUniqueSlug } from '../common/utils/slug.util';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async findAll() {
    const cacheKey = this.cache.categoriesKey();
    const cached = await this.cache.get<unknown>(cacheKey);

    if (cached) {
      return cached;
    }

    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    await this.cache.set(cacheKey, categories, 3600);

    return categories;
  }

  async create(dto: CreateCategoryDto) {
    const slug = await this.resolveSlug(dto.name, dto.slug);

    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim(),
        },
      });
      await this.cache.invalidateCategories();
      return category;
    } catch {
      throw new ConflictException('Category slug already exists');
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const name = dto.name?.trim() ?? category.name;
    const slug =
      dto.slug !== undefined
        ? await this.resolveSlug(name, dto.slug, id)
        : dto.name
          ? await this.resolveSlug(name, category.slug, id)
          : category.slug;

    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: {
          name,
          slug,
          description:
            dto.description === undefined
              ? category.description
              : dto.description,
        },
      });
      await this.cache.invalidateCategories();
      return updated;
    } catch {
      throw new ConflictException('Category slug already exists');
    }
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({ where: { id } });
    await this.cache.invalidateCategories();

    return { success: true };
  }

  private async resolveSlug(
    name: string,
    requestedSlug: string | undefined,
    excludeId?: string,
  ) {
    const base = requestedSlug?.trim() || name;

    return generateUniqueSlug(base, async (candidate) => {
      const existing = await this.prisma.category.findUnique({
        where: { slug: candidate },
      });
      return existing !== null && existing.id !== excludeId;
    });
  }
}
