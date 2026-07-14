import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { SubscribeNewsletterDto } from './dto/newsletter.dto';
import { NewsletterService } from './newsletter.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Public()
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }
}

@Controller('admin/newsletter')
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Permissions('settings:manage')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.newsletterService.findAll(query);
  }
}
