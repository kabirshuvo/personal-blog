import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  AdminCommentsController,
  CommentsController,
} from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [NotificationsModule],
  controllers: [CommentsController, AdminCommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
