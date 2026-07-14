import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const POST_STATUSES = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug?: string;

  @IsString()
  @MinLength(10)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaDescription?: string;

  @IsOptional()
  @IsUUID()
  featuredImageId?: string;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsIn(POST_STATUSES)
  status?: PostStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaDescription?: string;

  @IsOptional()
  @IsUUID()
  featuredImageId?: string | null;
}

export class SchedulePostDto {
  @IsDateString()
  scheduledAt!: string;
}

export type PostAuthorResponse = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
};

export type PostCategoryResponse = {
  id: string;
  name: string;
  slug: string;
};

export type PostTagResponse = {
  id: string;
  name: string;
  slug: string;
};

export type PostResponse = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: PostStatus;
  featured: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  author: PostAuthorResponse;
  category: PostCategoryResponse | null;
  tags: PostTagResponse[];
  createdAt: string;
  updatedAt: string;
};

export type PostListItemResponse = Omit<PostResponse, 'content'> & {
  content?: string;
};
