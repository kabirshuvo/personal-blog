import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { POSTS_QUEUE, PUBLISH_SCHEDULED_JOB } from './posts-publish.processor';

@Injectable()
export class PostsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(PostsSchedulerService.name);

  constructor(@InjectQueue(POSTS_QUEUE) private readonly postsQueue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.postsQueue.add(
      PUBLISH_SCHEDULED_JOB,
      {},
      {
        repeat: {
          pattern: '* * * * *',
        },
        jobId: 'publish-scheduled-repeat',
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    this.logger.log('Registered scheduled post publish job (every minute)');
  }
}
