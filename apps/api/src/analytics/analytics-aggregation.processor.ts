import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AnalyticsService } from './analytics.service';

export const ANALYTICS_QUEUE = 'analytics';
export const AGGREGATE_HOURLY_JOB = 'aggregate-hourly';

@Processor(ANALYTICS_QUEUE)
export class AnalyticsAggregationProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsAggregationProcessor.name);

  constructor(private readonly analyticsService: AnalyticsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== AGGREGATE_HOURLY_JOB) {
      return;
    }

    const result = await this.analyticsService.aggregateDaily();
    this.logger.debug(
      `Aggregated analytics for ${result.date} (${result.metrics.length} metrics)`,
    );
  }
}
