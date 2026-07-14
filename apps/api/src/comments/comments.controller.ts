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
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CommentsService } from './comments.service';
import {
  CommentsQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto/comments.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get()
  findByPost(@Query() query: CommentsQueryDto) {
    return this.commentsService.findApprovedByPost(query.postId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user, dto);
  }
}

@Controller('admin/comments')
export class AdminCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Permissions('comments:moderate')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.commentsService.update(id, dto);
  }

  @Permissions('comments:moderate')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(id);
  }
}
