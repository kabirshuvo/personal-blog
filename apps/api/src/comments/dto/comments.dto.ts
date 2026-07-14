import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CommentsQueryDto {
  @IsString()
  postId!: string;
}

export class CreateCommentDto {
  @IsString()
  postId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'SPAM'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM';
}
