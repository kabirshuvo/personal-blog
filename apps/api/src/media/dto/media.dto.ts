import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class MediaQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  @IsOptional()
  @IsString()
  postId?: string | null;
}

export class UploadMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  @IsOptional()
  @IsString()
  postId?: string;
}
