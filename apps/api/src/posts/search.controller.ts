import { Controller, Get, Query } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { PostsQueryDto } from '../common/dto/pagination.dto';
import { PostsService } from './posts.service';

class SearchQueryDto extends PostsQueryDto {
  @IsString()
  @MaxLength(200)
  q!: string;
}

@Controller('search')
export class SearchController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.postsService.findPublished({
      ...query,
      search: query.q,
    });
  }
}
