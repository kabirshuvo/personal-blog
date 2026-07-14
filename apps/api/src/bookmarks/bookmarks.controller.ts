import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/bookmarks.dto';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.bookmarksService.findAll(user);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.create(user, dto);
  }

  @Delete(':postId')
  remove(@CurrentUser() user: AuthUser, @Param('postId') postId: string) {
    return this.bookmarksService.remove(user, postId);
  }
}
