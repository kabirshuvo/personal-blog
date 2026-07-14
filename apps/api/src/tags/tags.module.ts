import { Module } from '@nestjs/common';
import { AdminTagsController, TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  controllers: [TagsController, AdminTagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
