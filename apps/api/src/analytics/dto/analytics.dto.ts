import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class TrackEventDto {
  @IsString()
  @MaxLength(50)
  eventType!: string;

  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class AnalyticsRangeQueryDto {
  @IsOptional()
  @IsIn(['7d', '30d', '90d'])
  range?: '7d' | '30d' | '90d' = '7d';
}
