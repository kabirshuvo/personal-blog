import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePostDto, SchedulePostDto, UpdatePostDto } from '@blog/shared';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  AdminPostsQueryDto,
  PostsQueryDto,
} from '../common/dto/pagination.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  findAll(@Query() query: PostsQueryDto) {
    return this.postsService.findPublished(query);
  }

  @Public()
  @Get('featured')
  findFeatured() {
    return this.postsService.findFeatured();
  }

  @Public()
  @Get('trending')
  findTrending() {
    return this.postsService.findTrending();
  }

  @Public()
  @Get(':slug/related')
  findRelated(@Param('slug') slug: string) {
    return this.postsService.findRelated(slug);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findPublishedBySlug(slug);
  }
}

@Controller('admin/posts')
export class AdminPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Permissions('posts:edit', 'posts:edit_all', 'posts:create')
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: AdminPostsQueryDto) {
    return this.postsService.findAdminPosts(user, query);
  }

  @Permissions('posts:edit', 'posts:edit_all', 'posts:create')
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.findAdminById(user, id);
  }

  @Permissions('posts:create')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user, dto);
  }

  @Permissions('posts:edit', 'posts:edit_all')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(user, id, dto);
  }

  @Permissions('posts:delete')
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.remove(user, id);
  }

  @Permissions('posts:publish')
  @Post(':id/publish')
  publish(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.postsService.publish(user, id);
  }

  @Permissions('posts:publish')
  @Post(':id/schedule')
  schedule(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SchedulePostDto,
  ) {
    return this.postsService.schedule(user, id, dto);
  }
}
