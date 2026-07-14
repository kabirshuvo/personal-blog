import { Type } from 'class-transformer';
import { IsNumber, IsString, Max, Min } from 'class-validator';

export class UpsertReadingHistoryDto {
  @IsString()
  postId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  progress!: number;
}
