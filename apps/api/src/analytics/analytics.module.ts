import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  AnalyticsAggregationProcessor,
  ANALYTICS_QUEUE,
} from './analytics-aggregation.processor';
import { AnalyticsGateway } from './analytics.gateway';
import { AnalyticsSchedulerService } from './analytics-scheduler.service';
import {
  AdminAnalyticsController,
  AnalyticsController,
} from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: ANALYTICS_QUEUE,
    }),
  ],
  controllers: [AnalyticsController, AdminAnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsGateway,
    AnalyticsAggregationProcessor,
    AnalyticsSchedulerService,
  ],
})
export class AnalyticsModule {}
