import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import sharp from 'sharp';
import { PrismaService } from '../database/prisma.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../common/dto/pagination.dto';
import type { MediaQueryDto, UpdateMediaDto } from './dto/media.dto';
import { S3Service } from './s3.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'application/pdf',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async upload(
    user: AuthUser,
    file: Express.Multer.File,
    metadata?: { altText?: string; caption?: string; postId?: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds maximum size of 10MB');
    }

    let width: number | undefined;
    let height: number | undefined;

    if (
      file.mimetype.startsWith('image/') &&
      file.mimetype !== 'image/svg+xml'
    ) {
      const imageMeta = await sharp(file.buffer).metadata();
      width = imageMeta.width;
      height = imageMeta.height;
    }

    const extension =
      extname(file.originalname) || this.extensionFromMime(file.mimetype);
    const storageKey = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
    const url = await this.s3.uploadObject(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    const media = await this.prisma.media.create({
      data: {
        filename: storageKey.split('/').pop() ?? storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        url,
        storageKey,
        altText: metadata?.altText?.trim(),
        caption: metadata?.caption?.trim(),
        uploadedById: user.sub,
        postId: metadata?.postId,
      },
      include: this.mediaInclude,
    });

    return this.toResponse(media);
  }

  async findAll(query: MediaQueryDto): Promise<PaginatedResult<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      ...(query.mimeType ? { mimeType: { startsWith: query.mimeType } } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              {
                originalName: {
                  contains: query.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
              {
                altText: {
                  contains: query.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.media.count({ where }),
      this.prisma.media.findMany({
        where,
        include: this.mediaInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: items.map((item) => this.toResponse(item)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: this.mediaInclude,
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return this.toResponse(media);
  }

  async update(id: string, dto: UpdateMediaDto) {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const updated = await this.prisma.media.update({
      where: { id },
      data: {
        altText: dto.altText === undefined ? media.altText : dto.altText,
        caption: dto.caption === undefined ? media.caption : dto.caption,
        postId: dto.postId === undefined ? media.postId : dto.postId,
      },
      include: this.mediaInclude,
    });

    return this.toResponse(updated);
  }

  async remove(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.s3.deleteObject(media.storageKey);
    await this.prisma.media.delete({ where: { id } });

    return { success: true };
  }

  private readonly mediaInclude = {
    uploadedBy: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  };

  private extensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'application/pdf': '.pdf',
    };

    return map[mimeType] ?? '';
  }

  private toResponse(media: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    width: number | null;
    height: number | null;
    url: string;
    storageKey: string;
    altText: string | null;
    caption: string | null;
    postId: string | null;
    createdAt: Date;
    updatedAt: Date;
    uploadedBy: { id: string; name: string; slug: string };
  }) {
    return {
      id: media.id,
      filename: media.filename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
      width: media.width,
      height: media.height,
      url: media.url,
      storageKey: media.storageKey,
      altText: media.altText,
      caption: media.caption,
      postId: media.postId,
      uploadedBy: media.uploadedBy,
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
    };
  }
}
