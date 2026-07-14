import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  AGGREGATE_HOURLY_JOB,
  ANALYTICS_QUEUE,
} from './analytics-aggregation.processor';

@Injectable()
export class AnalyticsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsSchedulerService.name);

  constructor(
    @InjectQueue(ANALYTICS_QUEUE) private readonly analyticsQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.analyticsQueue.add(
      AGGREGATE_HOURLY_JOB,
      {},
      {
        repeat: {
          pattern: '0 * * * *',
        },
        jobId: 'analytics-aggregate-hourly',
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    this.logger.log('Registered hourly analytics aggregation job');
  }
}
