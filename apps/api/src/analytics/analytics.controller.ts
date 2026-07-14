import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AnalyticsRangeQueryDto, TrackEventDto } from './dto/analytics.dto';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Post('events')
  trackEvent(
    @Body() dto: TrackEventDto,
    @Req() request: Request,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.analyticsService.trackEvent(dto, {
      userId: user?.sub,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }
}

@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Permissions('analytics:view')
  @Get('overview')
  overview(@Query() query: AnalyticsRangeQueryDto) {
    return this.analyticsService.getOverview(query);
  }

  @Permissions('analytics:view')
  @Get('traffic')
  traffic(@Query() query: AnalyticsRangeQueryDto) {
    return this.analyticsService.getTraffic(query);
  }

  @Permissions('analytics:view')
  @Get('popular-posts')
  popularPosts(@Query() query: AnalyticsRangeQueryDto) {
    return this.analyticsService.getPopularPosts(query);
  }

  @Permissions('analytics:view')
  @Get('categories')
  categories(@Query() query: AnalyticsRangeQueryDto) {
    return this.analyticsService.getCategories(query);
  }

  @Permissions('analytics:view')
  @Get('engagement')
  engagement(@Query() query: AnalyticsRangeQueryDto) {
    return this.analyticsService.getEngagement(query);
  }
}
