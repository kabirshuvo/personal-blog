import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UpsertReadingHistoryDto } from './dto/reading-history.dto';
import { ReadingHistoryService } from './reading-history.service';

@Controller('reading-history')
export class ReadingHistoryController {
  constructor(private readonly readingHistoryService: ReadingHistoryService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.readingHistoryService.findAll(user);
  }

  @Post()
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertReadingHistoryDto) {
    return this.readingHistoryService.upsert(user, dto);
  }
}
