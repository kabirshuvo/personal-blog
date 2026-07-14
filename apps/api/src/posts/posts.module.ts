import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AdminPostsController, PostsController } from './posts.controller';
import { POSTS_QUEUE, PostsPublishProcessor } from './posts-publish.processor';
import { PostsSchedulerService } from './posts-scheduler.service';
import { PostsService } from './posts.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: POSTS_QUEUE,
    }),
  ],
  controllers: [PostsController, AdminPostsController, SearchController],
  providers: [PostsService, PostsPublishProcessor, PostsSchedulerService],
  exports: [PostsService],
})
export class PostsModule {}
