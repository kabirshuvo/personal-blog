import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PostsService } from './posts.service';

export const POSTS_QUEUE = 'posts';
export const PUBLISH_SCHEDULED_JOB = 'publish-scheduled';

@Processor(POSTS_QUEUE)
export class PostsPublishProcessor extends WorkerHost {
  private readonly logger = new Logger(PostsPublishProcessor.name);

  constructor(private readonly postsService: PostsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== PUBLISH_SCHEDULED_JOB) {
      return;
    }

    const result = await this.postsService.publishDueScheduledPosts();
    this.logger.debug(
      `Processed scheduled publish job (${result.published} due)`,
    );
  }
}
