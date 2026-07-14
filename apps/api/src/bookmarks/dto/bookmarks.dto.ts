import { IsString } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  postId!: string;
}
